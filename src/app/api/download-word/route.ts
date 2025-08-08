import { NextRequest, NextResponse } from 'next/server'
import { generateDocumentBlob } from '@/lib/document-generator-server'
import { mergePDFsWithAnnexes } from '@/lib/pdf-merger'

export async function POST(request: NextRequest) {
  console.log('=== INICIO DEL PROCESO DE DESCARGA DE WORD CON ANEXOS E IMÁGENES ===')
  try {
    console.log('Obteniendo FormData...')
    const formData = await request.formData()
    console.log('FormData obtenido exitosamente', formData)
    
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
    const imageFiles: any[] = []
    let imageMetadata: any[] = []
    
    for (const [key, value] of formData.entries()) {
      if (key === 'anexos' && value instanceof File) {
        // Recolectar archivos anexos del step 2
        anexoFiles.push(value)
        console.log(`Anexo encontrado: ${value.name} (${value.size} bytes)`)
      } else if (key.startsWith('imagen_') && value instanceof File) {
        // Recolectar archivos de imágenes
        const imageIndex = parseInt(key.replace('imagen_', ''))
        
        // Leer el archivo y convertir a data URL
        const arrayBuffer = await value.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        // Crear data URL base64 correcto
        const mimeType = value.type || 'image/jpeg'
        // Asegurar que el mimeType sea compatible con docxtemplater-image-module-free
        const validMimeType = mimeType.includes('jpeg') ? 'image/jpg' : mimeType
        const base64String = `data:${validMimeType};base64,${buffer.toString('base64')}`
        
        console.log(`Imagen ${imageIndex} procesada:`, {
          name: value.name,
          originalType: value.type,
          processedType: validMimeType,
          size: value.size,
          base64Length: base64String.length,
          base64Preview: base64String.substring(0, 50) + '...'
        })
        
        imageFiles.push({
          data: base64String, // Data URL completo
          name: value.name,
          width: 400, // Se actualizará con metadatos
          height: 300, // Se actualizará con metadatos
          index: imageIndex,
          mimeType: validMimeType
        })
        
      } else if (key === 'imagenesMetadata') {
        // Obtener metadatos de las imágenes
        try {
          imageMetadata = JSON.parse(value as string)
          console.log('Metadatos de imágenes:', imageMetadata.length)
        } catch (error) {
          console.error('Error parseando metadatos de imágenes:', error)
          imageMetadata = []
        }
      } else if (key !== 'caseType') {
        documentData[key] = value
      }
    }

    // Actualizar metadatos de imágenes con información correcta
    imageFiles.forEach(imgFile => {
      const metadata = imageMetadata.find(m => m.id === imgFile.index)
      if (metadata) {
        imgFile.width = metadata.width
        imgFile.height = metadata.height
        imgFile.name = metadata.name
        console.log(`Metadatos aplicados a imagen ${imgFile.index}: ${metadata.width}x${metadata.height}`)
      }
    })
    
    console.log('Datos extraídos para documento:', {
      keys: Object.keys(documentData),
      anexosCount: anexoFiles.length,
      imagenesCount: imageFiles.length,
      caseType,
      sampleData: {
        nombreEmpresa: documentData.nombreEmpresa,
        nitEmpresa: documentData.nitEmpresa,
        correoEmpresa: documentData.correoEmpresa
      }
    })
    
    console.log('Generando documento Word para descarga con imágenes...')
    
    // Generar documento Word con imágenes
    let documentBlob: Blob
    try {
      let hechos: any = formData.get('hechos')
      let hechosArray = undefined
      if (hechos) {
        try {
          hechosArray = JSON.parse(hechos as string)
        } catch (e) {
          console.error('Error parseando Hechos:', e)
          hechosArray = undefined
        }
      }
      hechosArray.forEach((hecho: any) => {
        // Procesar cada hecho
        console.log(`Procesando hecho: ${hecho.descripcionHecho} con ID ${hecho.id}`)
      })
      documentBlob = await generateDocumentBlob(documentData, caseType, undefined, hechosArray)
      console.log('Documento generado exitosamente con imágenes')
    } catch (error) {
      console.error('Error generando documento:', error)
      return NextResponse.json(
        { success: false, error: 'Error al generar el documento con imágenes' },
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
          
          const filename = `${caseType.replace(/\s+/g, '_')}_${fecha}_COMPLETO_CON_IMAGENES.pdf`
          
          console.log('PDF combinado creado exitosamente con imágenes')
          
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
            ? `${caseType.replace(/\s+/g, '_')}_${fecha}_CON_IMAGENES.pdf`
            : `${caseType.replace(/\s+/g, '_')}_${fecha}_CON_IMAGENES.docx`
          
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
        // Sin anexos o documento no es PDF - enviar documento principal con imágenes
        console.log('Enviando documento principal con imágenes, sin anexos adicionales')
        
        const filename = isPDF 
          ? `${caseType.replace(/\s+/g, '_')}_${fecha}_CON_IMAGENES.pdf`
          : `${caseType.replace(/\s+/g, '_')}_${fecha}_CON_IMAGENES.docx`
        
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
