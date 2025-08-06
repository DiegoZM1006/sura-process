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
const prepareTemplateData = async (formData: any, caseType: string, tabContents?: any, imageFiles?: any[]) => {
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
  
  // Preparar contenido de hechos según el tipo de caso
  const hechosContent = tabContents?.hechos || formData.contenidoHechos || getDefaultHechosContent(formData, caseType);

  // Preparar datos de imágenes para docxtemplater
  let imagenesHechos: any[] = []
  
  if (imageFiles && imageFiles.length > 0) {
    console.log('Procesando múltiples imágenes para plantilla:', imageFiles.length)
    
    imagenesHechos = imageFiles.map((imgFile, index) => {
      try {
        console.log(`Procesando imagen ${index}:`, {
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
          
          console.log(`Imagen ${index} preparada con propiedad 'src'`)
          return imageObj
        }
        
        console.error(`Imagen ${index} no tiene data URL válido`)
        return null
        
      } catch (error) {
        console.error(`Error procesando imagen ${index}:`, error)
        return null
      }
    }).filter(img => img !== null)
    
    console.log('Imágenes procesadas para plantilla:', imagenesHechos.length)
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
    deducible: formatCurrency(formData.deducible),
    
    // Contenido de anexos y hechos editado por el usuario
    anexos: anexosContent,
    contenidoAnexos: anexosContent,
    contenidoHechos: hechosContent,
    
    // Variable para las imágenes de hechos
    imagenesHechos: imagenesHechos,
  }

  console.log('Template data preparado para tipo:', caseType, {
    ...templateData,
    imagenesHechos: imagenesHechos.length > 0 ? `${imagenesHechos.length} imágenes con propiedad src` : 'No hay imágenes'
  })

  return templateData
}

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
      return `1. El ${diaAccidente} de ${mesAccidente} del ${añoAccidente} en la ${direccionAccidente} ${ciudad}, ${departamento} se presentó un accidente de tránsito entre el vehículo de placas ${placasPrimerVehiculo} de propiedad de ${propietarioPrimerVehiculo} y el vehículo de placas ${placasSegundoVehiculo} afiliado a la empresa de transportes ${afiliador} conducido por ${conductorVehiculoInfractor}

2. Derivado del mentado accidente se levantó la evidencia fotográfica conforme a lo previsto en el artículo 16 de la Ley 2251 del 2022, donde se atribuye la responsabilidad al conductor del vehículo de placas ${placasSegundoVehiculo}.

3. El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del accidente por la póliza de seguros ${numeroPolizaSura} expedida por Seguros Generales Suramericana.

4. Producto del accidente de tránsito Seguros Generales Sura S.A. canceló la suma por concepto de reparación de los daños materiales sufridos por el vehículo de placas ${placasPrimerVehiculo}.

5. Para que el vehículo de placas ${placasPrimerVehiculo} fuese reparado, ${propietarioPrimerVehiculo} locatario y tenedor material del vehículo debió asumir el valor de un deducible por la suma de $ ${cuantia} (de lo cual quedó constancia en la factura anexada al presente documento.`;

    case 'RCE DAÑOS + OBJECION':
      return `1.El ${diaAccidente} de ${mesAccidente} del ${añoAccidente}  en ${direccionAccidente} de la ciudad de ${ciudad}.; se presentó un accidente de tránsito entre el vehículo de placas ${placasPrimerVehiculo} y el vehículo de placas ${placasSegundoVehiculo} de propiedad de ${afiliador}

2.Derivado del mentado accidente se levantó la evidencia fotográfica conforme a lo previsto en el artículo 16 de la Ley 2251 del 2022, donde se atribuye la responsabilidad al conductor del vehículo de placas ${placasSegundoVehiculo} 

3.El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del accidente por la póliza de seguros ${numeroPolizaSura} expedida por Seguros Generales Suramericana.

4.Producto del accidente de tránsito Seguros Generales Sura S.A. canceló la suma de $ ${cuantia}  por concepto de daños sufridos al vehículo de placas ${placasPrimerVehiculo}.

5. En consecuencia, se presentó reclamación de responsabilidad civil ante la aseguradora MUNDIAL frente al siniestro en mención, no obstante, objetan la reclamación, dejando sin cobertura al vehículo del tercero responsable.`;

    case 'RCE DAÑOS + DEDUCIBLE':
      return `1.El ${diaAccidente} de ${mesAccidente} del ${añoAccidente} en ${direccionAccidente}, ${departamento}, se presentó un accidente de tránsito entre el vehículo de placas ${placasPrimerVehiculo} y el vehículo de placas ${placasSegundoVehiculo} de propiedad de ${propietarioSegundoVehiculo}  afiliado a la empresa de transporte ${afiliador}

2.Derivado del mentado accidente se levantó la evidencia fotográfica conforme a lo previsto en el artículo 16 de la Ley 2251 del 2022, donde se atribuye la responsabilidad al conductor del vehículo de placas ${placasSegundoVehiculo}

3.El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del accidente por la póliza de seguros ${numeroPolizaSura}; expedida por Seguros Generales Suramericana.

4.Para que el vehículo de placas ${placasPrimerVehiculo} fuese reparado, ${propietarioPrimerVehiculo} debió asumir el valor de un deducible por la suma de $ ${deducible} de lo cual quedó constancia en la factura anexada al presente documento.

5.Producto del accidente de tránsito Seguros Generales Sura S.A. canceló la suma de $ ${cuantia} por concepto de pérdida total sufridos al vehículo de placas ${placasPrimerVehiculo} .`

    case 'RCE DAÑOS + DEDUCIBLE + OBJECION':
      return `1.El ${diaAccidente} de ${mesAccidente} del ${añoAccidente} en ${direccionAccidente} en el sector del peaje ${ciudad}, se presentó un accidente de tránsito entre el vehículo de placas ${placasPrimerVehiculo} y el vehículo de placas ${placasSegundoVehiculo} de propiedad de ${propietarioSegundoVehiculo} afiliado a la empresa de transporte ${afiliador}

2.Derivado del mentado accidente se levantó la evidencia fotográfica conforme a lo previsto en el artículo 16 de la Ley 2251 del 2022, donde se atribuye la responsabilidad al conductor del vehículo de placas ${placasSegundoVehiculo}

3.El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del accidente por la póliza de seguros ${numeroPolizaSura} expedida por Seguros Generales Suramericana.

4.Para que el vehículo de placas ${placasPrimerVehiculo} fuese reparado, ${propietarioPrimerVehiculo} debió asumir el valor de un deducible por la suma de $ ${deducible} de lo cual quedó constancia en la factura anexada al presente documento.

5.Producto del accidente de tránsito Seguros Generales Sura S.A. canceló la suma de $ {cuantia} por concepto de pérdida total sufridos al vehículo de placas ${placasPrimerVehiculo}.

6. En consecuencia, se presentó reclamación de responsabilidad civil ante la aseguradora SEGUROS DEL ESTADO frente al siniestro en mención, no obstante, objetan manifestando:

  “ Se aplica el deducible pactado en la póliza para el amparo DBT de 2.600.000, motivo por el cual, el valor de la perdida es absorbido por el deducible pactado en la póliza.”
`;

    case 'RCE SOLO DEDUCIBLE + OBJECION':
      return `1.El ${diaAccidente} de ${mesAccidente} del ${añoAccidente} en ${direccionEmpresa} ${ciudad}, ${departamento}  se presentó un accidente de tránsito entre el vehículo de placas ${placasPrimerVehiculo} de propiedad de ${propietarioPrimerVehiculo} y el vehículo de placas ${placasSegundoVehiculo} afiliado a la empresa de transportes ${afiliador} conducido por ${conductorVehiculoInfractor}

2.Derivado del mentado accidente se levantó la evidencia fotográfica conforme a lo previsto en el artículo 16 de la Ley 2251 del 2022, donde se atribuye la responsabilidad al conductor del vehículo de placas ${placasSegundoVehiculo}.

3.El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del accidente por la póliza de seguros ${numeroPolizaSura} expedida por Seguros Generales Suramericana.

4.Producto del accidente de tránsito Seguros Generales Sura S.A. canceló la suma por concepto de reparación de los daños materiales sufridos por el vehículo de placas ${placasPrimerVehiculo}.

5.Para que el vehículo de placas ${placasPrimerVehiculo} fuese reparado, ${empresaTenedora} locatario y tenedor material del vehículo debió asumir el valor de un deducible por la suma de $ ${deducible} de lo cual quedó constancia en la factura anexada al presente documento.

6.En concordancia con el pago de la aseguradora {nombreAseguradora}, se realizó reclamo por concepto de deducible, no obstante, fue objetado por:

  “Como quiera, que el monto del deducible ($ ${deducible}) supera la cuantía solicitada ($ ${cuantia}), lamentamos informarle que no hay lugar a indemnización alguna bajo la presente póliza. Con fundamento en lo anterior, nos permitimos informar que no es posible atender favorablemente su solicitud, y por lo tanto, {nombreAseguradora} OBJETA formal e íntegramente su reclamación. “

Es decir que, como el contrato de póliza de ${nombreEmpresa} incluye un deducible del mismo valor por el cual se pretende, en esos casos lo deberá asumir directamente su asegurado.`;

    case 'RCE HURTO':
      return `1.El ${diaAccidente} de ${mesAccidente} del ${añoAccidente}, el señor ${propietarioPrimerVehiculo} se dispuso a parquear el vehículo de placas ${placasPrimerVehiculo} en ${nombreEmpresa} ubicado en ${direccionEmpresa} de la ciudad de ${ciudad}

2.El ${diaAccidente}/${mesAccidente}/${añoAccidente}, el señor ${propietarioPrimerVehiculo} se entera que su vehículo había sido hurtado, siendo parte de los hechos de la denuncia anexada al presente escrito:

3.De acuerdo a los registros videográficos, el vehículo fue hurtado de las instalaciones del parqueadero en horas de la madrugada.

4.El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del hurto por la póliza de seguros expedida por Seguros Generales Suramericana.

5.De conformidad con el aviso de reclamo y la documentación que soporta el siniestro, la compañía de Seguros Generales Sura S.A., afectó el amparo por hurto y se procedió a indemnizar a ${propietarioPrimerVehiculo} por el valor de $ ${cuantia}

6.Asimismo, ${propietarioPrimerVehiculo} canceló la suma de $ ${deducible} pesos por concepto del deducible por el amparo afectado.

7. En consecuencia, se presentó reclamación de responsabilidad civil ante la aseguradora ${nombreAseguradora} frente al siniestro en mención, no obstante, objetan, manifestando que:

Es decir que, la póliza contratada excluye dentro de su protección eventos como el hurto, estando éste fuera de su cobertura.`;

    case 'RCE HURTO + DEDUCIBLE':
      return `1.El 30 de abril de 2024, el señor ${propietarioPrimerVehiculo} se dispuso a parquear el vehículo de placas ${placasPrimerVehiculo} en el parqueadero de TIERRACOLINA ubicado en la ${direccionEmpresa} de la ciudad de ${ciudadEmpresa}

2.En la misma fecha, a eso de las ${horaAccidente} aproximadamente, el señor ${propietarioPrimerVehiculo} se entera que su vehículo le habían hurtado los espejos retrovisores en el parqueadero, indicado asi en la denuncia anexada:

3.Como consecuencia de los hechos, el señor ${propietarioPrimerVehiculo}, se dirige al personal de seguridad del parqueadero para reportar lo ocurrido; así mismo, procedió a comunicarse con la policía del cuadrante y presenta la denuncia. Revisadas las cámaras se evidencia ingreso al edificio de sujeto desconocido en “modalidad de trencito” el cual baja al sótano y roba los espejos del vehículo ${placasPrimerVehiculo}.

4.El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del hurto por la póliza de seguros ${numeroPolizaSura} expedida por Seguros Generales Suramericana.

5.De conformidad con el aviso de reclamo y la documentación que soporta el siniestro, la compañía de Seguros Generales Sura S.A., se afectó el amparo por hurto parcial y se procedió a indemnizar al señor ${propietarioPrimerVehiculo} por el valor de $ ${cuantia}

6.Asimismo, el señor ${propietarioPrimerVehiculo} canceló la suma de $ ${deducible} pesos por concepto del deducible por el amparo afectado.`;

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

export const generateDocumentBlobServer = async (
  formData: any, 
  caseType: string, 
  tabContents?: any,
  imageFiles?: any[]
): Promise<Blob> => {
  try {
    console.log('=== INICIO GENERACIÓN DE DOCUMENTO EN SERVIDOR ===')
    console.log('Tipo de caso:', caseType)
    console.log('Datos recibidos:', Object.keys(formData))
    console.log('Contenido de tabs recibido:', tabContents ? Object.keys(tabContents) : 'No incluido')
    console.log('Imágenes recibidas:', imageFiles ? imageFiles.length : 0)
    
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
          console.log('Procesando data URL desde propiedad src');
          const result = base64DataURLToArrayBuffer(tag);
          console.log('Resultado de conversión:', result ? 'ArrayBuffer generado' : 'Falló la conversión');
          return result;
        }
        
        console.log('Tag no es un data URL válido:', typeof tag);
        return false;
      },
      getSize(img: any, tagValue: any, tagName: string) {
        console.log('getSize llamado para tagName:', tagName, 'tagValue type:', typeof tagValue);
        
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
      console.log('Creando Docxtemplater con módulo de imágenes...')
      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [imageModule]
      })
      console.log('Docxtemplater creado exitosamente con soporte para imágenes')
    } catch (error) {
      console.error('Error al crear Docxtemplater:', error)
      throw error
    }

    // Preparar los datos para la plantilla incluyendo contenido de tabs e imágenes
    console.log('Preparando datos para plantilla con imágenes...')
    const templateData = await prepareTemplateData(formData, caseType, tabContents, imageFiles)
    console.log('Datos preparados:', Object.keys(templateData))
    console.log('Imágenes en templateData:', templateData.imagenesHechos ? templateData.imagenesHechos.length : 0)
    
    // Logging adicional para debugging
    console.log('Template data final que se enviará a docxtemplater:')
    Object.keys(templateData).forEach(key => {
      if (key === 'imagenesHechos') {
        console.log(`  ${key}:`, Array.isArray(templateData[key]) ? `Array con ${templateData[key].length} elementos` : 'No es array')
        if (Array.isArray(templateData[key]) && templateData[key].length > 0) {
          templateData[key].forEach((img, idx) => {
            console.log(`    Imagen ${idx}:`, {
              hasSrc: !!img.src,
              width: img.width,
              height: img.height,
              srcPreview: img.src ? img.src.substring(0, 50) + '...' : 'No src'
            })
          })
        }
      } else {
        console.log(`  ${key}:`, typeof templateData[key] === 'string' ? templateData[key].substring(0, 50) + '...' : templateData[key])
      }
    })
    
    // Renderizar el documento
    try {
      console.log('Renderizando documento con múltiples imágenes...')
      console.log('imagenesHechos es array:', Array.isArray(templateData.imagenesHechos))
      console.log('imagenesHechos length:', templateData.imagenesHechos ? templateData.imagenesHechos.length : 'undefined')
      doc.render(templateData)
      console.log('Documento renderizado exitosamente')
    } catch (renderError) {
      console.error('Error crítico al renderizar documento:', renderError)
      console.error('Detalles del error:', {
        message: renderError.message,
        stack: renderError.stack,
        templateDataKeys: Object.keys(templateData),
        imagenesHechosType: typeof templateData.imagenesHechos,
        imagenesHechosLength: Array.isArray(templateData.imagenesHechos) ? templateData.imagenesHechos.length : 'No es array'
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
      
      console.log('=== DOCUMENTO PDF CON IMÁGENES GENERADO EXITOSAMENTE ===')
      console.log('Tamaño del blob PDF:', blob.size, 'bytes')
      console.log('Tipo de caso procesado:', caseType)
      
      return blob
      
    } catch (pdfError) {
      console.warn('Error al convertir a PDF, enviando DOCX original:', pdfError)
      
      // Si falla la conversión a PDF, enviar DOCX
      const blob = new Blob([outputBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      })
      
      console.log('=== DOCUMENTO DOCX CON IMÁGENES GENERADO COMO FALLBACK ===')
      console.log('Tamaño del blob DOCX:', blob.size, 'bytes')
      console.log('Tipo de caso procesado:', caseType)
      
      return blob
    }
    
  } catch (error) {
    console.error('=== ERROR AL GENERAR DOCUMENTO EN SERVIDOR ===')
    console.error('Error:', error)
    console.error('Tipo de caso que falló:', caseType)
    throw error
  }
}

// Función de compatibilidad con el nombre esperado por el route.ts
export const generateDocumentBlob = generateDocumentBlobServer
