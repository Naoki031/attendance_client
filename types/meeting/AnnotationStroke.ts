export interface AnnotationPoint {
  x: number // normalized 0-1 relative to canvas width
  y: number // normalized 0-1 relative to canvas height
}

export interface AnnotationStroke {
  id: string // unique ID for deduplication across clients
  userId: number
  color: string
  lineWidth: number
  points: AnnotationPoint[]
  timestamp: number // Date.now() when the stroke was drawn — used for fade-out timing
}
