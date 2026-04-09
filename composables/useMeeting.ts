import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { Room, RoomEvent, Track, VideoPresets } from 'livekit-client'
import type {
  Participant,
  RemoteParticipant,
  LocalParticipant,
  TrackPublication,
  RemoteTrackPublication,
  RemoteTrack,
  TrackPublishOptions,
} from 'livekit-client'
import type { Ref } from 'vue'
import { SCREEN_SHARE_PRESETS } from '@/types/meeting/ScreenShareQuality'
import type { ScreenShareQuality } from '@/types/meeting/ScreenShareQuality'
import type { CursorPosition, ScreenMarker } from '@/types/meeting/ScreenCursor'
import type { MeetingVote } from '@/types/meeting/MeetingVote'

// Preset colors assigned round-robin per userId so each participant has a distinct color
const ANNOTATION_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA94D', '#69DB7C', '#DA77F2']

function getUserAnnotationColor(userId: number): string {
  return ANNOTATION_COLORS[userId % ANNOTATION_COLORS.length]!
}

export interface MeetingParticipantInfo {
  userId: number
  username: string
}

export interface SubtitleEntry {
  id: string
  speakerId: number
  speakerName: string
  original: string
  language: string
  translations: Record<string, string>
  audioBase64: Record<string, string | null>
  timestamp: number
  pending: boolean // true while translation is still in-flight
}

export function useMeeting(
  meetingId: Ref<number>,
  _meetingUuid: Ref<string>,
  onMeetingEnded?: () => void,
) {
  const config = useRuntimeConfig()

  // Fallback to current origin so cross-device access (ngrok/local IP) works automatically
  const wsUrl =
    (config.public.wsUrl as string) ||
    (import.meta.client ? window.location.origin : 'http://localhost:3001')

  // Dynamic LiveKit URL: if not explicitly configured, derive from current page origin + /livekit/ nginx proxy path
  // This ensures it works on any device (mobile, ngrok, local IP) without needing to set the env var
  const defaultLivekitUrl = import.meta.client
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/livekit/`
    : 'ws://localhost:7880'
  const livekitUrl = (config.public.livekitUrl as string) || defaultLivekitUrl

  // Socket.IO state
  const isConnected = ref(false)
  const socketParticipants = ref<MeetingParticipantInfo[]>([])

  // LiveKit state — shallowRef to prevent Vue from wrapping LiveKit objects in Proxy
  // (LiveKit internally calls structuredClone which fails on Vue reactive Proxy)
  const room = shallowRef<Room | null>(null)
  const localParticipant = shallowRef<LocalParticipant | null>(null)
  const remoteParticipants = shallowRef<RemoteParticipant[]>([])
  const isMicEnabled = ref(false)
  const isCameraEnabled = ref(false)
  const isScreenSharing = ref(false)
  const isSpeakerEnabled = ref(true)

  // Map trackSid → audio element so we can mute/unmute all remote audio at once
  const remoteAudioElements = new Map<string, HTMLAudioElement>()

  // Subtitle state
  const subtitles = ref<SubtitleEntry[]>([])

  // Active speakers — identity = String(userId), audioLevel 0-1
  const activeSpeakerIdentities = ref<string[]>([])
  const speakerAudioLevels = ref<Record<string, number>>({})

  // Explicit mic state per remote participant — avoids reading isMicrophoneEnabled from markRaw objects,
  // which are not reactive and can return stale values after track mute/unmute events.
  const remoteMicStates = ref<Record<string, boolean>>({})

  // Speaker state per remote participant: true = speaker on, false = speaker off
  // Keyed by String(userId) — broadcast via socket speaker_state event
  const remoteSpeakerStates = ref<Record<string, boolean>>({})

  // Explicit reactive flag — avoids relying on non-reactive LiveKit publication reads inside computed()
  const hasRemoteScreenShare = ref(false)

  // identity → subscribed ScreenShare track — updated in TrackSubscribed/TrackUnsubscribed
  // VideoGrid reads this directly instead of calling markRaw participant.getTrackPublication()
  // which can return stale results after re-render races.
  // shallowRef: prevents Vue from Proxy-wrapping RemoteTrack objects.
  // ref() deep-converts the Record values, wrapping each RemoteTrack in a reactive Proxy.
  // LiveKit's track.attach() internally accesses private properties (MediaStreamTrack, WeakMaps)
  // that break when intercepted by a Vue Proxy → attach silently fails → no video rendered.
  const remoteScreenShareTracks = shallowRef<Record<string, RemoteTrack>>({})

  // Whether audio capture is using screen share audio (vs mic)
  const screenAudioActive = ref(false)

  // Screen overlay state — cursors + markers from all participants
  const cursors = ref<Record<string, CursorPosition>>({})
  const markers = ref<ScreenMarker[]>([])
  let markerPurgeInterval: ReturnType<typeof setInterval> | null = null
  // Throttle cursor broadcast — max ~10 updates/sec per user
  let lastCursorSendTime = 0

  // Vote state — all active and closed votes in the current meeting
  const votes = ref<MeetingVote[]>([])
  const showVotePanel = ref(false)

  // Speaking language — defaults to Vietnamese (primary input), en only when explicitly enabled.
  // Uses a dedicated cookie so it is independent of the UI locale cookie ('language').
  const speakingLanguageCookie = useCookie<string>('speaking_language', { default: () => 'vi' })
  const speakingLanguage = ref<string>(speakingLanguageCookie.value)

  // Persist speaking language preference so the selection survives page reloads
  watch(speakingLanguage, (value) => {
    speakingLanguageCookie.value = value
  })

  // TTS — disabled by default to reduce latency; enable when audio playback is needed
  const ttsEnabled = ref(false)

  // Currently selected speaker output device ID (empty = browser default)
  let activeSpeakerDeviceId = ''

  // Audio recording state
  let mediaRecorder: MediaRecorder | null = null
  let audioStream: MediaStream | null = null
  let isCapturing = false
  let vadAnimFrame: number | null = null
  let vadAudioContext: AudioContext | null = null

  // Noise suppression state — enabled by default
  const isNoiseSuppressed = ref(true)

  let socket: Socket | null = null
  let localUserId: number | null = null

  async function connect(userId: number, username: string) {
    localUserId = userId

    // Connect Socket.IO for signaling + subtitles
    socket = io(`${wsUrl}/meeting`, {
      path: '/ws',
      auth: { token: useCookie('auth_token').value },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      isConnected.value = true
      socket!.emit('join_meeting', { meetingId: meetingId.value, userId, username })

      // Broadcast our current speaker state so existing participants know it immediately
      socket!.emit('speaker_state', {
        meetingId: meetingId.value,
        userId,
        enabled: isSpeakerEnabled.value,
      })
    })

    socket.on('disconnect', () => {
      isConnected.value = false
    })

    socket.on(
      'meeting_state',
      (data: {
        participants: MeetingParticipantInfo[]
        speakerStates?: Record<number, boolean>
      }) => {
        socketParticipants.value = data.participants

        // Hydrate speaker states snapshot sent by the gateway on join
        if (data.speakerStates) {
          const states: Record<string, boolean> = {}

          for (const [userId, enabled] of Object.entries(data.speakerStates)) {
            states[String(userId)] = enabled as boolean
          }

          remoteSpeakerStates.value = states
        }
      },
    )

    socket.on('participant_joined', (data: MeetingParticipantInfo) => {
      if (!socketParticipants.value.find((participant) => participant.userId === data.userId)) {
        socketParticipants.value.push(data)
      }
    })

    socket.on('participant_left', (data: { userId: number }) => {
      socketParticipants.value = socketParticipants.value.filter(
        (participant) => participant.userId !== data.userId,
      )
    })

    socket.on(
      'subtitle_partial',
      (entry: {
        id: string
        meetingId: number
        speakerId: number
        speakerName: string
        original: string
        language: string
      }) => {
        subtitles.value.push({
          id: entry.id,
          speakerId: entry.speakerId,
          speakerName: entry.speakerName,
          original: entry.original,
          language: entry.language,
          translations: {},
          audioBase64: {},
          timestamp: Date.now(),
          pending: true,
        })

        // Keep only last 50 subtitles
        if (subtitles.value.length > 50) {
          subtitles.value.shift()
        }
      },
    )

    socket.on('subtitle_update', (entry: SubtitleEntry & { meetingId: number }) => {
      // Find existing partial entry and update it in-place
      const existing = subtitles.value.find((subtitle) => subtitle.id === entry.id)

      if (existing) {
        existing.translations = entry.translations
        existing.audioBase64 = entry.audioBase64
        existing.pending = false
      } else {
        // Fallback: partial was missed, add full entry directly
        subtitles.value.push({ ...entry, timestamp: Date.now(), pending: false })

        if (subtitles.value.length > 50) {
          subtitles.value.shift()
        }
      }

      // Play TTS audio for user's target language
      const userLang = useCookie('language').value ?? 'en'
      const audioBase64 = entry.audioBase64?.[userLang]

      if (audioBase64) {
        playAudio(audioBase64)
      }
    })

    socket.on('speaker_state', (data: { userId: number; enabled: boolean }) => {
      remoteSpeakerStates.value = {
        ...remoteSpeakerStates.value,
        [String(data.userId)]: data.enabled,
      }
    })

    socket.on('cursor_move', (payload: { userId: number; x: number; y: number }) => {
      cursors.value = {
        ...cursors.value,
        [String(payload.userId)]: {
          userId: payload.userId,
          x: payload.x,
          y: payload.y,
        },
      }
    })

    socket.on('cursor_hide', (payload: { userId: number }) => {
      const { [String(payload.userId)]: _removed, ...remaining } = cursors.value
      cursors.value = remaining
    })

    socket.on(
      'screen_marker',
      (payload: {
        id: string
        userId: number
        x: number
        y: number
        color: string
        timestamp: number
      }) => {
        // Deduplicate — sender adds locally, gateway broadcasts to others only
        if (markers.value.some((marker) => marker.id === payload.id)) return
        markers.value = [...markers.value, payload]
      },
    )

    socket.on('screen_marker_clear', () => {
      markers.value = []
    })

    // Vote events — real-time voting during meeting
    socket.on('votes_state', (activeVotes: MeetingVote[]) => {
      // Joining user receives all current votes
      votes.value = activeVotes
    })

    socket.on('vote_started', (vote: MeetingVote) => {
      votes.value = [...votes.value, vote]
      showVotePanel.value = true
    })

    socket.on('vote_updated', (updatedVote: MeetingVote) => {
      votes.value = votes.value.map((value) => (value.id === updatedVote.id ? updatedVote : value))
    })

    socket.on('vote_ended', (closedVote: MeetingVote) => {
      votes.value = votes.value.map((value) => (value.id === closedVote.id ? closedVote : value))
    })

    // Host has ended the meeting for everyone
    socket.on('meeting_ended', () => {
      onMeetingEnded?.()
    })

    // Purge expired markers (older than 8s)
    const MARKER_TTL_MS = 8000
    markerPurgeInterval = setInterval(() => {
      const cutoff = Date.now() - MARKER_TTL_MS
      if (markers.value.some((marker) => marker.timestamp < cutoff)) {
        markers.value = markers.value.filter((marker) => marker.timestamp >= cutoff)
      }
    }, 2000)
  }

  /**
   * Broadcasts the local user's cursor position to all other participants.
   * Throttled to ~10 updates/sec to avoid flooding the socket.
   */
  function sendCursorMove(posX: number, posY: number) {
    if (!socket?.connected || localUserId === null) return
    const now = Date.now()
    if (now - lastCursorSendTime < 100) return // throttle 10fps
    lastCursorSendTime = now
    socket.emit('cursor_move', {
      meetingId: meetingId.value,
      userId: localUserId,
      x: posX,
      y: posY,
    })
  }

  /**
   * Hides the local user's cursor from all other participants (e.g. mouse leaves screen share area).
   */
  function sendCursorHide() {
    if (!socket?.connected || localUserId === null) return
    socket.emit('cursor_hide', { meetingId: meetingId.value, userId: localUserId })
  }

  /**
   * Places a click-marker on the shared screen and broadcasts to all participants.
   */
  function sendScreenMarker(posX: number, posY: number) {
    if (!socket?.connected || localUserId === null) return
    const marker: ScreenMarker = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId: localUserId,
      x: posX,
      y: posY,
      color: getUserAnnotationColor(localUserId),
      timestamp: Date.now(),
    }
    // Add locally immediately — sender does not go through socket round-trip
    markers.value = [...markers.value, marker]
    socket.emit('screen_marker', { meetingId: meetingId.value, ...marker })
  }

  /**
   * Clears all markers for all participants in the meeting.
   */
  function clearScreenMarkers() {
    if (!socket?.connected) return
    socket.emit('screen_marker_clear', { meetingId: meetingId.value })
  }

  /**
   * Returns the annotation color for any user by userId.
   */
  function getParticipantColor(userId: number): string {
    return getUserAnnotationColor(userId)
  }

  /**
   * Ends the meeting for all participants (host only).
   * Gateway verifies host before broadcasting meeting_ended to the room.
   */
  function endMeeting() {
    if (!socket?.connected || localUserId === null) return
    socket.emit('end_meeting', { meetingId: meetingId.value, userId: localUserId })
  }

  /**
   * Returns the annotation color for the local user.
   */
  function getLocalAnnotationColor(): string {
    return localUserId !== null ? getUserAnnotationColor(localUserId) : ANNOTATION_COLORS[0]!
  }

  async function joinLiveKit(token: string, audioCaptureDeviceId?: string) {
    // markRaw: prevent Vue from wrapping LiveKit's Room in a Proxy.
    // LiveKit internally calls structuredClone / WeakMap lookups that fail on Vue Proxies,
    // causing silent render stutters (Nuxt 4 is more aggressive about proxying class instances).
    const livekitRoom = markRaw(
      new Room({
        adaptiveStream: true,
        // dynacast disabled — with dynacast:true LiveKit server progressively increases targetBitrate
        // (2Mbps → 2.5Mbps over time), forcing OpenH264 to work harder → encode time 65ms → 145ms → 2fps
        dynacast: false,
        publishDefaults: {
          simulcast: true,
          videoSimulcastLayers: [VideoPresets.h180],
          videoCodec: 'h264',
          // screenShareEncoding intentionally omitted — explicit options in startScreenShare() take precedence
        },
        videoCaptureDefaults: {
          resolution: VideoPresets.h360.resolution,
        },
        audioCaptureDefaults: {
          deviceId: audioCaptureDeviceId ?? undefined,
          // Always enable AEC/AGC — without these, LiveKit mic picks up speaker output and
          // creates echo feedback loops audible to all other participants.
          // noiseSuppression follows the user's toggle state at join time.
          echoCancellation: true,
          noiseSuppression: isNoiseSuppressed.value,
          autoGainControl: true,
        },
      }),
    )
    room.value = livekitRoom

    livekitRoom.on(RoomEvent.ParticipantConnected, () => {
      // markRaw on each participant — prevents Vue from proxying LiveKit class instances
      remoteParticipants.value = [...livekitRoom.remoteParticipants.values()].map(markRaw)
    })

    livekitRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      remoteParticipants.value = [...livekitRoom.remoteParticipants.values()].map(markRaw)
      const { [participant.identity]: _removed, ...remaining } = remoteMicStates.value
      remoteMicStates.value = remaining
    })

    livekitRoom.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrack, publication: TrackPublication, participant: RemoteParticipant) => {
        remoteParticipants.value = [...livekitRoom.remoteParticipants.values()].map(markRaw)

        if (track.source === Track.Source.ScreenShare) {
          hasRemoteScreenShare.value = true
          remoteScreenShareTracks.value = {
            ...remoteScreenShareTracks.value,
            [participant.identity]: markRaw(track),
          }
        }

        // Auto-attach remote microphone audio — without this, remote mic audio is never heard
        // ScreenShareAudio is handled separately by VideoGrid's <audio> element
        if (track.kind === Track.Kind.Audio && track.source === Track.Source.Microphone) {
          const audioElement = track.attach() as HTMLAudioElement
          // Apply current speaker state immediately — handles the case where speaker was
          // turned off before this participant joined
          if (!isSpeakerEnabled.value) audioElement.muted = true

          // Apply selected output device if one was chosen in prejoin
          if (activeSpeakerDeviceId) {
            ;(audioElement as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> })
              .setSinkId?.(activeSpeakerDeviceId)
              .catch(() => {})
          }

          remoteAudioElements.set(track.sid!, audioElement)

          // Initialise mic state from the publication's current muted flag
          remoteMicStates.value = {
            ...remoteMicStates.value,
            [participant.identity]: !publication.isMuted,
          }
        }
      },
    )

    // TrackPublished fires for tracks from existing participants when we join, and for new
    // publications. This is the earliest signal that a screen share is active. We use it
    // to set hasRemoteScreenShare immediately (so the presentation layout appears) and to
    // populate remoteScreenShareTracks when the track is already subscribed.
    livekitRoom.on(
      RoomEvent.TrackPublished,
      (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        if (publication.source !== Track.Source.ScreenShare) return
        remoteParticipants.value = [...livekitRoom.remoteParticipants.values()].map(markRaw)
        hasRemoteScreenShare.value = true
        // If the track is already subscribed (e.g. we joined after it was published),
        // populate the track map immediately so VideoGrid can render and attach it.
        if (publication.isSubscribed && publication.track) {
          remoteScreenShareTracks.value = {
            ...remoteScreenShareTracks.value,
            [participant.identity]: markRaw(publication.track as RemoteTrack),
          }
        }
      },
    )

    livekitRoom.on(
      RoomEvent.TrackUnsubscribed,
      (track: RemoteTrack, _publication: TrackPublication, participant: RemoteParticipant) => {
        remoteParticipants.value = [...livekitRoom.remoteParticipants.values()].map(markRaw)

        if (track.source === Track.Source.ScreenShare) {
          const { [participant.identity]: _removed, ...remaining } = remoteScreenShareTracks.value
          remoteScreenShareTracks.value = remaining
          hasRemoteScreenShare.value = Object.keys(remoteScreenShareTracks.value).length > 0
        }

        // Clean up audio elements when track ends
        if (track.kind === Track.Kind.Audio && track.source === Track.Source.Microphone) {
          track.detach()
          remoteAudioElements.delete(track.sid!)
        }
      },
    )

    // Re-render participant tiles when someone mutes/unmutes their microphone.
    // remoteParticipants uses shallowRef + markRaw — replacing the array triggers reactivity
    // so templates re-read participant.isMicrophoneEnabled with the updated value.
    livekitRoom.on(
      RoomEvent.TrackMuted,
      (publication: TrackPublication, participant: Participant) => {
        if (publication.source === Track.Source.Microphone) {
          remoteMicStates.value = { ...remoteMicStates.value, [participant.identity]: false }
        }

        remoteParticipants.value = [...livekitRoom.remoteParticipants.values()].map(markRaw)
      },
    )

    livekitRoom.on(
      RoomEvent.TrackUnmuted,
      (publication: TrackPublication, participant: Participant) => {
        if (publication.source === Track.Source.Microphone) {
          remoteMicStates.value = { ...remoteMicStates.value, [participant.identity]: true }
        }

        remoteParticipants.value = [...livekitRoom.remoteParticipants.values()].map(markRaw)
      },
    )

    livekitRoom.on(RoomEvent.LocalTrackPublished, (_publication) => {
      // triggerRef: notify Vue watchers that localParticipant's internal state changed
      // (a track was published/unpublished). Cannot use re-assign because markRaw(obj) === obj
      // → Vue sees same reference → skips watcher notification.
      triggerRef(localParticipant)

      // ScreenShareAudio is intentionally ignored for subtitles — only mic voice is transcribed
    })

    livekitRoom.on(RoomEvent.LocalTrackUnpublished, (publication) => {
      // triggerRef: notify Vue watchers that localParticipant's internal state changed
      // (a track was published/unpublished). Cannot use re-assign because markRaw(obj) === obj
      // → Vue sees same reference → skips watcher notification.
      triggerRef(localParticipant)

      if (publication.source === Track.Source.ScreenShare) {
        isScreenSharing.value = false
      }
    })

    livekitRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
      activeSpeakerIdentities.value = speakers.map((speaker) => speaker.identity)

      const levels: Record<string, number> = {}

      for (const speaker of speakers) {
        levels[speaker.identity] = speaker.audioLevel
      }

      speakerAudioLevels.value = levels
    })

    await livekitRoom.connect(livekitUrl, token)
    localParticipant.value = markRaw(livekitRoom.localParticipant)
    remoteParticipants.value = [...livekitRoom.remoteParticipants.values()].map(markRaw)
  }

  /**
   * Routes raw mic audio through a Web Audio processing chain (high-pass filter + dynamics
   * compressor) and publishes the processed track to LiveKit. The same processed stream is
   * also fed into the VAD/subtitle pipeline so Whisper receives cleaner audio too.
   */
  async function toggleMic() {
    if (!room.value) return
    const enabled = !isMicEnabled.value
    isMicEnabled.value = enabled

    if (!enabled) {
      stopAudioCapture()
      await room.value.localParticipant.setMicrophoneEnabled(false)
    } else {
      await room.value.localParticipant.setMicrophoneEnabled(true)
      startVADFromLiveKitTrack()
    }
  }

  /**
   * Starts VAD/subtitle audio capture by reusing the mic MediaStreamTrack that LiveKit
   * already captured. Avoids opening a second getUserMedia on the same device — two
   * simultaneous getUserMedia streams with independent AEC processors interfere with
   * each other, producing the echo/feedback heard by other participants.
   *
   * Falls back to a new getUserMedia if the LiveKit track is not yet available.
   */
  function startVADFromLiveKitTrack() {
    if (!room.value) {
      startAudioCapture()
      return
    }

    const micPublication = room.value.localParticipant.getTrackPublication(Track.Source.Microphone)

    if (micPublication?.track?.mediaStreamTrack) {
      startAudioCapture(new MediaStream([micPublication.track.mediaStreamTrack]))
    } else {
      startAudioCapture()
    }
  }

  /**
   * Toggles native browser noise suppression on/off via MediaStreamTrack.applyConstraints().
   * Does NOT use a Web Audio pipeline — native NS is processed before AEC so timing alignment
   * is preserved and there is no echo pumping artifact.
   */
  async function toggleNoiseSuppression() {
    isNoiseSuppressed.value = !isNoiseSuppressed.value

    if (!isMicEnabled.value || !room.value) return

    const micPub = room.value.localParticipant.getTrackPublication(Track.Source.Microphone)
    const mediaTrack = micPub?.track?.mediaStreamTrack
    if (mediaTrack) {
      await mediaTrack.applyConstraints({ noiseSuppression: isNoiseSuppressed.value })
    }
  }

  function toggleSpeaker() {
    isSpeakerEnabled.value = !isSpeakerEnabled.value
    remoteAudioElements.forEach((audioElement) => {
      audioElement.muted = !isSpeakerEnabled.value
    })

    // Broadcast speaker state to other participants so they can see our speaker icon
    if (socket?.connected && localUserId !== null) {
      socket.emit('speaker_state', {
        meetingId: meetingId.value,
        userId: localUserId,
        enabled: isSpeakerEnabled.value,
      })
    }
  }

  async function toggleCamera() {
    if (!room.value) return
    const enabled = !isCameraEnabled.value
    await room.value.localParticipant.setCameraEnabled(enabled)
    isCameraEnabled.value = enabled
  }

  async function switchMicDevice(deviceId: string) {
    if (!room.value) return
    // LiveKit switches the capture device without re-publishing — maintains the existing track
    await room.value.switchActiveDevice('audioinput', deviceId)
    // Restart VAD with the new track (switchActiveDevice replaces the underlying MediaStreamTrack)
    if (isMicEnabled.value) {
      stopAudioCapture()
      startVADFromLiveKitTrack()
    }
  }

  function setRemoteSpeakerDevice(deviceId: string) {
    activeSpeakerDeviceId = deviceId
    remoteAudioElements.forEach((audioElement) => {
      ;(audioElement as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> })
        .setSinkId?.(deviceId)
        .catch(() => {})
    })
  }

  async function startScreenShare(quality: ScreenShareQuality = 'video') {
    if (!room.value) return

    const preset = SCREEN_SHARE_PRESETS[quality]

    const screenSharePublishOptions: TrackPublishOptions = {
      videoCodec: 'h264',
      simulcast: false,
      videoEncoding: {
        maxBitrate: preset.maxBitrate,
        maxFramerate: preset.maxFramerate,
      },
    }

    try {
      await room.value.localParticipant.setScreenShareEnabled(
        true,
        {
          audio: true,
          // LiveKit's createScreenTracks() defaults to h1080fps30 (1920×1080 @30fps) when no
          // resolution is supplied, then passes `frameRate: 30` as a bare number into getDisplayMedia.
          // Chrome macOS treats bare-number frameRate as an exact constraint → OverconstrainedError
          // for Window and Screen sources (only Tab sources can honour an exact frame rate).
          //
          // Fix: supply a zero-dimension resolution so LiveKit's na() constraint builder sees
          // `width: 0` and skips the entire resolution block (it checks width > 0 && height > 0).
          // The browser then receives `video: true` with no constraints, showing all three source
          // types (Tab, Window, Entire Screen) without any OverconstrainedError.
          //
          // Encoding quality is controlled via videoEncoding.maxBitrate/maxFramerate in publishOptions.
          resolution: { width: 0, height: 0, frameRate: 0 },
        },
        screenSharePublishOptions,
      )
    } catch {
      // NotAllowedError: user dismissed the picker or macOS Screen Recording permission is denied.
      // Any other error: constraint rejection or LiveKit negotiation failure.
      return
    }

    // contentHint: 'detail' tells the browser encoder this is screen content, not motion video
    // The encoder uses intra-prediction heavily → crisp text, no motion blur
    const screenPub = room.value.localParticipant.getTrackPublication(Track.Source.ScreenShare)

    if (screenPub?.track?.mediaStreamTrack) {
      const mediaStreamTrack = screenPub.track.mediaStreamTrack
      mediaStreamTrack.contentHint = 'detail'

      // Apply capture constraints post-capture so they work across all source types
      // (Tab, Window, Entire Screen) without triggering OverconstrainedError.
      // frameRate as {max: N} so Chrome treats it as an upper bound, not exact requirement.
      mediaStreamTrack
        .applyConstraints({
          width: { max: preset.maxWidth },
          height: { max: preset.maxHeight },
          frameRate: { max: preset.maxFramerate },
        })
        .catch(() => {
          // applyConstraints can fail if the track is already stopped or constraints are unsupported.
          // Not fatal — encoding quality is still bounded by videoEncoding.maxBitrate/maxFramerate.
        })

      // On macOS, if the browser lacks Screen Recording permission the OS still allows the picker
      // and returns a track — but every captured frame is solid black. Detect this by sampling
      // a frame 1.5s after capture starts, before remote participants notice anything.
      detectBlackFrames(mediaStreamTrack)
    }

    isScreenSharing.value = true
    // Audio capture switch is handled by LocalTrackPublished event above
  }

  /**
   * Samples one frame from the screen share track ~1.5s after capture starts.
   * If the frame is >99% dark pixels, the capture is likely blocked by macOS
   * Screen Recording permission — fires the onBlackScreen callback so the UI
   * can warn the user.
   */
  function detectBlackFrames(mediaStreamTrack: MediaStreamTrack) {
    setTimeout(() => {
      if (!isScreenSharing.value) return

      try {
        const video = document.createElement('video')
        video.srcObject = new MediaStream([mediaStreamTrack])
        video.muted = true
        video
          .play()
          .then(() => {
            const canvas = document.createElement('canvas')
            canvas.width = 64
            canvas.height = 36
            const context = canvas.getContext('2d')
            if (!context) return
            context.drawImage(video, 0, 0, 64, 36)
            video.srcObject = null
            const { data } = context.getImageData(0, 0, 64, 36)
            let darkPixels = 0

            for (let index = 0; index < data.length; index += 4) {
              const brightness = data[index] + data[index + 1] + data[index + 2]
              if (brightness < 30) darkPixels++
            }

            const totalPixels = data.length / 4

            if (darkPixels / totalPixels > 0.99) {
              onBlackScreen()
            }
          })
          .catch(() => {
            // Sampling failed — skip silently
          })
      } catch {
        // Canvas/video creation failed — skip silently
      }
    }, 1500)
  }

  const blackScreenCallbacks: Array<() => void> = []

  function onBlackScreen() {
    for (const callback of blackScreenCallbacks) callback()
  }

  function onBlackScreenDetected(callback: () => void) {
    blackScreenCallbacks.push(callback)
  }

  async function stopScreenShare() {
    if (!room.value) return
    await room.value.localParticipant.setScreenShareEnabled(false)
    isScreenSharing.value = false
    // Audio restore is handled by LocalTrackUnpublished event above
  }

  function startAudioCapture(sourceStream?: MediaStream) {
    isCapturing = true

    if (sourceStream) {
      audioStream = sourceStream
      startVADRecording()

      return
    }

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          // Hint browser to use highest-quality AEC processing
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 16000 },
        },
      })
      .then((stream) => {
        audioStream = stream
        startVADRecording()
      })
  }

  function sendAudioChunk(blob: Blob) {
    if (!socket?.connected) return

    blob.arrayBuffer().then((buffer) => {
      // volatile: drop this audio chunk if the socket buffer is backed up.
      // Prevents audio chunks from blocking subtitle/signaling events (head-of-line blocking).
      // A dropped chunk means one missed subtitle — far better than delayed subtitles for all.
      socket!.volatile.emit('audio_stream', {
        meetingId: meetingId.value,
        audioData: buffer,
        speakerLanguage: speakingLanguage.value,
        ttsEnabled: ttsEnabled.value,
        isScreenAudio: false,
      })
    })
  }

  function startVADRecording() {
    if (!isCapturing || !audioStream) return

    // VAD parameters — mic only
    const SILENCE_THRESHOLD = 0.015
    const SILENCE_DURATION_MS = 450
    const MIN_SPEECH_MS = 800
    const MAX_SPEECH_MS = 2000

    vadAudioContext = new AudioContext()
    const source = vadAudioContext.createMediaStreamSource(audioStream)
    const analyser = vadAudioContext.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)
    const dataArray = new Float32Array(analyser.frequencyBinCount)

    let isSpeaking = false
    let silenceStart = 0
    let speechStart = 0
    let chunks: Blob[] = []

    const startRecording = () => {
      mediaRecorder = new MediaRecorder(audioStream!, { mimeType: 'audio/webm' })
      chunks = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }
      mediaRecorder.start()
      speechStart = Date.now()
    }

    const flushRecording = () => {
      if (mediaRecorder?.state === 'recording') {
        mediaRecorder.onstop = () => {
          const duration = Date.now() - speechStart

          if (chunks.length > 0 && duration >= MIN_SPEECH_MS) {
            sendAudioChunk(new Blob(chunks, { type: 'audio/webm' }))
          }

          chunks = []
        }

        mediaRecorder.stop()
      }
    }

    const tick = () => {
      if (!isCapturing) return
      analyser.getFloatTimeDomainData(dataArray)
      const rms = Math.sqrt(
        dataArray.reduce((sum, value) => sum + value * value, 0) / dataArray.length,
      )
      const now = Date.now()

      if (rms > SILENCE_THRESHOLD) {
        silenceStart = 0

        if (!isSpeaking) {
          isSpeaking = true
          startRecording()
        } else if (now - speechStart > MAX_SPEECH_MS) {
          // Max duration hit — flush and restart to avoid huge chunks
          flushRecording()
          isSpeaking = false
        }
      } else if (isSpeaking) {
        if (silenceStart === 0) silenceStart = now

        if (now - silenceStart > SILENCE_DURATION_MS) {
          isSpeaking = false
          flushRecording()
        }
      }

      vadAnimFrame = requestAnimationFrame(tick)
    }

    vadAnimFrame = requestAnimationFrame(tick)
  }

  function stopAudioCapture() {
    isCapturing = false
    if (vadAnimFrame !== null) {
      cancelAnimationFrame(vadAnimFrame)
      vadAnimFrame = null
    }
    vadAudioContext?.close()
    vadAudioContext = null
    audioStream?.getTracks().forEach((track) => track.stop())
    audioStream = null

    if (mediaRecorder?.state !== 'inactive') {
      mediaRecorder?.stop()
    }

    mediaRecorder = null
  }

  function playAudio(base64Mp3: string) {
    const audio = new Audio(`data:audio/mp3;base64,${base64Mp3}`)
    audio.play().catch(() => {
      // Autoplay may be blocked; user interaction required
    })
  }

  function attachTrackToElement(
    publication: TrackPublication,
    element: HTMLVideoElement | HTMLAudioElement,
  ) {
    if (publication.track) {
      publication.track.attach(element)
    }
  }

  /**
   * Creates a new vote and broadcasts it to all participants.
   */
  function createVote(
    question: string,
    options: string[],
    type: 'single' | 'multiple' | 'story_point',
    participantIds: number[] = [],
  ) {
    if (!socket?.connected || localUserId === null) return
    socket.emit('vote_create', {
      meetingId: meetingId.value,
      userId: localUserId,
      creatorName:
        socketParticipants.value.find((participant) => participant.userId === localUserId)
          ?.username ?? '',
      question,
      options,
      type,
      participantIds,
    })
  }

  /**
   * Casts a vote by selecting option(s). Overwrites previous selection.
   */
  function castVote(voteId: string, optionIds: string[]) {
    if (!socket?.connected || localUserId === null) return
    socket.emit('vote_cast', {
      meetingId: meetingId.value,
      voteId,
      userId: localUserId,
      optionIds,
    })
  }

  /**
   * Closes an active vote. Only the creator can close it.
   */
  function closeVote(voteId: string) {
    if (!socket?.connected || localUserId === null) return
    socket.emit('vote_close', {
      meetingId: meetingId.value,
      voteId,
      userId: localUserId,
    })
  }

  function disconnect() {
    stopAudioCapture()

    if (socket) {
      socket.emit('leave_meeting', { meetingId: meetingId.value })
      socket.disconnect()
      socket = null
    }

    if (room.value) {
      room.value.disconnect()
      room.value = null
    }

    remoteAudioElements.clear()
    isConnected.value = false
    isMicEnabled.value = false
    isCameraEnabled.value = false
    isScreenSharing.value = false
    isSpeakerEnabled.value = true
    hasRemoteScreenShare.value = false
    remoteScreenShareTracks.value = {}
    cursors.value = {}
    markers.value = []
    votes.value = []

    if (markerPurgeInterval !== null) {
      clearInterval(markerPurgeInterval)
      markerPurgeInterval = null
    }
  }

  return {
    isConnected,
    socketParticipants,
    room,
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
    isNoiseSuppressed,
    isMicEnabled,
    isCameraEnabled,
    isScreenSharing,
    isSpeakerEnabled,
    subtitles,
    connect,
    joinLiveKit,
    toggleMic,
    toggleNoiseSuppression,
    toggleCamera,
    toggleSpeaker,
    startScreenShare,
    stopScreenShare,
    switchMicDevice,
    setRemoteSpeakerDevice,
    onBlackScreenDetected,
    attachTrackToElement,
    disconnect,
    cursors,
    markers,
    sendCursorMove,
    sendCursorHide,
    sendScreenMarker,
    clearScreenMarkers,
    getLocalAnnotationColor,
    getParticipantColor,
    endMeeting,
    votes,
    showVotePanel,
    createVote,
    castVote,
    closeVote,
  }
}
