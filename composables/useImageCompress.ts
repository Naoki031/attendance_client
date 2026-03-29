/**
 * Composable for client-side image compression using the Canvas API.
 * Uses an adaptive quality algorithm: starts high (0.92) and reduces gradually
 * until the output is under the target size. Falls back to dimension reduction
 * if quality alone is insufficient.
 */
export const useImageCompress = () => {
  const TARGET_SIZE_BYTES = 3 * 1024 * 1024 // 3MB

  const canvasToBlob = (
    canvas: HTMLCanvasElement,
    type: string,
    quality: number,
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
        type,
        quality,
      )
    })
  }

  /**
   * Compresses a canvas to a JPEG Blob under 3MB.
   * Algorithm:
   * 1. Start at quality 0.92, reduce by 0.05 each iteration (min 0.5)
   * 2. If still too large, reduce dimensions by 75% and retry from quality 0.85
   */
  const compress = async (canvas: HTMLCanvasElement): Promise<Blob> => {
    let quality = 0.92
    let blob = await canvasToBlob(canvas, 'image/jpeg', quality)

    while (blob.size > TARGET_SIZE_BYTES && quality > 0.5) {
      quality = Math.round((quality - 0.05) * 100) / 100
      blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    }

    // Fallback: reduce dimensions and retry
    if (blob.size > TARGET_SIZE_BYTES) {
      const scale = 0.75
      const reduced = document.createElement('canvas')
      reduced.width = Math.round(canvas.width * scale)
      reduced.height = Math.round(canvas.height * scale)
      const context = reduced.getContext('2d')!
      context.drawImage(canvas, 0, 0, reduced.width, reduced.height)

      quality = 0.85
      blob = await canvasToBlob(reduced, 'image/jpeg', quality)

      while (blob.size > TARGET_SIZE_BYTES && quality > 0.5) {
        quality = Math.round((quality - 0.05) * 100) / 100
        blob = await canvasToBlob(reduced, 'image/jpeg', quality)
      }
    }

    return blob
  }

  return { compress }
}
