<template>
  <div
    v-if="user?.kyc_status !== 'approved'"
    class="d-flex align-center ga-4 pa-4 rounded-lg"
    style="background: rgba(var(--v-theme-surface-variant), 0.4); min-width: 260px"
  >
    <!-- Face photo or icon -->
    <v-avatar size="64" rounded="lg" :color="avatarColor" style="flex-shrink: 0">
      <v-img v-if="imageSource && user?.kyc_status" :src="imageSource" cover />
      <v-icon v-else size="28" color="white">mdi-face-recognition</v-icon>
    </v-avatar>

    <div class="flex-grow-1" style="min-width: 0">
      <div class="text-body-2 font-weight-bold mb-1">{{ $t('face.kyc.title') }}</div>
      <v-chip
        v-if="user?.kyc_status"
        :color="chipColor"
        size="x-small"
        :prepend-icon="chipIcon"
        class="mb-1"
      >
        {{ $t(`face.kyc.status${statusKey}`) }}
      </v-chip>
      <div class="text-caption text-medium-emphasis">{{ hintText }}</div>
      <div
        v-if="user?.kyc_status === 'rejected' && user.kyc_rejection_reason"
        class="text-caption text-error mt-1"
      >
        {{ user.kyc_rejection_reason }}
      </div>
      <v-btn
        v-if="user?.kyc_status !== 'pending'"
        color="primary"
        variant="flat"
        size="x-small"
        rounded="lg"
        prepend-icon="mdi-camera"
        class="mt-2"
        @click="emit('open-kyc')"
      >
        {{ user?.kyc_status === 'rejected' ? $t('face.kyc.resubmit') : $t('face.kyc.startKyc') }}
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts" setup>
/** START DEFINE EMITS */
const emit = defineEmits<{ 'open-kyc': [] }>()
/* END DEFINE EMITS */

/** START DEFINE STATE */
const { t } = useI18n()
const { $apiFetch } = useNuxtApp()
const userStore = useUserStore()
const user = computed(() => userStore.user)
const imageSource = ref<string>('')
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const statusKey = computed(() => {
  const status = user.value?.kyc_status
  if (status === 'approved') return 'Approved'
  if (status === 'pending') return 'Pending'
  if (status === 'rejected') return 'Rejected'

  return ''
})

const chipColor = computed(() => {
  const status = user.value?.kyc_status
  if (status === 'approved') return 'success'
  if (status === 'pending') return 'warning'

  return 'error'
})

const chipIcon = computed(() => {
  const status = user.value?.kyc_status
  if (status === 'approved') return 'mdi-check-circle'
  if (status === 'pending') return 'mdi-clock-outline'

  return 'mdi-close-circle'
})

const avatarColor = computed(() => {
  const status = user.value?.kyc_status
  if (status === 'approved') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'rejected') return 'error'

  return 'primary'
})

const hintText = computed(() => {
  const status = user.value?.kyc_status
  if (status === 'approved') return t('face.kyc.approvedHint')
  if (status === 'pending') return t('face.kyc.pendingHint')
  if (status === 'rejected') return t('face.kyc.rejectedHint')

  return t('face.kyc.subtitle')
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const loadImage = async (url: string) => {
  if (!url) return

  if (url.startsWith('http://') || url.startsWith('https://')) {
    imageSource.value = url

    return
  }

  try {
    const relativePath = url.replace(/^\/api\/v\d+\//, '')
    const blob = await ($apiFetch as typeof $fetch)<Blob>(relativePath, { responseType: 'blob' })
    if (imageSource.value.startsWith('blob:')) URL.revokeObjectURL(imageSource.value)
    imageSource.value = URL.createObjectURL(blob)
  } catch {
    imageSource.value = ''
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => user.value?.face_avatar_url,
  (url) => {
    void loadImage(url ?? '')
  },
  { immediate: true },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onUnmounted(() => {
  if (imageSource.value.startsWith('blob:')) URL.revokeObjectURL(imageSource.value)
})
/* END DEFINE LIFE CYCLE HOOK */
</script>
