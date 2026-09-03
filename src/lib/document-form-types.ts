/**
 * Tipos compartidos por las rutas API que arman el FormData multipart para
 * generar el documento (download-word, send-email). Reflejan la forma en
 * que estos handlers extraen imágenes, videos y hechos de un `FormData`
 * crudo antes de pasarlos al generador de documentos.
 */

export interface ExtractedImage {
  data: string
  name: string
  width: number
  height: number
  index: number
  mimeType: string
}

export interface ImageMetadataEntry {
  id?: unknown
  name?: string
  width?: number
  height?: number
}

export interface ExtractedVideo {
  file: File
  name: string
  size: number
  type: string
  index: number
}

export interface VideoMetadataEntry {
  id?: unknown
  name?: string
}

export interface HechoInput {
  id: string
  descripcionHecho: string
  fotoHecho?: { data: string; name: string; width: number; height: number } | null
}
