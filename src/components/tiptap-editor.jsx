import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import { EditorProvider, useCurrentEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import React from 'react'
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
  Palette
} from 'lucide-react'

const MenuBar = () => {
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
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Encabezado 1"
        >
          <Heading1 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Encabezado 2"
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
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

const StyledEditor = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <EditorProvider 
          slotBefore={<MenuBar />} 
          extensions={extensions} 
          content={content}
          editorProps={{
            attributes: {
              class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto focus:outline-none min-h-[400px] max-w-none p-6 prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-em:text-gray-600 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:text-blue-900 prose-blockquote:font-normal prose-code:bg-gray-100 prose-code:text-red-600 prose-code:px-1 prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700"
            }
          }}
        />
      </div>
    </div>
  )
}

export default StyledEditor;
