/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { generateDocumentBlob } from '@/lib/document-generator-server'
import { mergePDFsWithAnnexes } from '@/lib/pdf-merger'
import fs from 'fs'
import path from 'path'

export async function GET() {
  return NextResponse.json({
    message: 'API de envío de email funcionando correctamente con Gmail API',
    timestamp: new Date().toISOString(),
    methods: ['POST']
  })
}

/**
 * Obtiene el access token desde el backend
 */
async function getAccessTokenFromBackend(userEmail: string): Promise<string> {
  const apiKey = process.env.N8N_API_KEY
  if (!apiKey) {
    throw new Error('N8N_API_KEY no configurada')
  }

  const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/oauth/tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({ userEmail })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Error obteniendo token: ${errorText}`)
  }

  const tokenData = await response.json()
  return tokenData.data.access_token
}

/**
 * Lee un archivo y lo convierte a base64
 */
async function readFileAsBase64(filePath: string): Promise<string> {
  try {
    const fullPath = path.join(process.cwd(), filePath)
    const fileBuffer = await fs.promises.readFile(fullPath)
    return fileBuffer.toString('base64')
  } catch (error) {
    console.error(`Error leyendo archivo ${filePath}:`, error)
    throw new Error(`No se pudo leer el archivo: ${filePath}`)
  }
}

/**
 * Crea un mensaje MIME compatible con Gmail API - Versión mejorada
 */
function createMimeMessage(
  to: string[],
  subject: string,
  htmlBody: string,
  attachments: any[],
  fromEmail: string
): string {
  const mixedBoundary = `mixed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const relatedBoundary = `related_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Separar attachments embebidos (CID) de archivos adjuntos
  const embeddedImages = attachments.filter(att => att.cid)
  const fileAttachments = attachments.filter(att => !att.cid)
  
  // Crear encabezados principales
  let message = [
    `From: ${fromEmail}`,
    `To: ${to.join(', ')}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    '',
    `--${mixedBoundary}`,
    `Content-Type: multipart/related; boundary="${relatedBoundary}"`,
    '',
    `--${relatedBoundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(htmlBody, 'utf-8').toString('base64').match(/.{1,76}/g)?.join('\r\n') || '',
    ''
  ].join('\r\n')

  // Agregar imágenes embebidas (CID)
  embeddedImages.forEach(image => {
    const base64Content = image.content.toString('base64')
    const lines = base64Content.match(/.{1,76}/g) || []
    
    message += [
      `--${relatedBoundary}`,
      `Content-Type: ${image.contentType}`,
      'Content-Transfer-Encoding: base64',
      `Content-ID: <${image.cid}>`,
      `Content-Disposition: inline; filename="${image.filename}"`,
      '',
      lines.join('\r\n'),
      ''
    ].join('\r\n')
  })

  // Cerrar boundary related
  message += `--${relatedBoundary}--\r\n`

  // Agregar archivos adjuntos normales
  fileAttachments.forEach(attachment => {
    const base64Content = attachment.content.toString('base64')
    const lines = base64Content.match(/.{1,76}/g) || []
    
    message += [
      `--${mixedBoundary}`,
      `Content-Type: ${attachment.contentType}`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      '',
      lines.join('\r\n'),
      ''
    ].join('\r\n')
  })

  // Cerrar boundary principal
  message += `--${mixedBoundary}--`

  // Codificar en base64url (requerido por Gmail API)
  return Buffer.from(message, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Envía email usando Gmail API
 */
async function sendEmailWithGmailAPI(
  accessToken: string,
  to: string[],
  subject: string,
  htmlBody: string,
  attachments: any[],
  fromEmail: string
) {
  // Configurar autenticación con access token
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })
  const gmail = google.gmail({ version: 'v1', auth })

  // Crear mensaje MIME
  const mimeMessage = createMimeMessage(to, subject, htmlBody, attachments, fromEmail)

  // Enviar email
  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: mimeMessage
    }
  })

  return response.data
}

export async function POST(request: NextRequest) {
  console.log('=== INICIO DEL PROCESO DE ENVÍO DE EMAIL CON GMAIL API ===')
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
    const nombreEmpresa = formData.get('nombreEmpresa') as string
    const senderEmail = formData.get('senderEmail') as string // Email del remitente para obtener su token

    console.log('Datos extraídos:', { emailRecipients, emailSubject, caseType, nombreEmpresa, senderEmail })

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

    if (!senderEmail) {
      return NextResponse.json(
        { success: false, error: 'Email del remitente es requerido para obtener token' },
        { status: 400 }
      )
    }

    // Extraer datos del formulario para generar el documento
    console.log('Extrayendo datos del formulario...')
    const documentData: any = {}
    const anexoFiles: File[] = []
    const imageFiles: any[] = []
    const videoFiles: any[] = []
    let imageMetadata: any[] = []
    let videoMetadata: any[] = []

    for (const [key, value] of formData.entries()) {
      if (key === 'anexos' && value instanceof File) {
        anexoFiles.push(value)
        console.log(`Anexo encontrado: ${value.name} (${value.size} bytes)`)
      } else if (key.startsWith('imagen_') && value instanceof File) {
        const imageIndex = parseInt(key.replace('imagen_', ''))

        const arrayBuffer = await value.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const mimeType = value.type || 'image/jpeg'
        const validMimeType = mimeType.includes('jpeg') ? 'image/jpg' : mimeType
        const base64String = `data:${validMimeType};base64,${buffer.toString('base64')}`

        console.log(`Imagen ${imageIndex} procesada:`, {
          name: value.name,
          originalType: value.type,
          processedType: validMimeType,
          size: value.size,
          base64Length: base64String.length
        })

        imageFiles.push({
          data: base64String,
          name: value.name,
          width: 400,
          height: 300,
          index: imageIndex,
          mimeType: validMimeType
        })

      } else if (key.startsWith('video_') && value instanceof File) {
        const videoIndex = parseInt(key.replace('video_', ''))

        console.log(`Video ${videoIndex} encontrado:`, {
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
        try {
          imageMetadata = JSON.parse(value as string)
          console.log('Metadatos de imágenes:', imageMetadata.length)
        } catch (error) {
          console.error('Error parseando metadatos de imágenes:', error)
          imageMetadata = []
        }
      } else if (key === 'videosMetadata') {
        try {
          videoMetadata = JSON.parse(value as string)
          console.log('Metadatos de videos:', videoMetadata.length)
        } catch (error) {
          console.error('Error parseando metadatos de videos:', error)
          videoMetadata = []
        }
      } else if (!key.startsWith('email') && key !== 'caseType' && key !== 'senderEmail') {
        documentData[key] = value
      }
    }

    // Actualizar metadatos
    imageFiles.forEach(imgFile => {
      const metadata = imageMetadata.find(m => m.id === imgFile.index)
      if (metadata) {
        imgFile.width = metadata.width
        imgFile.height = metadata.height
        imgFile.name = metadata.name
        console.log(`Metadatos aplicados a imagen ${imgFile.index}: ${metadata.width}x${metadata.height}`)
      }
    })

    videoFiles.forEach(videoFile => {
      const metadata = videoMetadata.find(m => m.id === videoFile.index)
      if (metadata) {
        videoFile.name = metadata.name || videoFile.name
        console.log(`Metadatos aplicados a video ${videoFile.index}: ${videoFile.name}`)
      }
    })

    console.log('Datos extraídos para documento:', {
      keys: Object.keys(documentData),
      anexosCount: anexoFiles.length,
      imagenesCount: imageFiles.length,
      videosCount: videoFiles.length,
      caseType,
      sampleData: {
        nombreEmpresa: documentData.nombreEmpresa,
        nitEmpresa: documentData.nitEmpresa,
        correoEmpresa: documentData.correoEmpresa
      }
    })

    console.log('Generando documento Word con imágenes...')

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
      if (hechosArray) {
        hechosArray.forEach((hecho: any) => {
          console.log(`Procesando hecho: ${hecho.descripcionHecho} con ID ${hecho.id}`)
        })
      }
      documentBlob = await generateDocumentBlob(documentData, caseType, undefined, hechosArray, imageFiles)
      console.log('Documento generado exitosamente con imágenes')
    } catch (error) {
      console.error('Error generando documento:', error)
      documentError = error instanceof Error ? error.message : 'Error desconocido'
      console.warn('⚠️ Continuando sin documento adjunto debido a error en plantilla')
    }

    // Obtener access token del backend
    console.log('Obteniendo access token del backend...')
    let accessToken: string
    try {
      accessToken = await getAccessTokenFromBackend(senderEmail)
      console.log('Access token obtenido exitosamente')
    } catch (error) {
      console.error('Error obteniendo access token:', error)
      return NextResponse.json(
        { success: false, error: 'No se pudo obtener el token de autenticación' },
        { status: 500 }
      )
    }

    console.log('Preparando anexos para Gmail API...')
    const attachments = []

    // Agregar logo BTL como imagen embebida (CID)
    let logoBase64 = ''
    try {
      const logoPath = 'public/btl-logo.png'
      logoBase64 = await readFileAsBase64(logoPath)
      attachments.push({
        filename: 'btl-logo.png',
        content: Buffer.from(logoBase64, 'base64'),
        contentType: 'image/png',
        cid: 'logo',
        disposition: 'inline'
      })
      console.log('Logo BTL agregado exitosamente como imagen embebida')
    } catch (error) {
      console.error('Error agregando logo BTL:', error)
      console.warn('Continuando sin logo en el correo')
    }

    // Procesar documento principal y anexos
    if (documentBlob) {
      try {
        const documentBuffer = Buffer.from(await documentBlob.arrayBuffer())
        const fecha = new Date().toISOString().split('T')[0]

        const isPDF = documentBlob.type === 'application/pdf'

        if (isPDF && anexoFiles.length > 0) {
          console.log('Documento principal es PDF y hay anexos - realizando merge...')

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
            console.log('PDF combinado creado exitosamente')

          } catch (mergeError) {
            console.error('Error en el merge, enviando archivos por separado:', mergeError)

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
          console.log(`Documento ${fileExtension.toUpperCase()} añadido como anexo`)

          // Añadir anexos del step 2 por separado
          if (anexoFiles.length > 0) {
            console.log(`Procesando ${anexoFiles.length} anexos por separado...`)

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

              const timestamp = Date.now()
              const fileExtension = video.name.split('.').pop() || 'mp4'
              const cleanName = video.name.replace(/[^a-zA-Z0-9._-]/g, '_')
              const fileName = `video_evidencia_${i + 1}_${timestamp}.${fileExtension}`

              let contentType = video.type || 'video/mp4'
              if (!contentType.startsWith('video/')) {
                contentType = 'video/mp4'
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
    }

    console.log(`Total de anexos preparados: ${attachments.length}`)

    // Configurar HTML del email con estilos mejorados y compatibles
    let emailMessageWithMedia = emailMessage

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; font-family: Arial, sans-serif; background-color: #ffffff; color: #333333;">
    
    <div style="background-color: #ffffff;">
        
        <!-- Mensaje principal -->
        <div style="font-size: 14px; line-height: 1.6; color: #333333; margin-bottom: 30px;">
            ${emailMessageWithMedia.replace(/\n/g, '<br>')}
        </div>

        <!-- Logo BTL -->
        <div style="text-align: left; margin: 30px 0 40px 0;">
            <img src="cid:logo" alt="BTL Legal Group" style="max-width: 150px; height: auto; display: block;" />
        </div>
        
        <!-- Aviso de Confidencialidad en Español -->
        <div style="margin-top: 30px; margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; font-size: 12px; color: #333333; line-height: 1.5;">
            <div style="font-weight: bold; color: #000000; margin-bottom: 8px;">AVISO DE CONFIDENCIALIDAD:</div>
            <div style="color: #333333;">
                El anterior mensaje de correo electrónico y sus anexos contienen información confidencial y, por lo tanto, sujeta a reserva. Si usted no es destinatario del mismo debe proceder a informar mediante correo electrónico a la persona que lo envió y a borrar de su sistema tanto el correo recibido como el enviado, sin conservar copias. En todo caso el uso, difusión, distribución o reproducción del presente mensaje, sin autorización, es prohibido y puede configurar un delito.
            </div>
        </div>
        
        <!-- Aviso de Confidencialidad en Inglés -->
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; font-size: 12px; color: #333333; line-height: 1.5;">
            <div style="font-weight: bold; color: #000000; margin-bottom: 8px;">CONFIDENTIALITY NOTICE:</div>
            <div style="color: #333333;">
                The previous email message and its attachments contain confidential information and are therefore subject to privilege. If you are not the intended recipient, you must notify the sender by email and delete both the received and sent email from your system without keeping copies. In any case, the use, disclosure, distribution or reproduction of this message without authorization is prohibited and may constitute a crime.
            </div>
        </div>
        
    </div>
    
</body>
</html>
    `.trim()

    console.log('Configuración de correo preparada:', {
      to: emailRecipients.join(', '),
      subject: emailSubject,
      attachmentsCount: attachments.length,
      imagenesIncluidas: imageFiles.length,
      videosIncluidos: videoFiles.length,
      totalSizeVideos: `${(videoFiles.reduce((total, v) => total + v.size, 0) / 1024 / 1024).toFixed(2)}MB`
    })

    // Enviar el correo usando Gmail API
    console.log('Enviando correo electrónico con Gmail API...')
    let response
    try {
      response = await sendEmailWithGmailAPI(
        accessToken,
        emailRecipients,
        emailSubject,
        htmlBody,
        attachments,
        senderEmail
      )

      console.log('Correo enviado exitosamente con Gmail API:', response.id)
    } catch (error) {
      console.error('Error enviando correo con Gmail API:', error)

      let errorMessage = 'Error al enviar el correo'
      if (error instanceof Error) {
        if (error.message.includes('invalid_grant') || error.message.includes('unauthorized')) {
          errorMessage = 'Token de autenticación expirado o inválido'
        } else if (error.message.includes('quotaExceeded')) {
          errorMessage = 'Cuota de Gmail API excedida'
        } else if (error.message.includes('Message too large')) {
          errorMessage = 'El correo excede el límite de tamaño de Gmail'
        } else if (error.message.includes('invalid recipients')) {
          errorMessage = 'Direcciones de correo inválidas'
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

    console.log('=== RESPUESTA EXITOSA CON GMAIL API ===')

    // Determinar información sobre archivos adjuntos
    const mergedFile = attachments.find(att => att.filename.includes('_COMPLETO'))
    const hasMergedPDF = !!mergedFile
    const hasImages = imageFiles.length > 0
    const hasVideos = videoFiles.length > 0

    // CREAR CASO EN EL BACKEND después del envío exitoso del correo
    console.log('=== CREANDO CASO EN EL BACKEND ===')
    console.log('Datos disponibles para caso:', {
      nombreEmpresa_delModal: nombreEmpresa,
      documentData_nombreEmpresa: documentData.nombreEmpresa,
      caseType: caseType,
      messageId: response?.id,
      hasToken: !!request.cookies.get('auth_token')?.value
    })

    try {
      const token = request.cookies.get('auth_token')?.value

      console.log('🔍 VERIFICANDO CONDICIONES PARA CREAR CASO:')
      console.log('  - Token presente:', !!token)
      console.log('  - Nombre empresa (modal):', nombreEmpresa)
      console.log('  - Tipo caso:', caseType)
      console.log('  - Message ID:', response?.id)

      if (token && nombreEmpresa && caseType && response?.id) {
        const casePayload = {
          type: caseType,
          companyName: nombreEmpresa,
          messageId: response.id
        }

        console.log('✅ Enviando datos del caso al backend:', casePayload)

        const caseResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/cases`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
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
        }
      } else {
        console.warn('❌ Datos insuficientes para crear caso')
      }
    } catch (caseError) {
      console.error('❌ Error al intentar crear caso:', caseError)
    }

    const successResponse = {
      success: true,
      message: 'Correo enviado exitosamente con Gmail API',
      messageId: response.id,
      recipients: emailRecipients.length,
      provider: 'Gmail API',
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

    return NextResponse.json(successResponse)

  } catch (error) {
    console.error('=== ERROR GENERAL ===')
    console.error('Error en el proceso:', error)

    let errorMessage = 'Error al procesar la solicitud'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('invalid_grant') || error.message.includes('unauthorized')) {
        errorMessage = 'Token de autenticación expirado o inválido'
        statusCode = 401
      } else if (error.message.includes('quotaExceeded')) {
        errorMessage = 'Cuota de Gmail API excedida'
        statusCode = 429
      } else if (error.message.includes('Network')) {
        errorMessage = 'Error de conexión de red'
        statusCode = 503
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}
