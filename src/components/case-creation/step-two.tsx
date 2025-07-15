"use client"

import { useState } from "react"
import { Upload, X, FileText, Image, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface StepTwoProps {
  formData: any
  updateFormData: (data: any) => void
  onNext: () => void
  onPrev: () => void
}

export function StepTwo({ formData, updateFormData, onNext, onPrev }: StepTwoProps) {
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).filter(file => {
      // Filtrar tipos de archivo permitidos
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/webp']
      return allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024 // 10MB max
    })

    const currentAnexos = formData.anexos || []
    const updatedAnexos = [...currentAnexos, ...newFiles]
    
    updateFormData({ ...formData, anexos: updatedAnexos })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const removeFile = (index: number) => {
    const currentAnexos = formData.anexos || []
    const updatedAnexos = currentAnexos.filter((_: any, i: number) => i !== index)
    updateFormData({ ...formData, anexos: updatedAnexos })
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-500" />
    } else if (file.type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />
    } else {
      return <File className="w-8 h-8 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Anexos y Documentos de Soporte
          </CardTitle>
          <CardDescription>
            Suba los documentos, imágenes y evidencias relacionadas con el caso. 
            Formatos permitidos: JPG, PNG, GIF, PDF, WEBP (máximo 10MB por archivo)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Zona de arrastre y suelta */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragActive(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDragActive(false)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-500 mb-4">
              JPG, PNG, GIF, PDF, WEBP hasta 10MB
            </p>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="pointer-events-none">
              Seleccionar Archivos
            </Button>
          </div>

          {/* Lista de archivos subidos */}
          {formData.anexos && formData.anexos.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">
                Archivos Adjuntos ({formData.anexos.length})
              </h3>
              <div className="space-y-3">
                {formData.anexos.map((file: File, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)} • {file.type}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">💡 Tipos de documentos recomendados:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Fotografías del accidente y daños</li>
              <li>• Informe policial o IPAT</li>
              <li>• Cotizaciones y facturas de reparación</li>
              <li>• Documentos del vehículo (tarjeta de propiedad, SOAT)</li>
              <li>• Declaraciones de testigos</li>
              <li>• Cualquier evidencia adicional relevante</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Botones de navegación */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          Anterior
        </Button>
        <Button onClick={onNext}>
          Siguiente
        </Button>
      </div>
    </div>
  )
}
