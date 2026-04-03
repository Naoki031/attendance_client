<template>
  <v-dialog :model-value="dialog" max-width="420" persistent @update:model-value="emit('close')">
    <v-card v-if="user" rounded="xl">
      <v-card-title class="px-6 pt-6 pb-2 text-h6">
        {{ $t('face.kyc.rejectConfirm') }}
      </v-card-title>
      <v-card-text class="px-6 pb-2">
        <div class="text-body-2 text-medium-emphasis mb-4">{{ user.full_name }}</div>
        <v-textarea
          v-model="reason"
          :label="$t('face.kyc.rejectionReasonLabel')"
          rows="3"
          variant="outlined"
          density="compact"
          rounded="lg"
          hide-details
        />
      </v-card-text>
      <v-card-actions class="px-6 pb-5 ga-2">
        <v-btn variant="text" rounded="lg" :disabled="loading" @click="emit('close')">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-spacer />
        <v-btn
          color="error"
          variant="flat"
          rounded="lg"
          :loading="loading"
          @click="emit('confirm', reason)"
        >
          {{ $t('face.kyc.reject') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { UserModel } from '@/interfaces/models/UserModel'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  dialog: { type: Boolean, required: true },
  user: { type: Object as PropType<UserModel | null>, default: null },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits<{
  confirm: [reason: string]
  close: []
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const reason = ref('')
/* END DEFINE STATE */

/** START DEFINE WATCHER */
// Reset reason each time the dialog opens
watch(
  () => props.dialog,
  (isOpen) => {
    if (isOpen) reason.value = ''
  },
)
/* END DEFINE WATCHER */
</script>
