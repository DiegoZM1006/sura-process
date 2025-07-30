// Helper para formatear cuantía con separador de miles
const formatCurrency = (value) => {
  if (typeof value === 'number') {
    return value.toLocaleString('es-CO');
  }
  if (typeof value === 'string' && value.match(/^\d+$/)) {
    return parseInt(value, 10).toLocaleString('es-CO');
  }
  return value || '{cuantia}';
};

import React, { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RefreshCw } from 'lucide-react'

const StyledEditor = ({ formData = {}, caseType = "", tabContents = {}, onTabContentChange }) => {
  const [activeTab, setActiveTab] = useState("informacion-empresa");
  const [forceRegenerate, setForceRegenerate] = useState(0);

  const handleRegenerateContent = () => {
    if (onTabContentChange) {
      onTabContentChange('fundamentos', generateTabContent("Fundamentos de Derecho"));
      onTabContentChange('anexos', getDefaultAnexosContent(formData));
      onTabContentChange('firma', generateTabContent("Firma"));
    }
  };

  const handleTabContentChange = (tabId, content) => {
    if (onTabContentChange) {
      onTabContentChange(tabId, content);
    }
  };

  const tabs = [
    { id: "informacion-empresa", label: "Información Empresa", readOnly: true },
    { id: "asunto", label: "Asunto", readOnly: true },
    { id: "solicitud", label: "Solicitud", readOnly: true },
    { id: "hechos", label: "Hechos", readOnly: false }, // NUEVA SECCIÓN EDITABLE
    { id: "fundamentos", label: "Fundamentos de Derecho", readOnly: true },
    { id: "notificaciones", label: "Notificaciones", readOnly: true },
    { id: "anexos", label: "Anexos", readOnly: false },
  ];

  const getTabContent = (tabId) => {
    switch (tabId) {
      case "informacion-empresa":
        return generateInformacionEmpresa(formData);
      case "asunto":
        return `JORGE ARMANDO LASSO DUQUE, identificado como aparece al pie de mi firma, obrando en calidad de Representante Legal General de la compañía SEGUROS GENERALES SURA S.A., de conformidad con el poder otorgado mediante Escritura Pública No. 392 del 12 de abril de 2016, Clausula Primera, Numeral (5), presento RECLAMACIÓN FORMAL por el pago de perjuicios, con fundamento en los siguientes:`;
      case "solicitud": {
        const nombreEmpresa = formData?.nombreEmpresa || '{nombreEmpresa}';
        const cuantia = formatCurrency(formData?.cuantia);
        return `De manera respetuosa solicitamos que ${nombreEmpresa} cancele a favor de Seguros Generales Sura S.A. la suma de $ ${cuantia} en virtud de la subrogación consignada en el artículo 1096 del Código de Comercio.`;
      }
      case "hechos":
        return tabContents.hechos || generateHechosContent(formData);
      case "fundamentos":
        return generateFundamentosContent(formData);
      case "notificaciones":
        return `Es interés de Seguros Generales Suramericana S.A. poder invitarlo a que podamos materializar un acuerdo beneficioso para ambas partes que evite desgastes administrativos y judiciales para ambas partes, por lo anterior en caso de que resulte de su interés poder que realicemos acercamientos al respecto, nos permitimos informarle que el recobro del presente siniestro ha sido asignado a la firma de abogados externos BTL Legal Group S.A.S. ubicada en la Avenida 6AN 25N – 22 Piso Tercero, Cali - Valle del Cauca y con números de teléfonos 6686611, , WhatsApp 323 6214498 y correo electrónico subrogacion10@btllegalgroup.com. Empresa con la cual podrá comunicarse en caso de que resulte de su interés poder llegar a un acuerdo para zanjar la presente controversia.`;
      case "anexos":
        return tabContents.anexos || getDefaultAnexosContent(formData);
      default:
        return generateTabContent("Contenido");
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b border-gray-200 bg-white px-4 py-2">
          <TabsList className="w-full h-12 bg-gray-50">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 text-xs font-medium"
              >
                {tab.label}
                {tab.readOnly && <span className="ml-1 text-gray-400">(Vista)</span>}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              {tab.readOnly ? (
                // Vista de solo lectura
                <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm overflow-y-auto flex-1 p-6">
                  <div className="max-w-none prose prose-sm">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                      {getTabContent(tab.id)}
                    </pre>
                  </div>
                </div>
              ) : (
                // Editor editable con textarea
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col">
                  {/* Toolbar */}
                  <div className="bg-white border-b border-gray-200 p-3">
                    <button
                      onClick={handleRegenerateContent}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:border-gray-300"
                      title="Regenerar contenido desde formulario"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  
                  {/* Textarea */}
                  <textarea
                    value={getTabContent(tab.id)}
                    onChange={(e) => handleTabContentChange(tab.id, e.target.value)}
                    className="flex-1 p-6 resize-none border-none outline-none font-sans text-sm leading-relaxed text-gray-800"
                    placeholder={`Escriba el contenido para ${tab.label}...`}
                    style={{
                      minHeight: '500px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  />
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

// Función para generar contenido de la tab "Información Empresa" (solo vista)
const generateInformacionEmpresa = (formData = {}) => {
  const formatValue = (value, defaultText = '') => {
    return value && value.toString().trim() ? value.toString().trim() : defaultText;
  };

  // Obtener fecha actual formateada
  const fechaActual = new Date();
  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const diaActual = fechaActual.getDate();
  const mesActual = monthNames[fechaActual.getMonth()];
  const añoActual = fechaActual.getFullYear();

  // Datos de la empresa
  const nombreEmpresa = formatValue(formData.nombreEmpresa, '{nombreEmpresa}');
  const nitEmpresa = formatValue(formData.nitEmpresa, '{nitEmpresa}');
  const direccionEmpresa = formatValue(formData.direccionEmpresa, '{direccionEmpresa}');
  const correoEmpresa = formatValue(formData.correoEmpresa, '{correoEmpresa}');
  const telefonoEmpresa = formatValue(formData.telefonoEmpresa, '{telefonoEmpresa}');
  const cuantia = formatCurrency(formData.cuantia);

  return `Santiago de Cali, ${diaActual} de ${mesActual} del ${añoActual}

Señores:
${nombreEmpresa}
NIT. ${nitEmpresa}
${direccionEmpresa}
${correoEmpresa}
${telefonoEmpresa}`;
};

// Contenido por defecto para las tabs editables
const generateTabContent = (tabName) => {
  return `${tabName}

Contenido de ${tabName}. Complete el formulario en el panel izquierdo para generar automáticamente el contenido de esta sección.

Puede editar este contenido según sea necesario.`;
};

// NUEVA FUNCIÓN PARA FUNDAMENTOS DE DERECHO
const generateFundamentosContent = (formData = {}) => {
  const numeroPoliza = formData.numeroPolizaSura || '{numeroPolizaSura}';
  const placasPrimerVehiculo = formData.placasPrimerVehiculo || '{placasPrimerVehiculo}';
  const placasSegundoVehiculo = formData.placasSegundoVehiculo || '{placasSegundoVehiculo}';
  const cuantia = formatCurrency(formData.cuantia);
  return `La subrogación  \n\nLas entidades aseguradoras se ven obligadas al pago de las indemnizaciones que hayan sido pactadas en el contrato de seguro. No obstante, el Código de Comercio establece la posibilidad que asiste a la aseguradora de realizar el recobro de este pago a quien haya sido responsable del daño resarcido: “El asegurador que pague una indemnización se subrogará, por ministerio de la ley y hasta concurrencia de su importe, en los derechos del asegurado contra las personas responsables del siniestro.”[ Código Comercial Colombiano (CCo) Decreto 410 de 1971. Artículo 1096. Marzo 27 de 1971 (Colombia).]\n\nLa Corte Suprema de Justicia ha desarrollado esta disposición legal de la siguiente manera:\n\nLa citada disposición permite establecer, que para el buen suceso de la «acción subrogatoria», se debe acreditar que en virtud de un «contrato de seguro», al haberse producido el «siniestro», el asegurador efectuó válidamente el «pago de la indemnización», de tal manera que por mandato legal se subroga en los derechos del afectado patrimonialmente con el riesgo amparado, pasando a ocupar su lugar o posición en la relación jurídica existente con el responsable o causante del hecho dañoso.[ Corte Suprema de Justicia. Sala de Casación Civil. Sentencia SC 003-2015. (M. P. Jesús Vall de Rutén; 14 de enero de 2015).]\nEn consecuencia, a Seguros Generales Sura S.A. le asiste el derecho a recobrar el valor pagado por la reparación del vehículo asegurado, en virtud de la figura de la subrogación, tanto frente al propietario como frente a la empresa de servicio público por cumplirse los presupuestos jurisprudenciales:\n\na. Existe un contrato de seguro de autos soportado mediante la póliza ${numeroPoliza}.\nb. Se produjo un accidente de tránsito entre el vehículo de placa ${placasPrimerVehiculo} y el vehículo de placa ${placasSegundoVehiculo}, en el cual ha sido atribuida la responsabilidad al vehículo de su propiedad.\nc. Seguros Generales Sura S.A. canceló el valor de la reparación del vehículo de placas $ ${cuantia}.\n\nResponsabilidad Civil Extracontractual por Actividades Peligrosas  \n\nEl artículo 2341 del Código Civil establece que quien cometa un delito o culpa, y con ello le genere un daño a otro, se encuentra obligado a indemnizarlo, sin perjuicio de la pena principal que la ley imponga por la culpa o el delito cometido.\nEn lo que respecta puntualmente a la responsabilidad civil extracontractual por actividades peligrosas, esta se origina en el ejercicio de una actividad que genera un riesgo mayor al que normalmente están expuestas las personas. Al respecto, la jurisprudencia de la Sala Civil de la Corte Suprema de Justicia ha definido en forma pacífica que la conducción de vehículos automotores es una actividad considerada como peligrosa. Lo anterior, debido al alto nivel de riesgo que implica su ejercicio.\nAhora bien, en concordancia con el desarrollo jurisprudencial colombiano, con base en artículos como el 2356 (presunción de culpa en actividades peligrosas), 2347 y 2349 del Código civil (Responsabilidad indirecta por el hecho de empleado o personas a cargo) se establece todo un régimen de responsabilidad aplicado no solo a la persona principal que ejerce el hecho dañoso sino a terceros que tienen un deber de guarda o dominio y son solidariamente responsables en casos específicos.\nDe esta forma, La Corte Suprema de Justicia, en la Sentencia del 13 de marzo de 2008 (Exp. 9327), reafirmó que la responsabilidad en casos de actividades peligrosas, recae sobre quien ostenta la condición de guardián, es decir, quien detenta el poder de mando, dirección y control sobre la actividad en el momento en que ocurre el daño.\nAsimismo, según la doctrina establecida en la Sentencia del 22 de abril de 1997 (Exp. 5743), la responsabilidad no se desplaza automáticamente con la venta del vehículo o la externalización de la actividad, si la empresa continúa obteniendo un beneficio económico de la misma. Ahora bien pese a no ser la propietaria directa del vehículo involucrado en el siniestro o la actividad principal de la empresa no sea el transporte, mantiene un claro vínculo económico con la actividad que generó el daño, toda vez que, asi la entidad no tenga como actividad principal el transporte, utiliza vehículos en sus operaciones y sigue obteniendo beneficios de esta actividad, generando así la actividad peligrosa. Este vínculo económico no la exime de responsabilidad, ya que, conforme a la doctrina expuesta por la Corte Suprema, la simple transferencia de la propiedad o la tercerización de la actividad no desplaza automáticamente la responsabilidad civil, si la empresa responsable sigue beneficiándose de la operación que ocasionó el perjuicio.\nEn conclusión, en el contexto de la responsabilidad civil extracontractual en Colombia, tanto la jurisprudencia de la Corte Suprema como la normativa vigente establecen que la responsabilidad por daños en actividades peligrosas recae sobre quienes detentan el control, dirección y obtienen un beneficio económico de la actividad, independientemente de la propiedad directa de los bienes involucrados. Las empresas que conservan influencia y provecho económico en actividades riesgosas, como la operación de vehículos  pueden ser solidariamente responsables por los daños causados, debiendo responder por ellos.\n\nLa responsabilidad de la empresa de transportes  \n\nLa afiliación de vehículos automotores a una empresa prestadora del servicio público de transporte conlleva una serie de responsabilidades de carácter legal, establecidas en la Ley 336 de 1996. El artículo 36 de esta norma establece: “Los conductores de los equipos destinados al servicio público de transporte serán contratados directamente por la empresa operadora de transporte, quien para todos los efectos será solidariamente responsable junto con el propietario del equipo.”[ Ley 336 de 1996. Por la cual se adopta el estatuto nacional de transporte. Diciembre 20 de 1996.]\n\nLa responsabilidad solidaria planteada en estos términos implica que la empresa de transporte deberá responder por los créditos en cabeza de cualquiera de sus conductores, derivados de la ejecución de la actividad de transporte. Por lo tanto, este fundamento legal activa la posibilidad de efectuar el cobro directo a la empresa de transporte cuando los perjuicios ocasionados a un tercero sean producto de la responsabilidad de uno de sus vehículos afiliados. Por lo tanto, solicitamos de manera respetuosa que se acojan a nuestras pretensiones.`;
};

export const getDefaultAnexosContent = (formData = {}) => {
  const numeroPoliza = formData.numeroPolizaSura || '{numeroPolizaSura}';
  return `1. Aviso de siniestro de póliza ${numeroPoliza} expedida por Seguros Generales Sura S.A.\n\n2. Registro fotográfico dispuesto en el Artículo 16 de la Ley 2251 del 2022 / IPAT.\n\n3. Constancia de pago de daños materiales del vehículo asegurado por Sura S.A.\n\n4. Copia simple de la Escritura Pública No. 392 del 12 de abril de 2016, a través del cual se otorga la representación legal general al suscrito.`;
};

// NUEVA FUNCIÓN PARA GENERAR EL CONTENIDO POR DEFECTO DE LA SECCIÓN HECHOS
const generateHechosContent = (formData = {}) => {
  const diaAccidente = formData.diaAccidente || '{diaAccidente}';
  const mesAccidente = formData.mesAccidente || '{mesAccidente}';
  const añoAccidente = formData.añoAccidente || '{añoAccidente}';
  const direccionAccidente = formData.direccionAccidente || '{direccionAccidente}';
  const ciudad = formData.ciudad || '{ciudad}';
  const departamento = formData.departamento || '{departamento}';
  const placasPrimerVehiculo = formData.placasPrimerVehiculo || '{placasPrimerVehiculo}';
  const propietarioPrimerVehiculo = formData.propietarioPrimerVehiculo || '{propietarioPrimerVehiculo}';
  const placasSegundoVehiculo = formData.placasSegundoVehiculo || '{placasSegundoVehiculo}';
  const propietarioSegundoVehiculo = formData.propietarioSegundoVehiculo || '{propietarioSegundoVehiculo}';
  const conductorVehiculoInfractor = formData.conductorVehiculoInfractor || '{conductorVehiculoInfractor}';
  const cedulaConductorInfractor = formData.cedulaConductorInfractor || '{cedulaConductorInfractor}';
  const numeroPolizaSura = formData.numeroPolizaSura || '{numeroPolizaSura}';
  const cuantia = formatCurrency(formData.cuantia);
  return `
1. El ${diaAccidente} de ${mesAccidente} del ${añoAccidente} en la ${direccionAccidente}, de la ciudad de ${ciudad}, ${departamento}; se presentó un accidente de tránsito entre el vehículo de placas ${placasPrimerVehiculo} de propiedad de ${propietarioPrimerVehiculo} y el vehículo de placas ${placasSegundoVehiculo} de propiedad de ${propietarioSegundoVehiculo} conducido por ${conductorVehiculoInfractor} identificado con cédula de ciudadanía ${cedulaConductorInfractor}.\n
2. Derivado del mentado accidente se levantó la evidencia fotográfica conforme a lo previsto en el artículo 16 de la Ley 2251 del 2022, donde se atribuye la responsabilidad al conductor del vehículo de placas ${placasSegundoVehiculo}.\n
3. El vehículo de placas ${placasPrimerVehiculo} se encontraba asegurado al momento del accidente por la póliza de seguros ${numeroPolizaSura} expedida por Seguros Generales Suramericana.\n
4. Producto del accidente de tránsito Seguros Generales Sura S.A. canceló la suma de $ ${cuantia} por concepto de reparación de los daños materiales sufridos al vehículo de placas ${placasPrimerVehiculo}.`;
};

export default StyledEditor;
