import { useI18n } from 'vue-i18n'

export type RingtoneId = 'phone' | 'chime' | 'beep' | 'pulse'

const STORAGE_KEY = 'meeting_ringtone'
const DEFAULT_RINGTONE: RingtoneId = 'phone'

/**
 * Shared AudioContext kept alive across composable instances.
 * Pre-unlocked on the first user gesture so ringtone can play
 * immediately when a socket invite_result event arrives (no gesture).
 */
let unlockedContext: AudioContext | null = null

function getUnlockedContext(): AudioContext {
  if (!unlockedContext || unlockedContext.state === 'closed') {
    unlockedContext = new AudioContext()
  }
  if (unlockedContext.state === 'suspended') {
    unlockedContext.resume().catch(() => {})
  }
  return unlockedContext
}

// Eagerly unlock on the first user gesture so subsequent auto-play calls succeed
if (import.meta.client) {
  const unlock = () => {
    getUnlockedContext()
  }
  window.addEventListener('click', unlock, { once: true, capture: true })
  window.addEventListener('keydown', unlock, { once: true, capture: true })
  window.addEventListener('touchstart', unlock, { once: true, capture: true, passive: true })
}

export function useMeetingRingtone() {
  const { t } = useI18n()

  const selectedRingtone = useState<RingtoneId>('meetingRingtone', () => {
    if (!import.meta.client) return DEFAULT_RINGTONE
    return (localStorage.getItem(STORAGE_KEY) as RingtoneId) ?? DEFAULT_RINGTONE
  })

  function saveRingtone(id: RingtoneId) {
    selectedRingtone.value = id
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, id)
    }
  }

  // ── Ringtone definitions ──────────────────────────────────────────────────

  function playPhone(context: AudioContext, startTime: number) {
    // Classic telephone: alternating 440 / 480 Hz (North American ring)
    const duration = 0.4
    for (let index = 0; index < 2; index++) {
      const noteStart = startTime + index * 0.5
      const oscillator1 = context.createOscillator()
      const oscillator2 = context.createOscillator()
      const gain = context.createGain()

      oscillator1.connect(gain)
      oscillator2.connect(gain)
      gain.connect(context.destination)

      oscillator1.frequency.value = 440
      oscillator2.frequency.value = 480
      oscillator1.type = 'sine'
      oscillator2.type = 'sine'

      gain.gain.setValueAtTime(0, noteStart)
      gain.gain.linearRampToValueAtTime(0.2, noteStart + 0.02)
      gain.gain.setValueAtTime(0.2, noteStart + duration - 0.02)
      gain.gain.linearRampToValueAtTime(0, noteStart + duration)

      oscillator1.start(noteStart)
      oscillator1.stop(noteStart + duration)
      oscillator2.start(noteStart)
      oscillator2.stop(noteStart + duration)
    }
  }

  function playChime(context: AudioContext, startTime: number) {
    // Descending musical notes: C5 → A4 → G4 (like FaceTime / notification bell)
    const notes = [523.25, 440, 392]
    notes.forEach((freq, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.type = 'sine'
      oscillator.frequency.value = freq

      const noteStart = startTime + index * 0.18
      gain.gain.setValueAtTime(0.3, noteStart)
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.5)

      oscillator.start(noteStart)
      oscillator.stop(noteStart + 0.5)
    })
  }

  function playBeep(context: AudioContext, startTime: number) {
    // Simple 2-beep
    const beepAt = (at: number) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, at)
      oscillator.frequency.setValueAtTime(660, at + 0.15)
      gain.gain.setValueAtTime(0.3, at)
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.3)
      oscillator.start(at)
      oscillator.stop(at + 0.3)
    }
    beepAt(startTime)
    beepAt(startTime + 0.4)
  }

  function playPulse(context: AudioContext, startTime: number) {
    // Urgent rising sweep — 3 short ascending pulses
    const freqs = [300, 500, 800]
    freqs.forEach((freq, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.type = 'square'
      oscillator.frequency.value = freq

      const noteStart = startTime + index * 0.15
      gain.gain.setValueAtTime(0.15, noteStart)
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.12)

      oscillator.start(noteStart)
      oscillator.stop(noteStart + 0.12)
    })
  }

  // ── Play a single ring cycle ──────────────────────────────────────────────

  function playOnce(context: AudioContext, id: RingtoneId) {
    const now = context.currentTime
    if (id === 'phone') playPhone(context, now)
    else if (id === 'chime') playChime(context, now)
    else if (id === 'beep') playBeep(context, now)
    else if (id === 'pulse') playPulse(context, now)
  }

  // ── Looping ring (for active call notification) ───────────────────────────

  let activeContext: AudioContext | null = null
  let loopTimer: ReturnType<typeof setInterval> | null = null

  function startRing() {
    stopRing()
    if (!import.meta.client) return

    try {
      // Reuse the pre-unlocked shared context so audio plays even without a gesture at call time
      const context = getUnlockedContext()
      activeContext = context

      const doPlay = () => {
        playOnce(context, selectedRingtone.value)
        const interval = selectedRingtone.value === 'phone' ? 2500 : 2000
        loopTimer = setInterval(() => {
          if (activeContext === context) playOnce(context, selectedRingtone.value)
        }, interval)
      }

      if (context.state === 'running') {
        doPlay()
      } else {
        context
          .resume()
          .then(doPlay)
          .catch(() => {})
      }
    } catch {
      // AudioContext blocked or unsupported — fail silently
    }
  }

  function stopRing() {
    if (loopTimer) {
      clearInterval(loopTimer)
      loopTimer = null
    }
    // Do not close the shared context — just detach the local reference
    activeContext = null
  }

  // ── Preview (one-shot, no loop) ───────────────────────────────────────────

  function preview(id: RingtoneId) {
    if (!import.meta.client) return
    try {
      const context = new AudioContext()
      playOnce(context, id)
      setTimeout(() => context.close().catch(() => {}), 2000)
    } catch {
      // Fail silently
    }
  }

  // ── Ringtone option list (for UI) ─────────────────────────────────────────

  const ringtoneOptions = computed(() => [
    {
      id: 'phone' as RingtoneId,
      label: t('settings.meeting.ringtone.phone'),
      icon: 'mdi-phone-ring',
    },
    {
      id: 'chime' as RingtoneId,
      label: t('settings.meeting.ringtone.chime'),
      icon: 'mdi-bell-ring-outline',
    },
    {
      id: 'beep' as RingtoneId,
      label: t('settings.meeting.ringtone.beep'),
      icon: 'mdi-access-point',
    },
    {
      id: 'pulse' as RingtoneId,
      label: t('settings.meeting.ringtone.pulse'),
      icon: 'mdi-sine-wave',
    },
  ])

  return {
    selectedRingtone,
    ringtoneOptions,
    saveRingtone,
    startRing,
    stopRing,
    preview,
  }
}
