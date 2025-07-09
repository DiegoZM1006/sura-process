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
  const formatDate = (dateValue) => {
    if (!dateValue) return 'No especificada';
    try {
      const date = new Date(dateValue);
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateValue;
    }
  };

  // Usar el tipo de caso como título principal, o un título genérico si no hay tipo
  const title = caseType ? `📋 ${caseType}` : '📋 Información del Caso';

  // Obtener la ciudad y la fecha formateada en español
  const ciudad = formatValue(formData.ciudadSucedido);
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
  <li><strong>Nombre o Razón Social:</strong> ${formatValue(formData.nombreRazonSocial)}</li>
  <li><strong>NIT:</strong> ${formatValue(formData.nit)}</li>
  <li><strong>Correo:</strong> ${formatValue(formData.correo)}</li>
  <li><strong>Número de Póliza:</strong> ${formatValue(formData.polizaAsegurado)}</li>
</ul>

<h2>🚗 Información del Accidente</h2>
<ul>
  <li><strong>Fecha del Accidente:</strong> ${formatDate(formData.fechaAccidente)}</li>
  <li><strong>Dirección:</strong> ${formatValue(formData.direccionSucedido)}</li>
  <li><strong>Ciudad:</strong> ${formatValue(formData.ciudadSucedido)}</li>
  <li><strong>Departamento:</strong> ${formatValue(formData.departamentoSucedido)}</li>
</ul>

<h2>🚙 Vehículos Involucrados</h2>

<h3>Primer Vehículo</h3>
<ul>
  <li><strong>Placas:</strong> ${formatValue(formData.placas1erImplicado)}</li>
  <li><strong>Propietario:</strong> ${formatValue(formData.propietario1erVehiculo)}</li>
</ul>

<h3>Segundo Vehículo</h3>
<ul>
  <li><strong>Placas:</strong> ${formatValue(formData.placas2doImplicado)}</li>
  <li><strong>Propietario:</strong> ${formatValue(formData.propietario2doVehiculo)}</li>
</ul>

<h2>👤 Información del Conductor</h2>
<ul>
  <li><strong>Nombre:</strong> ${formatValue(formData.conductorVehiculo)}</li>
  <li><strong>Cédula:</strong> ${formatValue(formData.ccConductor)}</li>
</ul>

<h2>💰 Información Económica</h2>
<ul>
  <li><strong>Cuantías Estimadas:</strong> ${formatValue(formData.cuantias)}</li>
</ul>

<hr>

<blockquote>
  <p><strong>Nota:</strong> Esta información ha sido generada automáticamente basada en los datos del formulario. Puedes editar este contenido según sea necesario para completar el reporte del caso.</p>
</blockquote>

<h2>📝 Descripción Adicional</h2>
<p>Aquí puedes agregar detalles adicionales sobre el caso, descripción de los daños, circunstancias del accidente, testigos, etc.</p>
  `;
};

const StyledEditor = ({ formData = {}, caseType = "" }) => {
  const [forceRegenerate, setForceRegenerate] = useState(0);
  const editorContent = generateFormDataContent(formData, caseType);
  
  const handleRegenerateContent = () => {
    // Forzar regeneración del contenido incrementando el contador
    setForceRegenerate(prev => prev + 1);
  };
  
  return (
    <div className="w-full h-full flex flex-col">
      <style>{editorStyles}</style>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-y-scroll flex flex-col h-full">
        <EditorProvider 
          slotBefore={<MenuBar onRegenerateContent={handleRegenerateContent} />} 
          extensions={extensions} 
          content={editorContent}
          editorProps={{
            attributes: {
              class: "focus:outline-none h-full max-w-none p-6 overflow-y-auto overflow-x-hidden"
            }
          }}
        >
          <EditorContentUpdater 
            formData={formData} 
            caseType={caseType}
            forceRegenerate={forceRegenerate}
          />
        </EditorProvider>
      </div>
    </div>
  )
}

const EditorContentUpdater = ({ formData, caseType, forceRegenerate }) => {
  const { editor } = useCurrentEditor()
  const lastFormDataRef = useRef(null)
  const lastCaseTypeRef = useRef(null)
  const lastForceRegenerateRef = useRef(0)

  useEffect(() => {
    if (editor) {
      const newContent = generateFormDataContent(formData, caseType);
      
      // Comparar si los datos del formulario han cambiado
      const currentFormDataString = JSON.stringify(formData);
      const lastFormDataString = JSON.stringify(lastFormDataRef.current);
      
      // Actualizar el contenido si cambió el formulario, el tipo de caso o si se forzó la regeneración
      if (currentFormDataString !== lastFormDataString || 
          caseType !== lastCaseTypeRef.current || 
          forceRegenerate !== lastForceRegenerateRef.current) {
        editor.commands.setContent(newContent);
        lastFormDataRef.current = formData;
        lastCaseTypeRef.current = caseType;
        lastForceRegenerateRef.current = forceRegenerate;
      }
    }
  }, [editor, formData, caseType, forceRegenerate])

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
