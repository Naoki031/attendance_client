import { apiClient } from '@/utils/apiClient'

interface FeatureFlags {
  qrCheckin: boolean
  faceCheckin: boolean
}

const flags = ref<FeatureFlags | null>(null)

export function useFeatureFlags() {
  const load = async () => {
    if (flags.value !== null) return

    try {
      flags.value = await apiClient.get<FeatureFlags>('features')
    } catch {
      // Default to all enabled on error to avoid blocking users
      flags.value = { qrCheckin: true, faceCheckin: true }
    }
  }

  const qrCheckin = computed(() => flags.value?.qrCheckin ?? true)
  const faceCheckin = computed(() => flags.value?.faceCheckin ?? true)

  return { load, qrCheckin, faceCheckin }
}
