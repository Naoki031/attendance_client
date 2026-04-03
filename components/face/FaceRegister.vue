<template>
  <v-card rounded="xl" elevation="2" max-width="520">
    <!-- Header -->
    <div class="dialog-header px-6 pt-6 pb-4 d-flex align-center justify-space-between">
      <div>
        <div class="text-h6 font-weight-bold text-primary">{{ $t('face.registerTitle') }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">{{ props.employeeName }}</div>
      </div>
      <v-btn icon variant="text" size="small" @click="emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <v-card-text class="px-6 pb-4">
      <!-- Camera preview (hidden after all steps done) -->
      <div
        v-if="!kycDone"
        class="camera-wrapper mb-3"
        style="
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: #000;
          aspect-ratio: 4/3;
        "
      >
        <video
          ref="videoRef"
          autoplay
          muted
          playsinline
          style="
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transform: scaleX(-1);
          "
        />
        <!-- Camera switch button — shown only when multiple cameras are available -->
        <div
          v-if="availableCameras.length > 1 && !isCapturing"
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

        <!-- Face detection status badge -->
        <div
          v-if="cameraIsReady && !isCapturing"
          style="
            position: absolute;
            bottom: 8px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            pointer-events: none;
            z-index: 1;
          "
        >
          <div
            class="text-caption font-weight-medium px-3 py-1 d-flex align-center ga-1"
            style="background: rgba(0, 0, 0, 0.55); border-radius: 999px; color: white"
          >
            <v-icon size="12" :color="isFaceDetected ? 'success' : 'warning'">
              {{ isFaceDetected ? 'mdi-face-recognition' : 'mdi-face-man-outline' }}
            </v-icon>
            {{ isFaceDetected ? $t('face.faceDetected') : $t('face.positionHint') }}
          </div>
        </div>

        <div
          v-if="!cameraIsReady"
          class="d-flex align-center justify-center"
          style="position: absolute; inset: 0; background: rgba(0, 0, 0, 0.7)"
        >
          <v-progress-circular v-if="!cameraError" indeterminate color="white" size="40" />
          <div v-else class="text-white text-center pa-4">
            <v-icon size="32" class="mb-2">mdi-camera-off</v-icon>
            <div class="text-body-2">{{ cameraError }}</div>
          </div>
        </div>
      </div>

      <!-- KYC step indicator -->
      <v-expand-transition>
        <div v-if="isCapturing && kycCurrentStep > 0" class="mb-3">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-caption text-medium-emphasis">
              {{
                $t('face.liveness.kycStep', { current: kycCurrentStep, total: KYC_SEQUENCE.length })
              }}
            </span>
            <div class="d-flex ga-1">
              <v-icon
                v-for="stepIndex in KYC_SEQUENCE.length"
                :key="stepIndex"
                size="14"
                :color="
                  stepIndex < kycCurrentStep
                    ? 'success'
                    : stepIndex === kycCurrentStep
                      ? 'primary'
                      : 'grey'
                "
              >
                {{ stepIndex < kycCurrentStep ? 'mdi-check-circle' : 'mdi-circle-outline' }}
              </v-icon>
            </div>
          </div>
          <v-progress-linear
            :model-value="((kycCurrentStep - 1) / KYC_SEQUENCE.length) * 100"
            color="primary"
            height="4"
            rounded
          />
        </div>
      </v-expand-transition>

      <!-- Liveness prompt for current step -->
      <v-expand-transition>
        <div
          v-if="currentChallenge"
          class="text-center py-3 px-2 mb-3"
          style="background: rgba(var(--v-theme-primary), 0.08); border-radius: 8px"
        >
          <v-icon color="primary" class="mr-1" size="18">mdi-eye-outline</v-icon>
          <span class="text-body-2 font-weight-medium text-primary">
            {{ $t(`face.liveness.${currentChallenge}`) }}
          </span>
          <v-progress-linear
            :model-value="livenessProgress"
            color="primary"
            height="3"
            rounded
            class="mt-2"
          />
        </div>
      </v-expand-transition>

      <!-- Captured photo preview (shown after KYC completes) -->
      <div v-if="capturedUrl" class="mb-4">
        <div class="text-caption text-medium-emphasis mb-1">{{ $t('face.capturedPreview') }}</div>
        <v-img :src="capturedUrl" rounded="lg" height="140" cover />
      </div>

      <!-- Status messages -->
      <v-alert v-if="statusMessage" :type="statusType" rounded="lg" class="mb-4" density="compact">
        {{ statusMessage }}
      </v-alert>

      <!-- Actions -->
      <div class="d-flex gap-3">
        <v-btn
          v-if="!kycDone"
          color="primary"
          variant="flat"
          rounded="lg"
          :loading="isCapturing"
          :disabled="!cameraIsReady || !faceApiIsLoaded"
          prepend-icon="mdi-face-recognition"
          block
          @click="startKyc"
        >
          {{ $t('face.capture') }}
        </v-btn>

        <template v-else>
          <v-btn
            variant="outlined"
            rounded="lg"
            prepend-icon="mdi-refresh"
            :disabled="isRegistering"
            @click="resetCapture"
          >
            {{ $t('common.retry') }}
          </v-btn>
          <v-btn
            color="success"
            variant="flat"
            rounded="lg"
            prepend-icon="mdi-check"
            :loading="isRegistering"
            @click="confirmRegister"
          >
            {{ $t('face.confirmRegister') }}
          </v-btn>
        </template>
      </div>

      <div v-if="!faceApiIsLoaded" class="text-caption text-medium-emphasis mt-2 text-center">
        <v-progress-linear indeterminate color="primary" height="2" class="mb-1" />
        {{ $t('face.loadingModels') }}
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
/** START IMPORT */
import FaceAttendanceService from '@/services/FaceAttendanceService'
import { useCamera } from '@/composables/useCamera'
import { useFaceApi } from '@/composables/useFaceApi'
import { useLiveness } from '@/composables/useLiveness'
import { useAudio } from '@/composables/useAudio'
import type { LivenessChallenge } from '@/composables/useLiveness'
import type { UserModel } from '@/interfaces/models/UserModel'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
defineOptions({ name: 'FaceRegister' })
/* END DEFINE */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  employeeId: {
    type: Number,
    required: true,
  },
  employeeName: {
    type: String,
    required: true,
  },
})

const emit = defineEmits<{
  registered: [user: UserModel]
  close: []
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { t, locale } = useI18n()

/**
 * KYC sequence: captures three descriptors from different angles.
 * Step 1 (smile)       → front-facing + avatar photo capture
 * Step 2 (turn_left)   → left profile descriptor
 * Step 3 (turn_right)  → right profile descriptor
 * The three descriptors are averaged before registration.
 */
const KYC_SEQUENCE: LivenessChallenge[] = ['smile', 'turn_left', 'turn_right']
const KYC_SHARPNESS_THRESHOLD = 80
const KYC_MAX_RETRIES = 2

const isFaceDetected = ref<boolean>(false)
let faceTrackingTimer: ReturnType<typeof setInterval> | null = null

const capturedBlob = ref<Blob | null>(null)
const capturedUrl = ref<string | null>(null)
const capturedDescriptor = ref<Float32Array | null>(null)
const isCapturing = ref<boolean>(false)
const isRegistering = ref<boolean>(false)
const kycCurrentStep = ref<number>(0)
const kycDone = ref<boolean>(false)
const statusMessage = ref<string | null>(null)
const statusType = ref<'success' | 'error' | 'info'>('info')

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
  checkSharpness,
} = useCamera()
const { isLoaded: faceApiIsLoaded, loadModels, detectFace, detectFacePresence } = useFaceApi()
const { currentChallenge, livenessProgress, isPassed, runChallenge } = useLiveness()
const { playPrompt, playSuccess, speak, stopSpeech } = useAudio()
/* END DEFINE STATE */

/** START DEFINE METHOD */
const startFaceTracking = () => {
  if (faceTrackingTimer) return
  faceTrackingTimer = setInterval(async () => {
    if (!videoRef.value || !cameraIsReady.value || isCapturing.value) return
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

const showStatus = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  statusMessage.value = message
  statusType.value = type
}

const resetCapture = () => {
  if (capturedUrl.value) URL.revokeObjectURL(capturedUrl.value)
  capturedBlob.value = null
  capturedUrl.value = null
  capturedDescriptor.value = null
  kycCurrentStep.value = 0
  kycDone.value = false
  statusMessage.value = null
  startCamera()
}

/**
 * Averages multiple 128-dimension face descriptors into one.
 * More angles = more robust matching across lighting and pose variations.
 */
const averageDescriptors = (descriptors: Float32Array[]): Float32Array => {
  const result = new Float32Array(128)
  for (let index = 0; index < 128; index++) {
    result[index] =
      descriptors.reduce((sum, desc) => sum + (desc[index] ?? 0), 0) / descriptors.length
  }
  return result
}

/**
 * Runs the 3-step KYC sequence.
 *
 * Each step:
 *  1. Run liveness challenge (ensures person is live and in correct pose)
 *  2. Detect face → get descriptor
 *  3. Check image sharpness (Laplacian variance) — retry up to KYC_MAX_RETRIES
 *     times if frame is too blurry before failing the step
 *  4. Capture avatar photo on step 1 (front-facing smile)
 *
 * The three descriptors from different angles are averaged before registration.
 */
const startKyc = async () => {
  if (!videoRef.value || !cameraIsReady.value) return

  isCapturing.value = true
  kycDone.value = false
  statusMessage.value = null

  const collectedDescriptors: Float32Array[] = []

  try {
    for (let index = 0; index < KYC_SEQUENCE.length; index++) {
      kycCurrentStep.value = index + 1
      const challenge = KYC_SEQUENCE[index] as LivenessChallenge

      let stepDescriptor: Float32Array | null = null
      let stepBlob: Blob | null = null
      let retries = 0

      while (stepDescriptor === null && retries <= KYC_MAX_RETRIES) {
        // Re-run liveness on retry so the user proves they are still live
        try {
          await runChallenge(videoRef.value, challenge)
        } catch {
          showStatus(t('face.liveness.timeout'), 'error')
          return
        }

        const sharpness = checkSharpness(videoRef.value)
        if (sharpness < KYC_SHARPNESS_THRESHOLD) {
          retries++
          if (retries > KYC_MAX_RETRIES) {
            showStatus(
              'Ảnh quá mờ, không thể nhận diện. Hãy đảm bảo đủ ánh sáng và đứng yên.',
              'error',
            )
            return
          }
          showStatus(`Ảnh mờ, vui lòng thử lại (${retries}/${KYC_MAX_RETRIES})`, 'error')
          // Brief pause so user can read the message before re-running the challenge
          await new Promise((resolve) => setTimeout(resolve, 1500))
          statusMessage.value = null
          continue
        }

        const descriptor = await detectFace(videoRef.value)
        if (!descriptor) {
          retries++
          if (retries > KYC_MAX_RETRIES) {
            showStatus('Không nhận diện được khuôn mặt. Vui lòng thử lại.', 'error')
            return
          }
          statusMessage.value = null
          continue
        }

        stepDescriptor = descriptor

        // Capture the avatar photo only on step 1 (front-facing smile)
        if (index === 0) {
          stepBlob = await captureFrame()
          if (stepBlob) {
            capturedBlob.value = stepBlob
            capturedUrl.value = URL.createObjectURL(stepBlob)
          }
        }
      }

      if (!stepDescriptor) return
      collectedDescriptors.push(stepDescriptor)
    }

    capturedDescriptor.value = averageDescriptors(collectedDescriptors)
    kycDone.value = true
    stopCamera()
    showStatus('Xác minh hoàn tất. Nhấn xác nhận để đăng ký.', 'info')
  } catch (error) {
    console.error('KYC error:', error)
    showStatus('Lỗi trong quá trình xác minh. Vui lòng thử lại.', 'error')
  } finally {
    isCapturing.value = false
    kycCurrentStep.value = 0
  }
}

const confirmRegister = async () => {
  if (!capturedBlob.value || !capturedDescriptor.value) return

  isRegistering.value = true

  try {
    const result = await FaceAttendanceService.registerFace(
      props.employeeId,
      capturedDescriptor.value,
      capturedBlob.value,
    )
    showStatus('Đăng ký khuôn mặt thành công!', 'success')
    emit('registered', result)
  } catch (error) {
    console.error('Face register error:', error)
    showStatus('Đăng ký thất bại, vui lòng thử lại', 'error')
  } finally {
    isRegistering.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch([cameraIsReady, faceApiIsLoaded], ([ready, loaded]) => {
  if (ready && loaded) startFaceTracking()
  else stopFaceTracking()
})

// Play prompt beep + speak instruction when a new challenge starts
watch(currentChallenge, (challenge) => {
  if (challenge) {
    playPrompt()
    speak(t(`face.liveness.${challenge}`), locale.value)
  }
})

// Play success sound when the current challenge is passed
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
  if (capturedUrl.value) URL.revokeObjectURL(capturedUrl.value)
})
/* END DEFINE LIFE CYCLE HOOK */
</script>
