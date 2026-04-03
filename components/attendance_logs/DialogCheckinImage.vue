<template>
  <v-dialog :model-value="dialog" max-width="520" @update:model-value="emit('close-modal')">
    <v-card v-if="item" rounded="xl">
      <v-card-title class="px-6 pt-5 pb-2 d-flex align-center justify-space-between">
        <span class="text-h6 font-weight-bold">{{ $t('attendanceLogs.checkinImageTitle') }}</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="emit('close-modal')" />
      </v-card-title>

      <v-card-text class="px-6 pb-4">
        <!-- User info row -->
        <div class="d-flex align-center ga-3 mb-4">
          <v-avatar size="36" color="primary" variant="tonal">
            <span class="text-caption font-weight-bold">
              {{ (item.user?.first_name?.[0] ?? '') + (item.user?.last_name?.[0] ?? '') }}
            </span>
          </v-avatar>
          <div>
            <div class="text-body-2 font-weight-medium">
              {{ item.user?.full_name ?? `User #${item.user_id}` }}
            </div>
            <div class="text-caption text-medium-emphasis">{{ item.date }}</div>
          </div>
          <v-spacer />
          <!-- Confidence badge -->
          <v-chip
            v-if="item.confidence != null"
            :color="confidenceColor"
            size="small"
            variant="tonal"
            prepend-icon="mdi-shield-check-outline"
          >
            {{ (item.confidence * 100).toFixed(1) }}%
          </v-chip>
        </div>

        <!-- Face image -->
        <div class="image-container rounded-lg overflow-hidden bg-grey-lighten-3">
          <v-progress-circular
            v-if="isLoading"
            indeterminate
            color="primary"
            class="image-loader"
          />
          <v-img v-else-if="imageSource" :src="imageSource" max-height="380" cover class="w-100" />
          <div v-else class="d-flex align-center justify-center pa-12 text-medium-emphasis">
            <div class="text-center">
              <v-icon size="48" class="mb-2">mdi-image-off-outline</v-icon>
              <div class="text-body-2">{{ $t('attendanceLogs.checkinImageUnavailable') }}</div>
            </div>
          </div>
        </div>

        <!-- Clock detail -->
        <div class="d-flex ga-3 mt-4">
          <v-chip
            v-if="item.clock_in"
            color="success"
            size="small"
            variant="tonal"
            prepend-icon="mdi-login"
          >
            {{ $t('attendanceLogs.clockIn') }}: {{ item.clock_in }}
          </v-chip>
          <v-chip
            v-if="item.clock_out"
            color="error"
            size="small"
            variant="tonal"
            prepend-icon="mdi-logout"
          >
            {{ $t('attendanceLogs.clockOut') }}: {{ item.clock_out }}
          </v-chip>
        </div>

        <!-- IP address -->
        <div v-if="item.ip_address" class="text-caption text-medium-emphasis mt-2">
          <v-icon size="12" class="mr-1">mdi-ip-network-outline</v-icon>{{ item.ip_address }}
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { AttendanceLogModel } from '@/interfaces/models/AttendanceLogModel'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  item: { type: Object as PropType<AttendanceLogModel | null>, default: null },
  dialog: { type: Boolean, required: true },
})

const emit = defineEmits<{ 'close-modal': [] }>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { $apiFetch } = useNuxtApp()
const imageSource = ref('')
const isLoading = ref(false)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const confidenceColor = computed(() => {
  const score = props.item?.confidence ?? 0
  if (score >= 0.85) return 'success'
  if (score >= 0.7) return 'warning'

  return 'error'
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const loadImage = async (url: string) => {
  isLoading.value = true
  imageSource.value = ''

  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      imageSource.value = url

      return
    }

    // Strip /api/vX prefix — $apiFetch already includes the API base URL
    const relativePath = url.replace(/^\/api\/v\d+\//, '')
    const blob = await ($apiFetch as typeof $fetch)<Blob>(relativePath, { responseType: 'blob' })
    imageSource.value = URL.createObjectURL(blob)
  } catch {
    imageSource.value = ''
  } finally {
    isLoading.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (isOpen) => {
    if (isOpen && props.item?.checkin_image_url) {
      void loadImage(props.item.checkin_image_url)
    } else if (!isOpen && imageSource.value.startsWith('blob:')) {
      URL.revokeObjectURL(imageSource.value)
      imageSource.value = ''
    }
  },
)
/* END DEFINE WATCHER */
</script>

<style scoped>
.image-container {
  position: relative;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-loader {
  position: absolute;
}
</style>
