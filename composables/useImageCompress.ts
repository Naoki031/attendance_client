const HEIC_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
])

const CONVERT_TO_JPEG_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
  'image/bmp',
  'image/gif',
  'image/webp',
])

// Never scale beyond this on either side — 4K is more than enough for photo viewing
const MAX_DIMENSION = 4096

// JPEG below this is visibly blocky — never go lower
const MIN_QUALITY = 0.55

export const useImageCompress = () => {
  const DEFAULT_TARGET_BYTES = 3 * 1024 * 1024
  const PHOTO_TARGET_BYTES = 5 * 1024 * 1024

  // ── EXIF orientation ───────────────────────────────────────────
  // Reads the orientation tag directly from JPEG bytes without an external library.
  // Returns 1 (normal) for non-JPEG files or when parsing fails.

  async function readExifOrientation(file: File): Promise<number> {
    if (file.type !== 'image/jpeg') return 1

    try {
      const buffer = await file.slice(0, 65536).arrayBuffer()
      const view = new DataView(buffer)

      if (view.getUint16(0) !== 0xffd8) return 1

      let offset = 2
      while (offset + 4 < view.byteLength) {
        const marker = view.getUint16(offset)
        offset += 2

        if (marker === 0xffe1) {
          // APP1 — check "Exif\0\0" signature
          if (view.getUint32(offset + 2) !== 0x45786966) return 1

          const tiffStart = offset + 8
          const littleEndian = view.getUint16(tiffStart) === 0x4949
          const ifd0 = tiffStart + view.getUint32(tiffStart + 4, littleEndian)
          const numberEntries = view.getUint16(ifd0, littleEndian)

          for (let index = 0; index < numberEntries; index++) {
            const entryOffset = ifd0 + 2 + index * 12
            if (view.getUint16(entryOffset, littleEndian) === 0x0112) {
              return view.getUint16(entryOffset + 8, littleEndian)
            }
          }
          return 1
        }

        if (marker === 0xffda || marker < 0xff00) break
        offset += view.getUint16(offset)
      }
    } catch {
      // silently fall through
    }
    return 1
  }

  // Apply the 2D transform matrix that maps EXIF orientation to upright pixels.
  // bw/bh are the scaled bitmap dimensions (before any axis swap).
  function applyExifTransform(
    context: CanvasRenderingContext2D,
    orientation: number,
    bw: number,
    bh: number,
  ): void {
    switch (orientation) {
      case 2:
        context.transform(-1, 0, 0, 1, bw, 0)
        break
      case 3:
        context.transform(-1, 0, 0, -1, bw, bh)
        break
      case 4:
        context.transform(1, 0, 0, -1, 0, bh)
        break
      case 5:
        context.transform(0, 1, 1, 0, 0, 0)
        break
      case 6:
        // Rotate 90° CW (most common: portrait photo taken with phone)
        context.transform(0, 1, -1, 0, bh, 0)
        break
      case 7:
        context.transform(0, -1, -1, 0, bh, bw)
        break
      case 8:
        // Rotate 90° CCW
        context.transform(0, -1, 1, 0, 0, bw)
        break
      default:
        break
    }
  }

  // ── Core: render canvas to JPEG blob ──────────────────────────

  function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        quality,
      )
    })
  }

  // Orientations 5-8 require swapping width/height axes on the canvas.
  function drawBitmapToCanvas(bitmap: ImageBitmap, scale = 1, orientation = 1): HTMLCanvasElement {
    const needsSwap = orientation >= 5 && orientation <= 8
    const bw = Math.round(bitmap.width * scale)
    const bh = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = needsSwap ? bh : bw
    canvas.height = needsSwap ? bw : bh

    const context = canvas.getContext('2d')!
    applyExifTransform(context, orientation, bw, bh)
    context.drawImage(bitmap, 0, 0, bw, bh)
    return canvas
  }

  // ── Binary-search: highest quality under target ────────────────
  // Prioritizes quality — only reduces dimensions when quality floor is hit.

  async function findBestQuality(
    canvas: HTMLCanvasElement,
    targetBytes: number,
    highQuality: number,
  ): Promise<Blob | null> {
    // Fast path: try high quality first
    const firstTry = await canvasToJpeg(canvas, highQuality)
    if (firstTry.size <= targetBytes) return firstTry

    let low = MIN_QUALITY
    let high = highQuality
    let best: Blob | null = null

    // 7 iterations → quality precision ~0.006
    for (let iteration = 0; iteration < 7; iteration++) {
      const mid = (low + high) / 2
      const blob = await canvasToJpeg(canvas, mid)
      if (blob.size <= targetBytes) {
        best = blob
        low = mid // fits — try higher quality
      } else {
        high = mid // still too big — try lower quality
      }
    }

    return best
  }

  async function compressBitmap(
    bitmap: ImageBitmap,
    targetBytes: number,
    orientation = 1,
  ): Promise<Blob | null> {
    const longest = Math.max(bitmap.width, bitmap.height)
    let scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1

    // Phase 1: find best quality at current scale (keep dimensions)
    const canvas = drawBitmapToCanvas(bitmap, scale, orientation)
    const result = await findBestQuality(canvas, targetBytes, 0.92)
    if (result) return result

    // Phase 2: quality floor reached — compute minimum scale needed
    // bytes ∝ area (pixels²), so scale ∝ sqrt(targetBytes / actualBytes)
    const oversizeBlob = await canvasToJpeg(canvas, MIN_QUALITY)
    const sizeRatio = oversizeBlob.size / targetBytes
    scale = (scale / Math.sqrt(sizeRatio)) * 0.95 // 5% safety margin

    const reducedCanvas = drawBitmapToCanvas(bitmap, scale, orientation)
    return findBestQuality(reducedCanvas, targetBytes, 0.88)
  }

  // ── Public API ─────────────────────────────────────────────────

  /**
   * Compress a pre-rendered canvas to JPEG under targetSizeBytes.
   * Kept for backward compatibility (used by AvatarUpload).
   */
  const compress = async (
    canvas: HTMLCanvasElement,
    targetSizeBytes: number = DEFAULT_TARGET_BYTES,
  ): Promise<Blob> => {
    const result = await findBestQuality(canvas, targetSizeBytes, 0.92)
    return result ?? (await canvasToJpeg(canvas, MIN_QUALITY))
  }

  /**
   * Normalize a raw image File to JPEG, compressing to under 5MB.
   * - Reads EXIF orientation from JPEG files and bakes correct rotation into pixels.
   * - Handles HEIC/HEIF, BMP, GIF, WebP → JPEG conversion automatically.
   */
  async function normalizeToJpeg(file: File): Promise<File> {
    if (!file.type.startsWith('image/')) return file

    let sourceBlob: Blob = file
    let orientation = 1

    if (HEIC_TYPES.has(file.type)) {
      try {
        const heic2any = (await import('heic2any')).default
        const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
        sourceBlob = Array.isArray(converted) ? converted[0] : converted
        // heic2any handles HEIC orientation internally — no manual fix needed
      } catch {
        return file
      }
    } else if (file.type === 'image/jpeg') {
      orientation = await readExifOrientation(file)
    }

    const needsConvert = CONVERT_TO_JPEG_TYPES.has(file.type)
    const tooBig = file.size > PHOTO_TARGET_BYTES
    const needsOrientationFix = orientation !== 1

    // Skip re-encoding if there's nothing to change
    if (!needsConvert && !tooBig && !needsOrientationFix) return file

    let bitmap: ImageBitmap | null = null
    try {
      // 'none' tells the browser not to auto-rotate — we apply the transform ourselves.
      // This prevents double-rotation in browsers that respect EXIF in createImageBitmap.
      const options: ImageBitmapOptions =
        file.type === 'image/jpeg' ? { imageOrientation: 'none' } : {}
      bitmap = await createImageBitmap(sourceBlob, options)
      const blob = await compressBitmap(bitmap, PHOTO_TARGET_BYTES, orientation)
      if (!blob) return file
      const baseName = file.name.replace(/\.[^.]+$/, '')
      return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
    } catch {
      return file
    } finally {
      bitmap?.close()
    }
  }

  /**
   * Build instant preview URL for non-HEIC images (O(1), no data copy).
   */
  function buildInstantPreview(file: File): string {
    if (!file.type.startsWith('image/') || HEIC_TYPES.has(file.type)) return ''
    return URL.createObjectURL(file)
  }

  /**
   * Convert HEIC file to JPEG preview URL (async, browser can't render HEIC natively).
   */
  async function buildHeicPreview(file: File): Promise<string> {
    try {
      const heic2any = (await import('heic2any')).default
      const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.6 })
      const converted = Array.isArray(blob) ? blob[0] : blob
      return URL.createObjectURL(converted as Blob)
    } catch {
      return ''
    }
  }

  function isHeic(file: File): boolean {
    return HEIC_TYPES.has(file.type)
  }

  return {
    compress,
    normalizeToJpeg,
    buildInstantPreview,
    buildHeicPreview,
    isHeic,
  }
}
