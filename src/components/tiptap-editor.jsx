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
import { RefreshCw, Plus, Trash2, Upload } from 'lucide-react'

const StyledEditor = ({
  formData = {},
  caseType = "",
  tabContents = {},
  onTabContentChange = (_tabId, _content) => {},
  onImagesChange = (_images) => {},
  onHechosChange = (_hechos) => {},
}) => {
  const [activeTab, setActiveTab] = useState("informacion-empresa");
  const [forceRegenerate, setForceRegenerate] = useState(0);
  const [images, setImages] = useState([]);
  const [hechos, setHechos] = useState([]);

  // Inicializar hechos cuando cambie el tipo de caso o los datos del formulario
  useEffect(() => {
    if (caseType && formData) {
      const hechosDefault = generateDefaultHechos(formData, caseType);
      setHechos(hechosDefault);
      // Notificar al componente padre
      if (onHechosChange) {
        onHechosChange(hechosDefault);
      }
    }
  }, [caseType, formData]);

  const handleRegenerateContent = () => {
    if (onTabContentChange) {
      onTabContentChange('fundamentos', generateFundamentosContent(formData, caseType));
      onTabContentChange('anexos', getDefaultAnexosContent(formData, caseType));
    }
    // Regenerar hechos
    const hechosDefault = generateDefaultHechos(formData, caseType);
    setHechos(hechosDefault);
    if (onHechosChange) {
      onHechosChange(hechosDefault);
    }
  };

  const handleTabContentChange = (tabId, content) => {
    if (onTabContentChange) {
      onTabContentChange(tabId, content);
    }
  };

  // Función para generar hechos por defecto basado en el tipo de caso - CORREGIDA
  const generateDefaultHechos = (formData, caseType) => {
    const hechosTexto = generateHechosContent(formData, caseType);    
    const hechosArray = hechosTexto
      .split(/(?:^|\n)\s*(\d+)\.\s+(?!\d)/)
      .filter(h => h && h.trim().length > 0 && !/^\d+$/.test(h.trim()));
    
    return hechosArray.map((hecho, index) => ({
      id: `hecho_${Date.now()}_${index}`,
      descripcionHecho: (index + 1) + ". " + hecho.trim(),
      fotoHecho: null
    }));
  };

  // Función para agregar un nuevo hecho
  const handleAgregarHecho = () => {
    const nuevoHecho = {
      id: `hecho_${Date.now()}`,
      descripcionHecho: '',
      fotoHecho: null
    };
    const nuevosHechos = [...hechos, nuevoHecho];
    setHechos(nuevosHechos);
    if (onHechosChange) {
      onHechosChange(nuevosHechos);
    }
  };

  // Función para eliminar un hecho
  const handleEliminarHecho = (hechoId) => {
    const nuevosHechos = hechos.filter(h => h.id !== hechoId);
    setHechos(nuevosHechos);
    if (onHechosChange) {
      onHechosChange(nuevosHechos);
    }
  };

  // Función para actualizar la descripción de un hecho
  const handleActualizarDescripcionHecho = (hechoId, nuevaDescripcion) => {
    const nuevosHechos = hechos.map(h => 
      h.id === hechoId 
        ? { ...h, descripcionHecho: nuevaDescripcion }
        : h
    );
    setHechos(nuevosHechos);
    if (onHechosChange) {
      onHechosChange(nuevosHechos);
    }
  };

  // Función para subir imagen a un hecho específico
  const handleImagenHecho = (hechoId, event) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = {
          id: Date.now().toString(),
          name: file.name,
          data: e.target?.result,
          file: file,
          width: 400, // Ancho por defecto
          height: 300 // Alto por defecto
        };

        const nuevosHechos = hechos.map(h => 
          h.id === hechoId 
            ? { ...h, fotoHecho: imageData }
            : h
        );
        setHechos(nuevosHechos);
        if (onHechosChange) {
          onHechosChange(nuevosHechos);
        }
      };
      reader.readAsDataURL(file);
    }
    // Limpiar el input
    event.target.value = '';
  };

  // Función para eliminar imagen de un hecho
  const handleEliminarImagenHecho = (hechoId) => {
    const nuevosHechos = hechos.map(h => 
      h.id === hechoId 
        ? { ...h, fotoHecho: null }
        : h
    );
    setHechos(nuevosHechos);
    if (onHechosChange) {
      onHechosChange(nuevosHechos);
    }
  };

  // Función para manejar la subida de imágenes (para otras tabs)
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = {
            id: Date.now() + Math.random(),
            name: file.name,
            data: e.target.result,
            file: file,
            width: 100,
            height: 300
          };

          setImages(prev => {
            const newImages = [...prev, imageData];
            if (onImagesChange) {
              onImagesChange(newImages);
            }
            return newImages;
          });
        };
        reader.readAsDataURL(file);
      }
    });

    event.target.value = '';
  };

  // Función para eliminar una imagen (para otras tabs)
  const handleRemoveImage = (imageId) => {
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== imageId);
      if (onImagesChange) {
        onImagesChange(newImages);
      }
      return newImages;
    });
  };

  const tabs = [
    { id: "informacion-empresa", label: "Información Empresa", readOnly: true },
    { id: "asunto", label: "Asunto", readOnly: true },
    { id: "solicitud", label: "Solicitud", readOnly: true },
    { id: "hechos", label: "Hechos", readOnly: false, special: 'hechos' },
    { id: "fundamentos", label: "Fundamentos de Derecho", readOnly: true },
    { id: "notificaciones", label: "Notificaciones", readOnly: true },
    { id: "anexos", label: "Anexos", readOnly: false },
  ];

  const getTabContent = (tabId) => {
    switch (tabId) {
      case "informacion-empresa":
        return generateInformacionEmpresa(formData);
      case "asunto":
        return generateAsuntoContent(formData, caseType);
      case "solicitud":
        return generateSolicitudContent(formData, caseType);
      case "hechos":
        return ""; // Los hechos se manejan de manera especial
      case "fundamentos":
        return generateFundamentosContent(formData, caseType);
      case "notificaciones":
        return generateNotificacionesContent(formData, caseType);
      case "anexos":
        return tabContents.anexos || getDefaultAnexosContent(formData, caseType);
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
              {tab.special === 'hechos' ? (
                // Editor especial para hechos
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col">
                  {/* Toolbar para hechos */}
                  <div className="bg-white border-b border-gray-200 p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRegenerateContent}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:border-gray-300"
                        title="Regenerar contenido desde formulario"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={handleAgregarHecho}
                        className="inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-md border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer transition-colors"
                      >
                        <Plus size={12} />
                        Agregar Hecho
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      {hechos.length} hecho(s)
                    </div>
                  </div>

                  {/* Lista de hechos */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {hechos.map((hecho, index) => (
                      <div key={hecho.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        {/* Header del hecho */}
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-900">
                            Hecho {index + 1}
                          </h4>
                          <div className="flex items-center gap-2">
                            {/* Input file oculto para subir imagen */}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImagenHecho(hecho.id, e)}
                              className="hidden"
                              id={`image-upload-${hecho.id}`}
                            />
                            <label
                              htmlFor={`image-upload-${hecho.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <Upload size={12} />
                              Imagen
                            </label>
                            <button
                              onClick={() => handleEliminarHecho(hecho.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
                            >
                              <Trash2 size={12} />
                              Eliminar
                            </button>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          {/* Textarea para el hecho */}
                          <div className="flex-1">
                            <textarea
                              value={hecho.descripcionHecho}
                              onChange={(e) => handleActualizarDescripcionHecho(hecho.id, e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-md resize-none text-sm leading-relaxed"
                              placeholder={`Describa el hecho ${index + 1}...`}
                              rows={4}
                              style={{
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                              }}
                            />
                          </div>

                          {/* Preview de imagen si existe */}
                          {hecho.fotoHecho && (
                            <div className="w-48 flex-shrink-0">
                              <div className="relative">
                                <img
                                  src={hecho.fotoHecho.data}
                                  alt={hecho.fotoHecho.name}
                                  className="w-full h-32 object-cover rounded border"
                                />
                                <button
                                  onClick={() => handleEliminarImagenHecho(hecho.id)}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                  title="Eliminar imagen"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 truncate" title={hecho.fotoHecho.name}>
                                {hecho.fotoHecho.name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {hechos.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No hay hechos definidos.</p>
                        <p className="text-xs mt-1">Usa "Regenerar contenido" o "Agregar Hecho" para comenzar.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : tab.readOnly ? (
                // Vista de solo lectura
                <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm overflow-y-auto flex-1 p-6">
                  <div className="max-w-none prose prose-sm">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
                      {getTabContent(tab.id)}
                    </pre>
                  </div>
                </div>
              ) : (
                // Editor editable con textarea (para otras tabs como anexos)
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col">
                  {/* Toolbar */}
                  <div className="bg-white border-b border-gray-200 p-3 flex justify-between items-center">
                    <button
                      onClick={handleRegenerateContent}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:border-gray-300"
                      title="Regenerar contenido desde formulario"
                    >
                      <RefreshCw size={14} />
                    </button>

                    {/* Botón para subir imágenes solo en otras tabs que no sean hechos
                    {tab.id !== 'hechos' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          📷 Subir Imágenes
                        </label>
                      </div>
                    )} */}
                  </div>

                  {/* Contenedor principal con textarea y panel de imágenes */}
                  <div className="flex-1 flex">
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

                    {/* Panel de imágenes para otras tabs */}
                    {tab.id !== 'hechos' && images.length > 0 && (
                      <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">Imágenes ({images.length})</h3>
                        <div className="space-y-4">
                          {images.map((image) => (
                            <div key={image.id} className="bg-white rounded-lg border border-gray-200 p-3">
                              <div className="mb-2">
                                <img
                                  src={image.data}
                                  alt={image.name}
                                  className="w-full h-32 object-cover rounded border"
                                />
                              </div>
                              <p className="text-xs text-gray-600 mb-2 truncate" title={image.name}>
                                {image.name}
                              </p>
                              <button
                                onClick={() => handleRemoveImage(image.id)}
                                className="w-full px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                              >
                                Eliminar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

// Resto de funciones auxiliares permanecen igual...
// (generateInformacionEmpresa, generateAsuntoContent, etc.)

// Función para generar contenido de la tab "Información Empresa" (solo vista)
const generateInformacionEmpresa = (formData = {}) => {
  const formatValue = (value, defaultText = '') => {
    return value && value.toString().trim() ? value.toString().trim() : defaultText;
  };

  const fechaActual = new Date();
  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const diaActual = fechaActual.getDate();
  const mesActual = monthNames[fechaActual.getMonth()];
  const añoActual = fechaActual.getFullYear();

  const nombreEmpresa = formatValue(formData.nombreEmpresa, '{nombreEmpresa}');
  const nitEmpresa = formatValue(formData.nitEmpresa, '{nitEmpresa}');
  const direccionEmpresa = formatValue(formData.direccionEmpresa, '{direccionEmpresa}');
  const correoEmpresa = formatValue(formData.correoEmpresa, '{correoEmpresa}');
  const telefonoEmpresa = formatValue(formData.telefonoEmpresa, '{telefonoEmpresa}');

  return `Santiago de Cali, ${diaActual} de ${mesActual} del ${añoActual}

Señores:
${nombreEmpresa}
NIT. ${nitEmpresa}
${direccionEmpresa}
${correoEmpresa}
${telefonoEmpresa}`;
};

// Función para generar contenido del ASUNTO según el tipo de caso
const generateAsuntoContent = (formData = {}, caseType = "") => {
  const propietarioPrimerVehiculo = formData.propietarioPrimerVehiculo || '{propietarioPrimerVehiculo}';

  switch (caseType) {
    case 'RCE DAÑOS':
    case 'RCE DAÑOS + OBJECION':
      return `JORGE ARMANDO LASSO DUQUE, identificado como aparece al pie de mi firma, obrando en calidad de Representante Legal General de la compañía SEGUROS GENERALES SURA S.A., de conformidad con el poder otorgado mediante Escritura Pública No. 392 del 12 de abril de 2016, Clausula Primera, Numeral (5), presento RECLAMACIÓN FORMAL por el pago de perjuicios, con fundamento en los siguientes:`;

    case 'RCE DAÑOS + DEDUCIBLE':
    case 'RCE HURTO + DEDUCIBLE':
    case 'RCE DAÑOS + DEDUCIBLE + OBJECION':
    case 'RCE HURTO':
      return `LINA MARIA BENITEZ FREYRE, identificado como aparece al pie de mi firma, obrando en calidad de apoderada de ${propietarioPrimerVehiculo}, de conformidad con el poder adjunto y JORGE ARMANDO LASSO DUQUE, identificado como aparece al pie de mi firma, obrando en calidad de Representante Legal General de la compañía SEGUROS GENERALES SURA S.A., de conformidad con el poder otorgado mediante Escritura Pública No. 640 del 14 de junio de 2016, Clausula Primera, Numeral (5), presento RECLAMACIÓN FORMAL por el pago de perjuicios, con fundamento en los siguiente:`;

    case 'RCE SOLO DEDUCIBLE':
    case 'RCE SOLO DEDUCIBLE + OBJECION':
      return `LINA MARÍA BENÍTEZ FREYRE identificada como aparece al pie de mi firma en mi calidad de apoderada de ${propietarioPrimerVehiculo}, conforme al poder que se anexa a este documento, de manera respetuosa me permito presentar ante ustedes RECLAMACIÓN FORMAL por el pago de perjuicios, con fundamento en los siguientes:`;

    default:
      return `JORGE ARMANDO LASSO DUQUE, identificado como aparece al pie de mi firma, obrando en calidad de Representante Legal General de la compañía SEGUROS GENERALES SURA S.A., de conformidad con el poder otorgado mediante Escritura Pública No. 392 del 12 de abril de 2016, Clausula Primera, Numeral (5), presento RECLAMACIÓN FORMAL por el pago de perjuicios, con fundamento en los siguientes:`;
  }
};

// Función para generar contenido de SOLICITUD según el tipo de caso
const generateSolicitudContent = (formData = {}, caseType = "") => {
  const nombreEmpresa = formData?.nombreEmpresa || '{nombreEmpresa}';
  const propietarioPrimerVehiculo = formData?.propietarioPrimerVehiculo || '{propietarioPrimerVehiculo}';
  const propietarioSegundoVehiculo = formData?.propietarioSegundoVehiculo || '{propietarioSegundoVehiculo}';
  const cuantia = formatCurrency(formData?.cuantia);
  const deducible = formatCurrency(formData.deducible);
  const nombreAseguradora = formData.nombreAseguradora || '{nombreAseguradora}';

  switch (caseType) {
    case 'RCE DAÑOS':
    case 'RCE DAÑOS + OBJECION':
      return `De manera respetuosa solicitamos que ${nombreEmpresa} cancele a favor de Seguros Generales Sura S.A. la suma de $ ${cuantia} en virtud de la subrogación consignada en el artículo 1096 del Código de Comercio.`;

    case 'RCE SOLO DEDUCIBLE':
      return `De manera respetuosa solicitamos que ${propietarioSegundoVehiculo} cancele a favor ${propietarioPrimerVehiculo} la suma de $ ${cuantia} pesos por concepto del deducible asumido a raíz del accidente de tránsito en mención.`;

    case 'RCE DAÑOS + DEDUCIBLE':
    case 'RCE HURTO + DEDUCIBLE':
    case 'RCE DAÑOS + DEDUCIBLE + OBJECION':
    case 'RCE HURTO':
      return `De manera respetuosa solicitamos que ${nombreEmpresa} cancele a favor de ${propietarioPrimerVehiculo} la suma de $ ${deducible} M/CTE por concepto de DEDUCIBLE y cancele a favor de Seguros Generales Suramericana S.A. la suma de $ ${cuantia} en virtud de la subrogación consignada en el artículo 1096 del Código de Comercio.`;
    
    case 'RCE SOLO DEDUCIBLE + OBJECION':
      return `De manera respetuosa solicitamos que ${nombreEmpresa} cancele a favor de ${nombreAseguradora} la suma de $ ${deducible} por concepto del deducible asumido a raíz del accidente de tránsito en mención.`;

    default:
      return `De manera respetuosa solicitamos que ${nombreEmpresa} cancele a favor de Seguros Generales Sura S.A. la suma de $ ${cuantia} en virtud de la subrogación consignada en el artículo 1096 del Código de Comercio.`;
  }
};

// Función para generar contenido de HECHOS según el tipo de caso (para generar hechos por defecto)
const generateHechosContent = (formData = {}, caseType = "") => {
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

// Función para generar fundamentos de derecho (permanece igual)
const generateFundamentosContent = (formData = {}, caseType = "") => {
  const numeroPoliza = formData.numeroPolizaSura || '{numeroPolizaSura}';
  const placasPrimerVehiculo = formData.placasPrimerVehiculo || '{placasPrimerVehiculo}';
  const placasSegundoVehiculo = formData.placasSegundoVehiculo || '{placasSegundoVehiculo}';
  const cuantia = formatCurrency(formData.cuantia);
  const ciudadEmpresa = formData.ciudadEmpresa || '{ciudadEmpresa}';
  const direccionEmpresa = formData.direccionEmpresa || '{direccionEmpresa}';
  const nombreEmpresa = formData.nombreEmpresa || '{nombreEmpresa}';

  switch (caseType) {
    case 'RCE SOLO DEDUCIBLE':
    case 'RCE SOLO DEDUCIBLE + OBJECION':
      return `Responsabilidad Civil Extracontractual por Actividades Peligrosas	

El artículo 2341 del Código Civil establece que quien cometa un delito o culpa, y con ello le genere un daño a otro, se encuentra obligado a indemnizarlo, sin perjuicio de la pena principal que la ley imponga por la culpa o el delito cometido.

En lo que respecta puntualmente a la responsabilidad civil extracontractual por actividades peligrosas, esta se origina en el ejercicio de una actividad que genera un riesgo mayor al que normalmente están expuestas las personas. Al respecto, la jurisprudencia de la Sala Civil de la Corte Suprema de Justicia ha definido en forma pacífica que la conducción de vehículos automotores es una actividad considerada como peligrosa. Lo anterior, debido al alto nivel de riesgo que implica su ejercicio.

Ahora bien, en concordancia con el desarrollo jurisprudencial colombiano, con base en artículos como el 2356 (presunción de culpa en actividades peligrosas), 2347 y 2349 del Código civil (Responsabilidad indirecta por el hecho de empleado o personas a cargo) se establece todo un régimen de responsabilidad aplicado no solo a la persona principal que ejerce el hecho dañoso sino a terceros que tienen un deber de guarda o dominio y son solidariamente responsables en casos específicos.

De esta forma, La Corte Suprema de Justicia, en la Sentencia del 13 de marzo de 2008 (Exp. 9327), reafirmó que la responsabilidad en casos de actividades peligrosas, recae sobre quien ostenta la condición de guardián, es decir, quien detenta el poder de mando, dirección y control sobre la actividad en el momento en que ocurre el daño.

Asimismo, según la doctrina establecida en la Sentencia del 22 de abril de 1997 (Exp. 5743), la responsabilidad no se desplaza automáticamente con la venta del vehículo o la externalización de la actividad, si la empresa continúa obteniendo un beneficio económico de la misma. Ahora bien pese a no ser la propietaria directa del vehículo involucrado en el siniestro o la actividad principal de la empresa no sea el transporte, mantiene un claro vínculo económico con la actividad que generó el daño, toda vez que, asi la entidad no tenga como actividad principal el transporte, utiliza vehículos en sus operaciones y sigue obteniendo beneficios de esta actividad, generando así la actividad peligrosa. Este vínculo económico no la exime de responsabilidad, ya que, conforme a la doctrina expuesta por la Corte Suprema, la simple transferencia de la propiedad o la tercerización de la actividad no desplaza automáticamente la responsabilidad civil, si la empresa responsable sigue beneficiándose de la operación que ocasionó el perjuicio.

En conclusión, en el contexto de la responsabilidad civil extracontractual en Colombia, tanto la jurisprudencia de la Corte Suprema como la normativa vigente establecen que la responsabilidad por daños en actividades peligrosas recae sobre quienes detentan el control, dirección y obtienen un beneficio económico de la actividad, independientemente de la propiedad directa de los bienes involucrados. Las empresas que conservan influencia y provecho económico en actividades riesgosas, como la operación de vehículos  pueden ser solidariamente responsables por los daños causados, debiendo responder por ellos.

La responsabilidad de la empresa de transportes	

La afiliación de vehículos automotores a una empresa prestadora del servicio público de transporte conlleva una serie de responsabilidades de carácter legal, establecidas en la Ley 336 de 1996. El artículo 36 de esta norma establece: “Los conductores de los equipos destinados al servicio público de transporte serán contratados directamente por la empresa operadora de transporte, quien para todos los efectos será solidariamente responsable junto con el propietario del equipo.”[ Ley 336 de 1996. Por la cual se adopta el estatuto nacional de transporte. Diciembre 20 de 1996.NOTIFICACIONES]

La responsabilidad solidaria planteada en estos términos implica que la empresa de transporte deberá responder por los créditos en cabeza de cualquiera de sus conductores, derivados de la ejecución de la actividad de transporte. Por lo tanto, este fundamento legal activa la posibilidad de efectuar el cobro directo a la empresa de transporte cuando los perjuicios ocasionados a un tercero sean producto de la responsabilidad de uno de sus vehículos afiliados. Por lo tanto, solicitamos de manera respetuosa que se acojan a nuestras pretensiones.`; 

    case 'RCE HURTO + DEDUCIBLE':
    case 'RCE HURTO':
      return `La subrogación

Las entidades aseguradoras se ven obligadas al pago de las indemnizaciones que hayan sido pactadas en el contrato de seguro. No obstante, el Código de Comercio establece la posibilidad que asiste a la aseguradora de realizar el recobro de este pago a quien haya sido responsable del daño resarcido: “El asegurador que pague una indemnización se subrogará, por ministerio de la ley y hasta concurrencia de su importe, en los derechos del asegurado contra las personas responsables del siniestro.”

La Corte Suprema de Justicia ha desarrollado esta disposición legal de la siguiente manera:

La citada disposición permite establecer, que para el buen suceso de la «acción subrogatoria», se debe acreditar que en virtud de un «contrato de seguro», al haberse producido el «siniestro», el asegurador efectuó válidamente el «pago de la indemnización», de tal manera que por mandato legal se subroga en los derechos del afectado patrimonialmente con el riesgo amparado, pasando a ocupar su lugar o posición en la relación jurídica existente con el responsable o causante del hecho dañoso. 2

En consecuencia, a Seguros Generales Sura S.A. le asiste el derecho a recobrar el valor pagado por la reparación del vehículo asegurado, en virtud de la figura de la subrogación, tanto frente al propietario como frente a la empresa de servicio público por cumplirse los presupuestos jurisprudenciales:

a. Existe un contrato de seguro de autos soportado mediante la póliza ${numeroPoliza}.
b. Se produjo un accidente de tránsito entre el vehículo de placa ${placasPrimerVehiculo} y el vehículo de placa ${placasSegundoVehiculo}, en el cual ha sido atribuida la responsabilidad al vehículo de su propiedad.
c. Seguros Generales Sura S.A. canceló el valor de la reparación del vehículo de placas $ ${cuantia}.

La Responsabilidad de los parqueaderos

El Artículo 2236 del Código Civil indica que: llámase en general depósito el contrato en que se confía una cosa corporal a una persona que se encarga de guardarla y de restituir en especie, tal como sucede en el servicio de parqueadero.

A su vez el artículo 18 Ley 1480 de 2011 indica que cuando se exija la entrega de un bien respecto del cual se desarrollará una prestación de servicios, estará sometido a las siguientes reglas:

  “…
  Quien preste el servicio asume la custodia y conservación adecuada del bien y, por lo
  tanto, de la integridad de los elementos que lo componen, así como la de sus equipos
  anexos o complementarios, si los tuviere.…”
  Por su parte, La Corte Suprema de Justicia - Sala de Casación Civil en Sentencia SC (02-
  09 1985) del 2 de septiembre de 1985 Magistrado ponente: doctor Humberto Murcia
  Ballén, indico:
  “…

Ha querido el legislador darle grande importancia a la obligación de restitución que tiene el depositario frente al depositante, que la regula ampliamente, todo en aras de la confianza que inspira el depósito; por ello la establece "a voluntad del depositante" (Art. 2251); y que el depositario no puede retener la cosa, a título de compensación, salvo cuando el depositante le debe expensas necesarias para su conservación, o los perjuicios que se le hayan causado (Art. 2258 y 2259). Si este es el predicado que según la normación positiva se infiere en torno a la obligación principal de restituir, dístico semejante, por fuerza de la lógica, tiene que formularse en cuanto a la pretensión indemnizatoria de perjuicios que se deriva justa y precisamente del incumplimiento de ese específico deber. …”

La responsabilidad del parqueadero ${nombreEmpresa}

En este caso ${nombreEmpresa} se encontraba con la custodia del vehículo placas ${placasPrimerVehiculo} en el parqueadero del conjunto residencial ubicado en la ${direccionEmpresa} en la ciudad de ${ciudadEmpresa}. Por ello, y de acuerdo a la disposición normativa que recalca quienes prestan servicios que suponen la entrega del bien están obligados a devolver la cosa en el estado en el que les fue entregada o en su defecto repararla o sustituirlo:

Ley 1480 de 2011, Artículo 11. Aspectos incluidos en la garantía legal. Corresponden a la garantía legal las siguientes obligaciones: (…)

  9. En los casos de prestación de servicios que suponen la entrega de un bien,
  repararlo, sustituirlo por otro de las mismas características, o pagar su equivalente
  en dinero en caso de destrucción parcial o total causada con ocasión del servicio
  defectuoso. Para los efectos de este numeral, el valor del bien se determinará
  según sus características, estado y uso. (…)”

En merito de lo expuesto y en atención a la documentación aportada que evidencia con diáfana claridad los hechos, solicitamos resolver favorablemente la solicitud previamente señalada.
`;

    case 'RCE DAÑOS':   
    case 'RCE DAÑOS + OBJECION':
    case 'RCE DAÑOS + DEDUCIBLE':
    case 'RCE DAÑOS + DEDUCIBLE + OBJECION':
      return `La subrogación  

Las entidades aseguradoras se ven obligadas al pago de las indemnizaciones que hayan sido pactadas en el contrato de seguro. No obstante, el Código de Comercio establece la posibilidad que asiste a la aseguradora de realizar el recobro de este pago a quien haya sido responsable del daño resarcido: “El asegurador que pague una indemnización se subrogará, por ministerio de la ley y hasta concurrencia de su importe, en los derechos del asegurado contra las personas responsables del siniestro.”

La Corte Suprema de Justicia ha desarrollado esta disposición legal de la siguiente manera:

La citada disposición permite establecer, que para el buen suceso de la «acción subrogatoria», se debe acreditar que en virtud de un «contrato de seguro», al haberse producido el «siniestro», el asegurador efectuó válidamente el «pago de la indemnización», de tal manera que por mandato legal se subroga en los derechos del afectado patrimonialmente con el riesgo amparado, pasando a ocupar su lugar o posición en la relación jurídica existente con el responsable o causante del hecho dañoso.

En consecuencia, a Seguros Generales Sura S.A. le asiste el derecho a recobrar el valor pagado por la reparación del vehículo asegurado, en virtud de la figura de la subrogación, tanto frente al propietario como frente a la empresa de servicio público por cumplirse los presupuestos jurisprudenciales:

a. Existe un contrato de seguro de autos soportado mediante la póliza ${numeroPoliza}.
b. Se produjo un accidente de tránsito entre el vehículo de placa ${placasPrimerVehiculo} y el vehículo de placa ${placasSegundoVehiculo}, en el cual ha sido atribuida la responsabilidad al vehículo de su propiedad.
c. Seguros Generales Sura S.A. canceló el valor de la reparación del vehículo de placas $ ${cuantia}.

Responsabilidad Civil Extracontractual por Actividades Peligrosas  

El artículo 2341 del Código Civil establece que quien cometa un delito o culpa, y con ello le genere un daño a otro, se encuentra obligado a indemnizarlo, sin perjuicio de la pena principal que la ley imponga por la culpa o el delito cometido.

En lo que respecta puntualmente a la responsabilidad civil extracontractual por actividades peligrosas, esta se origina en el ejercicio de una actividad que genera un riesgo mayor al que normalmente están expuestas las personas. Al respecto, la jurisprudencia de la Sala Civil de la Corte Suprema de Justicia ha definido en forma pacífica que la conducción de vehículos automotores es una actividad considerada como peligrosa. Lo anterior, debido al alto nivel de riesgo que implica su ejercicio.

Ahora bien, en concordancia con el desarrollo jurisprudencial colombiano, con base en artículos como el 2356 (presunción de culpa en actividades peligrosas), 2347 y 2349 del Código civil (Responsabilidad indirecta por el hecho de empleado o personas a cargo) se establece todo un régimen de responsabilidad aplicado no solo a la persona principal que ejerce el hecho dañoso sino a terceros que tienen un deber de guarda o dominio y son solidariamente responsables en casos específicos.

De esta forma, La Corte Suprema de Justicia, en la Sentencia del 13 de marzo de 2008 (Exp. 9327), reafirmó que la responsabilidad en casos de actividades peligrosas, recae sobre quien ostenta la condición de guardián, es decir, quien detenta el poder de mando, dirección y control sobre la actividad en el momento en que ocurre el daño.

Asimismo, según la doctrina establecida en la Sentencia del 22 de abril de 1997 (Exp. 5743), la responsabilidad no se desplaza automáticamente con la venta del vehículo o la externalización de la actividad, si la empresa continúa obteniendo un beneficio económico de la misma. Ahora bien pese a no ser la propietaria directa del vehículo involucrado en el siniestro o la actividad principal de la empresa no sea el transporte, mantiene un claro vínculo económico con la actividad que generó el daño, toda vez que, asi la entidad no tenga como actividad principal el transporte, utiliza vehículos en sus operaciones y sigue obteniendo beneficios de esta actividad, generando así la actividad peligrosa. Este vínculo económico no la exime de responsabilidad, ya que, conforme a la doctrina expuesta por la Corte Suprema, la simple transferencia de la propiedad o la tercerización de la actividad no desplaza automáticamente la responsabilidad civil, si la empresa responsable sigue beneficiándose de la operación que ocasionó el perjuicio.

En conclusión, en el contexto de la responsabilidad civil extracontractual en Colombia, tanto la jurisprudencia de la Corte Suprema como la normativa vigente establecen que la responsabilidad por daños en actividades peligrosas recae sobre quienes detentan el control, dirección y obtienen un beneficio económico de la actividad, independientemente de la propiedad directa de los bienes involucrados. Las empresas que conservan influencia y provecho económico en actividades riesgosas, como la operación de vehículos  pueden ser solidariamente responsables por los daños causados, debiendo responder por ellos.

La responsabilidad de la empresa de transportes  

La afiliación de vehículos automotores a una empresa prestadora del servicio público de transporte conlleva una serie de responsabilidades de carácter legal, establecidas en la Ley 336 de 1996. El artículo 36 de esta norma establece: "Los conductores de los equipos destinados al servicio público de transporte serán contratados directamente por la empresa operadora de transporte, quien para todos los efectos será solidariamente responsable junto con el propietario del equipo."[ Ley 336 de 1996. Por la cual se adopta el estatuto nacional de transporte. Diciembre 20 de 1996.]

La responsabilidad solidaria planteada en estos términos implica que la empresa de transporte deberá responder por los créditos en cabeza de cualquiera de sus conductores, derivados de la ejecución de la actividad de transporte. Por lo tanto, este fundamento legal activa la posibilidad de efectuar el cobro directo a la empresa de transporte cuando los perjuicios ocasionados a un tercero sean producto de la responsabilidad de uno de sus vehículos afiliados. Por lo tanto, solicitamos de manera respetuosa que se acojan a nuestras pretensiones.`
  }

}

// Función para generar contenido de NOTIFICACIONES según el tipo de caso
const generateNotificacionesContent = (formData = {}, caseType = "") => {
  switch (caseType) {
    case 'RCE DAÑOS':
    case 'RCE DAÑOS + OBJECION':
    case 'RCE SOLO DEDUCIBLE':
    case 'RCE DAÑOS + DEDUCIBLE':
    case 'RCE DAÑOS + DEDUCIBLE + OBJECION':
    case 'RCE SOLO DEDUCIBLE + OBJECION':
    case 'RCE HURTO':
    default:
      return `Es interés de Seguros Generales Suramericana S.A. poder invitarlo a que podamos materializar un acuerdo beneficioso para ambas partes que evite desgastes administrativos y judiciales para ambas partes, por lo anterior en caso de que resulte de su interés poder que realicemos acercamientos al respecto, nos permitimos informarle que el recobro del presente siniestro ha sido asignado a la firma de abogados externos BTL Legal Group S.A.S. ubicada en la Avenida 6AN 25N – 22 Piso Tercero, Cali - Valle del Cauca y con números de teléfonos 6686611, , WhatsApp 323 6214498 y correo electrónico subrogacion10@btllegalgroup.com. Empresa con la cual podrá comunicarse en caso de que resulte de su interés poder llegar a un acuerdo para zanjar la presente controversia.`;
  }
};

// Contenido por defecto para las tabs editables
const generateTabContent = (tabName) => {
  return `${tabName}

Contenido de ${tabName}. Complete el formulario en el panel izquierdo para generar automáticamente el contenido de esta sección.

Puede editar este contenido según sea necesario.`;
};

// Función para obtener contenido por defecto de anexos según el tipo de caso
export const getDefaultAnexosContent = (formData = {}, caseType = "") => {
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

    default:
      return 'ELIGE UN TIPO DE CASO PARA GENERAR LOS ANEXOS';
  }
};

export default StyledEditor;
