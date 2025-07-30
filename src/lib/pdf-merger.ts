import { PDFDocument, degrees } from 'pdf-lib'

/**
 * Combina múltiples PDFs en un solo documento
 * @param mainPdfBuffer Buffer del PDF principal
 * @param annexBuffers Array de buffers de los anexos (pueden ser PDFs, imágenes, etc.)
 * @returns Buffer del PDF combinado
 */
export async function mergePDFsWithAnnexes(
  mainPdfBuffer: Buffer, 
  annexBuffers: { buffer: Buffer, filename: string, mimetype: string }[]
): Promise<Buffer> {
  try {
    console.log('=== INICIANDO MERGE DE PDFs ===')
    console.log('PDF principal:', mainPdfBuffer.length, 'bytes')
    console.log('Anexos a procesar:', annexBuffers.length)

    // Crear un nuevo documento PDF
    const mergedPdf = await PDFDocument.create()
    
    // Agregar páginas del PDF principal
    console.log('Agregando páginas del PDF principal...')
    const mainPdf = await PDFDocument.load(mainPdfBuffer)
    const mainPageIndices = mainPdf.getPageIndices();
    let mainPagesToCopy = mainPageIndices;
    // Si la última página está en blanco, no la agregues
    if (mainPageIndices.length > 0) {
      const lastPageIdx = mainPageIndices[mainPageIndices.length - 1];
      const lastPage = await mainPdf.getPage(lastPageIdx);
      const copiedLastPage = (await mergedPdf.copyPages(mainPdf, [lastPageIdx]))[0];
      if (isPageBlank(copiedLastPage)) {
        mainPagesToCopy = mainPageIndices.slice(0, -1);
        console.log('Última página del documento principal está en blanco y será omitida.');
      }
    }
    const mainPages = await mergedPdf.copyPages(mainPdf, mainPagesToCopy);
    let addedMain = 0;
    mainPages.forEach((page, idx) => {
      if (!isPageBlank(page)) {
        mergedPdf.addPage(page);
        addedMain++;
      } else {
        console.log(`Página en blanco omitida del documento principal: ${idx + 1}`);
      }
    });
    console.log(`Agregadas ${addedMain} páginas no en blanco del documento principal`)

    // Procesar cada anexo
    for (let i = 0; i < annexBuffers.length; i++) {
      const { buffer, filename, mimetype } = annexBuffers[i]
      console.log(`Procesando anexo ${i + 1}: ${filename} (${mimetype})`)

      try {
        if (mimetype === 'application/pdf') {
          // Si es un PDF, agregar todas sus páginas
          console.log('Procesando como PDF...')
          const annexPdf = await PDFDocument.load(buffer)
          const annexPages = await mergedPdf.copyPages(annexPdf, annexPdf.getPageIndices())
          // Agregar solo páginas no en blanco
          let addedAnnex = 0;
          annexPages.forEach((page, idx) => {
            if (!isPageBlank(page)) {
              mergedPdf.addPage(page);
              addedAnnex++;
            } else {
              console.log(`Página en blanco omitida del anexo ${filename}: ${idx + 1}`);
            }
          });
          console.log(`Agregadas ${addedAnnex} páginas no en blanco del anexo PDF`)
          
        } else if (mimetype.startsWith('image/')) {
          // Si es una imagen, crear una página y agregar la imagen
          console.log('Procesando como imagen...')
          
          let image
          if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
            image = await mergedPdf.embedJpg(buffer)
          } else if (mimetype === 'image/png') {
            image = await mergedPdf.embedPng(buffer)
          } else {
            console.warn(`Tipo de imagen no soportado: ${mimetype}, saltando...`)
            continue
          }

          // Crear una nueva página y agregar la imagen
          const page = mergedPdf.addPage()
          const { width, height } = page.getSize()
          
          // Calcular dimensiones para que la imagen quepa en la página
          const imageWidth = image.width
          const imageHeight = image.height
          const aspectRatio = imageWidth / imageHeight
          
          let drawWidth = width - 100 // Margen de 50px a cada lado
          let drawHeight = drawWidth / aspectRatio
          
          // Si la altura es muy grande, ajustar por altura
          if (drawHeight > height - 100) {
            drawHeight = height - 100
            drawWidth = drawHeight * aspectRatio
          }
          
          // Centrar la imagen en la página
          const x = (width - drawWidth) / 2
          const y = (height - drawHeight) / 2
          
          page.drawImage(image, {
            x,
            y,
            width: drawWidth,
            height: drawHeight,
          })
          
          console.log(`Imagen agregada como nueva página (${drawWidth}x${drawHeight})`)
          
        } else {
          // Para otros tipos de archivo, crear una página con información del archivo
          console.log('Tipo de archivo no soportado para merge, creando página informativa...')
          
          const page = mergedPdf.addPage()
          const { width, height } = page.getSize()
          
          // Agregar texto informativo sobre el archivo
          page.drawText('ANEXO NO PROCESABLE', {
            x: 50,
            y: height - 100,
            size: 20,
          })
          
          page.drawText(`Archivo: ${filename}`, {
            x: 50,
            y: height - 140,
            size: 14,
          })
          
          page.drawText(`Tipo: ${mimetype}`, {
            x: 50,
            y: height - 170,
            size: 14,
          })
          
          page.drawText(`Tamaño: ${buffer.length} bytes`, {
            x: 50,
            y: height - 200,
            size: 14,
          })
          
          page.drawText('Este archivo no se pudo integrar al PDF.', {
            x: 50,
            y: height - 240,
            size: 12,
          })
          
          page.drawText('Consulte el archivo original adjunto por separado.', {
            x: 50,
            y: height - 260,
            size: 12,
          })
          
          console.log('Página informativa creada para archivo no soportado')
        }
        
      } catch (annexError) {
        console.error(`Error procesando anexo ${filename}:`, annexError)
        
        // Crear una página de error
        const page = mergedPdf.addPage()
        const { width, height } = page.getSize()
        
        page.drawText('ERROR AL PROCESAR ANEXO', {
          x: 50,
          y: height - 100,
          size: 20,
        })
        
        page.drawText(`Archivo: ${filename}`, {
          x: 50,
          y: height - 140,
          size: 14,
        })
        
        page.drawText('No se pudo procesar este anexo.', {
          x: 50,
          y: height - 180,
          size: 12,
        })
      }
    }

    // Generar el PDF final
    console.log('Generando PDF combinado...')
    const mergedPdfBytes = await mergedPdf.save()
    const mergedBuffer = Buffer.from(mergedPdfBytes)
    
    console.log('=== MERGE COMPLETADO ===')
    console.log('Tamaño del PDF combinado:', mergedBuffer.length, 'bytes')
    console.log('Total de páginas:', mergedPdf.getPageCount())
    
    return mergedBuffer
    
  } catch (error) {
    console.error('Error en el merge de PDFs:', error)
    throw new Error(`Error al combinar PDFs: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

/**
 * Convierte un buffer de imagen a PDF
 * @param imageBuffer Buffer de la imagen
 * @param mimetype Tipo MIME de la imagen
 * @returns Buffer del PDF generado
 */
export async function convertImageToPdf(imageBuffer: Buffer, mimetype: string): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.create()
    
    let image
    if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
      image = await pdfDoc.embedJpg(imageBuffer)
    } else if (mimetype === 'image/png') {
      image = await pdfDoc.embedPng(imageBuffer)
    } else {
      throw new Error(`Tipo de imagen no soportado: ${mimetype}`)
    }

    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    
    // Calcular dimensiones para que la imagen quepa en la página
    const imageWidth = image.width
    const imageHeight = image.height
    const aspectRatio = imageWidth / imageHeight
    
    let drawWidth = width - 100
    let drawHeight = drawWidth / aspectRatio
    
    if (drawHeight > height - 100) {
      drawHeight = height - 100
      drawWidth = drawHeight * aspectRatio
    }
    
    const x = (width - drawWidth) / 2
    const y = (height - drawHeight) / 2
    
    page.drawImage(image, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    })
    
    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
    
  } catch (error) {
    console.error('Error convirtiendo imagen a PDF:', error)
    throw error
  }
}

// Helper para detectar si una página está en blanco (sin contenido visible)
function isPageBlank(page: any) {
  // pdf-lib: page.node.Contents puede ser undefined o vacío si la página está en blanco
  // page.getContentStream() no existe, pero page.node.Contents sí
  // Si Contents es undefined o un array vacío, la página está en blanco
  const contents = page.node.Contents();
  if (!contents) return true;
  if (Array.isArray(contents) && contents.length === 0) return true;
  // Si es un solo objeto, revisamos su tamaño
  if (Array.isArray(contents)) {
    return contents.every((c) => !c || (c.contents && c.contents.length === 0));
  } else if (contents && contents.contents) {
    return contents.contents.length === 0;
  }
  return false;
}
