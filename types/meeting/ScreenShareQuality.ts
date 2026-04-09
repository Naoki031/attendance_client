export type ScreenShareQuality = 'video' | 'document' | 'balanced'

export interface ScreenShareQualityPreset {
  quality: ScreenShareQuality
  maxWidth: number
  maxHeight: number
  maxFramerate: number
  maxBitrate: number
}

/**
 * Screen share quality presets.
 *
 * video     — 720p/12fps/1.5Mbps: default, optimised for smooth video playback on screen.
 * document  — 1080p/8fps/800Kbps: crisp text and slides with minimal motion blur.
 * balanced  — 720p/15fps/1Mbps: general purpose, good balance between clarity and smoothness.
 */
export const SCREEN_SHARE_PRESETS: Record<ScreenShareQuality, ScreenShareQualityPreset> = {
  video: {
    quality: 'video',
    maxWidth: 1280,
    maxHeight: 720,
    maxFramerate: 12,
    maxBitrate: 1_500_000,
  },
  document: {
    quality: 'document',
    maxWidth: 1920,
    maxHeight: 1080,
    maxFramerate: 8,
    maxBitrate: 800_000,
  },
  balanced: {
    quality: 'balanced',
    maxWidth: 1280,
    maxHeight: 720,
    maxFramerate: 15,
    maxBitrate: 1_000_000,
  },
}
