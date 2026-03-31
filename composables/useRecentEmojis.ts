const MAX_RECENT = 24

/**
 * Manages a per-user recent emoji list persisted in localStorage.
 * Emojis are stored most-recent-first and capped at MAX_RECENT entries.
 */
export function useRecentEmojis(userId: number | null | undefined) {
  const storageKey = userId ? `emoji_recent_${userId}` : null

  function load(): string[] {
    if (!storageKey || typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as string[]) : []
    } catch {
      return []
    }
  }

  const recentEmojis = ref<string[]>(load())

  /**
   * Records an emoji use — moves it to the front and trims to MAX_RECENT.
   */
  function trackEmoji(emoji: string): void {
    if (!storageKey) return
    const updated = [emoji, ...recentEmojis.value.filter((item) => item !== emoji)].slice(
      0,
      MAX_RECENT,
    )
    recentEmojis.value = updated
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch {
      // localStorage full — silently ignore
    }
  }

  return { recentEmojis, trackEmoji }
}
