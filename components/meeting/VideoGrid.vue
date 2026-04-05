<template>
  <!-- Presentation mode: screen share fills main area, cameras in sidebar -->
  <div v-if="hasAnyScreenShare" class="presentation-layout">
    <!-- Main screen share area -->
    <div ref="screenShareContainerReference" class="presentation-main">
      <!-- Local screen share -->
      <div v-if="isScreenSharing" class="video-tile">
        <video
          ref="localScreenReference"
          autoplay
          muted
          playsinline
          class="video-tile__video"
        ></video>
        <div class="video-tile__label">
          <v-icon icon="mdi-monitor-share" size="12" class="mr-1"></v-icon>
          {{ $t('meetings.you') }} ({{ $t('meetings.controls.shareOn') }})
        </div>
      </div>

      <!-- First remote screen share -->
      <template
        v-for="participant in remoteParticipants"
        :key="`screen-main-${participant.identity}`"
      >
        <div
          v-if="!isScreenSharing && remoteScreenShareTracks[participant.identity]"
          class="video-tile"
        >
          <video
            :ref="(element) => attachRemoteScreenShare(element as HTMLVideoElement, participant)"
            autoplay
            playsinline
            class="video-tile__video"
          ></video>
          <!-- Hidden audio element for screen share audio track -->
          <audio
            :ref="(element) => attachRemoteScreenAudio(element as HTMLAudioElement, participant)"
            autoplay
            style="display: none"
          ></audio>
          <div class="video-tile__label">
            <v-icon icon="mdi-monitor-share" size="12" class="mr-1"></v-icon>
            {{
              participantNameMap[participant.identity] || participant.name || participant.identity
            }}
            ({{ $t('meetings.controls.shareOn') }})
          </div>
        </div>
      </template>

      <!-- Fullscreen toggle button — shown on hover -->
      <v-btn
        :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
        :title="
          isFullscreen ? $t('meetings.controls.exitFullscreen') : $t('meetings.controls.fullscreen')
        "
        size="small"
        variant="tonal"
        color="white"
        class="screen-share-fullscreen-btn"
        @click="toggleFullscreen"
      ></v-btn>
    </div>

    <!-- Camera sidebar -->
    <div class="camera-sidebar">
      <!-- Local camera -->
      <div
        class="video-tile video-tile--local"
        :class="{
          'video-tile--speaking':
            localParticipant && activeSpeakerIdentities.includes(localParticipant.identity),
        }"
      >
        <video
          ref="localVideoReference"
          autoplay
          muted
          playsinline
          class="video-tile__video"
        ></video>
        <div v-if="!isCameraEnabled" class="video-tile__placeholder">
          <v-avatar v-if="localAvatar" size="48" class="video-tile__avatar">
            <v-img :src="localAvatar" cover />
          </v-avatar>
          <v-avatar v-else size="48" color="primary" class="video-tile__avatar">
            <span class="text-body-1 font-weight-bold text-white">
              {{ (localParticipant?.name ?? '?').charAt(0).toUpperCase() }}
            </span>
          </v-avatar>
        </div>
        <div v-if="!isMicEnabled" class="video-tile__mic-off">
          <v-icon icon="mdi-microphone-off" size="14" color="white"></v-icon>
        </div>
        <div v-if="!isSpeakerEnabled" class="video-tile__speaker-off">
          <v-icon icon="mdi-volume-mute" size="14" color="white"></v-icon>
        </div>
        <div class="video-tile__label">{{ $t('meetings.you') }}</div>
        <div class="audio-bar">
          <div
            class="audio-bar__fill"
            :style="{
              width: `${Math.round((speakerAudioLevels[localParticipant?.identity ?? ''] ?? 0) * 100)}%`,
            }"
          ></div>
        </div>
      </div>

      <!-- Remote cameras -->
      <div
        v-for="participant in remoteParticipants"
        :key="`cam-sidebar-${participant.identity}`"
        class="video-tile"
        :class="{ 'video-tile--speaking': activeSpeakerIdentities.includes(participant.identity) }"
      >
        <video
          :ref="(element) => attachRemoteCamera(element as HTMLVideoElement, participant)"
          autoplay
          playsinline
          class="video-tile__video"
        ></video>
        <div v-if="!participant.isCameraEnabled" class="video-tile__placeholder">
          <v-avatar
            v-if="participantAvatarMap[participant.identity]"
            size="48"
            class="video-tile__avatar"
          >
            <v-img :src="participantAvatarMap[participant.identity]" cover />
          </v-avatar>
          <v-avatar v-else size="48" color="primary" class="video-tile__avatar">
            <span class="text-body-1 font-weight-bold text-white">
              {{
                (
                  participantNameMap[participant.identity] ||
                  participant.name ||
                  participant.identity
                )
                  .charAt(0)
                  .toUpperCase()
              }}
            </span>
          </v-avatar>
        </div>
        <div v-if="!(remoteMicStates[participant.identity] ?? false)" class="video-tile__mic-off">
          <v-icon icon="mdi-microphone-off" size="14" color="white"></v-icon>
        </div>
        <div
          v-if="remoteSpeakerStates[participant.identity] === false"
          class="video-tile__speaker-off"
        >
          <v-icon icon="mdi-volume-mute" size="14" color="white"></v-icon>
        </div>
        <div class="video-tile__label">{{ participant.name ?? participant.identity }}</div>
        <div class="audio-bar">
          <div
            class="audio-bar__fill"
            :style="{
              width: `${Math.round((speakerAudioLevels[participant.identity] ?? 0) * 100)}%`,
            }"
          ></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Normal grid mode: no screen share -->
  <div v-else class="video-grid">
    <!-- Local camera tile -->
    <div
      class="video-tile video-tile--local"
      :class="{
        'video-tile--speaking':
          localParticipant && activeSpeakerIdentities.includes(localParticipant.identity),
      }"
    >
      <video ref="localVideoReference" autoplay muted playsinline class="video-tile__video"></video>
      <div v-if="!isCameraEnabled" class="video-tile__placeholder">
        <v-avatar v-if="localAvatar" size="64" class="video-tile__avatar">
          <v-img :src="localAvatar" cover />
        </v-avatar>
        <v-avatar v-else size="64" color="primary" class="video-tile__avatar">
          <span class="text-h6 font-weight-bold text-white">
            {{ (localParticipant?.name ?? '?').charAt(0).toUpperCase() }}
          </span>
        </v-avatar>
      </div>
      <div v-if="!isMicEnabled" class="video-tile__mic-off">
        <v-icon icon="mdi-microphone-off" size="14" color="white"></v-icon>
      </div>
      <div v-if="!isSpeakerEnabled" class="video-tile__speaker-off">
        <v-icon icon="mdi-volume-mute" size="14" color="white"></v-icon>
      </div>
      <div class="video-tile__label">
        <v-icon
          v-if="localParticipant && activeSpeakerIdentities.includes(localParticipant.identity)"
          icon="mdi-microphone"
          size="12"
          class="mr-1"
        ></v-icon>
        {{ $t('meetings.you') }}
      </div>
      <div class="audio-bar">
        <div
          class="audio-bar__fill"
          :style="{
            width: `${Math.round((speakerAudioLevels[localParticipant?.identity ?? ''] ?? 0) * 100)}%`,
          }"
        ></div>
      </div>
    </div>

    <!-- Remote camera tiles -->
    <div
      v-for="participant in remoteParticipants"
      :key="`cam-${participant.identity}`"
      class="video-tile"
      :class="{ 'video-tile--speaking': activeSpeakerIdentities.includes(participant.identity) }"
    >
      <video
        :ref="(element) => attachRemoteCamera(element as HTMLVideoElement, participant)"
        autoplay
        playsinline
        class="video-tile__video"
      ></video>
      <div v-if="!participant.isCameraEnabled" class="video-tile__placeholder">
        <v-avatar
          v-if="participantAvatarMap[participant.identity]"
          size="64"
          class="video-tile__avatar"
        >
          <v-img :src="participantAvatarMap[participant.identity]" cover />
        </v-avatar>
        <v-avatar v-else size="64" color="primary" class="video-tile__avatar">
          <span class="text-h6 font-weight-bold text-white">
            {{
              (participantNameMap[participant.identity] || participant.name || participant.identity)
                .charAt(0)
                .toUpperCase()
            }}
          </span>
        </v-avatar>
      </div>
      <div v-if="!(remoteMicStates[participant.identity] ?? false)" class="video-tile__mic-off">
        <v-icon icon="mdi-microphone-off" size="14" color="white"></v-icon>
      </div>
      <div
        v-if="remoteSpeakerStates[participant.identity] === false"
        class="video-tile__speaker-off"
      >
        <v-icon icon="mdi-volume-mute" size="14" color="white"></v-icon>
      </div>
      <div class="video-tile__label">
        <v-icon
          v-if="activeSpeakerIdentities.includes(participant.identity)"
          icon="mdi-microphone"
          size="12"
          class="mr-1"
        ></v-icon>
        {{ participantNameMap[participant.identity] || participant.name || participant.identity }}
      </div>
      <div class="audio-bar">
        <div
          class="audio-bar__fill"
          :style="{
            width: `${Math.round((speakerAudioLevels[participant.identity] ?? 0) * 100)}%`,
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// START IMPORT
import type { RemoteParticipant, LocalParticipant, RemoteTrack } from 'livekit-client'
import { Track } from 'livekit-client'
// END IMPORT

// START DEFINE PROPERTY AND EMITS
const props = defineProps<{
  localParticipant: LocalParticipant | null
  remoteParticipants: RemoteParticipant[]
  hasRemoteScreenShare: boolean
  /** identity → subscribed ScreenShare RemoteTrack — used to attach directly without racing markRaw reads */
  remoteScreenShareTracks: Record<string, RemoteTrack>
  isMicEnabled: boolean
  isCameraEnabled: boolean
  isScreenSharing: boolean
  isSpeakerEnabled: boolean
  activeSpeakerIdentities: string[]
  speakerAudioLevels: Record<string, number>
  remoteMicStates: Record<string, boolean>
  /** Map of String(userId) → avatar URL for all meeting participants */
  participantAvatarMap: Record<string, string>
  /** Map of String(userId) → full name — reliable fallback when LiveKit participant.name is empty */
  participantNameMap: Record<string, string>
  /** Avatar URL of the local user */
  localAvatar: string
  /** Map of String(userId) → speaker enabled state for remote participants */
  remoteSpeakerStates: Record<string, boolean>
}>()
// END DEFINE PROPERTY AND EMITS

// START DEFINE STATE
const localVideoReference = ref<HTMLVideoElement | null>(null)
// Track screen share audio elements so we can mute/unmute them when isSpeakerEnabled changes
const screenAudioElements = new Map<string, HTMLAudioElement>()
const localScreenReference = ref<HTMLVideoElement | null>(null)
const screenShareContainerReference = ref<HTMLDivElement | null>(null)
const isFullscreen = ref(false)
// END DEFINE STATE

// START DEFINE COMPUTED
const hasAnyScreenShare = computed(() => props.isScreenSharing || props.hasRemoteScreenShare)
// END DEFINE COMPUTED

// START DEFINE METHOD
function toggleFullscreen() {
  if (!screenShareContainerReference.value) return
  if (!document.fullscreenElement) {
    screenShareContainerReference.value.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}
// END DEFINE METHOD

// START DEFINE METHOD

function tryAttachLocalCamera(attempt: number) {
  if (attempt > 5 || !props.localParticipant || !localVideoReference.value) return
  // Guard: skip if already attached — prevents re-buffering when watchers re-trigger
  if (localVideoReference.value.srcObject) return
  const publication = props.localParticipant.getTrackPublication(Track.Source.Camera)

  if (publication?.track) {
    publication.track.attach(localVideoReference.value)
    return
  }

  setTimeout(() => tryAttachLocalCamera(attempt + 1), 200)
}

function tryAttachLocalScreenShare(attempt: number) {
  if (attempt > 5 || !props.localParticipant || !localScreenReference.value) return
  if (localScreenReference.value.srcObject) return
  const publication = props.localParticipant.getTrackPublication(Track.Source.ScreenShare)
  if (publication?.track) {
    publication.track.attach(localScreenReference.value)
    return
  }
  setTimeout(() => tryAttachLocalScreenShare(attempt + 1), 200)
}

function attachRemoteCamera(element: HTMLVideoElement | null, participant: RemoteParticipant) {
  if (!element) return
  // Guard: skip if element already has a live stream to avoid re-buffering on every re-render
  if (element.srcObject) return
  const publication = participant.getTrackPublication(Track.Source.Camera)
  if (publication?.track) publication.track.attach(element)
}

function attachRemoteScreenShare(element: HTMLVideoElement | null, participant: RemoteParticipant) {
  if (!element) return
  if (element.srcObject) return
  // Use the pre-resolved track from the reactive map instead of reading markRaw participant
  // to avoid timing races between TrackSubscribed and Vue re-render.
  const track = props.remoteScreenShareTracks[participant.identity]
  if (track) {
    track.attach(element)
  } else {
    retryAttachRemoteScreen(element, participant, 0)
  }
}

function retryAttachRemoteScreen(
  element: HTMLVideoElement,
  participant: RemoteParticipant,
  attempt: number,
) {
  if (attempt > 10) return
  if (element.srcObject) return
  const track = props.remoteScreenShareTracks[participant.identity]
  if (track) {
    track.attach(element)
    return
  }
  setTimeout(() => retryAttachRemoteScreen(element, participant, attempt + 1), 150)
}

function attachRemoteScreenAudio(element: HTMLAudioElement | null, participant: RemoteParticipant) {
  if (!element) return
  if (element.srcObject) return
  const publication = participant.getTrackPublication(Track.Source.ScreenShareAudio)
  if (publication?.track) {
    publication.track.attach(element)
    element.muted = !props.isSpeakerEnabled
    screenAudioElements.set(participant.identity, element)
  }
}
// END DEFINE METHOD

// START DEFINE WATCHER
watch(
  () => props.localParticipant,
  (participant) => {
    if (!participant) return
    if (props.isCameraEnabled) tryAttachLocalCamera(0)
    if (props.isScreenSharing) tryAttachLocalScreenShare(0)
  },
)

watch(
  () => props.isCameraEnabled,
  (enabled) => {
    if (enabled) tryAttachLocalCamera(0)
  },
)

watch(
  () => props.isScreenSharing,
  async (sharing) => {
    if (!sharing) return
    await nextTick()
    tryAttachLocalScreenShare(0)
  },
)

watch(
  () => props.isSpeakerEnabled,
  (enabled) => {
    screenAudioElements.forEach((audioElement) => {
      audioElement.muted = !enabled
    })
  },
)

// Re-attach tracks when entering/leaving presentation mode (DOM nodes remount)
watch(hasAnyScreenShare, async (active) => {
  await nextTick()
  if (props.isCameraEnabled && props.localParticipant) tryAttachLocalCamera(0)
  if (props.isScreenSharing && props.localParticipant) tryAttachLocalScreenShare(0)
  // Remote screen share <audio> elements are only in the DOM when hasAnyScreenShare is true.
  // Clear the map when leaving presentation mode so stale refs don't accumulate.
  if (!active) screenAudioElements.clear()
})
// END DEFINE WATCHER

// START LIFECYCLE
onMounted(() => {
  if (props.isCameraEnabled && props.localParticipant) tryAttachLocalCamera(0)
  if (props.isScreenSharing && props.localParticipant) tryAttachLocalScreenShare(0)

  // Sync isFullscreen with native browser fullscreen state (e.g. Escape key exits fullscreen)
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}
// END LIFECYCLE

// Expose toggleFullscreen so parent ([uuid].vue) can call it from ControlBar's toggle-fullscreen event
defineExpose({ toggleFullscreen })
</script>

<style scoped>
/* ── Design tokens (always-dark component) ── */
.video-grid,
.presentation-layout {
  --vg-bg: #1a1a1a;
  --vg-tile-bg: #2a2a2a;
  --vg-screen-bg: #000;
  --vg-label-bg: rgba(0, 0, 0, 0.6);
  --vg-label-fg: rgba(255, 255, 255, 0.87);
  --vg-speaking: #4caf50;
  --vg-mic-off: rgba(211, 47, 47, 0.85);
  --vg-speaker-off: rgba(100, 100, 100, 0.85);
  --vg-audio-bar-bg: rgba(255, 255, 255, 0.12);
  --vg-shadow: rgba(0, 0, 0, 0.5);
}

/* ── Normal grid mode ── */
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 8px;
  padding: 8px;
  height: 100%;
  background: var(--vg-bg);
  align-content: start;
}

@media (max-width: 640px) {
  .video-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 4px;
    padding: 4px;
  }
}

/* ── Presentation mode ── */
.presentation-layout {
  display: flex;
  height: 100%;
  background: var(--vg-bg);
  gap: 8px;
  padding: 8px;
}

.presentation-main {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.presentation-main .video-tile {
  width: 100%;
  height: 100%;
  aspect-ratio: unset;
}

.presentation-main .video-tile__video {
  object-fit: contain;
  background: var(--vg-screen-bg);
}

/* Fullscreen toggle button — hidden by default, revealed on hover */
.screen-share-fullscreen-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 10;
}

.presentation-main:hover .screen-share-fullscreen-btn {
  opacity: 1;
}

/* When the container itself is the fullscreen element, fill the screen */
.presentation-main:fullscreen {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--vg-screen-bg);
  width: 100vw;
  height: 100vh;
}

.presentation-main:fullscreen .video-tile {
  width: 100%;
  height: 100%;
  aspect-ratio: unset;
  border-radius: 0;
}

.presentation-main:fullscreen .screen-share-fullscreen-btn {
  opacity: 1;
}

/* Touch devices have no hover — always show the button */
@media (hover: none) {
  .screen-share-fullscreen-btn {
    opacity: 1;
  }
}

.camera-sidebar {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
}

.camera-sidebar .video-tile {
  width: 100%;
  aspect-ratio: 16 / 9;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .presentation-layout {
    flex-direction: column;
  }

  .camera-sidebar {
    width: 100%;
    height: 90px;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    flex-shrink: 0;
  }

  .camera-sidebar .video-tile {
    width: 120px;
    height: 68px;
    flex-shrink: 0;
    aspect-ratio: unset;
  }
}

/* ── Shared tile styles ── */
.video-tile {
  position: relative;
  background: var(--vg-tile-bg);
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
}

.video-tile__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-tile__label {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: var(--vg-label-bg);
  color: var(--vg-label-fg);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
}

.video-tile__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--vg-tile-bg);
}

.video-tile__avatar {
  box-shadow: 0 2px 8px var(--vg-shadow);
}

.video-tile--local .video-tile__video {
  transform: scaleX(-1);
}

.video-tile--speaking {
  box-shadow: 0 0 0 3px var(--vg-speaking);
}

.video-tile__mic-off {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--vg-mic-off);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.video-tile__speaker-off {
  position: absolute;
  top: 8px;
  right: 40px;
  background: var(--vg-speaker-off);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.audio-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--vg-audio-bar-bg);
  overflow: hidden;
}

.audio-bar__fill {
  height: 100%;
  background: var(--vg-speaking);
  transition: width 0.08s ease-out;
}
</style>
