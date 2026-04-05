import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { Room, RoomEvent, Track, VideoPresets } from 'livekit-client'
import type {
  Participant,
  RemoteParticipant,
  LocalParticipant,
  TrackPublication,
  RemoteTrack,
  TrackPublishOptions,
} from 'livekit-client'
import type { Ref } from 'vue'

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

export function useMeeting(meetingId: Ref<number>, _meetingUuid: Ref<string>) {
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
  const remoteScreenShareTracks = ref<Record<string, RemoteTrack>>({})

  // Whether audio capture is using screen share audio (vs mic)
  const screenAudioActive = ref(false)

  // Speaking language — null means Whisper auto-detects (recommended)
  // Set this when the user knows what language they/the video will speak
  const speakingLanguage = ref<string | null>(null)

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
        console.log('[subtitle_partial]', entry.id, entry.original)
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
      console.log(
        '[subtitle_update]',
        entry.id,
        entry.original,
        'translations:',
        Object.keys(entry.translations ?? {}),
      )

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
        audioCaptureDefaults: audioCaptureDeviceId ? { deviceId: audioCaptureDeviceId } : undefined,
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
            [participant.identity]: track,
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

          remoteAudioElements.set(track.sid, audioElement)

          // Initialise mic state from the publication's current muted flag
          remoteMicStates.value = {
            ...remoteMicStates.value,
            [participant.identity]: !publication.isMuted,
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
          remoteAudioElements.delete(track.sid)
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

    livekitRoom.on(RoomEvent.LocalTrackPublished, (publication) => {
      // triggerRef: notify Vue watchers that localParticipant's internal state changed
      // (a track was published/unpublished). Cannot use re-assign because markRaw(obj) === obj
      // → Vue sees same reference → skips watcher notification.
      triggerRef(localParticipant)

      // When ScreenShareAudio is published, switch audio capture to screen audio
      if (
        publication.source === Track.Source.ScreenShareAudio &&
        publication.track?.mediaStreamTrack
      ) {
        const mediaStreamTrack = publication.track.mediaStreamTrack
        stopAudioCapture()
        screenAudioActive.value = true
        startAudioCapture(new MediaStream([mediaStreamTrack]))

        // Restore mic when the screen audio track ends (user closes the tab/window being shared)
        mediaStreamTrack.addEventListener(
          'ended',
          () => {
            stopAudioCapture()
            screenAudioActive.value = false
            if (isMicEnabled.value) startAudioCapture()
          },
          { once: true },
        )
      }
    })

    livekitRoom.on(RoomEvent.LocalTrackUnpublished, (publication) => {
      // triggerRef: notify Vue watchers that localParticipant's internal state changed
      // (a track was published/unpublished). Cannot use re-assign because markRaw(obj) === obj
      // → Vue sees same reference → skips watcher notification.
      triggerRef(localParticipant)

      if (publication.source === Track.Source.ScreenShare) {
        // Handles the case where the user clicks Chrome's native "Stop sharing" floating button —
        // that unpublishes the track directly without going through stopScreenShare().
        isScreenSharing.value = false
      }

      if (publication.source === Track.Source.ScreenShareAudio) {
        stopAudioCapture()
        screenAudioActive.value = false
        if (isMicEnabled.value) startAudioCapture()
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

  async function toggleMic() {
    if (!room.value) return
    const enabled = !isMicEnabled.value
    await room.value.localParticipant.setMicrophoneEnabled(enabled)
    isMicEnabled.value = enabled

    if (enabled) {
      startAudioCapture()
    } else {
      stopAudioCapture()
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
  }

  function setRemoteSpeakerDevice(deviceId: string) {
    activeSpeakerDeviceId = deviceId
    remoteAudioElements.forEach((audioElement) => {
      ;(audioElement as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> })
        .setSinkId?.(deviceId)
        .catch(() => {})
    })
  }

  async function startScreenShare() {
    if (!room.value) return

    const screenSharePublishOptions: TrackPublishOptions = {
      videoCodec: 'h264',
      simulcast: false,
      videoEncoding: {
        // 720p with OpenH264: ~50ms/frame vs ~115ms at 1080p → encoder can sustain 15fps.
        // Progressive lag was caused by dynacast increasing targetBitrate 2Mbps→2.5Mbps,
        // forcing encoder to produce higher-quality (slower) frames over time.
        maxBitrate: 1_500_000,
        // 12fps (83ms budget) instead of 15fps (67ms) — extra headroom for I-frame spikes.
        // OpenH264 I-frames take ~150-200ms vs ~50ms for P-frames; at 15fps they cause brief stutters.
        maxFramerate: 12,
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
    } catch (error) {
      // NotAllowedError: user dismissed the picker or macOS Screen Recording permission is denied.
      // Any other error: constraint rejection or LiveKit negotiation failure.
      if (error instanceof Error && error.name !== 'NotAllowedError') {
        console.error('[screen-share] failed to start:', error)
      }

      return
    }

    // contentHint: 'detail' tells the browser encoder this is screen content, not motion video
    // The encoder uses intra-prediction heavily → crisp text, no motion blur
    const screenPub = room.value.localParticipant.getTrackPublication(Track.Source.ScreenShare)

    if (screenPub?.track?.mediaStreamTrack) {
      const mediaStreamTrack = screenPub.track.mediaStreamTrack
      mediaStreamTrack.contentHint = 'detail'

      // Cap capture resolution to 720p via applyConstraints() — done post-capture so it applies
      // to all source types (Tab, Window, Entire Screen) without triggering OverconstrainedError.
      // We pass frameRate as {max: 15} (not a bare number) so Chrome treats it as an upper bound,
      // not an exact requirement — this is what was causing Window/Screen to fail before.
      mediaStreamTrack
        .applyConstraints({
          width: { max: 1280 },
          height: { max: 720 },
          frameRate: { max: 15 },
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
      const bytes = new Uint8Array(buffer)
      let binary = ''

      for (let index = 0; index < bytes.byteLength; index++) {
        binary += String.fromCharCode(bytes[index]!)
      }

      // volatile: drop this audio chunk if the socket buffer is backed up.
      // Prevents audio chunks from blocking subtitle/signaling events (head-of-line blocking).
      // A dropped chunk means one missed subtitle — far better than delayed subtitles for all.
      socket!.volatile.emit('audio_stream', {
        meetingId: meetingId.value,
        audioBase64: btoa(binary),
        speakerLanguage: speakingLanguage.value || null,
        ttsEnabled: ttsEnabled.value,
        isScreenAudio: screenAudioActive.value,
      })
    })
  }

  function startVADRecording() {
    if (!isCapturing || !audioStream) return

    // VAD parameters
    // Screen share: lower threshold (video audio is already mixed, no AEC needed)
    // but require higher sustained level to avoid sending silent/noise segments
    const SILENCE_THRESHOLD = screenAudioActive.value ? 0.008 : 0.01
    const SILENCE_DURATION_MS = screenAudioActive.value ? 600 : 700
    const MIN_SPEECH_MS = screenAudioActive.value ? 1500 : 1000
    // Keep chunks short — Whisper latency scales with chunk size (base model: ~1s per 4s audio).
    // 4s chunks → ~1s transcription delay. 8s chunks → ~2s+ delay → subtitle lags visibly.
    const MAX_SPEECH_MS = screenAudioActive.value ? 4000 : 3500

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
    attachTrackToElement,
    disconnect,
  }
}
