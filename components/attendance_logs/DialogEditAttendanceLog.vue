<template>
  <v-dialog :model-value="dialog" max-width="480px" persistent @update:model-value="close">
    <v-card rounded="xl">
      <v-card-title class="pa-6 pb-2 text-h6 font-weight-bold">
        {{ $t('attendanceLogs.editTitle') }}
      </v-card-title>
      <v-card-subtitle class="px-6 pb-0 text-caption text-medium-emphasis">
        {{ $t('attendanceLogs.editSubtitle') }}
      </v-card-subtitle>
      <v-card-text class="pa-6">
        <v-row dense>
          <v-col cols="6">
            <v-text-field
              v-model="clockIn"
              :label="$t('attendanceLogs.clockIn')"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              hide-details
              placeholder="HH:MM"
              clearable
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="clockOut"
              :label="$t('attendanceLogs.clockOut')"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              hide-details
              placeholder="HH:MM"
              clearable
            />
          </v-col>
          <v-col cols="12" class="mt-2">
            <v-textarea
              v-model="reason"
              :label="$t('attendanceLogs.editReason')"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              hide-details
              rows="3"
              auto-grow
            />
          </v-col>
        </v-row>
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          rounded="lg"
          class="mt-3"
          density="compact"
        >
          {{ errorMessage }}
        </v-alert>
      </v-card-text>
      <div class="d-flex justify-end ga-2 px-6 py-4">
        <v-btn variant="text" rounded="lg" @click="close">{{ $t('common.cancel') }}</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          rounded="lg"
          :loading="isSaving"
          :disabled="!reason.trim()"
          @click="confirm"
        >
          {{ $t('common.save') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { AttendanceLogModel } from '@/interfaces/models/AttendanceLogModel'
import AttendanceLogService from '@/services/AttendanceLogService'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  item: {
    type: Object as PropType<AttendanceLogModel | null>,
    required: false,
    default: null,
  },
  dialog: {
    type: Boolean,
    required: true,
  },
})
const emit = defineEmits(['confirm', 'close-modal'])
/* END DEFINE PROPERTY AND EMITS */

const { t } = useI18n()

/** START DEFINE STATE */
const clockIn = ref<string>('')
const clockOut = ref<string>('')
const reason = ref<string>('')
const isSaving = ref(false)
const errorMessage = ref('')
/* END DEFINE STATE */

/** START DEFINE METHOD */
const close = () => {
  emit('close-modal')
}

/** Normalize to HH:MM so "08:00:00" and "08:00" compare as equal */
const normalizeTime = (time: string): string => time.substring(0, 5)

const confirm = async () => {
  if (!props.item || !reason.value.trim()) return

  const originalClockIn = normalizeTime(props.item.clock_in ?? '')
  const originalClockOut = normalizeTime(props.item.clock_out ?? '')
  const newClockIn = normalizeTime(clockIn.value)
  const newClockOut = normalizeTime(clockOut.value)

  if (newClockIn === originalClockIn && newClockOut === originalClockOut) {
    errorMessage.value = t('attendanceLogs.editNoChanges')

    return
  }

  try {
    isSaving.value = true
    errorMessage.value = ''

    const payload: { clock_in?: string; clock_out?: string; reason: string } = {
      reason: reason.value.trim(),
    }
    if (clockIn.value) payload.clock_in = clockIn.value
    if (clockOut.value) payload.clock_out = clockOut.value

    const updated = await AttendanceLogService.adminEdit(props.item.id, payload)
    emit('confirm', updated)
  } catch (error) {
    console.error('Failed to edit attendance log:', error)
    errorMessage.value = 'Failed to save changes. Please try again.'
  } finally {
    isSaving.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watchEffect(() => {
  if (props.item && props.dialog) {
    clockIn.value = props.item.clock_in ?? ''
    clockOut.value = props.item.clock_out ?? ''
    reason.value = ''
    errorMessage.value = ''
  }
})
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>
