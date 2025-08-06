"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Mail, Plus, Video, Upload, Trash2, Play } from "lucide-react"

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
  videos: File[]
}

interface VideoFile {
  file: File
  name: string
  size: string
  duration?: string
  preview?: string
}

export function EmailModal({ isOpen, onClose, onSend, caseType }: EmailModalProps) {
  const [recipients, setRecipients] = useState<string[]>([])
  const [currentEmail, setCurrentEmail] = useState("")
  const [nombreEmpresa, setNombreEmpresa] = useState("")
  const [videos, setVideos] = useState<VideoFile[]>([])
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
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const videoInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getVideoDuration = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        const duration = video.duration
        const minutes = Math.floor(duration / 60)
        const seconds = Math.floor(duration % 60)
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`)
      }
      video.onerror = () => resolve('--:--')
      video.src = URL.createObjectURL(file)
    })
  }

  const createVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      video.onloadedmetadata = () => {
        canvas.width = 160
        canvas.height = 90
        video.currentTime = 1 // Capturar en el segundo 1
      }
      
      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          resolve(canvas.toDataURL('image/jpeg', 0.5))
        }
      }
      
      video.onerror = () => resolve('')
      video.src = URL.createObjectURL(file)
    })
  }

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const videoFiles = files.filter(file => file.type.startsWith('video/'))
    
    if (videoFiles.length === 0) {
      alert("Por favor, seleccione solo archivos de video")
      return
    }

    // Validar tamaño máximo por video (100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    const oversizedFiles = videoFiles.filter(file => file.size > maxSize)
    
    if (oversizedFiles.length > 0) {
      alert(`Los siguientes videos exceden el límite de 100MB:\n${oversizedFiles.map(f => f.name).join('\n')}`)
      return
    }

    for (const file of videoFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
        
        const duration = await getVideoDuration(file)
        const preview = await createVideoThumbnail(file)
        
        const videoFile: VideoFile = {
          file,
          name: file.name,
          size: formatFileSize(file.size),
          duration,
          preview
        }
        
        setVideos(prev => [...prev, videoFile])
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
        
        // Limpiar el progreso después de un momento
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[file.name]
            return newProgress
          })
        }, 1000)
        
      } catch (error) {
        console.error(`Error procesando video ${file.name}:`, error)
        alert(`Error procesando el video: ${file.name}`)
      }
    }
    
    // Limpiar el input
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index))
  }

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
        nombreEmpresa,
        videos: videos.map(v => v.file)
      })
      
      // Reset form
      setRecipients([])
      setCurrentEmail("")
      setNombreEmpresa("")
      setVideos([])
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

  const getTotalVideoSize = () => {
    return videos.reduce((total, video) => total + video.file.size, 0)
  }

  const getTotalSizeFormatted = () => {
    return formatFileSize(getTotalVideoSize())
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
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

          {/* Sección de Videos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Videos de Evidencia
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Agregar Videos
              </Button>
            </div>

            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoUpload}
              className="hidden"
            />

            {/* Lista de videos subidos */}
            {videos.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Total: {videos.length} video(s) - {getTotalSizeFormatted()}
                </div>
                
                <div className="grid gap-3 max-h-48 overflow-y-auto">
                  {videos.map((video, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {/* Thumbnail del video */}
                      <div className="relative w-20 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        {video.preview ? (
                          <img
                            src={video.preview}
                            alt="Video preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 rounded-tl">
                          {video.duration}
                        </div>
                      </div>

                      {/* Información del video */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {video.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {video.size}
                        </p>
                        
                        {/* Barra de progreso */}
                        {uploadProgress[video.name] !== undefined && uploadProgress[video.name] < 100 && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress[video.name]}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Botón eliminar */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVideo(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Información sobre límites */}
            <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
              <strong>Nota:</strong> Tamaño máximo por video: 100MB. Los videos se incluirán como archivos adjuntos en el correo electrónico.
            </div>
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

          {/* Información del adjunto actualizada */}
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Documento Principal:</strong> Se incluirá automáticamente el documento Word de la reclamación por responsabilidad civil extracontractual con toda la información del caso.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              <strong>Anexos:</strong> Los anexos del step 2 (imágenes, documentos) se incluirán como archivos adjuntos separados en el correo.
            </p>
            {videos.length > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                <strong>Videos:</strong> {videos.length} video(s) de evidencia se incluirán como archivos adjuntos ({getTotalSizeFormatted()}).
              </p>
            )}
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
                {videos.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-white text-[#182A76]">
                    +{videos.length} video(s)
                  </Badge>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
