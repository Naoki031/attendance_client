/**
 * Composable for capturing the current screen using the Screen Capture API.
 * Returns a base64 PNG data URL of the captured frame.
 */
export const useScreenCapture = () => {
  const capturedImage = ref<string>('')
  const isCapturing = ref(false)

  const capture = async (): Promise<void> => {
    capturedImage.value = ''
    isCapturing.value = true

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
        systemAudio: 'exclude',
      } as DisplayMediaStreamOptions)
      const track = stream.getVideoTracks()[0]
      if (!track) return
      await new Promise((resolve) => setTimeout(resolve, 300))
      const imageCapture = new ImageCapture(track)
      const bitmap = await (
        imageCapture as unknown as { grabFrame: () => Promise<ImageBitmap> }
      ).grabFrame()
      track.stop()
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0)
      capturedImage.value = canvas.toDataURL('image/png')
    } catch (error) {
      if ((error as DOMException).name === 'NotAllowedError') return
      console.error('Failed to capture screen:', error)
    } finally {
      isCapturing.value = false
    }
  }

  return { capturedImage, isCapturing, capture }
}
