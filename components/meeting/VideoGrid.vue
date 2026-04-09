<template>
  <!-- Presentation mode: screen share fills main area, cameras in sidebar -->
  <div v-if="hasAnyScreenShare" class="presentation-layout">
    <div class="presentation-area">
      <!-- Main screen share display — shows only the focused screen share -->
      <div ref="screenShareContainerReference" class="presentation-main">
        <!-- Local screen share (shown when focused) -->
        <!-- The <video> is kept off-screen for LiveKit track attachment only.
             LiveKit publishes the MediaStreamTrack directly — the HTML element is not
             used for broadcasting, so moving it off-screen has zero effect on what
             others see. A <canvas> is used for local display instead of the <video>
             because canvas elements are never promoted to OS-level hardware overlays
             (IOSurface/CALayer on macOS), so the annotation canvas above it remains
             visible to the sharer. -->
        <div v-if="isScreenSharing && focusedScreenIdentity === 'local'" class="video-tile">
          <video
            ref="localScreenReference"
            autoplay
            muted
            playsinline
            class="local-screen-video--hidden"
          ></video>
          <canvas ref="localScreenCanvasReference" class="local-screen-canvas"></canvas>
          <div class="video-tile__label">
            <v-icon icon="mdi-monitor-share" size="12" class="mr-1"></v-icon>
            {{ $t('meetings.you') }} ({{ $t('meetings.controls.shareOn') }})
          </div>
        </div>

        <!-- Remote screen shares (only the focused one is rendered at full size) -->
        <template
          v-for="participant in remoteParticipants"
          :key="`screen-main-${participant.identity}`"
        >
          <div
            v-if="
              remoteScreenShareTracks[participant.identity] &&
              focusedScreenIdentity === participant.identity
            "
            class="video-tile"
          >
            <video
              :ref="(element) => attachRemoteScreenShare(element as HTMLVideoElement, participant)"
              autoplay
              muted
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

        <!-- Screen overlay — shows participant cursors + click-markers on the shared screen -->
        <MeetingAnnotationCanvas
          ref="annotationCanvasReference"
          :cursors="cursors"
          :markers="markers"
          :participant-name-map="participantNameMap"
          :participant-color-map="participantColorMap"
          :is-local-screen-sharing="isScreenSharing"
          @cursor-move="emit('cursor-move', $event)"
          @cursor-hide="emit('cursor-hide')"
          @marker-place="emit('marker-place', $event)"
          @markers-clear="emit('markers-clear')"
        />

        <!-- Fullscreen toggle button — shown on hover -->
        <v-btn
          :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
          :title="
            isFullscreen
              ? $t('meetings.controls.exitFullscreen')
              : $t('meetings.controls.fullscreen')
          "
          size="small"
          variant="tonal"
          color="white"
          class="screen-share-fullscreen-btn"
          @click="toggleFullscreen"
        ></v-btn>
      </div>

      <!-- Screen share selector strip — click to switch which screen share is enlarged -->
      <div v-if="screenSharesList.length > 1" class="screen-share-strip">
        <button
          v-for="share in screenSharesList"
          :key="`ss-strip-${share.identity}`"
          class="screen-share-chip"
          :class="{ 'screen-share-chip--active': focusedScreenIdentity === share.identity }"
          @click="focusedScreenIdentity = share.identity"
        >
          <v-icon icon="mdi-monitor-share" size="14" class="mr-1"></v-icon>
          <span>{{ share.name }}</span>
          <span v-if="share.isLocal" class="screen-share-chip__badge">
            {{ $t('meetings.you') }}
          </span>
        </button>
      </div>
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
        <div class="video-tile__label">
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
      <div
        v-if="hostUserId !== null && hostUserId !== undefined && localUserId === hostUserId"
        class="video-tile__host-badge"
      >
        <v-icon icon="mdi-crown" size="14" color="amber"></v-icon>
      </div>
      <div class="video-tile__label">
        <v-icon
          v-if="localParticipant && activeSpeakerIdentities.includes(localParticipant.identity)"
          icon="mdi-microphone"
          size="12"
          class="mr-1"
        ></v-icon>
        {{ $t('meetings.you') }}
        <span
          v-if="hostUserId !== null && hostUserId !== undefined && localUserId === hostUserId"
          class="video-tile__host-chip"
        >
          <v-icon icon="mdi-crown" size="10"></v-icon>
          HOST
        </span>
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
      <div
        v-if="
          hostUserId !== null &&
          hostUserId !== undefined &&
          Number(participant.identity) === hostUserId
        "
        class="video-tile__host-badge"
      >
        <v-icon icon="mdi-crown" size="14" color="amber"></v-icon>
      </div>
      <div class="video-tile__label">
        <v-icon
          v-if="activeSpeakerIdentities.includes(participant.identity)"
          icon="mdi-microphone"
          size="12"
          class="mr-1"
        ></v-icon>
        {{ participantNameMap[participant.identity] || participant.name || participant.identity }}
        <span
          v-if="
            hostUserId !== null &&
            hostUserId !== undefined &&
            Number(participant.identity) === hostUserId
          "
          class="video-tile__host-chip"
        >
          <v-icon icon="mdi-crown" size="10"></v-icon>
          HOST
        </span>
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
import type { CursorPosition, ScreenMarker } from '@/types/meeting/ScreenCursor'
import MeetingAnnotationCanvas from '@/components/meeting/AnnotationCanvas.vue'
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
  /** Map of String(userId) → cursor position for remote participants */
  cursors: Record<string, CursorPosition>
  /** Click-markers from all participants */
  markers: ScreenMarker[]
  /** Map of String(userId) → annotation color for cursor/marker rendering */
  participantColorMap: Record<string, string>
  /** userId of the current runtime host — shown with a crown badge */
  hostUserId?: number | null
  /** userId of the local user — used to check if local tile is the host */
  localUserId?: number
}>()

const emit = defineEmits<{
  'cursor-move': [position: { x: number; y: number }]
  'cursor-hide': []
  'marker-place': [position: { x: number; y: number }]
  'markers-clear': []
}>()
// END DEFINE PROPERTY AND EMITS

// START DEFINE STATE
const localVideoReference = ref<HTMLVideoElement | null>(null)
// Track screen share audio elements so we can mute/unmute them when isSpeakerEnabled changes
const screenAudioElements = new Map<string, HTMLAudioElement>()
const localScreenReference = ref<HTMLVideoElement | null>(null)
const localScreenCanvasReference = ref<HTMLCanvasElement | null>(null)
const screenShareContainerReference = ref<HTMLDivElement | null>(null)
const isFullscreen = ref(false)
const annotationCanvasReference = ref<InstanceType<typeof MeetingAnnotationCanvas> | null>(null)

/** Which screen share is displayed in the main area.
 *  'local' = local user's screen share, any other string = remote participant identity.
 *  Null when no screen share is active. */
const focusedScreenIdentity = ref<string | null>(null)

// rAF handle for canvas mirror loop
let screenMirrorFrame: number | null = null
// END DEFINE STATE

// START DEFINE COMPUTED
const hasAnyScreenShare = computed(() => props.isScreenSharing || props.hasRemoteScreenShare)

/** All active screen shares (local + remote) with display metadata */
const screenSharesList = computed(() => {
  const shares: Array<{ identity: string; name: string; isLocal: boolean }> = []
  if (props.isScreenSharing) {
    shares.push({ identity: 'local', name: 'You', isLocal: true })
  }
  for (const participant of props.remoteParticipants) {
    if (props.remoteScreenShareTracks[participant.identity]) {
      shares.push({
        identity: participant.identity,
        name:
          props.participantNameMap[participant.identity] ||
          participant.name ||
          participant.identity,
        isLocal: false,
      })
    }
  }
  return shares
})
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

/**
 * Continuously mirrors the hidden local screen-share <video> onto the visible <canvas>.
 * Using a canvas instead of displaying the <video> directly prevents Chrome/macOS from
 * promoting the getDisplayMedia video to an OS-level hardware overlay (IOSurface/CALayer)
 * which bypasses CSS z-index and would hide the annotation canvas from the sharer.
 */
function runScreenMirror() {
  const video = localScreenReference.value
  const canvas = localScreenCanvasReference.value
  if (!canvas) {
    screenMirrorFrame = requestAnimationFrame(runScreenMirror)
    return
  }

  const context = canvas.getContext('2d')
  if (!context) {
    screenMirrorFrame = requestAnimationFrame(runScreenMirror)
    return
  }

  // Sync canvas pixel size to its CSS container
  const parent = canvas.parentElement
  if (parent) {
    const rect = parent.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      if (canvas.width !== Math.round(rect.width) || canvas.height !== Math.round(rect.height)) {
        canvas.width = Math.round(rect.width)
        canvas.height = Math.round(rect.height)
      }
    }
  }

  if (video && video.readyState >= 2 && video.videoWidth > 0) {
    // Draw video centered with letterbox (contain) to preserve aspect ratio
    const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight)
    const drawWidth = video.videoWidth * scale
    const drawHeight = video.videoHeight * scale
    const offsetX = (canvas.width - drawWidth) / 2
    const offsetY = (canvas.height - drawHeight) / 2

    context.fillStyle = '#000'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)
  } else {
    context.fillStyle = '#000'
    context.fillRect(0, 0, canvas.width, canvas.height)
  }

  screenMirrorFrame = requestAnimationFrame(runScreenMirror)
}

function startScreenMirror() {
  stopScreenMirror()
  screenMirrorFrame = requestAnimationFrame(runScreenMirror)
}

function stopScreenMirror() {
  if (screenMirrorFrame !== null) {
    cancelAnimationFrame(screenMirrorFrame)
    screenMirrorFrame = null
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
  if (localScreenReference.value.srcObject) {
    // Track already attached — just ensure mirror is running
    startScreenMirror()
    return
  }
  const publication = props.localParticipant.getTrackPublication(Track.Source.ScreenShare)
  if (publication?.track) {
    publication.track.attach(localScreenReference.value)
    startScreenMirror()
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
    // Mobile browsers (especially iOS Safari) may reject autoplay even with muted+playsinline
    // (e.g. Low Power Mode). Catch and retry on the first user interaction.
    element.play().catch(() => {
      const resume = () => {
        element.play().catch(() => {})
        document.removeEventListener('click', resume)
        document.removeEventListener('touchend', resume)
      }
      document.addEventListener('click', resume, { once: true })
      document.addEventListener('touchend', resume, { once: true })
    })
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
    element.play().catch(() => {})
  } else {
    setTimeout(() => retryAttachRemoteScreen(element, participant, attempt + 1), 150)
  }
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
    if (!sharing) {
      stopScreenMirror()
      return
    }
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

// Auto-focus: select which screen share to display in the main area.
// - If the current focus is still valid, keep it (user explicitly chose it).
// - Otherwise, prefer local screen share, then first available remote.
watch(
  screenSharesList,
  (shares) => {
    if (shares.length === 0) {
      focusedScreenIdentity.value = null
      return
    }
    // Keep current focus if the screen share is still active
    if (
      focusedScreenIdentity.value &&
      shares.some((share) => share.identity === focusedScreenIdentity.value)
    ) {
      return
    }
    // Default: prefer local screen share, then first remote
    const localShare = shares.find((share) => share.isLocal)
    focusedScreenIdentity.value = localShare ? localShare.identity : shares[0]!.identity
  },
  { immediate: true },
)

// Re-attach remote screen share tracks when focus changes (DOM video elements are recreated)
watch(focusedScreenIdentity, async () => {
  await nextTick()
  if (props.isScreenSharing && props.localParticipant) tryAttachLocalScreenShare(0)
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
  stopScreenMirror()
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

/* Wraps the main screen area + selector strip */
.presentation-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.presentation-main {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* NOTE: no transform/isolation on this container.
   * Previous approach used transform:translateZ(0) + isolation:isolate to prevent
   * OS-level hardware overlays from hiding the annotation canvas. This is no longer
   * needed because the local screen share now uses a canvas mirror (hidden <video> +
   * visible <canvas>) — canvas elements are never promoted to OS overlays, so the
   * annotation canvas stays visible without forcing a compositing layer group.
   * Keeping those properties broke remote screen share rendering on many browsers
   * because the compositing layer group prevented hardware video decoding. */
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

/* ── Screen share selector strip ── */
.screen-share-strip {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 2px 0;
}

.screen-share-chip {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  border: 2px solid transparent;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.screen-share-chip:hover {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.screen-share-chip--active {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(var(--v-theme-primary), 0.8);
  color: rgba(255, 255, 255, 0.95);
}

.screen-share-chip__badge {
  margin-left: 4px;
  padding: 0 4px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 10px;
  line-height: 16px;
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

  .presentation-area {
    flex: 1;
    min-height: 0;
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

/* ── Local screen-share canvas mirror ── */
.local-screen-video--hidden {
  /* Off-screen: LiveKit attaches the MediaStreamTrack here for local decode.
   * The track is published via WebRTC directly — this element is local-playback only.
   * Hiding it prevents Chrome/macOS from creating an OS-level hardware overlay
   * (IOSurface/CALayer) that would cover the annotation canvas regardless of z-index. */
  position: fixed;
  left: -10000px;
  top: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

.local-screen-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  background: #000;
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

.video-tile__host-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.video-tile__host-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: rgba(255, 179, 0, 0.25);
  color: #ffd54f;
  border: 1px solid rgba(255, 179, 0, 0.5);
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 1px 4px;
  margin-left: 4px;
  vertical-align: middle;
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
