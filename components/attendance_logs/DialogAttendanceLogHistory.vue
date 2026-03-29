<template>
  <v-dialog :model-value="dialog" max-width="600px" @update:model-value="close">
    <v-card rounded="xl">
      <v-card-title class="pa-6 pb-2 text-h6 font-weight-bold">
        {{ $t('attendanceLogs.historyTitle') }}
      </v-card-title>
      <v-card-subtitle class="px-6 pb-0 text-caption text-medium-emphasis">
        {{ item?.user?.full_name }} — {{ item?.date }}
      </v-card-subtitle>
      <v-card-text class="pa-6">
        <div v-if="isLoading" class="d-flex justify-center py-4">
          <v-progress-circular indeterminate color="primary" />
        </div>
        <div
          v-else-if="history.length === 0"
          class="text-center text-medium-emphasis py-4 text-body-2"
        >
          {{ $t('attendanceLogs.noHistory') }}
        </div>
        <v-timeline v-else density="compact" side="end">
          <v-timeline-item
            v-for="entry in history"
            :key="entry.id"
            dot-color="primary"
            size="small"
          >
            <template #opposite>
              <span class="text-caption text-medium-emphasis">
                {{ formatDate(entry.created_at) }}
              </span>
            </template>
            <v-card rounded="lg" elevation="0" border class="pa-3">
              <div class="text-caption font-weight-medium mb-1">
                {{ entry.admin?.full_name ?? `Admin #${entry.admin_id}` }}
              </div>
              <div class="d-flex flex-column ga-1 mb-2">
                <div class="text-caption d-flex align-center ga-1">
                  <span class="text-medium-emphasis" style="min-width: 72px">
                    {{ $t('attendanceLogs.clockIn') }}:
                  </span>
                  <span
                    :class="
                      entry.old_clock_in !== entry.new_clock_in
                        ? 'text-decoration-line-through text-error'
                        : 'text-medium-emphasis'
                    "
                  >
                    {{ entry.old_clock_in ?? '—' }}
                  </span>
                  <v-icon size="12" icon="mdi-arrow-right" />
                  <span
                    :class="
                      entry.old_clock_in !== entry.new_clock_in
                        ? 'text-success font-weight-medium'
                        : 'text-medium-emphasis'
                    "
                  >
                    {{ entry.new_clock_in ?? '—' }}
                  </span>
                  <v-chip
                    v-if="entry.old_clock_in !== entry.new_clock_in"
                    color="warning"
                    size="x-small"
                    variant="tonal"
                    class="ml-1"
                  >
                    {{ $t('common.changed') }}
                  </v-chip>
                </div>
                <div class="text-caption d-flex align-center ga-1">
                  <span class="text-medium-emphasis" style="min-width: 72px">
                    {{ $t('attendanceLogs.clockOut') }}:
                  </span>
                  <span
                    :class="
                      entry.old_clock_out !== entry.new_clock_out
                        ? 'text-decoration-line-through text-error'
                        : 'text-medium-emphasis'
                    "
                  >
                    {{ entry.old_clock_out ?? '—' }}
                  </span>
                  <v-icon size="12" icon="mdi-arrow-right" />
                  <span
                    :class="
                      entry.old_clock_out !== entry.new_clock_out
                        ? 'text-success font-weight-medium'
                        : 'text-medium-emphasis'
                    "
                  >
                    {{ entry.new_clock_out ?? '—' }}
                  </span>
                  <v-chip
                    v-if="entry.old_clock_out !== entry.new_clock_out"
                    color="warning"
                    size="x-small"
                    variant="tonal"
                    class="ml-1"
                  >
                    {{ $t('common.changed') }}
                  </v-chip>
                </div>
              </div>
              <div class="text-caption text-medium-emphasis">
                <v-icon size="14" icon="mdi-comment-outline" class="mr-1" />
                {{ entry.reason }}
              </div>
            </v-card>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>
      <div class="d-flex justify-end px-6 py-4">
        <v-btn variant="text" rounded="lg" @click="close">{{ $t('common.close') }}</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type {
  AttendanceLogModel,
  AttendanceLogEditModel,
} from '@/interfaces/models/AttendanceLogModel'
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
const emit = defineEmits(['close-modal'])
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const history = ref<AttendanceLogEditModel[]>([])
const isLoading = ref(false)
/* END DEFINE STATE */

/** START DEFINE METHOD */
const close = () => {
  emit('close-modal')
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  async (isOpen) => {
    if (isOpen && props.item) {
      try {
        isLoading.value = true
        history.value = await AttendanceLogService.getEditHistory(props.item.id)
      } catch (error) {
        console.error('Failed to load edit history:', error)
      } finally {
        isLoading.value = false
      }
    } else {
      history.value = []
    }
  },
  { immediate: false },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>
