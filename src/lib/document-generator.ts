// Servidor - sin "use client"

import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'

// @ts-ignore - Módulo sin tipos
const ImageModule = require('docxtemplater-image-module')

// Función helper para convertir archivo a ArrayBuffer
const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    if (!file || file.size === 0) {
      reject(new Error('Archivo inválido o vacío'))
      return
    }
    
    const reader = new FileReader()
    reader.readAsArrayBuffer(file)
    reader.onload = () => {
      const result = reader.result as ArrayBuffer
      if (!result || result.byteLength === 0) {
        reject(new Error('No se pudo leer el archivo o está vacío'))
        return
      }
      resolve(result)
    }
    reader.onerror = error => {
      console.error('Error en FileReader:', error)
      reject(error)
    }
    reader.onabort = () => {
      reject(new Error('Lectura de archivo abortada'))
    }
  })
}

interface FormData {
  nombreEmpresa: string
  nitEmpresa: string
  correoEmpresa: string
  direccionEmpresa: string
  telefonoEmpresa: string
  diaAccidente: string
  mesAccidente: string
  añoAccidente: string
  direccionAccidente: string
  ciudad: string
  departamento: string
  placasPrimerVehiculo: string
  propietarioPrimerVehiculo: string
  placasSegundoVehiculo: string
  propietarioSegundoVehiculo: string
  conductorVehiculoInfractor: string
  cedulaConductorInfractor: string
  numeroPolizaSura: string
  cuantia: string
  anexos?: File[]
}

// Función helper para formatear fecha en formato español completo
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
const prepareTemplateData = async (formData: FormData) => {
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
  
  // Preparar lista de anexos e imágenes
  const anexosList = formData.anexos ? formData.anexos.map((file, index) => ({
    numero: index + 5, // Los primeros 4 anexos son documentos estándar
    nombre: file.name,
    tipo: file.type.includes('image') ? 'Imagen' : 'Documento',
    tamaño: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
  })) : []

  const anexosText = anexosList.length > 0 
    ? anexosList.map(anexo => `${anexo.numero}. ${anexo.nombre} (${anexo.tipo} - ${anexo.tamaño})`).join('\n')
    : ''

  // Preparar imágenes para el template (solo archivos de imagen)
  const imageFiles = formData.anexos ? formData.anexos.filter(file => 
    file.type.startsWith('image/') && file.size > 0
  ) : []
  
  console.log('Archivos de imagen encontrados:', imageFiles.length)
  
  const images = []
  
  // Convertir cada imagen a ArrayBuffer para el módulo de imágenes
  for (let i = 0; i < imageFiles.length; i++) {
    const imageFile = imageFiles[i]
    try {
      console.log(`Procesando imagen ${i + 1}:`, imageFile.name, imageFile.type, imageFile.size)
      const arrayBuffer = await fileToArrayBuffer(imageFile)
      
      if (arrayBuffer && arrayBuffer.byteLength > 0) {
        images.push({
          src: arrayBuffer, // Este es el campo que usa {%src} en el template
          name: imageFile.name,
          size: `${(imageFile.size / (1024 * 1024)).toFixed(2)} MB`,
          type: imageFile.type
        })
        console.log(`Imagen ${i + 1} procesada exitosamente:`, arrayBuffer.byteLength, 'bytes')
      } else {
        console.error(`Error: ArrayBuffer vacío para imagen:`, imageFile.name)
      }
    } catch (error) {
      console.error('Error al procesar imagen:', imageFile.name, error)
    }
  }
  
  console.log('Total de imágenes procesadas:', images.length)

  return {
    // Datos básicos con fecha actual (exactamente como en la plantilla)
    diaActual,
    mesActual,
    añoActual,
    fechaHoy,
    
    // Información de la empresa/destinatario (exactamente como en la plantilla)
    nombreEmpresa: formatValue(formData.nombreEmpresa, 'XXXXXXXXXXXXXXX'),
    nitEmpresa: formatValue(formData.nitEmpresa, 'XXXXXXXXXXXXXXX'),
    // correoEmpresa: Array.isArray(formData.correoEmpresa)
    //   ? formData.correoEmpresa.join('\n')
    //   : formatValue(formData.correoEmpresa, '{correoEmpresa}'),
    direccionEmpresa: formatValue(formData.direccionEmpresa, '{direccionEmpresa}'),
    telefonoEmpresa: formatValue(formData.telefonoEmpresa, '{telefonoEmpresa}'),

    // Para loop de correos en docxtemplater
    correos: Array.isArray(formData.correoEmpresa)
      ? formData.correoEmpresa.filter((c: string) => !!c && c.trim()).map((c: string) => ({ correoEmpresa: c.trim() }))
      : formData.correoEmpresa && formData.correoEmpresa.trim()
        ? [{ correoEmpresa: formData.correoEmpresa.trim() }]
        : [],
        
    // Datos del accidente (exactamente como en la plantilla)
    diaAccidente: formatValue(formData.diaAccidente, 'XX'),
    mesAccidente: formatValue(formData.mesAccidente, 'XXXXXXX'),
    añoAccidente: formatValue(formData.añoAccidente, '2024'),
    direccionAccidente: formatValue(formData.direccionAccidente, 'XXXXXXXXXXXXXXX'),
    ciudad: formatValue(formData.ciudad, 'XXXXX XXXX'),
    departamento: formatValue(formData.departamento, 'XXXXXXXX'),
    
    // Vehículos involucrados (exactamente como en la plantilla)
    placasPrimerVehiculo: formatValue(formData.placasPrimerVehiculo, 'XXXXX'),
    propietarioPrimerVehiculo: formatValue(formData.propietarioPrimerVehiculo, 'XXXXXXXX'),
    placasSegundoVehiculo: formatValue(formData.placasSegundoVehiculo, 'XXXXXX'),
    propietarioSegundoVehiculo: formatValue(formData.propietarioSegundoVehiculo, 'XXXXXXXX'),
    
    // Conductor infractor (exactamente como en la plantilla)
    conductorVehiculoInfractor: formatValue(formData.conductorVehiculoInfractor, 'RXXXXXXX'),
    cedulaConductorInfractor: formatValue(formData.cedulaConductorInfractor, '1XXXXXXXX'),
    
    // Información económica y póliza (exactamente como en la plantilla)
    cuantia: formatValue(formData.cuantia, 'XXXXXXXX'),
    numeroPolizaSura: formatValue(formData.numeroPolizaSura, 'XXXXXXXXXX'),

    // Anexos adicionales
    anexosAdicionales: anexosText,
    totalAnexos: (4 + anexosList.length).toString(), // 4 anexos estándar + anexos subidos
    anexos: anexosList,
    
    // Imágenes para el módulo de imágenes
    images: images
  }
}

export const generateDocument = async (formData: FormData, caseType: string) => {
  try {
    // Esta función ahora solo genera el blob y lo retorna para descarga manual
    const blob = await generateDocumentBlob(formData, caseType)
    
    // Determinar nombre del archivo
    let fileName = ''
    if (caseType === 'RECLAMACION RCE DAÑOS') {
      fileName = `RCE_Daños_${new Date().toISOString().split('T')[0]}.docx`
    } else if (caseType === 'RECLAMACION RCE HURTO') {
      fileName = `RCE_Hurto_${new Date().toISOString().split('T')[0]}.docx`
    } else {
      fileName = `Documento_${new Date().toISOString().split('T')[0]}.docx`
    }
    
    // Crear URL para descarga
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('Documento generado exitosamente:', fileName)
    console.log('Anexos incluidos:', formData.anexos?.length || 0)
    
    return true
    
  } catch (error) {
    console.error('Error al generar documento:', error)
    throw error
  }
}

// Función para generar documento como blob (para envío por email)
export const generateDocumentBlob = async (formData: FormData, caseType: string): Promise<Blob> => {
  try {
    // Determinar qué plantilla usar basado en el tipo de caso
    let templatePath = ''
    
    if (caseType === 'RECLAMACION RCE DAÑOS') {
      templatePath = '/docs/rce_daños.docx'
    } else if (caseType === 'RECLAMACION RCE HURTO') {
      templatePath = '/docs/rce_hurto.docx'
    } else {
      throw new Error('Tipo de caso no soportado')
    }

    // Cargar la plantilla
    const response = await fetch(templatePath)
    if (!response.ok) {
      throw new Error(`Error al cargar la plantilla: ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const zip = new PizZip(arrayBuffer)
    
    // Configurar las opciones del módulo de imágenes
    const imageOptions = {
      getImage(tagValue: ArrayBuffer, tagName: string, meta: any) {
        console.log('Procesando imagen:', { tagName, meta })
        // Validar que tagValue sea un ArrayBuffer válido
        if (!tagValue || !(tagValue instanceof ArrayBuffer)) {
          console.error('tagValue no es un ArrayBuffer válido:', tagValue)
          return new ArrayBuffer(0)
        }
        return tagValue
      },
      getSize(img: ArrayBuffer, tagValue: ArrayBuffer, tagName: string) {
        console.log('Obteniendo tamaño para:', tagName)
        // Retornar tamaño en píxeles [ancho, alto]
        return [300, 200] // 300px ancho, 200px alto
      },
    }
    
    // Crear el documento con docxtemplater y el módulo de imágenes
    let doc
    try {
      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [new ImageModule(imageOptions)],
      })
    } catch (error) {
      console.error('Error al crear Docxtemplater con módulo de imágenes:', error)
      // Si falla con imágenes, crear sin el módulo
      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      })
    }

    // Preparar los datos para la plantilla
    const templateData = await prepareTemplateData(formData)
    
    // Si no hay imágenes, eliminar el campo images para evitar errores
    if (!templateData.images || templateData.images.length === 0) {
      const { images, ...templateDataWithoutImages } = templateData
      doc.render(templateDataWithoutImages)
    } else {
      try {
        doc.render(templateData)
      } catch (error) {
        console.error('Error al renderizar con imágenes:', error)
        const { images, ...templateDataWithoutImages } = templateData
        doc.render(templateDataWithoutImages)
      }
    }
    
    // Generar el documento como blob
    const outputBlob = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })
    
    return outputBlob
    
  } catch (error) {
    console.error('Error al generar documento blob:', error)
    throw error
  }
}
