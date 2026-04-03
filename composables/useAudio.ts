/**
 * Composable for audio feedback during face KYC and check-in flows.
 *
 * Two channels:
 *  - Beep tones  : Web Audio API — no files needed, works offline
 *  - Speech      : Web Speech API (SpeechSynthesis) — reads instructions aloud
 *
 * Both channels gracefully no-op when the APIs are unavailable (old browsers,
 * server-side, or when the user's OS has muted the browser).
 */

const LANG_MAP: Record<string, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  ja: 'ja-JP',
}

let sharedAudioContext: AudioContext | null = null

/**
 * Returns (or lazily creates) a shared AudioContext.
 * Must be called from a user-gesture context the first time.
 */
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null

  try {
    if (!sharedAudioContext) {
      const AudioContextClass =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      sharedAudioContext = new AudioContextClass()
    }

    // Resume in case the context was suspended by the browser autoplay policy
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {})
    }

    return sharedAudioContext
  } catch {
    return null
  }
}

/**
 * Plays a single sine-wave tone.
 *
 * @param frequency - Tone frequency in Hz
 * @param duration  - Duration in seconds
 * @param volume    - Gain value 0–1
 */
const playTone = (frequency: number, duration: number, volume = 0.25): void => {
  const context = getAudioContext()
  if (!context) return

  try {
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, context.currentTime)
    gainNode.gain.setValueAtTime(volume, context.currentTime)
    // Fade out smoothly to avoid click artifacts
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration)

    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + duration)
  } catch {
    // Ignore — audio context may be in an unexpected state
  }
}

export const useAudio = () => {
  /**
   * Short attention beep played when a new liveness challenge starts.
   * A4 → A5 two-tone cue.
   */
  const playPrompt = (): void => {
    playTone(440, 0.08, 0.2)
    setTimeout(() => playTone(880, 0.12, 0.25), 90)
  }

  /**
   * Three-note ascending chord played when a challenge is passed.
   * C5 → E5 → G5 — universally recognised "success" pattern.
   */
  const playSuccess = (): void => {
    playTone(523, 0.1)
    setTimeout(() => playTone(659, 0.1), 110)
    setTimeout(() => playTone(784, 0.18), 220)
  }

  /**
   * Reads the given text aloud using the browser's speech synthesis.
   * Automatically maps app locale codes to BCP-47 language tags.
   *
   * @param text   - Text to speak
   * @param locale - App locale code (vi / en / ja). Defaults to 'vi'.
   */
  const speak = (text: string, locale = 'vi'): void => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = LANG_MAP[locale] ?? 'vi-VN'
    utterance.rate = 1.05
    utterance.pitch = 1
    utterance.volume = 1

    window.speechSynthesis.speak(utterance)
  }

  /** Cancels any in-progress speech immediately. */
  const stopSpeech = (): void => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  return { playPrompt, playSuccess, speak, stopSpeech }
}
