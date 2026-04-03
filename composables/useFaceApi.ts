/**
 * Composable for loading face-api.js models and running face detection + recognition.
 * Uses dynamic import to avoid SSR errors — face-api.js requires browser APIs.
 * Models are loaded once from /models/ and cached via the isLoaded flag.
 */
export const useFaceApi = () => {
  const isLoaded = ref<boolean>(false)

  /**
   * Loads the three required face-api.js models from /models/.
   * Safe to call multiple times — skips loading if already done.
   * Uses dynamic import so this only runs in the browser.
   */
  const loadModels = async (): Promise<void> => {
    if (isLoaded.value) return

    const faceapi = await import('face-api.js')

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    ])

    isLoaded.value = true
  }

  /**
   * Detects a face in the given video element and returns its 128-element descriptor.
   * Returns null if no face is detected or models are not loaded yet.
   *
   * @param video - Live HTMLVideoElement to detect from
   */
  const detectFace = async (video: HTMLVideoElement): Promise<Float32Array | null> => {
    if (!isLoaded.value) return null

    const faceapi = await import('face-api.js')

    // Try progressively more lenient settings before giving up
    const attempts = [
      new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 }),
      new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.2 }),
      new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.15 }),
    ]

    for (const options of attempts) {
      const detectionResult = await faceapi
        .detectSingleFace(video, options)
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (detectionResult) return detectionResult.descriptor
    }

    return null
  }

  /**
   * Lightweight face presence check — returns true if any face is visible.
   * Does NOT compute landmarks or descriptor, so it is significantly faster
   * than detectFace and safe to call in a polling loop (every ~500 ms).
   *
   * @param video - Live HTMLVideoElement from the webcam
   */
  const detectFacePresence = async (video: HTMLVideoElement): Promise<boolean> => {
    if (!isLoaded.value) return false

    try {
      const faceapi = await import('face-api.js')
      const result = await faceapi.detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.35 }),
      )

      return !!result
    } catch {
      return false
    }
  }

  return { isLoaded, loadModels, detectFace, detectFacePresence }
}
