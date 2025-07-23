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

// Función para preparar los datos para la plantilla
const prepareTemplateData = async (formData: any) => {
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

  return {
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
    
    // Conductor infractor (usando los nombres del formulario)
    conductorVehiculoInfractor: formatValue(formData.conductorVehiculoInfractor, 'RXXXXXXX'),
    cedulaConductorInfractor: formatValue(formData.cedulaConductorInfractor, '1XXXXXXXX'),
    
    // Información económica y póliza (usando los nombres del formulario)
    cuantia: formatCurrency(formData.cuantia),
    numeroPolizaSura: formatValue(formData.numeroPolizaSura, 'XXXXXXXXXX')
  }
}

export const generateDocumentBlobServer = async (formData: any, caseType: string): Promise<Blob> => {
  try {
    console.log('=== INICIO GENERACIÓN DE DOCUMENTO EN SERVIDOR ===')
    console.log('Tipo de caso:', caseType)
    console.log('Datos recibidos:', Object.keys(formData))
    
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
    
    // Crear el documento con docxtemplater sin módulo de imágenes
    let doc
    try {
      console.log('Creando Docxtemplater...')
      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      })
      console.log('Docxtemplater creado exitosamente')
    } catch (error) {
      console.error('Error al crear Docxtemplater:', error)
      throw error
    }

    // Preparar los datos para la plantilla
    console.log('Preparando datos para plantilla...')
    const templateData = await prepareTemplateData(formData)
    console.log('Datos preparados:', Object.keys(templateData))
    
    // Renderizar el documento
    try {
      console.log('Renderizando documento...')
      doc.render(templateData)
      console.log('Documento renderizado exitosamente')
    } catch (renderError) {
      console.error('Error crítico al renderizar documento:', renderError)
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
      
      console.log('=== DOCUMENTO PDF GENERADO EXITOSAMENTE ===')
      console.log('Tamaño del blob PDF:', blob.size, 'bytes')
      
      return blob
      
    } catch (pdfError) {
      console.warn('Error al convertir a PDF, enviando DOCX original:', pdfError)
      
      // Si falla la conversión a PDF, enviar DOCX
      const blob = new Blob([outputBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      
      console.log('=== DOCUMENTO DOCX GENERADO COMO FALLBACK ===')
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
