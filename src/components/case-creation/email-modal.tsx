"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Mail, Plus } from "lucide-react"

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (emailData: EmailData) => void
  caseType: string
}

interface EmailData {
  recipients: string[]
  subject: string
  message: string
  nombreEmpresa: string
}

export function EmailModal({ isOpen, onClose, onSend, caseType }: EmailModalProps) {
  const [recipients, setRecipients] = useState<string[]>([])
  const [currentEmail, setCurrentEmail] = useState("")
  const [nombreEmpresa, setNombreEmpresa] = useState("")
  const [subject, setSubject] = useState("RECLAMACION RESPONSABILIDAD CIVIL EXTRACONTRACTUAL")
  const [message, setMessage] = useState(`Estimados señores

{nombreEmpresa}

Por medio de la presente, adjuntamos el documento de reclamación por responsabilidad civil extracontractual, en el que se expone de manera sumaria los hechos relacionados con el incidente del cual su empresa es presuntamente responsable.

Además, anexamos la documentación relevante como elementos materiales probatorios, incluidas facturas y demás soportes que respaldan nuestra reclamación.

Agradecemos su pronta revisión y respuesta.

Cordialmente,

Juan Esteban Silva
Abogado
BTL Legal Group
Avenida 6AN # 25N - 22 Piso 3
Edificio Nexxus XXV
Celular: 323 621 4498
Teléfono (2) 4852303 y 4853993
subrogacion10@btlegalgroup.com
Santiago de Cali - Colombia`)
  const [isLoading, setIsLoading] = useState(false)

  const addEmail = () => {
    if (currentEmail && isValidEmail(currentEmail) && !recipients.includes(currentEmail)) {
      setRecipients([...recipients, currentEmail])
      setCurrentEmail("")
    }
  }

  const removeEmail = (emailToRemove: string) => {
    setRecipients(recipients.filter(email => email !== emailToRemove))
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addEmail()
    }
  }

  const handleSend = async () => {
    if (recipients.length === 0) {
      alert("Por favor, agregue al menos un destinatario")
      return
    }

    if (!nombreEmpresa.trim()) {
      alert("Por favor, ingrese el nombre de la empresa")
      return
    }

    setIsLoading(true)
    try {
      // Reemplazar el placeholder en el mensaje
      const finalMessage = message.replace("{nombreEmpresa}", nombreEmpresa)
      
      await onSend({
        recipients,
        subject,
        message: finalMessage,
        nombreEmpresa
      })
      // Reset form
      setRecipients([])
      setCurrentEmail("")
      setNombreEmpresa("")
      setSubject("RECLAMACION RESPONSABILIDAD CIVIL EXTRACONTRACTUAL")
      setMessage(`Estimados señores

{nombreEmpresa}

Por medio de la presente, adjuntamos el documento de reclamación por responsabilidad civil extracontractual, en el que se expone de manera sumaria los hechos relacionados con el incidente del cual su empresa es presuntamente responsable.

Además, anexamos la documentación relevante como elementos materiales probatorios, incluidas facturas y demás soportes que respaldan nuestra reclamación.

Agradecemos su pronta revisión y respuesta.

Cordialmente,

Juan Esteban Silva
Abogado
BTL Legal Group
Avenida 6AN # 25N - 22 Piso 3
Edificio Nexxus XXV
Celular: 323 621 4498
Teléfono (2) 4852303 y 4853993
subrogacion10@btlegalgroup.com
Santiago de Cali - Colombia`)
      onClose()
    } catch (error) {
      console.error("Error al enviar email:", error)
      alert("Error al enviar el email. Por favor, intente nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Reclamación por Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nombre de la Empresa */}
          <div className="space-y-2">
            <Label htmlFor="nombreEmpresa">Nombre de la Empresa *</Label>
            <Input
              id="nombreEmpresa"
              value={nombreEmpresa}
              onChange={(e) => setNombreEmpresa(e.target.value)}
              placeholder="Ingrese el nombre de la empresa demandada"
              required
            />
          </div>

          {/* Destinatarios */}
          <div className="space-y-3">
            <Label htmlFor="email-input">Destinatarios</Label>
            <div className="flex gap-2">
              <Input
                id="email-input"
                type="email"
                placeholder="Ingrese el email del destinatario"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addEmail}
                disabled={!currentEmail || !isValidEmail(currentEmail)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Lista de destinatarios */}
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md">
                {recipients.map((email, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeEmail(email)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Asunto */}
          <div className="space-y-2">
            <Label htmlFor="subject">Asunto</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto del correo"
            />
          </div>

          {/* Mensaje */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensaje</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
              placeholder="Mensaje del correo"
              rows={12}
              className="resize-none"
            />
          </div>

          {/* Información del adjunto */}
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Adjunto:</strong> Se incluirá automáticamente el documento Word de la reclamación por responsabilidad civil extracontractual con toda la información del caso.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              <strong>Logo:</strong> El logo de BTL Legal Group (PNG) se incluirá automáticamente en el pie del mensaje.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              <strong>Avisos:</strong> Los avisos de confidencialidad en español e inglés se añadirán automáticamente al final del correo.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={recipients.length === 0 || !nombreEmpresa.trim() || isLoading}
            className="bg-[#182A76] hover:bg-[#182A76]/90"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </div>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Reclamación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
