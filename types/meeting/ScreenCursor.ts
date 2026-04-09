/** Normalized (0–1) cursor position of a remote participant on the shared screen. */
export interface CursorPosition {
  userId: number
  /** Normalized X (0–1, relative to screen share area) */
  x: number
  /** Normalized Y (0–1, relative to screen share area) */
  y: number
}

/** A persistent click-marker placed by a participant on the shared screen. */
export interface ScreenMarker {
  id: string
  userId: number
  /** Normalized X (0–1) */
  x: number
  /** Normalized Y (0–1) */
  y: number
  color: string
  timestamp: number
}
