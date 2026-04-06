export interface CameraDevice {
  deviceId: string
  label: string
}

/**
 * Composable for managing webcam access and frame capture.
 * Handles getUserMedia, camera enumeration/switching, track cleanup,
 * and JPEG frame extraction via Canvas.
 */
export const useCamera = () => {
  const videoReference = ref<HTMLVideoElement | null>(null)
  const isReady = ref<boolean>(false)
  const error = ref<string | null>(null)
  const availableCameras = ref<CameraDevice[]>([])
  const currentDeviceId = ref<string | null>(null)

  let stream: MediaStream | null = null

  /**
   * Enumerates all available video input devices.
   * Labels are only populated after camera permission has been granted.
   */
  const enumerateCameras = async (): Promise<void> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      availableCameras.value = devices
        .filter((device) => device.kind === 'videoinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }))
    } catch {
      availableCameras.value = []
    }
  }

  /**
   * Requests camera access and binds the stream to videoRef.
   * Passing a deviceId selects a specific camera; omitting it defaults to
   * the front-facing camera (facingMode: 'user').
   * Sets isReady to true once the video can play.
   *
   * @param deviceId - Optional specific camera device ID to open
   */
  const startCamera = async (deviceId?: string): Promise<void> => {
    error.value = null
    isReady.value = false

    // Release any existing stream before opening a new one
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      stream = null
    }

    try {
      const videoConstraints: MediaTrackConstraints = deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
        : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }

      stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      })

      // Track which device is active; enumerate cameras now that permission is granted
      currentDeviceId.value = stream.getVideoTracks()[0]?.getSettings().deviceId ?? null
      await enumerateCameras()

      if (!videoReference.value) return

      videoReference.value.srcObject = stream
      await new Promise<void>((resolve, reject) => {
        if (!videoReference.value) return reject(new Error('Video element not available'))
        videoReference.value.oncanplay = () => resolve()
        videoReference.value.onerror = () => reject(new Error('Video stream error'))
      })

      await videoReference.value.play()
      isReady.value = true
    } catch (cameraError) {
      const message = cameraError instanceof Error ? cameraError.message : 'Camera access denied'
      error.value = message
      console.error('Camera error:', cameraError)
    }
  }

  /**
   * Switches to a different camera by device ID.
   * Stops the current stream and reopens with the new device.
   *
   * @param deviceId - The target camera's deviceId from availableCameras
   */
  const switchCamera = async (deviceId: string): Promise<void> => {
    await startCamera(deviceId)
  }

  /**
   * Stops all camera tracks and releases the media stream.
   */
  const stopCamera = (): void => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      stream = null
    }

    isReady.value = false
  }

  /**
   * Captures the current video frame as a Canvas element.
   * Returns null if the video element is not ready.
   * Useful when further processing (e.g. compression) is needed before blob conversion.
   */
  const captureCanvas = (): HTMLCanvasElement | null => {
    if (!videoReference.value || !isReady.value) return null

    const canvas = document.createElement('canvas')
    canvas.width = videoReference.value.videoWidth
    canvas.height = videoReference.value.videoHeight

    const context = canvas.getContext('2d')
    if (!context) return null

    context.drawImage(videoReference.value, 0, 0)

    return canvas
  }

  /**
   * Captures the current video frame and returns it as a JPEG Blob.
   * Returns null if the video element is not ready.
   */
  const captureFrame = (): Promise<Blob | null> => {
    const canvas = captureCanvas()
    if (!canvas) return Promise.resolve(null)

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 1.0)
    })
  }

  /**
   * Measures image sharpness of the current video frame using Laplacian variance.
   * A higher value means sharper. Values below ~80 are considered too blurry for
   * reliable face recognition.
   *
   * Algorithm: draw frame to a 100×100 canvas, convert to grayscale, apply the
   * Laplacian kernel [ 0,1,0 / 1,-4,1 / 0,1,0 ], return variance of the result.
   */
  const checkSharpness = (video: HTMLVideoElement): number => {
    const sampleSize = 100
    const canvas = document.createElement('canvas')
    canvas.width = sampleSize
    canvas.height = sampleSize

    const context = canvas.getContext('2d')
    if (!context) return 0

    context.drawImage(video, 0, 0, sampleSize, sampleSize)
    const imageData = context.getImageData(0, 0, sampleSize, sampleSize)
    const pixels = imageData.data

    // Convert to grayscale (luminance)
    const gray: number[] = []

    for (let pixelIndex = 0; pixelIndex < pixels.length; pixelIndex += 4) {
      const red = pixels[pixelIndex] ?? 0
      const green = pixels[pixelIndex + 1] ?? 0
      const blue = pixels[pixelIndex + 2] ?? 0
      gray.push(0.299 * red + 0.587 * green + 0.114 * blue)
    }

    // Apply Laplacian kernel and compute variance of the response
    let laplacianSum = 0
    let laplacianSumSquared = 0
    let count = 0

    for (let row = 1; row < sampleSize - 1; row++) {
      for (let col = 1; col < sampleSize - 1; col++) {
        const center = gray[row * sampleSize + col] ?? 0
        const top = gray[(row - 1) * sampleSize + col] ?? 0
        const bottom = gray[(row + 1) * sampleSize + col] ?? 0
        const left = gray[row * sampleSize + (col - 1)] ?? 0
        const right = gray[row * sampleSize + (col + 1)] ?? 0
        const laplacian = top + bottom + left + right - 4 * center
        laplacianSum += laplacian
        laplacianSumSquared += laplacian * laplacian
        count++
      }
    }

    if (count === 0) return 0
    const mean = laplacianSum / count

    return laplacianSumSquared / count - mean * mean
  }

  return {
    videoRef: videoReference,
    isReady,
    error,
    availableCameras,
    currentDeviceId,
    startCamera,
    stopCamera,
    switchCamera,
    captureCanvas,
    captureFrame,
    checkSharpness,
  }
}
