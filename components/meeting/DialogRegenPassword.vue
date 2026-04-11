<template>
  <v-dialog
    :model-value="modelValue"
    max-width="400"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="xl">
      <!-- Step 1: Confirm -->
      <template v-if="step === 'confirm'">
        <v-card-title class="pa-5 pb-2">
          <v-icon color="warning" class="mr-2">mdi-lock-reset</v-icon>
          {{ $t('meetings.regeneratePassword') }}
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis">
            {{ $t('meetings.regeneratePasswordConfirm') }}
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="close">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="warning"
            variant="elevated"
            rounded="lg"
            :loading="isRegenerating"
            @click="fetchNewPassword"
          >
            {{ $t('meetings.regeneratePassword') }}
          </v-btn>
        </v-card-actions>
      </template>

      <!-- Step 2: Show new password -->
      <template v-else>
        <v-card-title class="pa-5 pb-2">
          <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
          {{ $t('meetings.passwordGenerated') }}
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-4">
            {{ $t('meetings.passwordGeneratedDesc') }}
          </p>
          <div class="password-box d-flex align-center justify-space-between pa-3 rounded-lg">
            <span class="text-h6 font-weight-bold" style="letter-spacing: 0.2em">
              {{ password }}
            </span>
            <v-btn
              :icon="copied ? 'mdi-check' : 'mdi-content-copy'"
              :color="copied ? 'success' : 'default'"
              variant="text"
              size="small"
              @click="copyPassword"
            />
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn color="primary" variant="elevated" @click="close">
            {{ $t('common.done') }}
          </v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import MeetingService from '@/services/MeetingService'
/** END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  meetingUuid: {
    type: String,
    required: false,
    default: '',
  },
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
/** END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const step = ref<'confirm' | 'done'>('confirm')
const isRegenerating = ref(false)
const password = ref('')
const copied = ref(false)
/** END DEFINE STATE */

/** START DEFINE METHOD */
function close() {
  step.value = 'confirm'
  password.value = ''
  copied.value = false
  emit('update:modelValue', false)
}

async function copyPassword() {
  await navigator.clipboard.writeText(password.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

async function fetchNewPassword() {
  if (!props.meetingUuid) return
  isRegenerating.value = true
  try {
    const result = await MeetingService.generatePassword(props.meetingUuid)
    password.value = result.plain_password
    step.value = 'done'
  } finally {
    isRegenerating.value = false
  }
}
/** END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      step.value = 'confirm'
      password.value = ''
      copied.value = false
    }
  },
)
/** END DEFINE WATCHER */
</script>

<style scoped>
.password-box {
  background: rgba(var(--v-theme-surface-variant), 0.4);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}
</style>
