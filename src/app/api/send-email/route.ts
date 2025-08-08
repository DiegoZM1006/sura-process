import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { generateDocumentBlob } from '@/lib/document-generator-server'
import { mergePDFsWithAnnexes } from '@/lib/pdf-merger'

export async function GET() {
  return NextResponse.json({ 
    message: 'API de envío de email funcionando correctamente',
    timestamp: new Date().toISOString(),
    methods: ['POST']
  })
}

export async function POST(request: NextRequest) {
  console.log('=== INICIO DEL PROCESO DE ENVÍO DE EMAIL CON IMÁGENES Y VIDEOS ===')
  try {
    console.log('Obteniendo FormData...')
    const formData = await request.formData()
    
    // Extraer y validar datos del email
    const emailRecipientsRaw = formData.get('emailRecipients') as string
    if (!emailRecipientsRaw) {
      return NextResponse.json(
        { success: false, error: 'emailRecipients es requerido' },
        { status: 400 }
      )
    }
    
    let emailRecipients: string[]
    try {
      emailRecipients = JSON.parse(emailRecipientsRaw)
    } catch (error) {
      console.error('Error parsing emailRecipients:', error)
      return NextResponse.json(
        { success: false, error: 'Formato de destinatarios inválido' },
        { status: 400 }
      )
    }
    
    const emailSubject = formData.get('emailSubject') as string
    const emailMessage = formData.get('emailMessage') as string
    const caseType = formData.get('caseType') as string
    const nombreEmpresa = formData.get('nombreEmpresa') as string // 🔥 AGREGADO: Nombre empresa del modal
    
    console.log('Datos extraídos:', { emailRecipients, emailSubject, caseType, nombreEmpresa })
    
    // Validaciones básicas
    if (!emailRecipients || !Array.isArray(emailRecipients) || emailRecipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe especificar al menos un destinatario' },
        { status: 400 }
      )
    }
    
    if (!emailSubject) {
      return NextResponse.json(
        { success: false, error: 'El asunto del correo es requerido' },
        { status: 400 }
      )
    }
    
    if (!emailMessage) {
      return NextResponse.json(
        { success: false, error: 'El mensaje del correo es requerido' },
        { status: 400 }
      )
    }
    
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
    const videoFiles: any[] = [] // Nuevo array para videos
    let imageMetadata: any[] = []
    let videoMetadata: any[] = []
    
    for (const [key, value] of formData.entries()) {
      if (key === 'anexos' && value instanceof File) {
        // Recolectar archivos anexos del step 2
        anexoFiles.push(value)
        console.log(`Anexo encontrado: ${value.name} (${value.size} bytes)`)
      } else if (key.startsWith('imagen_') && value instanceof File) {
        // Recolectar archivos de imágenes de la tab Hechos
        const imageIndex = parseInt(key.replace('imagen_', ''))
        
        // Leer el archivo y convertir a data URL
        const arrayBuffer = await value.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        // Crear data URL base64 correcto
        const mimeType = value.type || 'image/jpeg'
        // Asegurar que el mimeType sea compatible con docxtemplater-image-module-free
        const validMimeType = mimeType.includes('jpeg') ? 'image/jpg' : mimeType
        const base64String = `data:${validMimeType};base64,${buffer.toString('base64')}`
        
        console.log(`Imagen ${imageIndex} procesada para email:`, {
          name: value.name,
          originalType: value.type,
          processedType: validMimeType,
          size: value.size,
          base64Length: base64String.length
        })
        
        imageFiles.push({
          data: base64String, // Data URL completo
          name: value.name,
          width: 400, // Se actualizará con metadatos
          height: 300, // Se actualizará con metadatos
          index: imageIndex,
          mimeType: validMimeType
        })
        
      } else if (key.startsWith('video_') && value instanceof File) {
        // Recolectar archivos de videos
        const videoIndex = parseInt(key.replace('video_', ''))
        
        console.log(`Video ${videoIndex} encontrado para email:`, {
          name: value.name,
          type: value.type,
          size: value.size,
          sizeInMB: (value.size / 1024 / 1024).toFixed(2)
        })
        
        videoFiles.push({
          file: value,
          name: value.name,
          size: value.size,
          type: value.type,
          index: videoIndex
        })
        
      } else if (key === 'imagenesMetadata') {
        // Obtener metadatos de las imágenes
        try {
          imageMetadata = JSON.parse(value as string)
          console.log('Metadatos de imágenes para email:', imageMetadata.length)
        } catch (error) {
          console.error('Error parseando metadatos de imágenes:', error)
          imageMetadata = []
        }
      } else if (key === 'videosMetadata') {
        // Obtener metadatos de los videos
        try {
          videoMetadata = JSON.parse(value as string)
          console.log('Metadatos de videos para email:', videoMetadata.length)
        } catch (error) {
          console.error('Error parseando metadatos de videos:', error)
          videoMetadata = []
        }
      } else if (!key.startsWith('email') && key !== 'caseType') {
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
        console.log(`Metadatos aplicados a imagen ${imgFile.index} para email: ${metadata.width}x${metadata.height}`)
      }
    })

    // Actualizar metadatos de videos con información correcta
    videoFiles.forEach(videoFile => {
      const metadata = videoMetadata.find(m => m.id === videoFile.index)
      if (metadata) {
        videoFile.name = metadata.name || videoFile.name
        console.log(`Metadatos aplicados a video ${videoFile.index} para email: ${videoFile.name}`)
      }
    })
    
    console.log('Datos extraídos para documento:', {
      keys: Object.keys(documentData),
      anexosCount: anexoFiles.length,
      imagenesCount: imageFiles.length,
      videosCount: videoFiles.length, // Nueva información
      caseType,
      sampleData: {
        nombreEmpresa: documentData.nombreEmpresa,
        nitEmpresa: documentData.nitEmpresa,
        correoEmpresa: documentData.correoEmpresa
      }
    })
    
    // 🔍 DEBUG: Log detallado de los datos extraídos del FormData
    console.log('🔍 DEBUG: Datos completos extraídos del FormData:')
    for (const [key, value] of Object.entries(documentData)) {
      console.log(`  ${key}: "${value}" (${typeof value})`)
    }
    
    // 🔍 DEBUG: Log de todos los entries del FormData original
    console.log('🔍 DEBUG: Todos los entries del FormData original:')
    const formDataEntries = []
    for (const [key, value] of formData.entries()) {
      if (!(value instanceof File)) {
        formDataEntries.push({ key, value, type: typeof value })
      }
    }
    console.log('FormData entries (no-files):', formDataEntries)
    
    console.log('Generando documento Word para email con imágenes...')
    
    // Generar documento Word con imágenes
    let documentBlob: Blob | null = null
    let documentError: string | null = null
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
      documentBlob = await generateDocumentBlob(documentData, caseType, undefined, hechosArray, imageFiles)
      console.log('Documento generado exitosamente con imágenes para email')
    } catch (error) {
      console.error('Error generando documento:', error)
      documentError = error instanceof Error ? error.message : 'Error desconocido'
      console.warn('⚠️ Continuando sin documento adjunto debido a error en plantilla')
      // No fallar el proceso, continuar sin documento
    }
    
    // Validar configuración SMTP
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('Configuración SMTP incompleta')
      return NextResponse.json(
        { success: false, error: 'Configuración de correo no disponible' },
        { status: 500 }
      )
    }
    
    console.log('Configurando transportador SMTP...')
    
    // Configurar el transportador de correo
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Preparar anexos
    console.log('Preparando anexos para el correo...')
    const attachments = []
    
    // Procesar documento principal y anexos
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
          
          const filename = imageFiles.length > 0 
            ? `${caseType.replace(/\s+/g, '_')}_${fecha}_COMPLETO_CON_IMAGENES.pdf`
            : `${caseType.replace(/\s+/g, '_')}_${fecha}_COMPLETO.pdf`
          
          attachments.push({
            filename: filename,
            content: mergedPdfBuffer,
            contentType: 'application/pdf'
          })
          console.log('PDF combinado creado exitosamente con imágenes incluidas')
          
        } catch (mergeError) {
          console.error('Error en el merge, enviando archivos por separado:', mergeError)
          
          // Si falla el merge, enviar archivos por separado
          const filename = imageFiles.length > 0
            ? `${caseType.replace(/\s+/g, '_')}_${fecha}_CON_IMAGENES.pdf`
            : `${caseType.replace(/\s+/g, '_')}_${fecha}.pdf`
          
          attachments.push({
            filename: filename,
            content: documentBuffer,
            contentType: 'application/pdf'
          })
          
          // Agregar anexos por separado
          for (let i = 0; i < anexoFiles.length; i++) {
            const anexo = anexoFiles[i]
            try {
              const anexoBuffer = Buffer.from(await anexo.arrayBuffer())
              const timestamp = Date.now()
              const fileExtension = anexo.name.split('.').pop() || ''
              const fileName = `anexo_${i + 1}_${timestamp}.${fileExtension}`
              
              attachments.push({
                filename: fileName,
                content: anexoBuffer,
                contentType: anexo.type || 'application/octet-stream'
              })
            } catch (error) {
              console.error(`Error procesando anexo ${anexo.name}:`, error)
            }
          }
        }
        
      } else {
        // Si no es PDF o no hay anexos, procesar normalmente
        const fileExtension = isPDF ? 'pdf' : 'docx'
        const contentType = isPDF ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        
        const filename = imageFiles.length > 0
          ? `${caseType.replace(/\s+/g, '_')}_${fecha}_CON_IMAGENES.${fileExtension}`
          : `${caseType.replace(/\s+/g, '_')}_${fecha}.${fileExtension}`
        
        attachments.push({
          filename: filename,
          content: documentBuffer,
          contentType: contentType
        })
        console.log(`Documento ${fileExtension.toUpperCase()} con imágenes añadido como anexo`)
        
        // Añadir anexos del step 2 por separado si existen
        if (anexoFiles.length > 0) {
          console.log(`Procesando ${anexoFiles.length} anexos del step 2 por separado...`)
          
          for (let i = 0; i < anexoFiles.length; i++) {
            const anexo = anexoFiles[i]
            try {
              const anexoBuffer = Buffer.from(await anexo.arrayBuffer())
              
              const timestamp = Date.now()
              const fileExtension = anexo.name.split('.').pop() || ''
              const fileName = `anexo_${i + 1}_${timestamp}.${fileExtension}`
              
              attachments.push({
                filename: fileName,
                content: anexoBuffer,
                contentType: anexo.type || 'application/octet-stream'
              })
              
              console.log(`Anexo ${i + 1} procesado: ${anexo.name} -> ${fileName}`)
            } catch (error) {
              console.error(`Error procesando anexo ${anexo.name}:`, error)
            }
          }
        }
      }

      // Añadir videos como anexos separados
      if (videoFiles.length > 0) {
        console.log(`Procesando ${videoFiles.length} videos como anexos...`)
        
        for (let i = 0; i < videoFiles.length; i++) {
          const video = videoFiles[i]
          try {
            const videoBuffer = Buffer.from(await video.file.arrayBuffer())
            
            // Crear un nombre de archivo limpio y único
            const timestamp = Date.now()
            const fileExtension = video.name.split('.').pop() || 'mp4'
            const cleanName = video.name.replace(/[^a-zA-Z0-9._-]/g, '_') // Limpiar caracteres especiales
            const fileName = `video_evidencia_${i + 1}_${timestamp}.${fileExtension}`
            
            // Determinar el tipo MIME correcto
            let contentType = video.type || 'video/mp4'
            if (!contentType.startsWith('video/')) {
              contentType = 'video/mp4' // Fallback por defecto
            }
            
            attachments.push({
              filename: fileName,
              content: videoBuffer,
              contentType: contentType
            })
            
            console.log(`Video ${i + 1} procesado:`, {
              originalName: video.name,
              fileName: fileName,
              size: `${(video.size / 1024 / 1024).toFixed(2)}MB`,
              contentType: contentType
            })
            
          } catch (error) {
            console.error(`Error procesando video ${video.name}:`, error)
            // Continuar con los siguientes videos aunque uno falle
          }
        }
      }
      
    } catch (error) {
      console.error('Error procesando documento principal:', error)
      return NextResponse.json(
        { success: false, error: 'Error procesando el documento principal' },
        { status: 500 }
      )
    }
    
    console.log(`Total de anexos preparados: ${attachments.length}`)

    // Agregar información sobre imágenes y videos al mensaje del email
    let emailMessageWithMedia = emailMessage

    {/*
          // ${imageFiles.length > 0 ? `
          // <div style="margin-top: 20px; padding: 10px; background-color: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
          //   <strong>📷 Evidencia Fotográfica:</strong> Este documento incluye ${imageFiles.length} imagen(es) integrada(s) como evidencia de los hechos.
          // </div>
          // ` : ''}

          // ${videoFiles.length > 0 ? `
          // <div style="margin-top: 20px; padding: 10px; background-color: #f3e5f5; border-left: 4px solid #9c27b0; border-radius: 4px;">
          //   <strong>🎥 Evidencia en Video:</strong> Se incluyen ${videoFiles.length} video(s) como evidencia adicional de los hechos (Total: ${(videoFiles.reduce((total, v) => total + v.size, 0) / 1024 / 1024).toFixed(2)}MB).
          // </div>
          // ` : ''}
      */}

    // Configurar el contenido del email
    const mailOptions = {
      from: process.env.SMTP_FROM || 'subrogacion10@btlegalgroup.com',
      to: emailRecipients.join(', '),
      subject: emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          ${emailMessageWithMedia.replace(/\n/g, '<br>')}
          
          <div style="margin-top: 30px;">
          <img src="cid:logo" alt="BTL Legal Group" style="max-width: 150px; height: auto;" />
          </div>

          <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; font-size: 12px;">
            <strong>AVISO DE CONFIDENCIALIDAD:</strong> El anterior mensaje de correo electrónico y sus anexos contienen información confidencial y, por lo tanto, sujeta a reserva. Si usted no es destinatario del mismo debe proceder a informar mediante correo electrónico a la persona que lo envió y a borrar de su sistema tanto el correo recibido como el enviado, sin conservar copias. En todo caso el uso, difusión, distribución o reproducción del presente mensaje, sin autorización, es prohibido y puede configurar un delito.
          </div>
          
          <div style="margin-top: 15px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; font-size: 12px;">
            <strong>CONFIDENTIALITY NOTICE:</strong> The previous email message and its attachments contain confidential information and are therefore subject to privilege. If you are not the intended recipient, you must notify the sender by email and delete both the received and sent email from your system without keeping copies. In any case, the use, disclosure, distribution or reproduction of this message without authorization is prohibited and may constitute a crime.
          </div>
        </div>
      `,
      attachments: [
        ...attachments,
        {
          filename: 'btl-logo.png',
          path: process.cwd() + '/public/btl-logo.png',
          cid: 'logo'
        }
      ]
    }

    console.log('Opciones de correo configuradas:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      attachmentsCount: mailOptions.attachments.length,
      imagenesIncluidas: imageFiles.length,
      videosIncluidos: videoFiles.length,
      totalSizeVideos: `${(videoFiles.reduce((total, v) => total + v.size, 0) / 1024 / 1024).toFixed(2)}MB`
    })

    // Verificar conexión SMTP antes de enviar
    try {
      console.log('Verificando conexión SMTP...')
      await transporter.verify()
      console.log('Conexión SMTP verificada correctamente')
    } catch (error) {
      console.error('Error en la verificación SMTP:', error)
      return NextResponse.json(
        { success: false, error: 'Error de configuración del servidor de correo' },
        { status: 500 }
      )
    }

    // Enviar el correo
    console.log('Enviando correo electrónico con imágenes y videos...')
    let info
    try {
      info = await transporter.sendMail(mailOptions)
      console.log('Correo enviado exitosamente:', info.messageId)
      console.log('🔥 PUNTO DE CONTROL: Correo enviado, ahora proceder a crear caso')
    } catch (error) {
      console.error('Error enviando correo:', error)
      
      let errorMessage = 'Error al enviar el correo'
      if (error instanceof Error) {
        if (error.message.includes('Invalid login') || error.message.includes('authentication')) {
          errorMessage = 'Error de autenticación del correo'
        } else if (error.message.includes('Network') || error.message.includes('ENOTFOUND')) {
          errorMessage = 'Error de conexión de red'
        } else if (error.message.includes('Invalid recipients')) {
          errorMessage = 'Direcciones de correo inválidas'
        } else if (error.message.includes('Message too large') || error.message.includes('size limit')) {
          errorMessage = 'El correo con los videos excede el límite de tamaño permitido. Considere enviar videos más pequeños o por separado.'
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage, 
          details: error instanceof Error ? error.message : 'Error desconocido'
        },
        { status: 500 }
      )
    }
    
    console.log('=== RESPUESTA EXITOSA CON IMÁGENES Y VIDEOS ===')
    
    // Determinar si se hizo merge o se enviaron archivos separados
    const mergedFile = attachments.find(att => att.filename.includes('_COMPLETO'))
    const hasMergedPDF = !!mergedFile
    const hasImages = imageFiles.length > 0
    const hasVideos = videoFiles.length > 0
    
    // CREAR CASO EN EL BACKEND después del envío exitoso del correo
    console.log('=== CREANDO CASO EN EL BACKEND ===')
    console.log('Datos disponibles para caso:', {
      nombreEmpresa_delModal: nombreEmpresa, // 🔥 USANDO DATO DEL MODAL
      documentData_nombreEmpresa: documentData.nombreEmpresa,
      caseType: caseType,
      messageId: info?.messageId,
      hasToken: !!request.cookies.get('auth_token')?.value
    })
    
    try {
      // Extraer el token de las cookies del request
      const token = request.cookies.get('auth_token')?.value
      
      console.log('🔍 VERIFICANDO CONDICIONES PARA CREAR CASO:')
      console.log('  - Token presente:', !!token)
      console.log('  - Nombre empresa (modal):', nombreEmpresa) // 🔥 USANDO DATO DEL MODAL
      console.log('  - Tipo caso:', caseType)
      console.log('  - Message ID:', info?.messageId)
      
      if (token && nombreEmpresa && caseType && info.messageId) { // 🔥 USANDO DATO DEL MODAL
        const casePayload = {
          type: caseType,
          companyName: nombreEmpresa, // 🔥 USANDO DATO DEL MODAL
          messageId: info.messageId
        }
        
        console.log('✅ Todos los datos están disponibles. Enviando datos del caso al backend:', casePayload)
        console.log('URL del backend:', `${process.env.BACKEND_URL || 'http://localhost:8080'}/cases`)
        
        // Llamar DIRECTAMENTE al backend real
        const caseResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/cases`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Usar Authorization header estándar
          },
          body: JSON.stringify(casePayload)
        })
        
        console.log('Respuesta del endpoint de casos - Status:', caseResponse.status)
        
        if (caseResponse.ok) {
          const caseData = await caseResponse.json()
          console.log('✅ Caso creado exitosamente en el backend:', caseData)
        } else {
          const errorText = await caseResponse.text()
          console.error('❌ Error creando caso en el backend:', errorText)
          // No fallar el envío del correo si falla la creación del caso
        }
      } else {
        console.warn('❌ Datos insuficientes para crear caso:', {
          hasToken: !!token,
          hasNombreEmpresa: !!nombreEmpresa, // 🔥 USANDO DATO DEL MODAL
          hasCaseType: !!caseType,
          hasMessageId: !!info?.messageId,
          token: token ? 'presente' : 'ausente',
          nombreEmpresa: nombreEmpresa || 'ausente', // 🔥 USANDO DATO DEL MODAL
          caseType: caseType || 'ausente',
          messageId: info?.messageId || 'ausente'
        })
      }
    } catch (caseError) {
      console.error('❌ Error al intentar crear caso:', caseError)
      // No fallar el envío del correo si falla la creación del caso
    }
    
    console.log('🎯 DESPUÉS DE INTENTAR CREAR CASO - Preparando respuesta')
    
    const successResponse = { 
      success: true, 
      message: 'Correo enviado exitosamente con imágenes y videos',
      messageId: info.messageId,
      recipients: emailRecipients.length,
      attachments: {
        total: attachments.length,
        merged: hasMergedPDF,
        images: hasImages ? imageFiles.length : 0,
        videos: hasVideos ? videoFiles.length : 0,
        videoSizeMB: hasVideos ? parseFloat((videoFiles.reduce((total, v) => total + v.size, 0) / 1024 / 1024).toFixed(2)) : 0,
        description: [
          hasImages ? `Documento con ${imageFiles.length} imagen(es) integrada(s)` : '',
          hasVideos ? `${videoFiles.length} video(s) de evidencia (${(videoFiles.reduce((total, v) => total + v.size, 0) / 1024 / 1024).toFixed(2)}MB)` : '',
          hasMergedPDF ? `PDF combinado con ${anexoFiles.length} anexos` : anexoFiles.length > 0 ? `${anexoFiles.length} anexos separados` : ''
        ].filter(Boolean).join(' + ')
      }
    }
    console.log('🏁 FINAL: Respuesta exitosa preparada:', successResponse)
    console.log('🏁 FINAL: Retornando respuesta al cliente')
    
    return NextResponse.json(successResponse)

  } catch (error) {
    console.error('=== ERROR GENERAL ===')
    console.error('Error enviando correo:', error)
    
    let errorMessage = 'Error al enviar el correo'
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid login') || error.message.includes('authentication')) {
        errorMessage = 'Error de autenticación del correo'
        statusCode = 401
      } else if (error.message.includes('Network') || error.message.includes('ENOTFOUND')) {
        errorMessage = 'Error de conexión de red'
        statusCode = 503
      } else if (error.message.includes('Invalid recipients')) {
        errorMessage = 'Direcciones de correo inválidas'
        statusCode = 400
      } else if (error.message.includes('Message too large') || error.message.includes('size limit')) {
        errorMessage = 'El correo con los videos excede el límite de tamaño permitido'
        statusCode = 413
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}
