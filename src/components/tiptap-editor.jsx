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
import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import { EditorProvider, useCurrentEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import React, { useEffect, useState, useRef } from 'react'
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Code, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Heading1, 
  Heading2, 
  Heading3, 
  Type, 
  Minus,
  RotateCcw,
  Eraser,
  CodeSquare,
  Palette,
  RefreshCw
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const MenuBar = ({ onRegenerateContent }) => {
  const { editor } = useCurrentEditor()

  if (!editor) {
    return null
  }

  const ToolbarButton = ({ onClick, disabled, isActive, children, title }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        inline-flex items-center justify-center
        w-8 h-8 rounded-md transition-all duration-200
        border border-gray-200
        ${disabled 
          ? 'opacity-50 cursor-not-allowed bg-gray-50' 
          : isActive 
            ? 'bg-blue-100 text-blue-600 border-blue-300 shadow-sm' 
            : 'hover:bg-gray-100 text-gray-600 hover:border-gray-300'
        }
      `}
    >
      {children}
    </button>
  )

  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-gray-300 mx-2"></div>
  )

  return (
    <div className="bg-white border-b border-gray-200 p-3 sticky top-0 z-10">
      <div className="flex flex-wrap gap-1 items-center">
        {/* Deshacer/Rehacer */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title="Deshacer"
        >
          <Undo size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title="Rehacer"
        >
          <Redo size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Formato de texto */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Negrita"
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Cursiva"
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Tachado"
        >
          <Strikethrough size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Código"
        >
          <Code size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Encabezados */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive('paragraph')}
          title="Párrafo"
        >
          <Type size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            if (editor.isActive('heading', { level: 1 })) {
              editor.chain().focus().setParagraph().run()
            } else {
              editor.chain().focus().setHeading({ level: 1 }).run()
            }
          }}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Encabezado 1"
        >
          <Heading1 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            if (editor.isActive('heading', { level: 2 })) {
              editor.chain().focus().setParagraph().run()
            } else {
              editor.chain().focus().setHeading({ level: 2 }).run()
            }
          }}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Encabezado 2"
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            if (editor.isActive('heading', { level: 3 })) {
              editor.chain().focus().setParagraph().run()
            } else {
              editor.chain().focus().setHeading({ level: 3 }).run()
            }
          }}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Encabezado 3"
        >
          <Heading3 size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Listas */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Lista con viñetas"
        >
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Lista numerada"
        >
          <ListOrdered size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Otros elementos */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Bloque de código"
        >
          <CodeSquare size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Cita"
        >
          <Quote size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Línea horizontal"
        >
          <Minus size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Color */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setColor('#958DF1').run()}
          isActive={editor.isActive('textStyle', { color: '#958DF1' })}
          title="Color púrpura"
        >
          <Palette size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Regenerar contenido */}
        <ToolbarButton
          onClick={onRegenerateContent}
          title="Regenerar contenido desde formulario"
        >
          <RefreshCw size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Limpiar formato */}
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetAllMarks().run()}
          title="Limpiar formato"
        >
          <Eraser size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().run()}
          title="Limpiar nodos"
        >
          <RotateCcw size={14} />
        </ToolbarButton>
      </div>
    </div>
  )
}

const extensions = [
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.configure({ types: [ListItem.name] }),
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
    },
    heading: {
      levels: [1, 2, 3, 4, 5, 6],
      HTMLAttributes: {
        class: 'heading-element',
      },
    },
  }),
]

const content = `
<h2>
  ¡Hola! 👋
</h2>
<p>
  Este es un ejemplo <em>mejorado</em> de <strong>TipTap</strong> con estilos modernos. Tienes todos los estilos básicos que esperarías de un editor de texto. Pero espera hasta que veas las listas:
</p>
<ul>
  <li>
    Esta es una lista con viñetas con uno …
  </li>
  <li>
    … o dos elementos de lista.
  </li>
</ul>
<p>
  ¿No es genial? Y todo esto es editable. Pero espera, hay más. Probemos un bloque de código:
</p>
<pre><code class="language-css">body {
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}</code></pre>
<p>
  Lo sé, lo sé, esto es impresionante. Pero esto es solo la punta del iceberg. Pruébalo y haz clic un poco por aquí y por allá. No olvides revisar los otros ejemplos también.
</p>
<blockquote>
  ¡Wow, eso es increíble. Buen trabajo! 👏
  <br />
  — Tu desarrollador favorito
</blockquote>
`

// Función para generar contenido basado en los datos del formulario
const generateFormDataContent = (formData, caseType = "") => {
  if (!formData || Object.values(formData).every(value => !value || !value.toString().trim())) {
    // Si no hay datos del formulario pero sí hay tipo de caso, mostrar solo el título
    if (caseType) {
      // Si es RCE de daños, mostrar la plantilla específica
      if (caseType === "RECLAMACION RCE DAÑOS") {
        return generateRCEDañosTemplate(formData, caseType);
      }
      return `
<h1>📋 ${caseType}</h1>

<p>Complete el formulario en el panel izquierdo para generar automáticamente el contenido de este caso.</p>

<h2>📝 Descripción Adicional</h2>
<p>Aquí puedes agregar detalles adicionales sobre el caso, descripción de los daños, circunstancias del accidente, testigos, etc.</p>
      `;
    }
    return content; // Retorna el contenido por defecto si no hay datos ni tipo
  }

  // Función helper para formatear valores
  const formatValue = (value, defaultText = 'No especificado') => {
    return value && value.toString().trim() ? value.toString().trim() : defaultText;
  };

  // Función helper para formatear fecha
  const formatDateFromDayMonthYear = (day, month, year) => {
    if (!day || !month || !year) return 'No especificada';
    try {
      const monthMap = {
        'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
        'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
      };
      const monthIndex = monthMap[month.toLowerCase()];
      if (monthIndex !== undefined) {
        const date = new Date(parseInt(year), monthIndex, parseInt(day));
        return date.toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      return `${day} de ${month} del ${year}`;
    } catch {
      return `${day} de ${month} del ${year}`;
    }
  };

  // Si es RCE de daños, usar la plantilla específica
  if (caseType === "RECLAMACION RCE DAÑOS") {
    return generateRCEDañosTemplate(formData, caseType);
  }

  // Usar el tipo de caso como título principal, o un título genérico si no hay tipo
  const title = caseType ? `📋 ${caseType}` : '📋 Información del Caso';

  // Obtener la ciudad y la fecha formateada en español
  const ciudad = formatValue(formData.ciudad);
  const fechaActual = new Date();
  const fechaFormateada = fechaActual.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).replace(/^(\d{1,2}) de ([a-záéíóú]+) de (\d{4})$/i, (m, d, mes, y) => `${d} de ${mes.charAt(0).toUpperCase() + mes.slice(1)} del ${y}`);

  return `
<p>${ciudad}, ${fechaFormateada}</p>

<h2>🏢 Datos del Asegurado</h2>
<ul>
  <li><strong>Nombre de la Empresa:</strong> ${formatValue(formData.nombreEmpresa)}</li>
  <li><strong>NIT:</strong> ${formatValue(formData.nitEmpresa)}</li>
  <li><strong>Correo:</strong> ${formatValue(formData.correoEmpresa)}</li>
  <li><strong>Número de Póliza Sura:</strong> ${formatValue(formData.numeroPolizaSura)}</li>
</ul>

<h2>🚗 Información del Accidente</h2>
<ul>
  <li><strong>Fecha del Accidente:</strong> ${formatDateFromDayMonthYear(formData.diaAccidente, formData.mesAccidente, formData.añoAccidente)}</li>
  <li><strong>Dirección:</strong> ${formatValue(formData.direccionAccidente)}</li>
  <li><strong>Ciudad:</strong> ${formatValue(formData.ciudad)}</li>
  <li><strong>Departamento:</strong> ${formatValue(formData.departamento)}</li>
</ul>

<h2>🚙 Vehículos Involucrados</h2>

<h3>Primer Vehículo</h3>
<ul>
  <li><strong>Placas:</strong> ${formatValue(formData.placasPrimerVehiculo)}</li>
  <li><strong>Propietario:</strong> ${formatValue(formData.propietarioPrimerVehiculo)}</li>
</ul>

<h3>Segundo Vehículo</h3>
<ul>
  <li><strong>Placas:</strong> ${formatValue(formData.placasSegundoVehiculo)}</li>
  <li><strong>Propietario:</strong> ${formatValue(formData.propietarioSegundoVehiculo)}</li>
</ul>

<h2>👤 Información del Conductor Infractor</h2>
<ul>
  <li><strong>Nombre:</strong> ${formatValue(formData.conductorVehiculoInfractor)}</li>
  <li><strong>Cédula:</strong> ${formatValue(formData.cedulaConductorInfractor)}</li>
</ul>

<h2>💰 Información Económica</h2>
<ul>
  <li><strong>Cuantía (Total de daños):</strong> $ ${formatCurrency(formData.cuantia)}</li>
</ul>

<hr>

<blockquote>
  <p><strong>Nota:</strong> Esta información ha sido generada automáticamente basada en los datos del formulario. Puedes editar este contenido según sea necesario para completar el reporte del caso.</p>
</blockquote>

<h2>📝 Descripción Adicional</h2>
<p>Aquí puedes agregar detalles adicionales sobre el caso, descripción de los daños, circunstancias del accidente, testigos, etc.</p>

${formData.anexos && formData.anexos.length > 0 ? `
<h2>📎 Anexos y Evidencias</h2>
<p>Se han adjuntado ${formData.anexos.length} archivo${formData.anexos.length > 1 ? 's' : ''} como evidencia del caso:</p>
<ul>
${formData.anexos.map((file, index) => `  <li><strong>Anexo ${index + 1}:</strong> ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)</li>`).join('\n')}
</ul>
<p><em>Nota: Los anexos se incluirán en el documento final generado.</em></p>
` : ''}
  `;
};

// Función para generar la plantilla específica de RCE de daños
const generateRCEDañosTemplate = (formData, caseType) => {
  // Función helper para formatear valores
  const formatValue = (value, defaultText = 'XXXXXXX') => {
    return value && value.toString().trim() ? value.toString().trim() : defaultText;
  };

  // Función helper para formatear fecha en formato español completo desde día, mes y año
  const formatDateFromDayMonthYear = (day, month, year) => {
    if (!day || !month || !year) return 'XXX de XXXX del 2024';
    try {
      const dayNum = parseInt(day);
      const monthStr = month.toLowerCase();
      const yearNum = parseInt(year);
      return `${dayNum} de ${monthStr} del ${yearNum}`;
    } catch {
      return 'XXX de XXXX del XXXX';
    }
  };

  // Obtener fecha actual formateada
  const fechaActual = new Date();
  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const fechaHoy = `${fechaActual.getDate()} de ${monthNames[fechaActual.getMonth()]} del ${fechaActual.getFullYear()}`;

  return `
<div style="text-align: center; margin-bottom: 40px;">
  <img src="/btl-logo.svg" alt="BTL Legal Group" style="max-width: 200px; height: auto;" />
</div>

<div style="margin-bottom: 40px;">
  <p style="text-align: right;">Santiago de Cali, ${fechaActual.getDate()} de ${monthNames[fechaActual.getMonth()]} del ${fechaActual.getFullYear()}</p>
</div>

<div style="margin-bottom: 30px;">
  <p><strong>Señores:</strong><br />
  ${formatValue(formData.nombreEmpresa, 'XXXXXXXXXXXXXXX')}<br />
  <strong>NIT.</strong> ${formatValue(formData.nitEmpresa, 'XXXXXXXXXXXXXXX')}<br />
  <strong>CORREO</strong> ${formatValue(formData.correoEmpresa, 'XXXXXXXXXXXXXXX')}<br />
  Bogotá D.C.</p>
</div>

<div style="text-align: center; margin: 30px 0;">
  <p><strong>Asunto: Reclamación Responsabilidad Civil Extracontractual</strong></p>
</div>

<div style="text-align: justify; margin-bottom: 30px;">
  <p><strong>JORGE ARMANDO LASSO DUQUE</strong>, identificado como aparece al pie de mi firma, obrando en calidad de Representante Legal General de la compañía <strong>SEGUROS GENERALES SURA S.A.</strong>, de conformidad con el poder otorgado mediante Escritura Pública No. 392 del 12 de abril de 2016, Clausula Primera, Numeral (5), presento <strong>RECLAMACIÓN FORMAL</strong> por el pago de perjuicios, con fundamento en los siguientes:</p>
</div>

<h2><strong>HECHOS</strong></h2>

<div style="text-align: justify; margin-bottom: 30px;">
  <p><strong>1.</strong> El ${formatDateFromDayMonthYear(formData.diaAccidente, formData.mesAccidente, formData.añoAccidente)} en la ${formatValue(formData.direccionAccidente, 'XXXXXXXXXXXXXXX')}, de la ciudad de ${formatValue(formData.ciudad, 'XXXXX XXXX')}, ${formatValue(formData.departamento, 'XXXXXXXX')}; se presentó un accidente de tránsito entre el vehículo de placas ${formatValue(formData.placasPrimerVehiculo, 'XXXXX')} de propiedad de ${formatValue(formData.propietarioPrimerVehiculo, 'XXXXXXXX')} y el vehículo de placas ${formatValue(formData.placasSegundoVehiculo, 'XXXXXX')} de propiedad de ${formatValue(formData.propietarioSegundoVehiculo, 'XXXXXXXX')} conducido por ${formatValue(formData.conductorVehiculoInfractor, 'RXXXXXXX')} identificado con cédula de ciudadanía ${formatValue(formData.cedulaConductorInfractor, '1XXXXXXXX')}</p>

  <p><strong>2.</strong> Derivado del mentado accidente se levantó la evidencia fotográfica conforme a lo previsto en el artículo 16 de la Ley 2251 del 2022, donde se atribuye la responsabilidad al conductor del vehículo de placas ${formatValue(formData.placasSegundoVehiculo, 'XXXXXXX')}</p>

  <p><strong>3.</strong> El vehículo de placas ${formatValue(formData.placasPrimerVehiculo, 'XXXXXX')} se encontraba asegurado al momento del accidente por la póliza de seguros ${formatValue(formData.numeroPolizaSura, 'XXXXXXXXXX')} expedida por Seguros Generales Suramericana.</p>

  <p><strong>4.</strong> Producto del accidente de tránsito Seguros Generales Sura S.A. canceló la suma de $ ${formatCurrency(formData.cuantia)} por concepto de reparación de los daños materiales sufridos al vehículo de placas ${formatValue(formData.placasPrimerVehiculo, 'XXXXXXX')}.</p>
</div>

<div style="text-align: justify; margin-bottom: 30px;">
  <p>Con fundamento en lo anterior, nos permitimos realizar la siguiente:</p>
</div>

<h2><strong>SOLICITUD</strong></h2>

<div style="text-align: justify; margin-bottom: 40px;">
  <p>De manera respetuosa solicitamos que ${formatValue(formData.nombreEmpresa, 'XXXXXXXXX')} cancele a favor de Seguros Generales Sura S.A. la suma de $ ${formatCurrency(formData.cuantia)} en virtud de la subrogación consignada en el artículo 1096 del Código de Comercio.</p>
</div>

<h2><strong>FUNDAMENTOS DE DERECHO</strong></h2>

<h3><strong>La subrogación</strong></h3>

<div style="text-align: justify; margin-bottom: 20px;">
  <p>Las entidades aseguradoras se ven obligadas al pago de las indemnizaciones que hayan sido pactadas en el contrato de seguro. No obstante, el Código de Comercio establece la posibilidad que asiste a la aseguradora de realizar el recobro de este pago a quien haya sido responsable del daño resarcido: "El asegurador que pague una indemnización se subrogará, por ministerio de la ley y hasta concurrencia de su importe, en los derechos del asegurado contra las personas responsables del siniestro."</p>

  <p>La Corte Suprema de Justicia ha desarrollado esta disposición legal de la siguiente manera:</p>
  
  <p><em>La citada disposición permite establecer, que para el buen suceso de la «acción subrogatoria», se debe acreditar que en virtud de un «contrato de seguro», al haberse producido el «siniestro», el asegurador efectuó válidamente el «pago de la indemnización», de tal manera que por mandato legal se subroga en los derechos del afectado patrimonialmente con el riesgo amparado, pasando a ocupar su lugar o posición en la relación jurídica existente con el responsable o causante del hecho dañoso.</em></p>
  
  <p>En consecuencia, a Seguros Generales Sura S.A. le asiste el derecho a recobrar el valor pagado por la reparación del vehículo asegurado, en virtud de la figura de la subrogación, tanto frente al propietario como frente a la empresa de servicio público por cumplirse los presupuestos jurisprudenciales:</p>

  <p><strong>a.</strong> Existe un contrato de seguro de autos soportado mediante la póliza ${formatValue(formData.numeroPolizaSura, 'XXXXXXXXXX')}.<br />
  <strong>b.</strong> Se produjo un accidente de tránsito entre el vehículo de placa ${formatValue(formData.placasPrimerVehiculo, 'XXXXXXX')} y el vehículo de placa ${formatValue(formData.placasSegundoVehiculo, 'XXXXXXX')}, en el cual ha sido atribuida la responsabilidad al vehículo de su propiedad.<br />
  <strong>c.</strong> Seguros Generales Sura S.A. canceló el valor de la reparación del vehículo de placas ${formatValue(formData.placasPrimerVehiculo, 'XXXXXX')}.</p>
</div>

<h3><strong>Responsabilidad Civil Extracontractual por Actividades Peligrosas</strong></h3>

<div style="text-align: justify; margin-bottom: 20px;">
  <p>El artículo 2341 del Código Civil establece que quien cometa un delito o culpa, y con ello le genere un daño a otro, se encuentra obligado a indemnizarlo, sin perjuicio de la pena principal que la ley imponga por la culpa o el delito cometido.</p>
  
  <p>En lo que respecta puntualmente a la responsabilidad civil extracontractual por actividades peligrosas, esta se origina en el ejercicio de una actividad que genera un riesgo mayor al que normalmente están expuestas las personas. Al respecto, la jurisprudencia de la Sala Civil de la Corte Suprema de Justicia ha definido en forma pacífica que la conducción de vehículos automotores es una actividad considerada como peligrosa. Lo anterior, debido al alto nivel de riesgo que implica su ejercicio.</p>
  
  <p>Ahora bien, en concordancia con el desarrollo jurisprudencial colombiano, con base en artículos como el 2356 (presunción de culpa en actividades peligrosas), 2347 y 2349 del Código civil (Responsabilidad indirecta por el hecho de empleado o personas a cargo) se establece todo un régimen de responsabilidad aplicado no solo a la persona principal que ejerce el hecho dañoso sino a terceros que tienen un deber de guarda o dominio y son solidariamente responsables en casos específicos.</p>
  
  <p>De esta forma, La Corte Suprema de Justicia, en la Sentencia del 13 de marzo de 2008 (Exp. 9327), reafirmó que la responsabilidad en casos de actividades peligrosas, recae sobre quien ostenta la condición de guardián, es decir, quien detenta el poder de mando, dirección y control sobre la actividad en el momento en que ocurre el daño.</p>
  
  <p>Asimismo, según la doctrina establecida en la Sentencia del 22 de abril de 1997 (Exp. 5743), la responsabilidad no se desplaza automáticamente con la venta del vehículo o la externalización de la actividad, si la empresa continúa obteniendo un beneficio económico de la misma. Ahora bien pese a no ser la propietaria directa del vehículo involucrado en el siniestro o la actividad principal de la empresa no sea el transporte, mantiene un claro vínculo económico con la actividad que generó el daño, toda vez que, asi la entidad no tenga como actividad principal el transporte, utiliza vehículos en sus operaciones y sigue obteniendo beneficios de esta actividad, generando así la actividad peligrosa. Este vínculo económico no la exime de responsabilidad, ya que, conforme a la doctrina expuesta por la Corte Suprema, la simple transferencia de la propiedad o la tercerización de la actividad no desplaza automáticamente la responsabilidad civil, si la empresa responsable sigue beneficiándose de la operación que ocasionó el perjuicio.</p>
  
  <p>En conclusión, en el contexto de la responsabilidad civil extracontractual en Colombia, tanto la jurisprudencia de la Corte Suprema como la normativa vigente establecen que la responsabilidad por daños en actividades peligrosas recae sobre quienes detentan el control, dirección y obtienen un beneficio económico de la actividad, independientemente de la propiedad directa de los bienes involucrados. Las empresas que conservan influencia y provecho económico en actividades riesgosas, como la operación de vehículos pueden ser solidariamente responsables por los daños causados, debiendo responder por ellos.</p>
</div>

<h3><strong>La responsabilidad de la empresa de transportes</strong></h3>

<div style="text-align: justify; margin-bottom: 30px;">
  <p>La afiliación de vehículos automotores a una empresa prestadora del servicio público de transporte conlleva una serie de responsabilidades de carácter legal, establecidas en la Ley 336 de 1996. El artículo 36 de esta norma establece: "Los conductores de los equipos destinados al servicio público de transporte serán contratados directamente por la empresa operadora de transporte, quien para todos los efectos será solidariamente responsable junto con el propietario del equipo."</p>

  <p>La responsabilidad solidaria planteada en estos términos implica que la empresa de transporte deberá responder por los créditos en cabeza de cualquiera de sus conductores, derivados de la ejecución de la actividad de transporte. Por lo tanto, este fundamento legal activa la posibilidad de efectuar el cobro directo a la empresa de transporte cuando los perjuicios ocasionados a un tercero sean producto de la responsabilidad de uno de sus vehículos afiliados. Por lo tanto, solicitamos de manera respetuosa que se acojan a nuestras pretensiones.</p>
</div>

<h2><strong>NOTIFICACIONES</strong></h2>

<h3><strong>Invitación a llegar a un acuerdo.</strong></h3>

<div style="text-align: justify; margin-bottom: 30px;">
  <p>Es interés de Seguros Generales Suramericana S.A. poder invitarlo a que podamos materializar un acuerdo beneficioso para ambas partes que evite desgastes administrativos y judiciales para ambas partes, por lo anterior en caso de que resulte de su interés poder que realicemos acercamientos al respecto, nos permitimos informarle que el recobro del presente siniestro ha sido asignado a la firma de abogados externos BTL Legal Group S.A.S. ubicada en la Avenida 6AN 25N – 22 Piso Tercero, Cali - Valle del Cauca y con números de teléfonos 6686611, , WhatsApp 323 6214498 y correo electrónico subrogacion10@btllegalgroup.com. Empresa con la cual podrá comunicarse en caso de que resulte de su interés poder llegar a un acuerdo para zanjar la presente controversia.</p>
</div>

<h2><strong>ANEXOS</strong></h2>

<div style="margin-bottom: 30px;">
  <p><strong>1.</strong> Aviso de siniestro de póliza ${formatValue(formData.numeroPolizaSura, 'XXXXXXXXXXX')} expedida por Seguros Generales Sura S.A.</p>
  <p><strong>2.</strong> Registro fotográfico dispuesto en el Artículo 16 de la Ley 2251 del 2022 / IPAT.</p>
  <p><strong>3.</strong> Constancia de pago de daños materiales del vehículo asegurado por Sura S.A.</p>
  <p><strong>4.</strong> Copia simple de la Escritura Pública No. 392 del 12 de abril de 2016, a través del cual se otorga la representación legal general al suscrito.</p>
</div>

<div style="margin-top: 60px; text-align: center;">
  <p>Atentamente,</p>
  
  <div style="margin: 40px 0;">
    <img src="/firma.png" alt="Firma Jorge Armando Lasso Duque" style="max-width: 200px; height: auto;" />
  </div>
  
  <p><strong>JORGE ARMANDO LASSO DUQUE</strong><br />
  C.C. 1.130.638.193</p>
</div>

<div style="margin-top: 60px; border-top: 1px solid #ccc; padding-top: 20px; text-align: center;">
  <p><em>Información de contacto BTL Legal Group</em></p>
</div>
  `;
};

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

  // Generar las líneas de dirección y correo (pueden ser múltiples o estar vacías)
  const direccionLines = direccionEmpresa ? `${direccionEmpresa}<br />` : '';
  const correoLines = correoEmpresa ? `${correoEmpresa}<br />` : '';

  return `
<div style="margin-bottom: 20px;">
  <p>Santiago de Cali, ${diaActual} de ${mesActual} del ${añoActual}</p>
</div>

<div>
  <p><strong>Señores:</strong><br />
  ${nombreEmpresa}<br />
  <strong>NIT.</strong> ${nitEmpresa}<br />
  ${direccionLines}
  ${correoLines}
  ${telefonoEmpresa}<br />
  <strong>Cuantía:</strong> $ ${formatCurrency(formData.cuantia)}
  </p>
</div>
  `;
};

// Contenido por defecto para las demás tabs
const generateTabContent = (tabName) => {
  return `
<h2>${tabName}</h2>
<p>Contenido de ${tabName}. Complete el formulario en el panel izquierdo para generar automáticamente el contenido de esta sección.</p>
<p>Puede editar este contenido según sea necesario.</p>
  `;
};

const StyledEditor = ({ formData = {}, caseType = "" }) => {
  const [activeTab, setActiveTab] = useState("informacion-empresa");
  const [forceRegenerate, setForceRegenerate] = useState(0);
  
  const handleRegenerateContent = () => {
    setForceRegenerate(prev => prev + 1);
  };

  const tabs = [
    { id: "informacion-empresa", label: "Información Empresa", readOnly: true },
    { id: "asunto", label: "Asunto", readOnly: true },
    { id: "solicitud", label: "Solicitud", readOnly: true },
    { id: "fundamentos", label: "Fundamentos de Derecho", readOnly: false },
    { id: "notificaciones", label: "Notificaciones", readOnly: true },
    { id: "anexos", label: "Anexos", readOnly: false },
    { id: "firma", label: "Firma", readOnly: false }
  ];

  const getTabContent = (tabId) => {
    switch (tabId) {
      case "informacion-empresa":
        return generateInformacionEmpresa(formData);
      case "asunto":
        return `
<div style="text-align: justify;">
<strong>JORGE ARMANDO LASSO DUQUE</strong>, identificado como aparece al pie de mi firma, obrando en calidad de Representante Legal General de la compañía <strong>SEGUROS GENERALES SURA S.A.</strong>, de conformidad con el poder otorgado mediante Escritura Pública No. 392 del 12 de abril de 2016, Clausula Primera, Numeral (5), presento <strong>RECLAMACIÓN FORMAL</strong> por el pago de perjuicios, con fundamento en los siguientes:
</div>
`;
      case "solicitud": {
        // Variables del formulario
        const nombreEmpresa = formData?.nombreEmpresa || '{nombreEmpresa}';
        const cuantia = formatCurrency(formData?.cuantia);
        return `
<div style="text-align: justify;">
De manera respetuosa solicitamos que <strong>${nombreEmpresa}</strong> cancele a favor de <strong>Seguros Generales Sura S.A.</strong> la suma de <strong>$ ${cuantia}</strong> en virtud de la subrogación consignada en el artículo 1096 del Código de Comercio.
</div>
`;
      }
      case "fundamentos":
        return generateTabContent("Fundamentos de Derecho");
      case "notificaciones":
        return `
<div style="text-align: justify;">
Es interés de Seguros Generales Suramericana S.A. poder invitarlo a que podamos materializar un acuerdo beneficioso para ambas partes que evite desgastes administrativos y judiciales para ambas partes, por lo anterior en caso de que resulte de su interés poder que realicemos acercamientos al respecto, nos permitimos informarle que el recobro del presente siniestro ha sido asignado a la firma de abogados externos BTL Legal Group S.A.S. ubicada en la Avenida 6AN 25N – 22 Piso Tercero, Cali - Valle del Cauca y con números de teléfonos 6686611, , WhatsApp 323 6214498 y correo electrónico subrogacion10@btllegalgroup.com. Empresa con la cual podrá comunicarse en caso de que resulte de su interés poder llegar a un acuerdo para zanjar la presente controversia.
</div>
`;
      case "anexos":
        return generateTabContent("Anexos");
      case "firma":
        return generateTabContent("Firma");
      default:
        return generateTabContent("Contenido");
    }
  };

  const currentTab = tabs.find(tab => tab.id === activeTab);
  
  return (
    <div className="w-full h-full flex flex-col">
      <style>{editorStyles}</style>
      
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
                // Vista de solo lectura para "Información Empresa"
                <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm overflow-y-auto flex-1 p-6">
                  <div className="max-w-none prose prose-sm">
                    <div dangerouslySetInnerHTML={{ __html: getTabContent(tab.id) }} />
                  </div>
                </div>
              ) : (
                // Editor editable para las demás tabs
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-y-auto flex-1">
                  <EditorProvider 
                    slotBefore={<MenuBar onRegenerateContent={handleRegenerateContent} />} 
                    extensions={extensions} 
                    content={getTabContent(tab.id)}
                    editorProps={{
                      attributes: {
                        class: "focus:outline-none h-full max-w-none p-6 overflow-y-auto overflow-x-hidden"
                      }
                    }}
                  >
                    <EditorContentUpdater 
                      tabContent={getTabContent(tab.id)}
                      forceRegenerate={forceRegenerate}
                    />
                  </EditorProvider>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

const EditorContentUpdater = ({ tabContent, forceRegenerate }) => {
  const { editor } = useCurrentEditor()
  const lastTabContentRef = useRef(null)
  const lastForceRegenerateRef = useRef(0)

  useEffect(() => {
    if (editor) {
      // Actualizar el contenido si cambió el contenido de la tab o si se forzó la regeneración
      if (tabContent !== lastTabContentRef.current || 
          forceRegenerate !== lastForceRegenerateRef.current) {
        editor.commands.setContent(tabContent);
        lastTabContentRef.current = tabContent;
        lastForceRegenerateRef.current = forceRegenerate;
      }
    }
  }, [editor, tabContent, forceRegenerate])

  return null
}

// Agregar estilos CSS para el editor
const editorStyles = `
  .ProseMirror {
    color: #374151;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.2;
    min-height: 100%;
    overflow-wrap: break-word;
    word-wrap: break-word;
    hyphens: auto;
    white-space: normal;
  }

  .ProseMirror h1 {
    font-size: 2rem !important;
    font-weight: 700 !important;
    line-height: 1.2 !important;
    margin-top: 1rem !important;
    margin-bottom: 0.5rem !important;
    color: #1f2937 !important;
  }
  
  .ProseMirror h2 {
    font-size: 1.5rem !important;
    font-weight: 600 !important;
    line-height: 1.3 !important;
    margin-top: 0.75rem !important;
    margin-bottom: 0.375rem !important;
    color: #374151 !important;
  }
  
  .ProseMirror h3 {
    font-size: 1.25rem !important;
    font-weight: 500 !important;
    line-height: 1.3 !important;
    margin-top: 0.625rem !important;
    margin-bottom: 0.25rem !important;
    color: #4b5563 !important;
  }
  
  .ProseMirror h4 {
    font-size: 1.125rem !important;
    font-weight: 500 !important;
    line-height: 1.3 !important;
    margin-top: 0.5rem !important;
    margin-bottom: 0.25rem !important;
    color: #6b7280 !important;
  }
  
  .ProseMirror h5 {
    font-size: 1rem !important;
    font-weight: 500 !important;
    line-height: 1.3 !important;
    margin-top: 0.5rem !important;
    margin-bottom: 0.25rem !important;
    color: #6b7280 !important;
  }
  
  .ProseMirror h6 {
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    line-height: 1.3 !important;
    margin-top: 0.5rem !important;
    margin-bottom: 0.25rem !important;
    color: #9ca3af !important;
  }

  .ProseMirror p {
    margin-bottom: 0.5rem;
    color: #374151;
    line-height: 1.4;
  }

  .ProseMirror strong {
    font-weight: 600;
    color: #1f2937;
  }

  .ProseMirror em {
    font-style: italic;
    color: #6b7280;
  }

  .ProseMirror ul, .ProseMirror ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  .ProseMirror ul {
    list-style-type: disc;
  }

  .ProseMirror ol {
    list-style-type: decimal;
  }

  .ProseMirror li {
    margin-bottom: 0.25rem;
    color: #374151;
    line-height: 1.4;
  }

  .ProseMirror blockquote {
    border-left: 4px solid #3b82f6;
    background-color: #eff6ff;
    padding: 0.75rem;
    margin: 0.75rem 0;
    color: #1e40af;
    font-style: italic;
    line-height: 1.4;
  }

  .ProseMirror code {
    background-color: #f3f4f6;
    color: #dc2626;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875em;
    font-family: 'Courier New', monospace;
  }

  .ProseMirror pre {
    background-color: #1f2937;
    color: #f9fafb;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin: 0.75rem 0;
    overflow-x: auto;
    line-height: 1.4;
  }

  .ProseMirror pre code {
    background-color: transparent;
    color: inherit;
    padding: 0;
  }

  .ProseMirror hr {
    border: none;
    border-top: 2px solid #e5e7eb;
    margin: 1rem 0;
  }

  /* Manejo de desbordamiento y texto largo */
  .ProseMirror * {
    max-width: 100%;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .ProseMirror table {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    display: block;
    white-space: nowrap;
  }

  .ProseMirror img {
    max-width: 100%;
    height: auto;
  }

  /* Asegurar que el contenedor del editor tenga altura fija */
  .ProseMirror-focused {
    outline: none;
  }

  /* Contenedor del editor con scroll */
  .ProseMirror-editor {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Mejorar la apariencia del scrollbar */
  .ProseMirror::-webkit-scrollbar {
    width: 8px;
  }

  .ProseMirror::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  .ProseMirror::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }

  .ProseMirror::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

export default StyledEditor;
