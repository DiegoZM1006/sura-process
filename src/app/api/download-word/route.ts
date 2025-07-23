import { NextRequest, NextResponse } from 'next/server'
import { generateDocumentBlob } from '@/lib/document-generator-server'
import { mergePDFsWithAnnexes } from '@/lib/pdf-merger'

export async function POST(request: NextRequest) {
  console.log('=== INICIO DEL PROCESO DE DESCARGA DE WORD CON ANEXOS ===')
  try {
    console.log('Obteniendo FormData...')
    const formData = await request.formData()
    
    const caseType = formData.get('caseType') as string
    
    if (!caseType) {
      return NextResponse.json(
        { success: false, error: 'El tipo de caso es requerido' },
        { status: 400 }
      )
    }
    
    // Extraer datos del formulario para generar el documento
    console.log('Extrayendo datos del formulario...')
    const documentData: any = {}
    const anexoFiles: File[] = []
    
    for (const [key, value] of formData.entries()) {
      if (key === 'anexos' && value instanceof File) {
        // Recolectar archivos anexos del step 2
        anexoFiles.push(value)
        console.log(`Anexo encontrado: ${value.name} (${value.size} bytes)`)
      } else if (key !== 'caseType') {
        documentData[key] = value
      }
    }
    
    console.log('Datos extraídos para documento:', {
      keys: Object.keys(documentData),
      anexosCount: anexoFiles.length,
      caseType,
      sampleData: {
        nombreEmpresa: documentData.nombreEmpresa,
        nitEmpresa: documentData.nitEmpresa,
        correoEmpresa: documentData.correoEmpresa
      }
    })
    
    console.log('Generando documento Word para descarga...')
    
    // Generar documento Word
    let documentBlob: Blob
    try {
      documentBlob = await generateDocumentBlob(documentData, caseType)
      console.log('Documento generado exitosamente')
    } catch (error) {
      console.error('Error generando documento:', error)
      return NextResponse.json(
        { success: false, error: 'Error al generar el documento' },
        { status: 500 }
      )
    }
    
    try {
      const documentBuffer = Buffer.from(await documentBlob.arrayBuffer())
      const fecha = new Date().toISOString().split('T')[0]
      
      // Detectar el tipo de archivo basado en el content type del blob
      const isPDF = documentBlob.type === 'application/pdf'
      
      if (isPDF && anexoFiles.length > 0) {
        console.log('Documento principal es PDF y hay anexos - realizando merge...')
        
        // Preparar anexos para el merge
        const annexBuffers = []
        for (let i = 0; i < anexoFiles.length; i++) {
          const anexo = anexoFiles[i]
          try {
            const anexoBuffer = Buffer.from(await anexo.arrayBuffer())
            annexBuffers.push({
              buffer: anexoBuffer,
              filename: anexo.name,
              mimetype: anexo.type || 'application/octet-stream'
            })
            console.log(`Anexo ${i + 1} preparado para merge: ${anexo.name}`)
          } catch (error) {
            console.error(`Error preparando anexo ${anexo.name} para merge:`, error)
          }
        }
        
        // Hacer el merge de PDFs
        try {
          console.log('Iniciando merge de PDF principal con anexos...')
          const mergedPdfBuffer = await mergePDFsWithAnnexes(documentBuffer, annexBuffers)
          
          const filename = `${caseType.replace(/\s+/g, '_')}_${fecha}_COMPLETO.pdf`
          
          console.log('PDF combinado creado exitosamente')
          
          // Retornar el PDF combinado
          return new NextResponse(mergedPdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Content-Length': mergedPdfBuffer.length.toString(),
            },
          })
          
        } catch (mergeError) {
          console.error('Error en el merge, enviando documento principal solamente:', mergeError)
          
          // Si falla el merge, enviar solo el documento principal
          const filename = isPDF 
            ? `${caseType.replace(/\s+/g, '_')}_${fecha}.pdf`
            : `${caseType.replace(/\s+/g, '_')}_${fecha}.docx`
          
          return new NextResponse(documentBuffer, {
            status: 200,
            headers: {
              'Content-Type': isPDF ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'Content-Disposition': `attachment; filename="${filename}"`,
              'Content-Length': documentBuffer.length.toString(),
            },
          })
        }
        
      } else {
        // Sin anexos o documento no es PDF - enviar documento principal solamente
        console.log('Enviando documento principal sin anexos')
        
        const filename = isPDF 
          ? `${caseType.replace(/\s+/g, '_')}_${fecha}.pdf`
          : `${caseType.replace(/\s+/g, '_')}_${fecha}.docx`
        
        return new NextResponse(documentBuffer, {
          status: 200,
          headers: {
            'Content-Type': isPDF ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': documentBuffer.length.toString(),
          },
        })
      }
      
    } catch (error) {
      console.error('Error procesando documento para descarga:', error)
      return NextResponse.json(
        { success: false, error: 'Error al procesar el documento para descarga' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('=== ERROR EN EL PROCESO DE DESCARGA ===')
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
