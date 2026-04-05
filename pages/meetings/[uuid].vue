<template>
  <div class="meeting-room">
    <v-theme-provider theme="sandstone-dark" style="display: contents">
      <!-- Loading state while fetching meeting data -->
      <div v-if="step === 'loading'" class="meeting-room__loading">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>

      <!-- Password screen (private meeting, non-host) -->
      <div v-else-if="step === 'password'" class="meeting-room__prejoin">
        <div class="prejoin-card">
          <v-icon icon="mdi-lock" size="48" color="warning" class="mb-3"></v-icon>
          <h2 class="text-h6 font-weight-bold mb-1">{{ meetingTitle }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-4">{{ $t('meetings.passwordRequired') }}</p>

          <v-text-field
            v-model="meetingPassword"
            :label="$t('meetings.enterPassword')"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            variant="outlined"
            density="comfortable"
            class="mb-2"
            autofocus
            @click:append-inner="showPassword = !showPassword"
            @keyup.enter="submitPassword"
          ></v-text-field>

          <v-alert
            v-if="passwordError"
            type="error"
            density="compact"
            class="mb-3"
            style="font-size: 12px"
          >
            {{ passwordError }}
          </v-alert>

          <div class="d-flex gap-3 justify-center mt-2">
            <v-btn variant="text" color="grey" @click="navigateTo('/meetings')">
              {{ $t('common.cancel') }}
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              rounded="lg"
              :loading="isVerifyingPassword"
              @click="submitPassword"
            >
              {{ $t('common.confirm') }}
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Pre-join screen -->
      <div v-else-if="step === 'prejoin'" class="meeting-room__prejoin">
        <div class="prejoin-card">
          <h2 class="text-h6 font-weight-bold mb-1">{{ meetingTitle }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-4">{{ $t('meetings.readyToJoin') }}</p>

          <!-- Camera preview -->
          <div class="prejoin-preview">
            <video
              ref="previewVideoReference"
              autoplay
              muted
              playsinline
              class="prejoin-preview__video"
            ></video>
            <div v-if="!previewCameraOn" class="prejoin-preview__placeholder">
              <v-icon icon="mdi-camera-off" size="48" color="grey"></v-icon>
            </div>
          </div>

          <!-- Mic level indicator -->
          <div class="mic-test mt-3">
            <div class="mic-test__label text-body-2 text-medium-emphasis mb-1">
              <v-icon size="14" class="mr-1">mdi-microphone</v-icon>
              {{ previewMicOn ? $t('meetings.micLevel') : $t('meetings.micOff') }}
            </div>
            <div class="mic-test__bar-bg">
              <div
                class="mic-test__bar"
                :style="{ width: `${micLevel}%` }"
                :class="micLevelClass"
              ></div>
            </div>
          </div>

          <!-- Toggle controls -->
          <div class="d-flex justify-center gap-4 mt-4 mb-4">
            <div class="prejoin-control">
              <v-btn
                :icon="previewMicOn ? 'mdi-microphone' : 'mdi-microphone-off'"
                :color="previewMicOn ? 'success' : 'error'"
                variant="tonal"
                rounded="xl"
                @click="togglePreviewMic"
              ></v-btn>
              <span
                class="prejoin-control__label"
                :class="previewMicOn ? 'prejoin-control__label--on' : 'prejoin-control__label--off'"
              >
                {{ previewMicOn ? $t('meetings.controls.micOn') : $t('meetings.controls.micOff') }}
              </span>
            </div>
            <div class="prejoin-control">
              <v-btn
                :icon="previewCameraOn ? 'mdi-camera' : 'mdi-camera-off'"
                :color="previewCameraOn ? 'success' : 'error'"
                variant="tonal"
                rounded="xl"
                @click="togglePreviewCamera"
              ></v-btn>
              <span
                class="prejoin-control__label"
                :class="
                  previewCameraOn ? 'prejoin-control__label--on' : 'prejoin-control__label--off'
                "
              >
                {{
                  previewCameraOn ? $t('meetings.controls.camOn') : $t('meetings.controls.camOff')
                }}
              </span>
            </div>
            <div class="prejoin-control">
              <v-btn
                :icon="previewSpeakerOn ? 'mdi-volume-high' : 'mdi-volume-mute'"
                :color="previewSpeakerOn ? 'success' : 'error'"
                variant="tonal"
                rounded="xl"
                @click="previewSpeakerOn = !previewSpeakerOn"
              ></v-btn>
              <span
                class="prejoin-control__label"
                :class="
                  previewSpeakerOn ? 'prejoin-control__label--on' : 'prejoin-control__label--off'
                "
              >
                {{
                  previewSpeakerOn
                    ? $t('meetings.controls.speakerOn')
                    : $t('meetings.controls.speakerOff')
                }}
              </span>
            </div>
          </div>

          <!-- Device selectors -->
          <div class="d-flex flex-column ga-2 mb-4">
            <v-select
              v-if="micDevices.length > 1"
              v-model="selectedMicId"
              :items="micDevices"
              item-title="label"
              item-value="deviceId"
              :label="$t('meetings.selectMic')"
              variant="outlined"
              density="compact"
              rounded="lg"
              hide-details
              prepend-inner-icon="mdi-microphone"
              @update:model-value="onMicDeviceChange"
            />
            <v-select
              v-if="speakerDevices.length >= 1"
              v-model="selectedSpeakerId"
              :items="speakerDevices"
              item-title="label"
              item-value="deviceId"
              :label="$t('meetings.selectSpeaker')"
              variant="outlined"
              density="compact"
              rounded="lg"
              hide-details
              prepend-inner-icon="mdi-volume-high"
            />
          </div>

          <v-alert
            v-if="joinError"
            type="error"
            density="compact"
            class="mb-3"
            style="font-size: 12px; word-break: break-all"
          >
            {{ joinError }}
          </v-alert>

          <p class="text-caption text-medium-emphasis mb-3">
            <v-icon size="12" class="mr-1">mdi-headphones</v-icon>
            {{ $t('meetings.headphonesHint') }}
          </p>

          <div class="d-flex gap-3 justify-center">
            <v-btn variant="text" color="grey" @click="navigateTo('/meetings')">
              {{ $t('common.cancel') }}
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              rounded="lg"
              :loading="isJoining"
              @click="confirmJoin"
            >
              {{ $t('meetings.join') }}
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Joining spinner -->
      <div v-else-if="step === 'joining'" class="meeting-room__loading">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="mt-3">{{ $t('meetings.joining') }}</p>
      </div>

      <!-- In meeting -->
      <template v-else-if="step === 'meeting'">
        <div class="meeting-room__main">
          <div class="meeting-room__video">
            <MeetingVideoGrid
              ref="videoGridReference"
              :local-participant="localParticipant"
              :remote-participants="remoteParticipants"
              :has-remote-screen-share="hasRemoteScreenShare"
              :remote-screen-share-tracks="remoteScreenShareTracks"
              :is-mic-enabled="isMicEnabled"
              :is-camera-enabled="isCameraEnabled"
              :is-screen-sharing="isScreenSharing"
              :is-speaker-enabled="isSpeakerEnabled"
              :active-speaker-identities="activeSpeakerIdentities"
              :speaker-audio-levels="speakerAudioLevels"
              :remote-mic-states="remoteMicStates"
              :remote-speaker-states="remoteSpeakerStates"
              :participant-avatar-map="participantAvatarMap"
              :participant-name-map="participantNameMap"
              :local-avatar="localAvatar"
            />
          </div>
          <div
            class="meeting-room__subtitles"
            :class="{ 'meeting-room__subtitles--hidden': !showSubtitles }"
          >
            <MeetingSubtitlePanel
              :subtitles="subtitles"
              :user-language="userLanguage"
              :speaking-language="speakingLanguage"
              :screen-audio-active="screenAudioActive"
              @update:speaking-language="speakingLanguage = $event"
            />
          </div>
        </div>

        <MeetingControlBar
          :is-mic-enabled="isMicEnabled"
          :is-camera-enabled="isCameraEnabled"
          :is-screen-sharing="isScreenSharing"
          :is-speaker-enabled="isSpeakerEnabled"
          :show-subtitles="showSubtitles"
          :tts-enabled="ttsEnabled"
          :has-any-screen-share="isScreenSharing || hasRemoteScreenShare"
          :is-fullscreen="isFullscreen"
          @toggle-mic="toggleMic"
          @toggle-camera="toggleCamera"
          @toggle-speaker="toggleSpeaker"
          @start-screen-share="startScreenShare"
          @stop-screen-share="stopScreenShare"
          @toggle-subtitles="showSubtitles = !showSubtitles"
          @toggle-tts="ttsEnabled = !ttsEnabled"
          @toggle-fullscreen="handleToggleFullscreen"
          @open-settings="settingsDialog = true"
          @leave="leaveMeeting"
        />
      </template>

      <!-- Device settings dialog -->
      <v-dialog v-model="settingsDialog" max-width="400">
        <v-card rounded="xl">
          <v-card-title class="pa-5 pb-3 d-flex align-center ga-2">
            <v-icon color="primary">mdi-cog-outline</v-icon>
            {{ $t('meetings.controls.settings') }}
          </v-card-title>
          <v-card-text class="pt-0 d-flex flex-column ga-4">
            <v-select
              v-model="selectedMicId"
              :items="micDevices"
              item-title="label"
              item-value="deviceId"
              :label="$t('meetings.selectMic')"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              prepend-inner-icon="mdi-microphone"
              @update:model-value="onMicDeviceChange"
            />
            <v-select
              v-model="selectedSpeakerId"
              :items="speakerDevices"
              item-title="label"
              item-value="deviceId"
              :label="$t('meetings.selectSpeaker')"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              prepend-inner-icon="mdi-volume-high"
            />
          </v-card-text>
          <v-card-actions class="pa-4 pt-0">
            <v-spacer />
            <v-btn color="primary" variant="elevated" rounded="lg" @click="settingsDialog = false">
              {{ $t('common.done') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- macOS Screen Recording permission warning -->
      <v-snackbar
        :model-value="!!screenShareWarning"
        color="warning"
        location="top"
        :timeout="-1"
        min-width="360"
      >
        <div class="d-flex align-center ga-2">
          <v-icon>mdi-shield-lock-outline</v-icon>
          <span>{{ screenShareWarning }}</span>
        </div>
        <template #actions>
          <v-btn variant="text" @click="screenShareWarning = ''">{{ $t('common.close') }}</v-btn>
        </template>
      </v-snackbar>
    </v-theme-provider>
  </div>
</template>

<script lang="ts" setup>
// START IMPORT
import { useNuxtApp, useRoute } from '#app'
import { useMeeting } from '@/composables/useMeeting'
import type MeetingVideoGrid from '@/components/meeting/VideoGrid.vue'
import type { MediaDeviceItem } from '@/types/meeting/MediaDeviceItem'
// END IMPORT

definePageMeta({ layout: false })

// START DEFINE STATE
const route = useRoute()
const { $apiFetch } = useNuxtApp()
const { t } = useI18n()
const meetingUuid = ref(route.params.uuid as string)

const step = ref<'loading' | 'password' | 'prejoin' | 'joining' | 'meeting'>('loading')
const isJoining = ref(false)
const joinError = ref('')
const meetingTitle = ref('')
const meetingId = ref(0)
const meetingIsPrivate = ref(false)
const meetingHostId = ref(0)
const localUserId = ref(0)

// Password step state
const meetingPassword = ref('')
const showPassword = ref(false)
const passwordError = ref('')
const isVerifyingPassword = ref(false)

const userLanguage = computed(() => useCookie('language').value ?? 'en')
const showSubtitles = ref(true)
const videoGridReference = ref<InstanceType<typeof MeetingVideoGrid> | null>(null)
const isFullscreen = ref(false)

// Map of String(userId) → avatar URL for all participants (used by VideoGrid placeholder)
const participantAvatarMap = ref<Record<string, string>>({})
// Map of String(userId) → full name — used as reliable fallback when LiveKit participant.name is empty
const participantNameMap = ref<Record<string, string>>({})
// Avatar URL for the local user
const localAvatar = ref('')

// Pre-join preview
const previewVideoReference = ref<HTMLVideoElement | null>(null)
const previewMicOn = ref(false)
const previewCameraOn = ref(false)
const previewSpeakerOn = ref(true)
let previewStream: MediaStream | null = null

// Device selection
const micDevices = ref<MediaDeviceItem[]>([])
const speakerDevices = ref<MediaDeviceItem[]>([])
const selectedMicId = ref<string>('')
const selectedSpeakerId = ref<string>('')
const settingsDialog = ref(false)

// Mic level detector
const micLevel = ref(0)
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let micLevelAnimFrame: number | null = null

const micLevelClass = computed(() => {
  if (micLevel.value < 20) return 'mic-test__bar--low'
  if (micLevel.value < 60) return 'mic-test__bar--mid'
  return 'mic-test__bar--high'
})

const {
  localParticipant,
  remoteParticipants,
  hasRemoteScreenShare,
  remoteScreenShareTracks,
  screenAudioActive,
  speakingLanguage,
  ttsEnabled,
  activeSpeakerIdentities,
  speakerAudioLevels,
  remoteMicStates,
  remoteSpeakerStates,
  isMicEnabled,
  isCameraEnabled,
  isScreenSharing,
  isSpeakerEnabled,
  subtitles,
  connect,
  joinLiveKit,
  toggleMic,
  toggleCamera,
  toggleSpeaker,
  startScreenShare,
  stopScreenShare,
  switchMicDevice,
  setRemoteSpeakerDevice,
  onBlackScreenDetected,
  disconnect,
} = useMeeting(meetingId, meetingUuid)
// END DEFINE STATE

// Apply speaker device change to all active remote audio elements
watch(selectedSpeakerId, (deviceId) => {
  if (deviceId) setRemoteSpeakerDevice(deviceId)
})

// Show a warning snackbar when black frames are detected (macOS Screen Recording permission blocked)
const screenShareWarning = ref('')
onBlackScreenDetected(() => {
  screenShareWarning.value = t('meetings.screenRecordingPermission')
  setTimeout(() => {
    screenShareWarning.value = ''
  }, 12000)
})

// START DEFINE METHOD
function startMicLevelDetection(stream: MediaStream) {
  audioContext = new AudioContext()
  analyser = audioContext.createAnalyser()
  analyser.fftSize = 256
  const source = audioContext.createMediaStreamSource(stream)
  source.connect(analyser)
  const dataArray = new Uint8Array(analyser.frequencyBinCount)

  function tick() {
    analyser!.getByteFrequencyData(dataArray)
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    micLevel.value = Math.min(100, Math.round((average / 128) * 100))
    micLevelAnimFrame = requestAnimationFrame(tick)
  }

  tick()
}

function stopMicLevelDetection() {
  if (micLevelAnimFrame !== null) {
    cancelAnimationFrame(micLevelAnimFrame)
    micLevelAnimFrame = null
  }
  audioContext?.close()
  audioContext = null
  analyser = null
  micLevel.value = 0
}

async function enumerateDevices() {
  try {
    // Must request permission first so labels are populated (not empty strings)
    await navigator.mediaDevices.getUserMedia({ audio: true })
    const devices = await navigator.mediaDevices.enumerateDevices()
    micDevices.value = devices
      .filter((device) => device.kind === 'audioinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `${t('meetings.microphone')} ${index + 1}`,
      }))
    speakerDevices.value = devices
      .filter((device) => device.kind === 'audiooutput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `${t('meetings.speaker')} ${index + 1}`,
      }))
    if (!selectedMicId.value && micDevices.value.length > 0) {
      selectedMicId.value = micDevices.value[0].deviceId
    }
    if (!selectedSpeakerId.value && speakerDevices.value.length > 0) {
      selectedSpeakerId.value = speakerDevices.value[0].deviceId
    }
  } catch {
    // Permission denied — device list stays empty, dropdowns hidden
  }
}

async function startPreviewMic(deviceId?: string) {
  previewStream?.getAudioTracks().forEach((track) => track.stop())
  stopMicLevelDetection()
  try {
    const constraints: MediaStreamConstraints = {
      audio: deviceId ? { deviceId: { exact: deviceId } } : true,
    }
    const micStream = await navigator.mediaDevices.getUserMedia(constraints)
    if (!previewStream) previewStream = new MediaStream()
    micStream.getAudioTracks().forEach((track) => previewStream!.addTrack(track))
    startMicLevelDetection(micStream)
    previewMicOn.value = true
  } catch {
    previewMicOn.value = false
  }
}

async function togglePreviewMic() {
  if (previewMicOn.value) {
    previewStream?.getAudioTracks().forEach((track) => track.stop())
    stopMicLevelDetection()
    previewMicOn.value = false
  } else {
    await startPreviewMic(selectedMicId.value || undefined)
  }
}

async function onMicDeviceChange(deviceId: string) {
  if (step.value === 'meeting') {
    await switchMicDevice(deviceId)
  } else if (previewMicOn.value) {
    await startPreviewMic(deviceId)
  }
}

async function togglePreviewCamera() {
  if (previewCameraOn.value) {
    previewStream?.getVideoTracks().forEach((track) => track.stop())
    if (previewVideoReference.value) previewVideoReference.value.srcObject = null
    previewCameraOn.value = false
  } else {
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (!previewStream) previewStream = new MediaStream()
      camStream.getVideoTracks().forEach((track) => previewStream!.addTrack(track))
      if (previewVideoReference.value) previewVideoReference.value.srcObject = previewStream
      previewCameraOn.value = true
    } catch {
      // Camera permission denied
    }
  }
}

function stopPreviewStream() {
  stopMicLevelDetection()
  previewStream?.getTracks().forEach((track) => track.stop())
  previewStream = null
}

const MEETING_PASSWORDS_KEY = 'meeting_passwords'

function savePassword(uuid: string, password: string) {
  const stored = JSON.parse(localStorage.getItem(MEETING_PASSWORDS_KEY) ?? '{}') as Record<
    string,
    string
  >
  stored[uuid] = password
  localStorage.setItem(MEETING_PASSWORDS_KEY, JSON.stringify(stored))
}

function loadSavedPassword(uuid: string): string | null {
  const stored = JSON.parse(localStorage.getItem(MEETING_PASSWORDS_KEY) ?? '{}') as Record<
    string,
    string
  >
  return stored[uuid] ?? null
}

function clearSavedPassword(uuid: string) {
  const stored = JSON.parse(localStorage.getItem(MEETING_PASSWORDS_KEY) ?? '{}') as Record<
    string,
    string
  >
  const next = Object.fromEntries(Object.entries(stored).filter(([key]) => key !== uuid))
  localStorage.setItem(MEETING_PASSWORDS_KEY, JSON.stringify(next))
}

async function submitPassword() {
  if (!meetingPassword.value.trim()) return

  isVerifyingPassword.value = true
  passwordError.value = ''

  try {
    // Attempt to get a token with the entered password — if wrong, API returns 403
    await ($apiFetch as (url: string, options?: object) => Promise<{ token: string }>)(
      `/meetings/${meetingUuid.value}/token`,
      { method: 'POST', body: { password: meetingPassword.value } },
    )
    // Password valid — save for future visits and proceed to prejoin
    savePassword(meetingUuid.value, meetingPassword.value)
    step.value = 'prejoin'
  } catch {
    passwordError.value = t('meetings.wrongPassword')
  } finally {
    isVerifyingPassword.value = false
  }
}

async function confirmJoin() {
  isJoining.value = true
  joinError.value = ''
  step.value = 'joining'
  stopPreviewStream()

  try {
    const user = await ($apiFetch as (url: string) => Promise<{ id: number; full_name: string }>)(
      '/auth/user',
    )

    await connect(user.id, user.full_name)

    const { token } = await (
      $apiFetch as (url: string, options?: object) => Promise<{ token: string }>
    )(`/meetings/${meetingUuid.value}/token`, {
      method: 'POST',
      body: meetingPassword.value ? { password: meetingPassword.value } : {},
    })

    await joinLiveKit(token, selectedMicId.value || undefined)

    if (previewMicOn.value) await toggleMic()
    if (previewCameraOn.value) await toggleCamera()
    if (!previewSpeakerOn.value) toggleSpeaker()

    step.value = 'meeting'
  } catch (error) {
    joinError.value = error instanceof Error ? error.message : String(error)
    step.value = 'prejoin'
    isJoining.value = false
  }
}

async function leaveMeeting() {
  disconnect()
  navigateTo('/meetings')
}

function handleToggleFullscreen() {
  videoGridReference.value?.toggleFullscreen()
  // isFullscreen is kept in sync via document.fullscreenchange listener
}
// END DEFINE METHOD

// START LIFECYCLE
onMounted(async () => {
  // Sync isFullscreen when user exits via Escape (browser fires fullscreenchange globally)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  try {
    const meeting = await (
      $apiFetch as (url: string) => Promise<{
        title: string
        id: number
        host_id: number
        is_private: boolean
        participants?: Array<{
          user_id: number
          user?: { avatar?: string | null; full_name?: string }
        }>
      }>
    )(`/meetings/${meetingUuid.value}`)
    meetingTitle.value = meeting.title
    meetingId.value = meeting.id
    meetingIsPrivate.value = meeting.is_private
    meetingHostId.value = meeting.host_id

    // Build avatar + name maps: String(userId) → value
    const avatarMap: Record<string, string> = {}
    const nameMap: Record<string, string> = {}
    for (const participant of meeting.participants ?? []) {
      const key = String(participant.user_id)
      if (participant.user?.avatar) avatarMap[key] = participant.user.avatar
      if (participant.user?.full_name) nameMap[key] = participant.user.full_name
    }
    participantAvatarMap.value = avatarMap
    participantNameMap.value = nameMap

    // Fetch local user avatar
    const authUser = await (
      $apiFetch as (url: string) => Promise<{
        id: number
        full_name: string
        avatar?: string | null
      }>
    )('/auth/user')
    localAvatar.value = authUser.avatar ?? ''
    localUserId.value = authUser.id

    // Show password screen for non-host joining a private room; otherwise go to prejoin
    if (meeting.is_private && authUser.id !== meeting.host_id) {
      // Try saved password first — skip password screen if still valid
      const savedPassword = loadSavedPassword(meetingUuid.value)
      if (savedPassword) {
        try {
          await ($apiFetch as (url: string, options?: object) => Promise<{ token: string }>)(
            `/meetings/${meetingUuid.value}/token`,
            { method: 'POST', body: { password: savedPassword } },
          )
          meetingPassword.value = savedPassword
          step.value = 'prejoin'
          enumerateDevices()
        } catch {
          // Saved password is no longer valid (host regenerated) — clear it and ask again
          clearSavedPassword(meetingUuid.value)
          step.value = 'password'
        }
      } else {
        step.value = 'password'
      }
    } else {
      step.value = 'prejoin'
      enumerateDevices()
    }
  } catch {
    navigateTo('/meetings')
  }
})

onUnmounted(() => {
  stopPreviewStream()
  disconnect()
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}
// END LIFECYCLE
</script>

<style scoped>
.meeting-room {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #111;
  overflow: hidden;
}

.meeting-room__prejoin {
  flex: 1;
  display: grid;
  place-items: center;
  overflow-y: auto;
  padding: 16px;
}

.prejoin-card {
  background: #1e1e1e;
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 420px;
  text-align: center;
  /* Always dark background — force white text regardless of app theme */
  color: rgba(255, 255, 255, 0.87);
}

.prejoin-card .text-medium-emphasis {
  color: rgba(255, 255, 255, 0.6);
}

.prejoin-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #2a2a2a;
  border-radius: 12px;
  overflow: hidden;
}

.prejoin-preview__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.prejoin-preview__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mic-test {
  text-align: left;
}

.mic-test__label {
  display: flex;
  align-items: center;
}

.mic-test__bar-bg {
  height: 6px;
  background: rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.mic-test__bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.08s ease-out;
}

.mic-test__bar--low {
  background: rgb(var(--v-theme-success));
}
.mic-test__bar--mid {
  background: rgb(var(--v-theme-warning));
}
.mic-test__bar--high {
  background: rgb(var(--v-theme-error));
}

.meeting-room__loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.meeting-room__main {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.meeting-room__video {
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.meeting-room__subtitles {
  flex: 0 0 clamp(240px, 25%, 320px);
  overflow: hidden;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  transition: flex-basis 0.2s ease;
}

.meeting-room__subtitles--hidden {
  flex: 0 0 0 !important;
  border: none;
}

.prejoin-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.prejoin-control__label {
  font-size: 11px;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.5);
  user-select: none;
}

.prejoin-control__label--on {
  color: #81c784;
}

.prejoin-control__label--off {
  color: #e57373;
}

/* ── Mobile portrait ── */
@media (max-width: 640px) {
  .prejoin-card {
    padding: 20px;
  }

  .meeting-room__main {
    flex-direction: column;
  }

  .meeting-room__subtitles {
    flex: 0 0 clamp(100px, 20vh, 140px);
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .meeting-room__subtitles--hidden {
    flex: 0 0 0 !important;
    border: none;
  }
}
</style>
