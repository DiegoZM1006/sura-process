// Helper para formatear cuantía con separador de miles
const formatCurrency = (value: string | number) => {
  if (typeof value === 'number') {
    return value.toLocaleString('es-CO');
  }
  if (typeof value === 'string' && value.match(/^\d+$/)) {
    return parseInt(value, 10).toLocaleString('es-CO');
  }
  return value || 'XXXXXXXX';
};

// Versión server-side del generador de documentos
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import fs from 'fs'
import path from 'path'
import libre from 'libreoffice-convert'
// Importar el módulo de imágenes gratuito
import ImageModule from 'docxtemplater-image-module-free'

// Función para formatear fechas en español
const formatDateSpanish = (dateValue: string) => {
  if (!dateValue) return 'XXX de XXXX del 2024'
  try {
    const date = new Date(dateValue)
    const day = date.getDate()
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ]
    const month = monthNames[date.getMonth()]
    const year = date.getFullYear()
    return `${day} de ${month} del ${year}`
  } catch {
    return 'XXX de XXXX del 2024'
  }
}

// Función helper para formatear valores
const formatValue = (value: string, defaultText = 'XXXXXXX') => {
  return value && value.toString().trim() ? value.toString().trim() : defaultText
}

// Función para convertir base64 DataURL a ArrayBuffer (según documentación)
function base64DataURLToArrayBuffer(dataURL: string) {
  const base64Regex = /^data:image\/(png|jpg|jpeg|svg|svg\+xml);base64,/;
  if (!base64Regex.test(dataURL)) {
    console.log('DataURL no válida:', dataURL.substring(0, 50));
    return false;
  }
  const stringBase64 = dataURL.replace(base64Regex, "");
  let binaryString;
  if (typeof window !== "undefined") {
    binaryString = window.atob(stringBase64);
  } else {
    binaryString = Buffer.from(stringBase64, "base64").toString("binary");
  }
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    const ascii = binaryString.charCodeAt(i);
    bytes[i] = ascii;
  }
  return bytes.buffer;
}

// Función para preparar los datos para la plantilla
const prepareTemplateData = async (formData: any, tabContents?: any, imageFiles?: any[]) => {
  // Obtener fecha actual formateada
  const fechaActual = new Date()
  const fechaHoy = formatDateSpanish(fechaActual.toISOString())
  
  // Obtener componentes de la fecha actual por separado
  const diaActual = fechaActual.getDate().toString()
  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]
  const mesActual = monthNames[fechaActual.getMonth()]
  const añoActual = fechaActual.getFullYear().toString()
  
  // Construir fecha del accidente desde día, mes y año separados
  const fechaAccidenteCompleta = formData.diaAccidente && formData.mesAccidente && formData.añoAccidente
    ? `${formData.diaAccidente} de ${formData.mesAccidente} del ${formData.añoAccidente}`
    : 'XXX de XXXX del 2024'

  // Preparar contenido de anexos
  const anexosContent = tabContents?.anexos || formData.contenidoAnexos || getDefaultAnexosContent(formData)
  
  // Preparar contenido de hechos
  const hechosContent = tabContents?.hechos || formData.contenidoHechos || getDefaultHechosContent(formData);

  // Preparar datos de imágenes para docxtemplater
  let imagenesHechos: string | null = null // Cambiar a string único, no array
  
  if (imageFiles && imageFiles.length > 0) {
    console.log('Procesando imágenes para plantilla:', imageFiles.length)
    
    // Tomar solo la primera imagen para {%imagenesHechos}
    const firstImageFile = imageFiles[0]
    
    try {
      console.log('Procesando primera imagen:', {
        name: firstImageFile.name,
        width: firstImageFile.width,
        height: firstImageFile.height,
        hasData: !!firstImageFile.data,
        dataType: typeof firstImageFile.data
      })
      
      // Para docxtemplater-image-module-free, necesitamos solo el data URL string
      if (firstImageFile.data && typeof firstImageFile.data === 'string' && firstImageFile.data.startsWith('data:image')) {
        imagenesHechos = firstImageFile.data
        console.log('Imagen preparada como data URL para {%imagenesHechos}')
        console.log('Data URL preview:', imagenesHechos.substring(0, 50) + '...')
      } else {
        console.error('Primera imagen no tiene data URL válido')
      }
      
    } catch (error) {
      console.error('Error procesando primera imagen:', error)
    }
  } else {
    console.log('No hay imágenes para procesar')
  }

  const templateData = {
    // Datos básicos con fecha actual
    diaActual,
    mesActual,
    añoActual,
    fechaHoy,
    fechaAccidente: fechaAccidenteCompleta,

    // Información de la empresa/destinatario (usando los nombres del formulario)
    nombreEmpresa: formatValue(formData.nombreEmpresa, 'XXXXXXXXXXXXXXX'),
    nitEmpresa: formatValue(formData.nitEmpresa, 'XXXXXXXXXXXXXXX'),
    telefonoEmpresa: formatValue(formData.telefonoEmpresa, 'XXXXXXXXXXXXXXX'),
    direccionEmpresa: formatValue(formData.direccionEmpresa, 'XXXXXXXXXXXXXXX'),
    correos: Array.isArray(formData.correoEmpresa)
      ? formData.correoEmpresa.filter((c: string) => !!c && c.trim()).map((c: string) => ({ correoEmpresa: c.trim() }))
      : formData.correoEmpresa && formData.correoEmpresa.trim()
        ? [{ correoEmpresa: formData.correoEmpresa.trim() }]
        : [],

    // Datos del accidente (usando los nombres del formulario)
    diaAccidente: formatValue(formData.diaAccidente, 'XX'),
    mesAccidente: formatValue(formData.mesAccidente, 'XXXXXXX'),
    añoAccidente: formatValue(formData.añoAccidente, '2024'),
    direccionAccidente: formatValue(formData.direccionAccidente, 'XXXXXXXXXXXXXXX'),
    ciudad: formatValue(formData.ciudad, 'XXXXX XXXX'),
    departamento: formatValue(formData.departamento, 'XXXXXXXX'),
    
    // Vehículos involucrados (usando los nombres del formulario)
    placasPrimerVehiculo: formatValue(formData.placasPrimerVehiculo, 'XXXXX'),
    propietarioPrimerVehiculo: formatValue(formData.propietarioPrimerVehiculo, 'XXXXXXXX'),
    placasSegundoVehiculo: formatValue(formData.placasSegundoVehiculo, 'XXXXXX'),
    propietarioSegundoVehiculo: formatValue(formData.propietarioSegundoVehiculo, 'XXXXXXXX'),
    afiliador: formatValue(formData.afiliador, ''),
    
    // Conductor infractor (usando los nombres del formulario)
    conductorVehiculoInfractor: formatValue(formData.conductorVehiculoInfractor, 'RXXXXXXX'),
    cedulaConductorInfractor: formatValue(formData.cedulaConductorInfractor, '1XXXXXXXX'),
    
    // Información económica y póliza (usando los nombres del formulario)
    cuantia: formatCurrency(formData.cuantia),
    numeroPolizaSura: formatValue(formData.numeroPolizaSura, 'XXXXXXXXXX'),
    
    // Contenido de anexos editado por el usuario
    anexos: anexosContent,
    contenidoAnexos: anexosContent,
    contenidoHechos: hechosContent,
    
    // NUEVA VARIABLE PARA LAS IMÁGENES DE HECHOS
    imagenesHechos: imagenesHechos,
  }

  console.log('Template data preparado:', {
    ...templateData,
    imagenesHechos: imagenesHechos ? 'Data URL presente' : 'No hay imagen'
  })

  return templateData
}

// Función para obtener contenido por defecto de anexos (debe coincidir con el frontend)
const getDefaultAnexosContent = (formData: any = {}) => {
  const numeroPoliza = formData.numeroPolizaSura || '{numeroPolizaSura}';
  
  return `
1. Aviso de siniestro de póliza ${numeroPoliza} expedida por Seguros Generales Sura S.A.

2. Registro fotográfico dispuesto en el Artículo 16 de la Ley 2251 del 2022 / IPAT.

3. Constancia de pago de daños materiales del vehículo asegurado por Sura S.A.

4. Copia simple de la Escritura Pública No. 392 del 12 de abril de 2016, a través del cual se otorga la representación legal general al suscrito.`;
};

// Agregar función getDefaultHechosContent
const getDefaultHechosContent = (formData: any = {}) => {
 const diaAccidente = formData.diaAccidente || '{diaAccidente}';
  const mesAccidente = formData.mesAccidente || '{mesAccidente}';
  const añoAccidente = formData.añoAccidente || '{añoAccidente}';
  const direccionAccidente = formData.direccionAccidente || '{direccionAccidente}';
  const ciudad = formData.ciudad || '{ciudad}';
  const departamento = formData.departamento || '{departamento}';
  const placasPrimerVehiculo = formData.placasPrimerVehiculo || '{placasPrimerVehiculo}';
  const propietarioPrimerVehiculo = formData.propietarioPrimerVehiculo || '{propietarioPrimerVehiculo}';
  const placasSegundoVehiculo = formData.placasSegundoVehiculo || '{placasSegundoVehiculo}';
  
  // Lógica para combinar propietario y afiliador
  const propietarioSegundoVehiculo = formData.propietarioSegundoVehiculo?.trim() || '';
  const afiliador = formData.afiliador?.trim() || '';
  
  let propietarioYAfiliador;
  if (propietarioSegundoVehiculo && afiliador) {
    propietarioYAfiliador = `${propietarioSegundoVehiculo} - ${afiliador}`;
  } else if (propietarioSegundoVehiculo) {
    propietarioYAfiliador = propietarioSegundoVehiculo;
  } else if (afiliador) {
    propietarioYAfiliador = afiliador;
  } else {
    propietarioYAfiliador = '{propietarioSegundoVehiculo}';
  }
  
  const conductorVehiculoInfractor = formData.conductorVehiculoInfractor || '{conductorVehiculoInfractor}';
  const cedulaConductorInfractor = formData.cedulaConductorInfractor || '{cedulaConductorInfractor}';
  const numeroPolizaSura = formData.numeroPolizaSura || '{numeroPolizaSura}';
  const cuantia = formatCurrency(formData.cuantia);
  return `
1. El ${diaAccidente} de ${mesAccidente} del ${añoAccidente} en la ${direccionAccidente}, de la ciudad de ${ciudad}, ${departamento}; se presentó un accidente de tránsito entre el vehículo de placas ${placasPrimerVehiculo} de propiedad de ${propietarioPrimerVehiculo} y el vehículo de placas ${placasSegundoVehiculo} de propiedad de ${propietarioYAfiliador} conducido por ${conductorVehiculoInfractor} identificado con cédula de ciudadanía ${cedulaConductorInfractor}.\n
2. Derivado del mentado accidente se levantó la evidencia fotográfica conforme a lo previsto en el artículo 16 de la Ley 2251 del 2022, donde se atribuye la responsabilidad al conductor del vehículo de placas ${placasSegundoVehiculo}.\n
3. El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del accidente por la póliza de seguros ${numeroPolizaSura} expedida por Seguros Generales Suramericana.\n
4. Producto del accidente de tránsito Seguros Generales Sura S.A. canceló la suma de $ ${cuantia} por concepto de reparación de los daños materiales sufridos al vehículo de placas ${placasPrimerVehiculo}.`;
};

export const generateDocumentBlobServer = async (
  formData: any, 
  caseType: string, 
  tabContents?: any,
  imageFiles?: any[] // Nuevo parámetro para las imágenes
): Promise<Blob> => {
  try {
    console.log('=== INICIO GENERACIÓN DE DOCUMENTO EN SERVIDOR ===')
    console.log('Tipo de caso:', caseType)
    console.log('Datos recibidos:', Object.keys(formData))
    console.log('Contenido de tabs recibido:', tabContents ? Object.keys(tabContents) : 'No incluido')
    console.log('Imágenes recibidas:', imageFiles ? imageFiles.length : 0)
    
    // Determinar qué plantilla usar basado en el tipo de caso
    let templatePath = ''
    
    if (caseType === 'RECLAMACION RCE DAÑOS') {
      templatePath = path.join(process.cwd(), 'public', 'docs', 'rce_daños.docx')
    } else if (caseType === 'RECLAMACION RCE HURTO') {
      templatePath = path.join(process.cwd(), 'public', 'docs', 'rce_hurto.docx')
    } else {
      throw new Error('Tipo de caso no soportado')
    }

    console.log('Ruta de plantilla:', templatePath)

    // Verificar que el archivo existe
    if (!fs.existsSync(templatePath)) {
      console.error('Plantilla no encontrada en:', templatePath)
      throw new Error(`Plantilla no encontrada en: ${templatePath}`)
    }

    console.log('Cargando plantilla...')
    // Cargar la plantilla desde el sistema de archivos
    const templateBuffer = fs.readFileSync(templatePath)
    console.log('Plantilla cargada, tamaño:', templateBuffer.length, 'bytes')
    const zip = new PizZip(templateBuffer)
    
    // Configurar el módulo de imágenes según la documentación oficial
    const imageOpts = {
      getImage(tag: any) {
        console.log('getImage llamado con tag:', typeof tag, tag ? tag.substring(0, 50) + '...' : 'undefined');
        
        // Para {%imagenesHechos}, tag será directamente el data URL string
        if (typeof tag === 'string' && tag.startsWith('data:image')) {
          console.log('Procesando data URL para {%imagenesHechos}');
          const result = base64DataURLToArrayBuffer(tag);
          console.log('Resultado de conversión:', result ? 'ArrayBuffer generado' : 'Falló la conversión');
          return result;
        }
        
        console.log('Tag no es un data URL válido:', typeof tag);
        return false;
      },
      getSize() {
        // Para {%imagenesHechos}, usamos tamaño fijo por ahora
        // TODO: Implementar tamaño dinámico basado en metadatos si es necesario
        console.log('getSize llamado, usando tamaño por defecto: 400x300');
        return [400, 300];
      },
    };
    
    const imageModule = new ImageModule(imageOpts);
    
    // Crear el documento con docxtemplater CON módulo de imágenes
    let doc
    try {
      console.log('Creando Docxtemplater con módulo de imágenes...')
      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [imageModule] // Agregar el módulo de imágenes
      })
      console.log('Docxtemplater creado exitosamente con soporte para imágenes')
    } catch (error) {
      console.error('Error al crear Docxtemplater:', error)
      throw error
    }

    // Preparar los datos para la plantilla incluyendo contenido de tabs e imágenes
    console.log('Preparando datos para plantilla con imágenes...')
    const templateData = await prepareTemplateData(formData, tabContents, imageFiles)
    console.log('Datos preparados:', Object.keys(templateData))
    console.log('Imágenes en templateData:', templateData.imagenesHechos ? templateData.imagenesHechos.length : 0)
    
    // Logging adicional para debugging
    console.log('Template data final que se enviará a docxtemplater:')
    Object.keys(templateData).forEach(key => {
      if (key === 'imagenesHechos') {
        console.log(`  ${key}:`, templateData[key] ? `Data URL (${templateData[key].length} chars)` : 'null')
        if (templateData[key]) {
          console.log(`    Preview: ${templateData[key].substring(0, 100)}...`)
        }
      } else {
        console.log(`  ${key}:`, typeof templateData[key] === 'string' ? templateData[key].substring(0, 50) + '...' : templateData[key])
      }
    })
    
    // Renderizar el documento
    try {
      console.log('Renderizando documento con imagen única...')
      console.log('imagenesHechos es:', typeof templateData.imagenesHechos, templateData.imagenesHechos ? 'tiene valor' : 'es null/undefined')
      doc.render(templateData)
      console.log('Documento renderizado exitosamente')
    } catch (renderError) {
      console.error('Error crítico al renderizar documento:', renderError)
      console.error('Detalles del error:', {
        message: renderError.message,
        stack: renderError.stack,
        templateDataKeys: Object.keys(templateData),
        imagenesHechosValue: templateData.imagenesHechos ? 'presente' : 'ausente'
      })
      throw new Error(`Error al renderizar documento: ${renderError instanceof Error ? renderError.message : 'Error desconocido'}`)
    }
    
    console.log('Generando documento final...')
    // Generar el documento como blob
    const outputBuffer = doc.getZip().generate({
      type: 'nodebuffer',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })
    
    console.log('Documento generado, tamaño:', outputBuffer.length, 'bytes')
    
    // Intentar convertir a PDF usando LibreOffice
    try {
      console.log('Intentando conversión a PDF con LibreOffice...')
      
      // Configurar la ruta de LibreOffice si no está en el PATH
      const libreOfficePath = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'
      if (require('fs').existsSync(libreOfficePath)) {
        process.env.LIBREOFFICE_PATH = libreOfficePath
        console.log('Configurando ruta de LibreOffice:', libreOfficePath)
      }
      
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        libre.convert(outputBuffer, '.pdf', undefined, (err, done) => {
          if (err) {
            console.error('Error en conversión LibreOffice:', err)
            reject(err)
          } else {
            console.log('Conversión a PDF exitosa')
            resolve(done as Buffer)
          }
        })
      })

      const blob = new Blob([pdfBuffer], {
        type: 'application/pdf'
      })
      
      console.log('=== DOCUMENTO PDF CON IMÁGENES GENERADO EXITOSAMENTE ===')
      console.log('Tamaño del blob PDF:', blob.size, 'bytes')
      
      return blob
      
    } catch (pdfError) {
      console.warn('Error al convertir a PDF, enviando DOCX original:', pdfError)
      
      // Si falla la conversión a PDF, enviar DOCX
      const blob = new Blob([outputBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      
      console.log('=== DOCUMENTO DOCX CON IMÁGENES GENERADO COMO FALLBACK ===')
      console.log('Tamaño del blob DOCX:', blob.size, 'bytes')
      
      return blob
    }
    
  } catch (error) {
    console.error('=== ERROR AL GENERAR DOCUMENTO EN SERVIDOR ===')
    console.error('Error:', error)
    throw error
  }
}

// Función de compatibilidad con el nombre esperado por el route.ts
export const generateDocumentBlob = generateDocumentBlobServer
