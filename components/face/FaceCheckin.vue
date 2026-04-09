<template>
  <v-card rounded="xl" elevation="2" max-width="480">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between px-5 pt-5 pb-3">
      <div>
        <div class="text-h6 font-weight-bold">{{ $t('face.checkinTitle') }}</div>
        <div class="text-caption text-medium-emphasis mt-1">{{ $t('face.checkinSubtitle') }}</div>
      </div>
      <v-btn icon variant="text" size="small" @click="emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <v-divider />

    <!-- Camera view -->
    <div class="camera-wrapper" style="position: relative; background: #000; overflow: hidden">
      <video
        ref="videoRef"
        autoplay
        muted
        playsinline
        style="
          width: 100%;
          display: block;
          max-height: 300px;
          object-fit: cover;
          transform: scaleX(-1);
        "
      />

      <!-- Face guide overlay -->
      <div
        class="face-overlay"
        style="
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        "
      >
        <div
          class="face-frame"
          :class="{
            'face-frame--ready': cameraIsReady && !isFaceDetected,
            'face-frame--detected': isFaceDetected,
          }"
        />
        <!-- Position hint shown when camera is ready but no face in frame -->
        <div v-if="cameraIsReady && !isFaceDetected && !isProcessing" class="face-hint">
          {{ $t('face.positionHint') }}
        </div>
      </div>

      <!-- Camera switch button — shown only when multiple cameras are available -->
      <div
        v-if="availableCameras.length > 1"
        style="position: absolute; top: 8px; right: 8px; z-index: 2"
      >
        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon
              size="small"
              variant="tonal"
              color="white"
              style="background: rgba(0, 0, 0, 0.4)"
            >
              <v-icon size="18">mdi-camera-switch-outline</v-icon>
            </v-btn>
          </template>
          <v-list density="compact" rounded="lg" min-width="200">
            <v-list-item
              v-for="camera in availableCameras"
              :key="camera.deviceId"
              :active="camera.deviceId === currentDeviceId"
              active-color="primary"
              @click="switchCamera(camera.deviceId)"
            >
              <v-list-item-title class="text-body-2">{{ camera.label }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>

      <!-- Camera not ready -->
      <div
        v-if="!cameraIsReady"
        style="
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
        "
      >
        <v-progress-circular v-if="!cameraError" indeterminate color="white" size="40" />
        <div v-else class="text-white text-center pa-4">
          <v-icon size="32" class="mb-2">mdi-camera-off</v-icon>
          <div class="text-body-2">{{ cameraError }}</div>
        </div>
      </div>
    </div>

    <!-- Liveness prompt -->
    <v-expand-transition>
      <div v-if="currentChallenge" class="liveness-banner px-5 py-3 text-center">
        <v-chip color="primary" variant="tonal" prepend-icon="mdi-eye-outline" class="mb-2">
          {{ $t(`face.liveness.${currentChallenge}`) }}
        </v-chip>
        <v-progress-linear :model-value="livenessProgress" color="primary" height="3" rounded />
      </div>
    </v-expand-transition>

    <!-- Success result card -->
    <v-expand-transition>
      <div v-if="checkinResult" class="pa-4">
        <v-alert
          :type="checkinResult.type === 'clock_in' ? 'success' : 'info'"
          rounded="lg"
          density="comfortable"
        >
          <div class="text-subtitle-2 font-weight-bold">{{ checkinResult.employeeName }}</div>
          <div class="text-body-2">
            {{ checkinResult.type === 'clock_in' ? $t('face.clockedIn') : $t('face.clockedOut') }}
            · {{ $t('face.confidence') }}: {{ Math.round(checkinResult.confidence * 100) }}%
          </div>
        </v-alert>
      </div>
    </v-expand-transition>

    <!-- Error message -->
    <v-expand-transition>
      <div v-if="errorMessage" class="px-4 pb-2">
        <v-alert
          type="error"
          rounded="lg"
          density="compact"
          closable
          @click:close="errorMessage = null"
        >
          {{ errorMessage }}
        </v-alert>
      </div>
    </v-expand-transition>

    <!-- Models loading hint -->
    <div v-if="!faceApiIsLoaded" class="text-center px-5 pb-2">
      <v-progress-linear indeterminate color="primary" height="2" class="mb-1" />
      <span class="text-caption text-medium-emphasis">{{ $t('face.loadingModels') }}</span>
    </div>

    <!-- Actions -->
    <v-card-actions class="px-5 pb-5 pt-2">
      <v-btn
        color="primary"
        variant="flat"
        rounded="lg"
        prepend-icon="mdi-face-recognition"
        block
        size="large"
        :loading="isProcessing"
        :disabled="!cameraIsReady || !faceApiIsLoaded || !!checkinResult"
        @click="handleCheckin"
      >
        {{ $t('face.checkinButton') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
/** START IMPORT */
import FaceAttendanceService from '@/services/FaceAttendanceService'
import { useCamera } from '@/composables/useCamera'
import { useFaceApi } from '@/composables/useFaceApi'
import { useLiveness } from '@/composables/useLiveness'
import { useAudio } from '@/composables/useAudio'
import type { FaceCheckinModel } from '@/interfaces/models/FaceCheckinModel'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
defineOptions({ name: 'FaceCheckin' })
/* END DEFINE */

/** START DEFINE PROPERTY AND EMITS */
const emit = defineEmits<{
  success: [result: FaceCheckinModel]
  error: [message: string]
  close: []
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { t, locale } = useI18n()
const isProcessing = ref<boolean>(false)
const errorMessage = ref<string | null>(null)
const checkinResult = ref<FaceCheckinModel | null>(null)

const {
  videoRef,
  isReady: cameraIsReady,
  error: cameraError,
  availableCameras,
  currentDeviceId,
  startCamera,
  stopCamera,
  switchCamera,
  captureFrame,
} = useCamera()
const { isLoaded: faceApiIsLoaded, loadModels, detectFace, detectFacePresence } = useFaceApi()
const { currentChallenge, livenessProgress, isPassed, runChallenge } = useLiveness()
const { playPrompt, playSuccess, speak, stopSpeech } = useAudio()

const isFaceDetected = ref<boolean>(false)
let faceTrackingTimer: ReturnType<typeof setInterval> | null = null
/* END DEFINE STATE */

/** START DEFINE METHOD */
const startFaceTracking = () => {
  if (faceTrackingTimer) return
  faceTrackingTimer = setInterval(async () => {
    if (!videoRef.value || !cameraIsReady.value || isProcessing.value) return
    isFaceDetected.value = await detectFacePresence(videoRef.value)
  }, 500)
}

const stopFaceTracking = () => {
  if (faceTrackingTimer) {
    clearInterval(faceTrackingTimer)
    faceTrackingTimer = null
  }

  isFaceDetected.value = false
}

const getLocation = (): Promise<string | undefined> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(undefined)
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(`${position.coords.latitude},${position.coords.longitude}`),
      () => resolve(undefined),
      { timeout: 3000 },
    )
  })
}

const handleCheckin = async () => {
  errorMessage.value = null
  checkinResult.value = null
  isProcessing.value = true

  try {
    // Step 1: liveness check
    if (!videoRef.value) throw new Error('Camera not available')

    try {
      await runChallenge(videoRef.value)
    } catch {
      errorMessage.value = t('face.liveness.timeout')
      emit('error', errorMessage.value)

      return
    }

    // Step 2: detect face
    const descriptor = await detectFace(videoRef.value!)

    if (!descriptor) {
      errorMessage.value = t('face.error.notDetected')
      emit('error', errorMessage.value)

      return
    }

    // Step 3: capture frame
    const imageBlob = await captureFrame()
    if (!imageBlob) throw new Error('Failed to capture frame')

    // Step 4: get location (optional)
    const location = await getLocation()

    // Step 5: call API
    const result = await FaceAttendanceService.faceCheckin(
      descriptor,
      imageBlob,
      location ?? undefined,
    )
    checkinResult.value = result
    emit('success', result)

    // Step 6: auto-reset after 3 seconds
    setTimeout(() => {
      checkinResult.value = null
    }, 3000)
  } catch (error) {
    const fetchError = error as {
      data?: { message?: string }
      status?: number
      statusCode?: number
    }
    const apiMessage = fetchError.data?.message ?? ''
    const status = fetchError.status ?? fetchError.statusCode ?? 0

    if (status === 403) {
      if (apiMessage.includes('yourself')) {
        errorMessage.value = t('face.error.wrongUser')
      } else if (apiMessage.includes('No IP whitelist')) {
        errorMessage.value = t('face.error.noIpConfig')
      } else {
        errorMessage.value = t('face.error.ipRestricted')
      }
    } else if (status === 400 || apiMessage.toLowerCase().includes('not recognized')) {
      errorMessage.value = t('face.error.notRecognized')
    } else {
      errorMessage.value = t('face.error.connectionError')
    }

    emit('error', errorMessage.value)
    console.error('Face checkin error:', error)
  } finally {
    isProcessing.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch([cameraIsReady, faceApiIsLoaded], ([ready, loaded]) => {
  if (ready && loaded) startFaceTracking()
  else stopFaceTracking()
})

watch(currentChallenge, (challenge) => {
  if (challenge) {
    playPrompt()
    speak(t(`face.liveness.${challenge}`), locale.value)
  }
})

watch(isPassed, (passed) => {
  if (passed) playSuccess()
})
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(async () => {
  await Promise.all([loadModels(), startCamera()])
})

onUnmounted(() => {
  stopFaceTracking()
  stopCamera()
  stopSpeech()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.liveness-banner {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.face-frame {
  width: 180px;
  height: 220px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4);
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.face-frame--ready {
  border-color: rgba(255, 193, 7, 0.9);
}

.face-frame--detected {
  border-color: rgb(var(--v-theme-success));
  border-width: 3px;
  box-shadow:
    0 0 0 9999px rgba(0, 0, 0, 0.35),
    0 0 18px rgba(var(--v-theme-success), 0.6);
  animation: face-pulse 2s ease-in-out infinite;
}

@keyframes face-pulse {
  0%,
  100% {
    box-shadow:
      0 0 0 9999px rgba(0, 0, 0, 0.35),
      0 0 10px rgba(var(--v-theme-success), 0.4);
  }
  50% {
    box-shadow:
      0 0 0 9999px rgba(0, 0, 0, 0.35),
      0 0 24px rgba(var(--v-theme-success), 0.8);
  }
}

.face-hint {
  position: absolute;
  bottom: 14px;
  left: 0;
  right: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 500;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  pointer-events: none;
}
</style>
