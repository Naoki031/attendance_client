<template>
  <v-dialog :model-value="dialog" max-width="400" persistent @keydown.esc="close">
    <v-card rounded="xl" elevation="2">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between px-5 pt-5 pb-3">
        <div>
          <div class="text-h6 font-weight-bold">{{ $t('qrScanner.title') }}</div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ $t('qrScanner.subtitle') }}
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider></v-divider>

      <!-- Loading state -->
      <div
        v-if="scanState === 'loading'"
        class="d-flex flex-column align-center justify-center py-10 px-6"
      >
        <v-progress-circular
          indeterminate
          color="primary"
          size="48"
          class="mb-4"
        ></v-progress-circular>
        <div class="text-body-2 text-medium-emphasis">{{ $t('qrScanner.requesting') }}</div>
      </div>

      <!-- Active camera state -->
      <div v-else-if="scanState === 'active'" class="camera-wrapper">
        <video ref="videoElement" class="camera-video" autoplay playsinline muted></video>
        <canvas ref="canvasElement" class="camera-canvas"></canvas>
        <!-- Scanner overlay -->
        <div class="scanner-overlay">
          <div class="scanner-frame"></div>
        </div>
        <div class="text-caption text-medium-emphasis text-center pa-3">
          {{ $t('qrScanner.alignFrame') }}
        </div>
      </div>

      <!-- Denied state -->
      <div v-else-if="scanState === 'denied'" class="text-center py-8 px-6">
        <v-icon size="56" color="error" class="mb-4">mdi-camera-off</v-icon>
        <div class="text-body-1 font-weight-medium mb-2">{{ $t('qrScanner.accessBlocked') }}</div>
        <div class="text-body-2 text-medium-emphasis mb-5">
          {{ $t('qrScanner.accessDenied') }}
        </div>
        <div class="d-flex flex-column ga-2">
          <v-btn
            color="primary"
            variant="tonal"
            rounded="lg"
            prepend-icon="mdi-refresh"
            @click="retryCamera"
          >
            {{ $t('qrScanner.tryAgain') }}
          </v-btn>
          <v-btn variant="text" rounded="lg" @click="close">{{ $t('common.cancel') }}</v-btn>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="scanState === 'error'" class="text-center py-8 px-6">
        <v-icon size="56" color="warning" class="mb-4">mdi-alert-circle-outline</v-icon>
        <div class="text-body-1 font-weight-medium mb-2">{{ $t('qrScanner.cameraError') }}</div>
        <div class="text-body-2 text-medium-emphasis mb-5">{{ errorMessage }}</div>
        <div class="d-flex flex-column ga-2">
          <v-btn
            color="primary"
            variant="tonal"
            rounded="lg"
            prepend-icon="mdi-refresh"
            @click="retryCamera"
          >
            {{ $t('qrScanner.tryAgain') }}
          </v-btn>
          <v-btn variant="text" rounded="lg" @click="close">{{ $t('common.cancel') }}</v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import jsQR from 'jsqr'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  dialog: {
    type: Boolean,
    required: true,
  },
})
const emit = defineEmits<{
  (event: 'scanned', url: string): void
  (event: 'close'): void
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
import type { ScanState } from '@/types/qr/ScanState'

const scanState = ref<ScanState>('loading')
const errorMessage = ref<string>('')
const videoElement = ref<HTMLVideoElement | null>(null)
const canvasElement = ref<HTMLCanvasElement | null>(null)
let stream: MediaStream | null = null
let animationFrameId: number | null = null
/* END DEFINE STATE */

/** START DEFINE METHOD */
const stopCamera = () => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
    stream = null
  }
}

const close = () => {
  stopCamera()
  emit('close')
}

const scanFrame = () => {
  const video = videoElement.value
  const canvas = canvasElement.value
  if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
    animationFrameId = requestAnimationFrame(scanFrame)
    return
  }

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  const context = canvas.getContext('2d')
  if (!context) {
    animationFrameId = requestAnimationFrame(scanFrame)
    return
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  })

  if (result?.data) {
    stopCamera()
    emit('scanned', result.data)
    return
  }

  animationFrameId = requestAnimationFrame(scanFrame)
}

const startCamera = async () => {
  scanState.value = 'loading'
  errorMessage.value = ''

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    })

    scanState.value = 'active'
    await nextTick()

    if (videoElement.value) {
      videoElement.value.srcObject = stream
      videoElement.value.play()
      animationFrameId = requestAnimationFrame(scanFrame)
    }
  } catch (error: unknown) {
    const domError = error as { name?: string; message?: string }
    if (domError?.name === 'NotAllowedError' || domError?.name === 'PermissionDeniedError') {
      scanState.value = 'denied'
    } else {
      scanState.value = 'error'
      errorMessage.value = domError?.message ?? 'Unable to access camera'
    }
  }
}

const retryCamera = () => {
  stopCamera()
  startCamera()
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (opened) => {
    if (opened) {
      startCamera()
    } else {
      stopCamera()
    }
  },
  { immediate: true },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onUnmounted(() => {
  stopCamera()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.camera-wrapper {
  position: relative;
  background: #000;
  overflow: hidden;
}

.camera-video {
  width: 100%;
  display: block;
  max-height: 320px;
  object-fit: cover;
}

.camera-canvas {
  display: none;
}

.scanner-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.scanner-frame {
  width: 200px;
  height: 200px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
}
</style>
