"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye, Download, Mail, FileText } from "lucide-react"
import TiptapEditor from "@/components/tiptap-editor"
import { EmailModal } from "./email-modal"
import { generateDocument } from "@/lib/document-generator"
import { getDefaultAnexosContent } from '@/components/tiptap-editor'

interface StepThreeProps {
  onPrev: () => void
  onFinish: () => void
  currentStep: number
  caseType?: string
  formData?: any
}

interface EmailData {
  recipients: string[]
  subject: string
  message: string
  nombreEmpresa: string
}

export function StepThree({ onPrev, onFinish, currentStep, caseType = "", formData }: StepThreeProps) {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDownloadingWord, setIsDownloadingWord] = useState(false)
  // Estado para los contenidos de los tabs, inicializando anexos con valor por defecto
  const [tabContents, setTabContents] = useState<{ anexos: string; hechos?: string }>({ anexos: getDefaultAnexosContent(formData) })

  // Handler para cambios en los tabs del editor
  const handleTabContentChange = (tabId: string, content: string) => {
    setTabContents(prev => ({ ...prev, [tabId]: content }))
  }

  const handleDownloadWord = async () => {
    setIsDownloadingWord(true)
    try {
      // Crear FormData con los datos del formulario y anexos
      const formDataForDownload = new FormData()
      
      // Agregar datos del formulario
      Object.keys(formData).forEach(key => {
        if (key === 'anexos' && formData[key]) {
          // Agregar cada archivo anexo
          formData[key].forEach((file: File) => {
            formDataForDownload.append('anexos', file)
          })
        } else if (formData[key]) {
          formDataForDownload.append(key, formData[key])
        }
      })
      
      // Agregar el contenido de anexos como 'contenidoAnexos'
      if (tabContents.anexos) {
        formDataForDownload.append('contenidoAnexos', String(tabContents.anexos))
      }
      // Agregar el contenido de hechos como 'contenidoHechos'
      if (tabContents.hechos) {
        formDataForDownload.append('contenidoHechos', String(tabContents.hechos))
      }
      
      // Agregar tipo de caso
      formDataForDownload.append('caseType', caseType)
      
      // Llamar a la nueva API de descarga
      const response = await fetch('/api/download-word', {
        method: 'POST',
        body: formDataForDownload
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al generar el documento')
      }
      
      // Obtener el archivo y crear la descarga
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      // Extraer el nombre del archivo desde el header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `${caseType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      // Crear elemento de descarga
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      
      // Limpiar
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      console.error('Error al descargar Word con anexos:', error)
      alert('Error al generar el documento Word con anexos. Por favor, intente nuevamente.')
    } finally {
      setIsDownloadingWord(false)
    }
  }

  const handleSendEmail = async (emailData: EmailData) => {
    setIsProcessing(true)
    try {
      // Crear FormData con los datos del formulario y del email
      const formDataWithEmail = new FormData()
      
      // Agregar datos del formulario
      Object.keys(formData).forEach(key => {
        if (key === 'anexos' && formData[key]) {
          // Agregar cada archivo anexo
          formData[key].forEach((file: File) => {
            formDataWithEmail.append('anexos', file)
          })
        } else if (formData[key]) {
          formDataWithEmail.append(key, formData[key])
        }
      })
      
      // Agregar el contenido de anexos como 'contenidoAnexos'
      if (tabContents.anexos) {
        formDataWithEmail.append('contenidoAnexos', String(tabContents.anexos))
      }
      // Agregar el contenido de hechos como 'contenidoHechos'
      if (tabContents.hechos) {
        formDataWithEmail.append('contenidoHechos', String(tabContents.hechos))
      }
      
      // Agregar datos del email
      formDataWithEmail.append('emailRecipients', JSON.stringify(emailData.recipients))
      formDataWithEmail.append('emailSubject', emailData.subject)
      formDataWithEmail.append('emailMessage', emailData.message)
      formDataWithEmail.append('caseType', caseType)
      
      // Enviar a la API
      const response = await fetch('/api/send-email', {
        method: 'POST',
        body: formDataWithEmail
      })
      
      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
      
      // Verificar si la respuesta tiene contenido
      const responseText = await response.text()
      console.log('Response text:', responseText)
      
      if (!response.ok) {
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: `Error ${response.status}: ${responseText || 'Sin contenido'}` }
        }
        throw new Error(errorData.error || 'Error al enviar el email')
      }
      
      let result
      try {
        result = JSON.parse(responseText)
      } catch (error) {
        console.error('Error parsing JSON response:', error)
        throw new Error('Respuesta del servidor inválida')
      }
      
      console.log('Email enviado exitosamente:', result)
      
      // Finalizar el caso después del envío exitoso
      onFinish()
      
      return Promise.resolve()
    } catch (error) {
      console.error('Error al enviar email:', error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFinishAndSend = () => {
    // Abrir el modal de email en lugar de finalizar directamente
    setIsEmailModalOpen(true)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header con opciones */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#182A76]" />
            <h3 className="text-lg font-semibold text-gray-900">
              Previsualización del Documento
            </h3>
          </div>
          
          {/* Opciones de acción */}
          <div className="flex items-center gap-3">
            {/* Botón Descargar Word */}
            <Button
              variant="outline"
              onClick={handleDownloadWord}
              className="flex items-center gap-2"
              size="sm"
              disabled={isDownloadingWord}
            >
              {isDownloadingWord ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Generando documento...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Descargar con Anexos
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Información del documento */}
        <div className="mt-3 text-sm text-gray-600">
          <p><strong>Tipo:</strong> {caseType}</p>
          <p><strong>Estado:</strong> Listo para envío</p>
          <p><strong>Formato:</strong> PDF con anexos incluidos</p>
          {formData?.anexos && formData.anexos.length > 0 && (
            <p><strong>Anexos:</strong> {formData.anexos.length} archivo(s)</p>
          )}
        </div>
      </div>

      {/* Editor - Ocupa todo el ancho disponible */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
        <TiptapEditor 
          formData={formData} 
          caseType={caseType}
          tabContents={tabContents}
          onTabContentChange={handleTabContentChange}
        />
      </div>

      {/* Footer con botones de navegación */}
      <div className="mt-4 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={isProcessing}
        >
          Anterior
        </Button>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={handleFinishAndSend}
            disabled={isProcessing}
            className="bg-[#182A76] hover:bg-[#182A76]/90 flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Finalizar y Enviar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Modal de envío de email */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSend={handleSendEmail}
        caseType={caseType}
      />
    </div>
  )
}
