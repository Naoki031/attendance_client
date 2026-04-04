<template>
  <v-card rounded="lg" height="100%">
    <!-- Face photo with authenticated loading -->
    <v-img :src="imageSource" height="220" cover class="bg-grey-lighten-3">
      <template #error>
        <div class="d-flex align-center justify-center fill-height">
          <v-icon size="48" color="secondary">mdi-image-off-outline</v-icon>
        </div>
      </template>
    </v-img>

    <v-card-text class="pa-4">
      <div class="text-subtitle-2 font-weight-bold">{{ user.full_name }}</div>
      <div class="text-caption text-medium-emphasis mb-2">{{ user.position ?? '—' }}</div>

      <div
        v-if="user.kyc_status === 'rejected' && user.kyc_rejection_reason"
        class="text-caption text-error mb-2"
      >
        <v-icon size="12" class="mr-1">mdi-alert-circle</v-icon>
        {{ user.kyc_rejection_reason }}
      </div>
    </v-card-text>

    <!-- Approve / Reject actions — only shown for pending tab -->
    <v-card-actions v-if="tabFilter === 'pending'" class="px-4 pb-4 pt-0 ga-2">
      <v-btn
        color="error"
        variant="tonal"
        rounded="lg"
        size="small"
        :loading="loadingId === user.id && reviewAction === 'rejected'"
        :disabled="!!loadingId"
        @click="emit('reject', user)"
      >
        {{ $t('face.kyc.reject') }}
      </v-btn>
      <v-spacer />
      <v-btn
        color="success"
        variant="flat"
        rounded="lg"
        size="small"
        :loading="loadingId === user.id && reviewAction === 'approved'"
        :disabled="!!loadingId"
        @click="emit('approve', user)"
      >
        {{ $t('face.kyc.approve') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { UserModel } from '@/interfaces/models/UserModel'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  user: { type: Object as PropType<UserModel>, required: true },
  tabFilter: { type: String as PropType<'pending' | 'approved' | 'rejected'>, required: true },
  loadingId: { type: Number as PropType<number | null>, default: null },
  reviewAction: { type: String as PropType<'approved' | 'rejected' | null>, default: null },
})

const emit = defineEmits<{
  approve: [user: UserModel]
  reject: [user: UserModel]
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { $apiFetch } = useNuxtApp()
const imageSource = ref('')
/* END DEFINE STATE */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(async () => {
  const url = props.user.face_avatar_url
  if (!url) return

  if (url.startsWith('http://') || url.startsWith('https://')) {
    imageSource.value = url

    return
  }

  try {
    const relativePath = url.replace(/^\/api\/v\d+\//, '')
    const blob = await ($apiFetch as typeof $fetch)<Blob>(relativePath, { responseType: 'blob' })
    imageSource.value = URL.createObjectURL(blob)
  } catch {
    // v-img error slot will show fallback icon
  }
})

onUnmounted(() => {
  if (imageSource.value.startsWith('blob:')) {
    URL.revokeObjectURL(imageSource.value)
  }
})
/* END DEFINE LIFE CYCLE HOOK */
</script>
