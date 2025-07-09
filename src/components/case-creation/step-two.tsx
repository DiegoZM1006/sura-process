"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { X, Upload, Image as ImageIcon } from "lucide-react"

interface StepTwoProps {
  onNext: () => void
  onPrev: () => void
  currentStep: number
  isStepComplete: () => boolean
}

interface UploadedImage {
  id: string
  file: File
  url: string
  name: string
  size: number
}

export function StepTwo({ onNext, onPrev, currentStep, isStepComplete }: StepTwoProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return

    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} no es una imagen válida`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`${file.name} es demasiado grande. Máximo 10MB`)
        return false
      }
      return true
    })

    validFiles.forEach(file => {
      const id = Date.now() + Math.random().toString(36).substr(2, 9)
      const url = URL.createObjectURL(file)
      
      const newImage: UploadedImage = {
        id,
        file,
        url,
        name: file.name,
        size: file.size
      }

      setUploadedImages(prev => [...prev, newImage])
    })
  }

  const removeImage = (id: string) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === id)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url)
      }
      return prev.filter(img => img.id !== id)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleImageUpload(e.dataTransfer.files)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isComplete = () => uploadedImages.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anexos - Subir Imágenes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zona de subida */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">
            Imágenes del caso <span className="text-red-500">*</span>
          </Label>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-[#182A76] bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <Upload className="h-8 w-8 text-gray-600" />
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  Arrastra y suelta tus imágenes aquí
                </p>
                <p className="text-sm text-gray-500">
                  o haz clic para seleccionar archivos
                </p>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Seleccionar Imágenes
              </Button>
              
              <p className="text-xs text-gray-400">
                Formatos soportados: JPG, PNG, GIF, WebP (máx. 10MB por imagen)
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleImageUpload(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Lista de imágenes subidas */}
        {uploadedImages.length > 0 && (
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              Imágenes cargadas ({uploadedImages.length})
            </Label>
            
            <div className="grid grid-cols-2 gap-4">
              {uploadedImages.map((image) => (
                <div
                  key={image.id}
                  className="relative group border rounded-lg overflow-hidden bg-gray-50"
                >
                  <div className="aspect-video relative">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {image.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(image.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="pt-4 flex gap-2">
          <Button
            variant="outline"
            onClick={onPrev}
            className="flex-1"
          >
            Anterior
          </Button>
          <Button
            onClick={onNext}
            disabled={false} // Remover validación para testing
            className="flex-1 bg-[#182A76] hover:bg-[#182A76]/90"
          >
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
