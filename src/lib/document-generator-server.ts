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

// Tipo para un hecho individual
interface Hecho {
  id: string;
  descripcionHecho: string;
  fotoHecho?: {
    id: string;
    name: string;
    data: string;
    file: File;
    width: number;
    height: number;
  } | null;
}

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

// Función para procesar hechos estructurados desde FormData
const processHechosFromFormData = (formData: any): Hecho[] => {
  try {
    if (formData.hechos && typeof formData.hechos === 'string') {
      const hechosData = JSON.parse(formData.hechos) as Hecho[]
      console.log('Hechos procesados desde FormData:', hechosData.length)
      return hechosData
    }
    return []
  } catch (error) {
    console.error('Error procesando hechos desde FormData:', error)
    return []
  }
}

// Función para procesar imágenes de hechos desde FormData
const processHechoImagesFromFormData = async (formData: any, hechos: Hecho[]): Promise<Hecho[]> => {
  try {
    const processedHechos = [...hechos]
    
    // Buscar archivos de imágenes de hechos en el FormData
    let imageIndex = 0
    while (formData[`hecho_imagen_${imageIndex}`]) {
      const imageFile = formData[`hecho_imagen_${imageIndex}`]
      
      if (imageFile && typeof imageFile === 'object') {
        // Convertir el archivo a data URL
        const buffer = await imageFile.arrayBuffer()
        const uint8Array = new Uint8Array(buffer)
        const base64 = Buffer.from(uint8Array).toString('base64')
        const mimeType = imageFile.type || 'image/jpeg'
        const dataUrl = `data:${mimeType};base64,${base64}`
        
        // Buscar el hecho correspondiente que no tenga imagen aún
        const hechoIndex = processedHechos.findIndex(h => h.fotoHecho === null || h.fotoHecho === undefined)
        
        if (hechoIndex >= 0) {
          processedHechos[hechoIndex] = {
            ...processedHechos[hechoIndex],
            fotoHecho: {
              id: `processed_${Date.now()}_${imageIndex}`,
              name: imageFile.name || `imagen_hecho_${imageIndex}.jpg`,
              data: dataUrl,
              file: imageFile,
              width: 400, // Dimensiones por defecto
              height: 300
            }
          }
          
          console.log(`Imagen de hecho ${imageIndex} procesada y asignada al hecho ${hechoIndex}`)
        }
      }
      
      imageIndex++
    }
    
    console.log('Hechos con imágenes procesados:', processedHechos.filter(h => h.fotoHecho).length)
    return processedHechos
    
  } catch (error) {
    console.error('Error procesando imágenes de hechos:', error)
    return hechos
  }
}

// Función para generar hechos de fallback basados en el contenido por defecto
const generateFallbackHechos = (formData: any, caseType: string): Hecho[] => {
  console.log('Generando hechos de fallback para tipo:', caseType);
  
  try {
    const hechosTexto = getDefaultHechosContent(formData, caseType);
    // Dividir los hechos por números (1., 2., 3., etc.) y limpiar
    const hechosArray = hechosTexto
      .split(/\d+\./)
      .filter(h => h.trim().length > 0)
      .map(h => h.trim());
    
    return hechosArray.map((hecho, index) => ({
      id: `fallback_${Date.now()}_${index}`,
      descripcionHecho: hecho,
      fotoHecho: null
    }));
  } catch (error) {
    console.error('Error generando hechos de fallback:', error);
    return [{
      id: `error_${Date.now()}`,
      descripcionHecho: 'Error al generar los hechos automáticamente. Por favor, complete manualmente.',
      fotoHecho: null
    }];
  }
}

// Función para preparar los datos para la plantilla - ACTUALIZADA PARA HECHOS COMO LOOP
const prepareTemplateData = async (
  formData: any, 
  caseType: string, 
  tabContents?: any, 
  hechosEstructurados?: Hecho[], 
  imageFiles?: any[]
) => {
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

  // Preparar contenido de anexos según el tipo de caso
  const anexosContent = tabContents?.anexos || formData.contenidoAnexos || getDefaultAnexosContent(formData, caseType)
  
  // PROCESAR HECHOS COMO LOOP ESTRUCTURADO
  let hechosParaLoop: any[] = []
  
  if (hechosEstructurados && hechosEstructurados.length > 0) {
    console.log('Procesando hechos estructurados para loop:', hechosEstructurados.length)
    
    hechosParaLoop = hechosEstructurados.map((hecho, index) => {
      const hechoParaTemplate = {
        descripcionHecho: hecho.descripcionHecho || `Hecho ${index + 1}`,
        fotoHecho: null as any
      }
      
      // Si el hecho tiene una foto, preparar para docxtemplater
      if (hecho.fotoHecho && hecho.fotoHecho.data) {
        console.log(`Procesando imagen para hecho ${index}:`, hecho.fotoHecho.name)
        // Para docxtemplater con el módulo de imágenes, necesitamos pasar el data URL directamente
        hechoParaTemplate.fotoHecho = hecho.fotoHecho.data
      }
      
      console.log(`Hecho ${index} preparado:`, {
        descripcion: hechoParaTemplate.descripcionHecho.substring(0, 50) + '...',
        tieneFoto: !!hechoParaTemplate.fotoHecho
      })
      
      return hechoParaTemplate
    })
    
    console.log('Hechos estructurados preparados para loop:', hechosParaLoop.length)
  } else {
    // Si no hay hechos estructurados, generar hechos por defecto
    console.log('No hay hechos estructurados, generando por defecto para tipo:', caseType)
    const hechosFallback = generateFallbackHechos(formData, caseType)
    
    hechosParaLoop = hechosFallback.map((hecho, index) => ({
      descripcionHecho: hecho.descripcionHecho,
      fotoHecho: null // Los hechos por defecto no tienen imágenes
    }))
    
    console.log('Hechos por defecto generados para loop:', hechosParaLoop.length)
  }

  // Preparar datos de imágenes adicionales para docxtemplater (si las hay - no relacionadas con hechos)
  let imagenesAdicionales: any[] = []
  
  if (imageFiles && imageFiles.length > 0) {
    console.log('Procesando imágenes adicionales para plantilla:', imageFiles.length)
    
    imagenesAdicionales = imageFiles.map((imgFile, index) => {
      try {
        console.log(`Procesando imagen adicional ${index}:`, {
          name: imgFile.name,
          width: imgFile.width,
          height: imgFile.height,
          hasData: !!imgFile.data,
          dataType: typeof imgFile.data
        })
        
        if (imgFile.data && typeof imgFile.data === 'string' && imgFile.data.startsWith('data:image')) {
          const imageObj = {
            src: imgFile.data,
            width: imgFile.width || 400,
            height: imgFile.height || 300,
            name: imgFile.name || `imagen_${index}`,
            index: index
          }
          
          console.log(`Imagen adicional ${index} preparada con propiedad 'src'`)
          return imageObj
        }
        
        console.error(`Imagen adicional ${index} no tiene data URL válido`)
        return null
        
      } catch (error) {
        console.error(`Error procesando imagen adicional ${index}:`, error)
        return null
      }
    }).filter(img => img !== null)
    
    console.log('Imágenes adicionales procesadas para plantilla:', imagenesAdicionales.length)
  }

  const templateData = {
    // Datos básicos con fecha actual
    diaActual,
    mesActual,
    añoActual,
    fechaHoy,
    fechaAccidente: fechaAccidenteCompleta,

    // Información de la empresa/destinatario
    nombreEmpresa: formatValue(formData.nombreEmpresa, 'XXXXXXXXXXXXXXX'),
    nitEmpresa: formatValue(formData.nitEmpresa, 'XXXXXXXXXXXXXXX'),
    telefonoEmpresa: formatValue(formData.telefonoEmpresa, 'XXXXXXXXXXXXXXX'),
    direccionEmpresa: formatValue(formData.direccionEmpresa, 'XXXXXXXXXXXXXXX'),
    correos: Array.isArray(formData.correoEmpresa)
      ? formData.correoEmpresa.filter((c: string) => !!c && c.trim()).map((c: string) => ({ correoEmpresa: c.trim() }))
      : formData.correoEmpresa && formData.correoEmpresa.trim()
        ? [{ correoEmpresa: formData.correoEmpresa.trim() }]
        : [],

    // Datos del accidente
    diaAccidente: formatValue(formData.diaAccidente, 'XX'),
    mesAccidente: formatValue(formData.mesAccidente, 'XXXXXXX'),
    añoAccidente: formatValue(formData.añoAccidente, '2024'),
    direccionAccidente: formatValue(formData.direccionAccidente, 'XXXXXXXXXXXXXXX'),
    ciudad: formatValue(formData.ciudad, 'XXXXX XXXX'),
    departamento: formatValue(formData.departamento, 'XXXXXXXX'),
    
    // Vehículos involucrados
    placasPrimerVehiculo: formatValue(formData.placasPrimerVehiculo, 'XXXXX'),
    propietarioPrimerVehiculo: formatValue(formData.propietarioPrimerVehiculo, 'XXXXXXXX'),
    placasSegundoVehiculo: formatValue(formData.placasSegundoVehiculo, 'XXXXXX'),
    propietarioSegundoVehiculo: formatValue(formData.propietarioSegundoVehiculo, 'XXXXXXXX'),
    afiliador: formatValue(formData.afiliador, ''),
    
    // Conductor infractor
    conductorVehiculoInfractor: formatValue(formData.conductorVehiculoInfractor, 'RXXXXXXX'),
    cedulaConductorInfractor: formatValue(formData.cedulaConductorInfractor, '1XXXXXXXX'),
    
    // Información económica y póliza
    cuantia: formatCurrency(formData.cuantia),
    numeroPolizaSura: formatValue(formData.numeroPolizaSura, 'XXXXXXXXXX'),
    deducible: formatCurrency(formData.deducible),
    
    // Contenido de anexos editado por el usuario
    anexos: anexosContent,
    contenidoAnexos: anexosContent,
    
    // HECHOS ESTRUCTURADOS PARA EL LOOP - ESTA ES LA CLAVE
    // Usar exactamente esta estructura para que docxtemplater procese el loop
    hechos: hechosParaLoop,
    
    // Imágenes adicionales (si las hay - no relacionadas con hechos)
    imagenesAdicionales: imagenesAdicionales,
  }

  console.log('Template data preparado para tipo:', caseType, {
    ...templateData,
    hechos: `${hechosParaLoop.length} hechos preparados para loop`,
    hechosConFotos: hechosParaLoop.filter(h => h.fotoHecho).length,
    imagenesAdicionales: imagenesAdicionales.length > 0 ? `${imagenesAdicionales.length} imágenes adicionales` : 'Sin imágenes adicionales'
  })

  return templateData
}

// Función principal actualizada para procesar desde FormData
export const generateDocumentFromFormData = async (
  formData: any,
  caseType: string
): Promise<Blob> => {
  try {
    console.log('=== PROCESANDO DATOS DESDE FORM DATA PARA HECHOS COMO LOOP ===')
    
    // 1. Procesar hechos estructurados desde FormData
    let hechos = processHechosFromFormData(formData)
    console.log('Hechos extraídos:', hechos.length)
    
    // 2. Si no hay hechos válidos, generar hechos de fallback
    if (!hechos || hechos.length === 0) {
      console.log('No hay hechos estructurados, generando fallback...')
      hechos = generateFallbackHechos(formData, caseType)
    }
    
    // 3. Procesar imágenes de hechos
    const hechosConImagenes = await processHechoImagesFromFormData(formData, hechos)
    console.log('Hechos con imágenes procesados:', hechosConImagenes.filter(h => h.fotoHecho).length)
    
    // 4. Procesar contenidos de tabs
    const tabContents = {
      anexos: formData.contenidoAnexos || getDefaultAnexosContent(formData, caseType),
    }
    
    // 5. Procesar imágenes adicionales (las que no son de hechos)
    const imagenesAdicionales: any[] = []
    if (formData.imagenesMetadata) {
      try {
        const metadata = JSON.parse(formData.imagenesMetadata)
        for (let i = 0; i < metadata.length; i++) {
          const imageFile = formData[`imagen_${i}`]
          if (imageFile && typeof imageFile === 'object') {
            const buffer = await imageFile.arrayBuffer()
            const uint8Array = new Uint8Array(buffer)
            const base64 = Buffer.from(uint8Array).toString('base64')
            const mimeType = imageFile.type || 'image/jpeg'
            const dataUrl = `data:${mimeType};base64,${base64}`
            
            imagenesAdicionales.push({
              id: metadata[i].id,
              name: metadata[i].name,
              data: dataUrl,
              file: imageFile,
              width: metadata[i].width || 400,
              height: metadata[i].height || 300
            })
          }
        }
        console.log('Imágenes adicionales procesadas:', imagenesAdicionales.length)
      } catch (error) {
        console.error('Error procesando imágenes adicionales:', error)
      }
    }
    
    // 6. Generar el documento usando la función actualizada
    return await generateDocumentBlobServer(
      formData,
      caseType,
      tabContents,
      hechosConImagenes,
      imagenesAdicionales
    )
    
  } catch (error) {
    console.error('Error en generateDocumentFromFormData:', error)
    throw error
  }
}

// Resto del código permanece igual...
// (getDefaultAnexosContent, getDefaultHechosContent, etc.)

// Función para obtener contenido por defecto de anexos según el tipo de caso
const getDefaultAnexosContent = (formData: any = {}, caseType: string = "") => {
  const numeroPoliza = formData.numeroPolizaSura || '{numeroPolizaSura}';
  const placasPrimerVehiculo = formData.placasPrimerVehiculo || '{placasPrimerVehiculo}';
  const propietarioPrimerVehiculo = formData.propietarioPrimerVehiculo || '{propietarioPrimerVehiculo}';
  const empresaTenedora = formData.empresaTenedora || '{empresaTenedora}';
  const nombreAseguradora = formData.nombreAseguradora || '{nombreAseguradora}';

  switch (caseType) {
    case 'RCE SOLO DEDUCIBLE':
      return `1. Factura de pago de deducible del vehículo ${placasPrimerVehiculo} asumido por ${propietarioPrimerVehiculo}

2. Registro fotográfico dispuesto en el Artículo 16 de la Ley 2251 del 2022.

3. Poder de asegurado autorizando reclamación del deducible.

4. Copia de documento de identidad de asegurado por Seguros generales Sura

5. Copia de tarjeta de propiedad del vehículo afectado.

6. Certificación bancaria de ${propietarioPrimerVehiculo}`;

    case 'RCE DAÑOS':
      return `1. Aviso de siniestro de póliza ${numeroPoliza} expedida por Seguros Generales Sura S.A.

2. Registro fotográfico dispuesto en el Artículo 16 de la Ley 2251 del 2022 / IPAT.

3. Constancia de pago de daños materiales del vehículo asegurado por Sura S.A.

4. Copia simple de la Escritura Pública No. 392 del 12 de abril de 2016, a través del cual se otorga la representación legal general al suscrito.`;

    case 'RCE DAÑOS + OBJECION':
      return `1.Aviso de siniestro de póliza ${numeroPoliza} expedida por Seguros Generales Sura S.A.

2.Registro fotográfico dispuesto en el Artículo 16 de la Ley 2251 del 2022 / IPAT.

3.Constancia de pago de daños materiales del vehículo asegurado por Sura S.A.

4.Copia simple de la Escritura Pública No. 392 del 12 de abril de 2016, a través del cual se otorga la representación legal general al suscrito.

5. Copia de objeción por parte de la aseguradora.`;

    case 'RCE HURTO + DEDUCIBLE':
      return `1.Aviso de siniestro de póliza ${numeroPoliza}  expedida por Seguros Generales Sura S.A.

2.Factura de pago de deducible del vehículo ${placasPrimerVehiculo} asumido por ${propietarioPrimerVehiculo}

3.Poder de asegurado autorizando reclamación del deducible. 

4.Copia de documento de identidad de asegurado por Seguros generales Sura

5.Certificación bancaria de ${propietarioPrimerVehiculo}

6.Registro fotográfico dispuesto en el Artículo 16 de la Ley 2251 del 2022 / IPAT.

7.Constancia de pago de daños materiales del vehículo asegurado por Sura S.A.

8.Copia simple de la Escritura Pública No. 392 del 12 de abril de 2016, a través del cual se otorga la representación legal general al suscrito.`;

    case 'RCE DAÑOS + DEDUCIBLE + OBJECION':
      return `1.Aviso de siniestro de póliza ${numeroPoliza} expedida por Seguros Generales Sura S.A.

2.Pago de deducible del vehículo ${placasPrimerVehiculo} asumido por ${propietarioPrimerVehiculo}

3.Registro fotográfico dispuesto en el Artículo 16 de la Ley 2251 del 2022 / IPAT.

4.Poder de asegurado autorizando reclamación del deducible. 

5.Copia de documento de identidad de asegurado por Seguros generales Sura

6.Constancia de pago y factura de daños materiales del vehículo asegurado por Sura S.A.

7.Copia simple de la Escritura Pública No. 392 del 12 de abril de 2016, a través del cual se otorga la representación legal general al suscrito.

8. Copia de objeción por parte de la aseguradora.`;

    case 'RCE SOLO DEDUCIBLE + OBJECION':
      return `1.Factura de pago de deducible del vehículo ${placasPrimerVehiculo}  asumido por ${empresaTenedora}

2.Copia de objeción presentada por ${nombreAseguradora}.

3.Registro fotográfico dispuesto en el Artículo 16 de la Ley 2251 del 2022.

4.Poder de asegurado autorizando reclamación del deducible. 

5.Copia de documento de identidad de asegurado por Seguros generales Sura

6.Copia de tarjeta de propiedad del vehículo afectado.

7.Certificación bancaria de ${empresaTenedora}`;

    case 'RCE HURTO':
      return `1.Aviso de siniestro de póliza ${numeroPoliza} expedida por Seguros Generales Sura S.A.

2.Factura de pago de deducible del vehículo ${placasPrimerVehiculo} asumido por ${propietarioPrimerVehiculo}

3.Poder de asegurado autorizando reclamación del deducible. 

4.Copia de documento de identidad de asegurado por Seguros generales Sura

5.Certificación bancaria de ${propietarioPrimerVehiculo}

6.Registro fotográfico dispuesto en el Artículo 16 de la Ley 2251 del 2022 / IPAT.

7.Constancia de pago y factura de daños materiales del vehículo asegurado por Sura S.A.

8.Copia simple de la Escritura Pública No. 392 del 12 de abril de 2016, a través del cual se otorga la representación legal general al suscrito.

9. Copia de objeción por parte de la aseguradora.`;

    case 'RCE DAÑOS + DEDUCIBLE':
      return `1.Aviso de siniestro de póliza ${numeroPoliza}  expedida por Seguros Generales Sura S.A.

2.Pago de deducible del vehículo ${placasPrimerVehiculo} asumido por ${propietarioPrimerVehiculo}

3.Registro fotográfico dispuesto en el Artículo 16 de la Ley 2251 del 2022 / IPAT.

4.Poder de asegurado autorizando reclamación del deducible. 

5.Copia de documento de identidad de asegurado por Seguros generales Sura

6.Constancia de pago y factura de daños materiales del vehículo asegurado por Sura S.A.

7.Copia simple de la Escritura Pública No. 392 del 12 de abril de 2016, a través del cual se otorga la representación legal general al suscrito.`;

    default: 'ELIGE UN TIPO DE CASO PARA GENERAR LOS ANEXOS';
  }
};

// Función para obtener contenido por defecto de hechos según el tipo de caso
const getDefaultHechosContent = (formData: any = {}, caseType: string = "") => {
  const diaAccidente = formData.diaAccidente || '{diaAccidente}';
  const mesAccidente = formData.mesAccidente || '{mesAccidente}';
  const añoAccidente = formData.añoAccidente || '{añoAccidente}';
  const direccionAccidente = formData.direccionAccidente || '{direccionAccidente}';
  const ciudad = formData.ciudad || '{ciudad}';
  const departamento = formData.departamento || '{departamento}';
  const placasPrimerVehiculo = formData.placasPrimerVehiculo || '{placasPrimerVehiculo}';
  const propietarioPrimerVehiculo = formData.propietarioPrimerVehiculo || '{propietarioPrimerVehiculo}';
  const placasSegundoVehiculo = formData.placasSegundoVehiculo || '{placasSegundoVehiculo}';
  const propietarioSegundoVehiculo = formData.propietarioSegundoVehiculo?.trim() || '';
  const afiliador = formData.afiliador?.trim() || '';
  const conductorVehiculoInfractor = formData.conductorVehiculoInfractor || '{conductorVehiculoInfractor}';
  const cedulaConductorInfractor = formData.cedulaConductorInfractor || '{cedulaConductorInfractor}';
  const numeroPolizaSura = formData.numeroPolizaSura || '{numeroPolizaSura}';
  const cuantia = formatCurrency(formData.cuantia);
  const deducible = formatCurrency(formData.deducible); // Valor fijo de deducible por ahora
  const horaAccidente = formData.horaAccidente || '{horaAccidente}';
  const direccionEmpresa = formData.direccionEmpresa || '{direccionEmpresa}';
  const ciudadEmpresa = formData.ciudadEmpresa || '{ciudadEmpresa}';
  const empresaTenedora = formData.empresaTenedora || '{empresaTenedora}';
  const nombreAseguradora =  formData.nombreAseguradora || '{nombreAsegurado}';
  const nombreEmpresa = formData.nombreEmpresa || '{nombreEmpresa}';

  // Lógica para combinar propietario y afiliador
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

  switch (caseType) {
    case 'RCE DAÑOS':
      return `1. El ${diaAccidente} de ${mesAccidente} del ${añoAccidente} en la ${direccionAccidente}, de la ciudad de ${ciudad}, ${departamento}; se presentó un accidente de tránsito entre el vehículo de placas ${placasPrimerVehiculo} de propiedad de ${propietarioPrimerVehiculo} y el vehículo de placas ${placasSegundoVehiculo} de propiedad de ${propietarioYAfiliador} conducido por ${conductorVehiculoInfractor} identificado con cédula de ciudadanía ${cedulaConductorInfractor}.

2. Derivado del mentado accidente se levantó la evidencia fotográfica conforme a lo previsto en el artículo 16 de la Ley 2251 del 2022, donde se atribuye la responsabilidad al conductor del vehículo de placas ${placasSegundoVehiculo}.

3. El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del accidente por la póliza de seguros ${numeroPolizaSura} expedida por Seguros Generales Suramericana.

4. Producto del accidente de tránsito Seguros Generales Sura S.A. canceló la suma de $ ${cuantia} por concepto de reparación de los daños materiales sufridos al vehículo de placas ${placasPrimerVehiculo}.`;

    case 'RCE SOLO DEDUCIBLE':
      return `1. El ${diaAccidente} de ${mesAccidente} del ${añoAccidente} en la ${direccionAccidente} ${ciudad}, ${departamento} se presentó un accidente de tránsito entre el vehículo de placas ${placasPrimerVehiculo} de propiedad de ${propietarioPrimerVehiculo} y el vehículo de placas ${placasSegundoVehiculo} afiliado a la empresa de transportes ${afiliador} conducido por ${conductorVehiculoInfractor}.

2. Derivado del mentado accidente se levantó la evidencia fotográfica conforme a lo previsto en el artículo 16 de la Ley 2251 del 2022, donde se atribuye la responsabilidad al conductor del vehículo de placas ${placasSegundoVehiculo}.

3. El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del accidente por la póliza de seguros ${numeroPolizaSura} expedida por Seguros Generales Suramericana.

4. Producto del accidente de tránsito Seguros Generales Sura S.A. canceló la suma por concepto de reparación de los daños materiales sufridos por el vehículo de placas ${placasPrimerVehiculo}.

5. Para que el vehículo de placas ${placasPrimerVehiculo} fuese reparado, ${propietarioPrimerVehiculo} locatario y tenedor material del vehículo debió asumir el valor de un deducible por la suma de $ ${cuantia} (de lo cual quedó constancia en la factura anexada al presente documento.`;

    case 'RCE DAÑOS + OBJECION':
      return `1. El ${diaAccidente} de ${mesAccidente} del ${añoAccidente}  en ${direccionAccidente} de la ciudad de ${ciudad}.; se presentó un accidente de tránsito entre el vehículo de placas ${placasPrimerVehiculo} y el vehículo de placas ${placasSegundoVehiculo} de propiedad de ${afiliador}.

2. Derivado del mentado accidente se levantó la evidencia fotográfica conforme a lo previsto en el artículo 16 de la Ley 2251 del 2022, donde se atribuye la responsabilidad al conductor del vehículo de placas ${placasSegundoVehiculo}.

3. El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del accidente por la póliza de seguros ${numeroPolizaSura} expedida por Seguros Generales Suramericana.

4. Producto del accidente de tránsito Seguros Generales Sura S.A. canceló la suma de $ ${cuantia} por concepto de daños sufridos al vehículo de placas ${placasPrimerVehiculo}.

5. En consecuencia, se presentó reclamación de responsabilidad civil ante la aseguradora MUNDIAL frente al siniestro en mención, no obstante, objetan la reclamación, dejando sin cobertura al vehículo del tercero responsable.`;

    case 'RCE DAÑOS + DEDUCIBLE':
      return `1. El ${diaAccidente} de ${mesAccidente} del ${añoAccidente} en ${direccionAccidente}, ${departamento}, se presentó un accidente de tránsito entre el vehículo de placas ${placasPrimerVehiculo} y el vehículo de placas ${placasSegundoVehiculo} de propiedad de ${propietarioSegundoVehiculo}  afiliado a la empresa de transporte ${afiliador}.

2. Derivado del mentado accidente se levantó la evidencia fotográfica conforme a lo previsto en el artículo 16 de la Ley 2251 del 2022, donde se atribuye la responsabilidad al conductor del vehículo de placas ${placasSegundoVehiculo}.

3. El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del accidente por la póliza de seguros ${numeroPolizaSura}; expedida por Seguros Generales Suramericana.

4. Para que el vehículo de placas ${placasPrimerVehiculo} fuese reparado, ${propietarioPrimerVehiculo} debió asumir el valor de un deducible por la suma de $ ${deducible} de lo cual quedó constancia en la factura anexada al presente documento.

5. Producto del accidente de tránsito Seguros Generales Sura S.A. canceló la suma de $ ${cuantia} por concepto de pérdida total sufridos al vehículo de placas ${placasPrimerVehiculo}.`

    case 'RCE DAÑOS + DEDUCIBLE + OBJECION':
      return `1. El ${diaAccidente} de ${mesAccidente} del ${añoAccidente} en ${direccionAccidente} en el sector del peaje ${ciudad}, se presentó un accidente de tránsito entre el vehículo de placas ${placasPrimerVehiculo} y el vehículo de placas ${placasSegundoVehiculo} de propiedad de ${propietarioSegundoVehiculo} afiliado a la empresa de transporte ${afiliador}.

2. Derivado del mentado accidente se levantó la evidencia fotográfica conforme a lo previsto en el artículo 16 de la Ley 2251 del 2022, donde se atribuye la responsabilidad al conductor del vehículo de placas ${placasSegundoVehiculo}.

3. El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del accidente por la póliza de seguros ${numeroPolizaSura} expedida por Seguros Generales Suramericana.

4. Para que el vehículo de placas ${placasPrimerVehiculo} fuese reparado, ${propietarioPrimerVehiculo} debió asumir el valor de un deducible por la suma de $ ${deducible} de lo cual quedó constancia en la factura anexada al presente documento.

5. Producto del accidente de tránsito Seguros Generales Sura S.A. canceló la suma de $ ${cuantia} por concepto de pérdida total sufridos al vehículo de placas ${placasPrimerVehiculo}.

6. En consecuencia, se presentó reclamación de responsabilidad civil ante la aseguradora SEGUROS DEL ESTADO frente al siniestro en mención, no obstante, objetan manifestando:

  “ Se aplica el deducible pactado en la póliza para el amparo DBT de 2.600.000, motivo por el cual, el valor de la perdida es absorbido por el deducible pactado en la póliza.”
`;

    case 'RCE SOLO DEDUCIBLE + OBJECION':
      return `1. El ${diaAccidente} de ${mesAccidente} del ${añoAccidente} en ${direccionEmpresa} ${ciudad}, ${departamento}  se presentó un accidente de tránsito entre el vehículo de placas ${placasPrimerVehiculo} de propiedad de ${propietarioPrimerVehiculo} y el vehículo de placas ${placasSegundoVehiculo} afiliado a la empresa de transportes ${afiliador} conducido por ${conductorVehiculoInfractor}.

2. Derivado del mentado accidente se levantó la evidencia fotográfica conforme a lo previsto en el artículo 16 de la Ley 2251 del 2022, donde se atribuye la responsabilidad al conductor del vehículo de placas ${placasSegundoVehiculo}.

3. El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del accidente por la póliza de seguros ${numeroPolizaSura} expedida por Seguros Generales Suramericana.

4. Producto del accidente de tránsito Seguros Generales Sura S.A. canceló la suma por concepto de reparación de los daños materiales sufridos por el vehículo de placas ${placasPrimerVehiculo}.

5. Para que el vehículo de placas ${placasPrimerVehiculo} fuese reparado, ${empresaTenedora} locatario y tenedor material del vehículo debió asumir el valor de un deducible por la suma de $ ${deducible} de lo cual quedó constancia en la factura anexada al presente documento.

6. En concordancia con el pago de la aseguradora ${nombreAseguradora}, se realizó reclamo por concepto de deducible, no obstante, fue objetado por:

  “Como quiera, que el monto del deducible ($ ${deducible}) supera la cuantía solicitada ($ ${cuantia}), lamentamos informarle que no hay lugar a indemnización alguna bajo la presente póliza. Con fundamento en lo anterior, nos permitimos informar que no es posible atender favorablemente su solicitud, y por lo tanto, {nombreAseguradora} OBJETA formal e íntegramente su reclamación. “

Es decir que, como el contrato de póliza de ${nombreEmpresa} incluye un deducible del mismo valor por el cual se pretende, en esos casos lo deberá asumir directamente su asegurado.`;

    case 'RCE HURTO':
      return `1. El ${diaAccidente} de ${mesAccidente} del ${añoAccidente}, el señor ${propietarioPrimerVehiculo} se dispuso a parquear el vehículo de placas ${placasPrimerVehiculo} en ${nombreEmpresa} ubicado en ${direccionEmpresa} de la ciudad de ${ciudad}.

2. El ${diaAccidente}/${mesAccidente}/${añoAccidente}, el señor ${propietarioPrimerVehiculo} se entera que su vehículo había sido hurtado, siendo parte de los hechos de la denuncia anexada al presente escrito.

3. De acuerdo a los registros videográficos, el vehículo fue hurtado de las instalaciones del parqueadero en horas de la madrugada.

4. El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del hurto por la póliza de seguros expedida por Seguros Generales Suramericana.

5. De conformidad con el aviso de reclamo y la documentación que soporta el siniestro, la compañía de Seguros Generales Sura S.A., afectó el amparo por hurto y se procedió a indemnizar a ${propietarioPrimerVehiculo} por el valor de $ ${cuantia}.

6. Asimismo, ${propietarioPrimerVehiculo} canceló la suma de $ ${deducible} pesos por concepto del deducible por el amparo afectado.

7. En consecuencia, se presentó reclamación de responsabilidad civil ante la aseguradora ${nombreAseguradora} frente al siniestro en mención, no obstante, objetan, manifestando que.
`;

    case 'RCE HURTO + DEDUCIBLE':
      return `1. El 30 de abril de 2024, el señor ${propietarioPrimerVehiculo} se dispuso a parquear el vehículo de placas ${placasPrimerVehiculo} en el parqueadero de TIERRACOLINA ubicado en la ${direccionEmpresa} de la ciudad de ${ciudadEmpresa}.

2. En la misma fecha, a eso de las ${horaAccidente} aproximadamente, el señor ${propietarioPrimerVehiculo} se entera que su vehículo le habían hurtado los espejos retrovisores en el parqueadero, indicado así en la denuncia anexada:

3. Como consecuencia de los hechos, el señor ${propietarioPrimerVehiculo}, se dirige al personal de seguridad del parqueadero para reportar lo ocurrido; así mismo, procedió a comunicarse con la policía del cuadrante y presenta la denuncia. Revisadas las cámaras se evidencia ingreso al edificio de sujeto desconocido en “modalidad de trencito” el cual baja al sótano y roba los espejos del vehículo ${placasPrimerVehiculo}.

4. El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del hurto por la póliza de seguros ${numeroPolizaSura} expedida por Seguros Generales Suramericana.

5. De conformidad con el aviso de reclamo y la documentación que soporta el siniestro, la compañía de Seguros Generales Sura S.A., se afectó el amparo por hurto parcial y se procedió a indemnizar al señor ${propietarioPrimerVehiculo} por el valor de $ ${cuantia}

6. Asimismo, el señor ${propietarioPrimerVehiculo} canceló la suma de $ ${deducible} pesos por concepto del deducible por el amparo afectado.`;

    default:
      return getDefaultHechosContent(formData, 'RCE DAÑOS');
  }
};

// Función para obtener la ruta de la plantilla según el tipo de caso
const getTemplatePath = (caseType: string): string => {
  switch (caseType) {
    case 'RCE DAÑOS':
      return path.join(process.cwd(), 'public', 'docs', 'rce_daños.docx');
      
    case 'RCE HURTO':
      return path.join(process.cwd(), 'public', 'docs', 'rce_hurto.docx');
      
    case 'RCE SOLO DEDUCIBLE':
      return path.join(process.cwd(), 'public', 'docs', 'rce-solo-deducible.docx');

    case 'RCE DAÑOS + DEDUCIBLE':
      return path.join(process.cwd(), 'public', 'docs', 'rce-danos-deducible.docx');

    case 'RCE DAÑOS + OBJECION':
      return path.join(process.cwd(), 'public', 'docs', 'rce-danos-objecion.docx');

    case 'RCE HURTO + DEDUCIBLE':
      return path.join(process.cwd(), 'public', 'docs', 'rce-hurto-deducible.docx');

    case 'RCE DAÑOS + DEDUCIBLE + OBJECION':
      return path.join(process.cwd(), 'public', 'docs', 'rce-danos-deducible-objecion.docx');

    case 'RCE SOLO DEDUCIBLE + OBJECION':
      return path.join(process.cwd(), 'public', 'docs', 'rce-solo-deducible-objecion.docx');
    
    default:
      throw new Error(`Tipo de caso no soportado: ${caseType}`);
  }
};

// Función principal del servidor ACTUALIZADA
export const generateDocumentBlobServer = async (
  formData: any, 
  caseType: string, 
  tabContents?: any,
  hechosEstructurados?: Hecho[],
  imageFiles?: any[]
): Promise<Blob> => {
  try {
    console.log('=== INICIO GENERACIÓN DE DOCUMENTO CON HECHOS COMO LOOP ===')
    console.log('Tipo de caso:', caseType)
    console.log('Datos recibidos:', Object.keys(formData))
    console.log('Contenido de tabs recibido:', tabContents ? Object.keys(tabContents) : 'No incluido')
    console.log('Hechos estructurados recibidos:', hechosEstructurados ? hechosEstructurados.length : 0)
    console.log('Imágenes adicionales recibidas:', imageFiles ? imageFiles.length : 0)
    
    // Determinar qué plantilla usar basado en el tipo de caso
    const templatePath = getTemplatePath(caseType);
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
        
        if (typeof tag === 'string' && tag.startsWith('data:image')) {
          console.log('Procesando data URL desde propiedad');
          const result = base64DataURLToArrayBuffer(tag);
          console.log('Resultado de conversión:', result ? 'ArrayBuffer generado' : 'Falló la conversión');
          return result;
        }
        
        console.log('Tag no es un data URL válido:', typeof tag);
        return false;
      },
      getSize(img: any, tagValue: any, tagName: string) {
        console.log('getSize llamado para tagName:', tagName, 'tagValue type:', typeof tagValue);
        
        // Para imágenes de hechos dentro del loop
        if (typeof tagValue === 'string' && tagValue.startsWith('data:image')) {
          console.log('Usando dimensiones por defecto para imagen de hecho: 400x300');
          return [400, 300];
        }
        
        // Para otras imágenes con dimensiones especificadas
        if (tagValue && typeof tagValue === 'object' && tagValue.width && tagValue.height) {
          console.log('Usando dimensiones del objeto imagen:', tagValue.width, 'x', tagValue.height);
          return [tagValue.width, tagValue.height];
        }
        
        console.log('Usando dimensiones por defecto: 400x300');
        return [400, 300];
      },
    };
    
    const imageModule = new ImageModule(imageOpts);
    
    // Crear el documento con docxtemplater CON módulo de imágenes
    let doc
    try {
      console.log('Creando Docxtemplater con módulo de imágenes y soporte para loops...')
      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [imageModule]
      })
      console.log('Docxtemplater creado exitosamente con soporte para imágenes y loops')
    } catch (error) {
      console.error('Error al crear Docxtemplater:', error)
      throw error
    }

    // Preparar los datos para la plantilla con hechos estructurados como loop
    console.log('Preparando datos para plantilla con hechos como loop estructurado...')
    const templateData = await prepareTemplateData(
      formData, 
      caseType, 
      tabContents, 
      hechosEstructurados, 
      imageFiles
    )
    console.log('Datos preparados:', Object.keys(templateData))
    console.log('Hechos para loop en templateData:', templateData.hechos ? templateData.hechos.length : 0)
    console.log('Imágenes adicionales en templateData:', templateData.imagenesAdicionales ? templateData.imagenesAdicionales.length : 0)
    
    // Logging detallado para debugging del loop de hechos
    console.log('=== ESTRUCTURA DE HECHOS PARA DOCXTEMPLATER LOOP ===')
    if (templateData.hechos && Array.isArray(templateData.hechos)) {
      templateData.hechos.forEach((hecho, idx) => {
        console.log(`Hecho ${idx + 1}:`, {
          descripcion: hecho.descripcionHecho ? hecho.descripcionHecho.substring(0, 100) + '...' : 'Sin descripción',
          tieneFoto: !!hecho.fotoHecho,
          tipoFoto: hecho.fotoHecho ? (typeof hecho.fotoHecho === 'string' ? 'Data URL' : typeof hecho.fotoHecho) : 'No tiene foto'
        })
      })
    } else {
      console.log('ERROR: templateData.hechos no es un array válido!')
    }
    console.log('================================================')
    
    // Renderizar el documento
    try {
      console.log('Renderizando documento con loop de hechos...')
      console.log('Estructura de datos para docxtemplater:')
      console.log('- hechos es array:', Array.isArray(templateData.hechos))
      console.log('- hechos length:', templateData.hechos ? templateData.hechos.length : 'undefined')
      console.log('- hechos con fotos:', templateData.hechos ? templateData.hechos.filter(h => h.fotoHecho).length : 0)
      
      doc.render(templateData)
      console.log('Documento renderizado exitosamente con loop de hechos')
    } catch (renderError) {
      console.error('Error crítico al renderizar documento:', renderError)
      console.error('Detalles del error:', {
        message: renderError.message,
        stack: renderError.stack,
        templateDataKeys: Object.keys(templateData),
        hechosType: typeof templateData.hechos,
        hechosLength: Array.isArray(templateData.hechos) ? templateData.hechos.length : 'No es array',
        primerHecho: templateData.hechos && templateData.hechos.length > 0 ? templateData.hechos[0] : 'No hay hechos'
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
      const libreOfficePath = process.env.LIBREOFFICE_PATH || 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'
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
      
      console.log('=== DOCUMENTO PDF CON LOOP DE HECHOS GENERADO EXITOSAMENTE ===')
      console.log('Tamaño del blob PDF:', blob.size, 'bytes')
      console.log('Tipo de caso procesado:', caseType)
      console.log('Hechos procesados en loop:', templateData.hechos ? templateData.hechos.length : 0)
      console.log('Hechos con imágenes:', templateData.hechos ? templateData.hechos.filter(h => h.fotoHecho).length : 0)
      
      return blob
      
    } catch (pdfError) {
      console.warn('Error al convertir a PDF, enviando DOCX original:', pdfError)
      
      // Si falla la conversión a PDF, enviar DOCX
      const blob = new Blob([outputBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      
      console.log('=== DOCUMENTO DOCX CON LOOP DE HECHOS GENERADO COMO FALLBACK ===')
      console.log('Tamaño del blob DOCX:', blob.size, 'bytes')
      console.log('Tipo de caso procesado:', caseType)
      console.log('Hechos procesados en loop:', templateData.hechos ? templateData.hechos.length : 0)
      console.log('Hechos con imágenes:', templateData.hechos ? templateData.hechos.filter(h => h.fotoHecho).length : 0)
      
      return blob
    }
    
  } catch (error) {
    console.error('=== ERROR AL GENERAR DOCUMENTO CON LOOP DE HECHOS ===')
    console.error('Error:', error)
    console.error('Tipo de caso que falló:', caseType)
    throw error
  }
}

// Función de compatibilidad con el nombre esperado por el route.ts
export const generateDocumentBlob = generateDocumentBlobServer

// Función auxiliar para validar estructura de hechos
export const validateHechosStructure = (hechos: any[]): boolean => {
  if (!Array.isArray(hechos)) {
    console.error('validateHechosStructure: hechos no es un array')
    return false;
  }
  
  const isValid = hechos.every((hecho, index) => {
    const hasValidId = typeof hecho.id === 'string' && hecho.id.trim().length > 0;
    const hasValidDescription = typeof hecho.descripcionHecho === 'string' && hecho.descripcionHecho.trim().length > 0;
    const hasValidPhoto = hecho.fotoHecho === null || hecho.fotoHecho === undefined || 
      (typeof hecho.fotoHecho === 'object' && typeof hecho.fotoHecho.data === 'string');
    
    if (!hasValidId) console.error(`Hecho ${index}: ID inválido`);
    if (!hasValidDescription) console.error(`Hecho ${index}: Descripción inválida`);
    if (!hasValidPhoto) console.error(`Hecho ${index}: Foto inválida`);
    
    return hasValidId && hasValidDescription && hasValidPhoto;
  });
  
  console.log('validateHechosStructure:', isValid ? 'VÁLIDO' : 'INVÁLIDO');
  return isValid;
}
