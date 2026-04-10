<template>
  <v-dialog :model-value="modelValue" max-width="640" scrollable>
    <v-card rounded="xl" elevation="2">
      <!-- Header -->
      <div class="dialog-header px-6 pt-6 pb-3">
        <div>
          <div class="text-h6 font-weight-bold text-primary">
            {{ $t('meetings.hostSchedule.manageTitle') }}
          </div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ meeting?.title }}
          </div>
        </div>
        <div class="d-flex align-center ga-2">
          <v-btn-toggle
            v-model="viewMode"
            density="compact"
            rounded="lg"
            mandatory
            variant="outlined"
          >
            <v-btn value="calendar" size="small" icon="mdi-calendar-month-outline" />
            <v-btn value="list" size="small" icon="mdi-format-list-bulleted" />
          </v-btn-toggle>
          <v-btn icon variant="text" size="small" @click="close">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <v-card-text class="px-6 py-2" style="min-height: 200px; max-height: 65vh; overflow-y: auto">
        <!-- Loading -->
        <div v-if="isLoading" class="d-flex justify-center py-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <template v-else>
          <!-- Calendar view -->
          <template v-if="viewMode === 'calendar'">
            <!-- Swap mode banner -->
            <v-alert
              v-if="swapState"
              type="info"
              variant="tonal"
              density="compact"
              rounded="lg"
              class="mb-3"
              :closable="true"
              @click:close="cancelSwap"
            >
              <template v-if="swapState.dateA">
                {{
                  $t('meetings.hostSchedule.swapSelectSecond', {
                    name: swapState.hostNameA,
                    date: swapState.dateA,
                  })
                }}
              </template>
              <template v-else>
                {{ $t('meetings.hostSchedule.swapSelectFirst') }}
              </template>
            </v-alert>

            <MeetingHostCalendar
              :schedules="schedules"
              :meeting-host-id="meeting?.host_id ?? 0"
              interactive
              @date-click="onCalendarDateClick"
            />
          </template>

          <!-- List view -->
          <template v-else>
            <div v-if="schedules.length === 0" class="text-center py-8">
              <v-icon size="48" color="medium-emphasis" class="mb-3"
                >mdi-calendar-account-outline</v-icon
              >
              <div class="text-body-1 text-medium-emphasis">
                {{ $t('meetings.hostSchedule.empty') }}
              </div>
              <div class="text-body-2 text-disabled mt-1">
                {{ $t('meetings.hostSchedule.emptyHint') }}
              </div>
            </div>

            <v-list v-else class="pa-0">
              <v-list-item
                v-for="schedule in schedules"
                :key="schedule.id"
                rounded="lg"
                class="px-3 mb-2"
                :class="{ 'opacity-50': !schedule.is_active }"
              >
                <template #prepend>
                  <v-avatar
                    size="36"
                    :color="scheduleTypeColor(schedule.schedule_type)"
                    variant="tonal"
                  >
                    <v-icon size="18">{{ scheduleTypeIcon(schedule.schedule_type) }}</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="text-body-2 font-weight-medium">
                  {{ schedule.user?.full_name ?? `User #${schedule.user_id}` }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ formatScheduleDescription(schedule) }}
                </v-list-item-subtitle>

                <template #append>
                  <div class="d-flex align-center ga-1">
                    <v-chip
                      v-if="!schedule.is_active"
                      size="x-small"
                      color="default"
                      variant="tonal"
                    >
                      {{ $t('meetings.hostSchedule.inactive') }}
                    </v-chip>
                    <v-btn
                      icon="mdi-pencil-outline"
                      variant="text"
                      size="small"
                      @click="openEdit(schedule)"
                    />
                    <v-btn
                      icon="mdi-delete-outline"
                      variant="text"
                      size="small"
                      color="error"
                      @click="confirmDelete(schedule)"
                    />
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </template>
        </template>
      </v-card-text>

      <!-- Footer -->
      <div class="d-flex justify-space-between align-center px-6 py-4">
        <div v-if="resolvedHostLabel" class="text-body-2 text-medium-emphasis">
          <v-icon size="16" class="mr-1">mdi-crown-outline</v-icon>
          {{ $t('meetings.hostSchedule.todayHost') }}: <strong>{{ resolvedHostLabel }}</strong>
        </div>
        <div v-else />
        <v-btn
          color="primary"
          variant="elevated"
          rounded="lg"
          prepend-icon="mdi-plus"
          @click="showCreateDialog = true"
        >
          {{ $t('meetings.hostSchedule.addSchedule') }}
        </v-btn>
      </div>
    </v-card>

    <!-- Delete confirmation -->
    <v-dialog v-model="showDeleteConfirm" max-width="400" persistent>
      <v-card rounded="xl">
        <v-card-text class="pt-6 pb-2 px-6">
          <div class="text-h6 font-weight-bold mb-2">
            {{ $t('meetings.hostSchedule.deleteTitle') }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ $t('meetings.hostSchedule.deleteConfirm') }}
          </div>
        </v-card-text>
        <v-card-actions class="px-6 pb-4 pt-2 d-flex justify-end ga-2">
          <v-btn variant="text" rounded="lg" @click="showDeleteConfirm = false">{{
            $t('common.cancel')
          }}</v-btn>
          <v-btn
            color="error"
            variant="flat"
            rounded="lg"
            :loading="isDeleting"
            @click="deleteSchedule"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>

  <!-- Create / Edit dialog -->
  <MeetingDialogCreateHostSchedule
    v-model="showCreateDialog"
    :meeting-uuid="meetingUuid"
    :editing-schedule="editingSchedule"
    @saved="onScheduleSaved"
  />

  <!-- Date action menu -->
  <v-dialog v-model="showDateActionDialog" max-width="360">
    <v-card rounded="xl" elevation="2">
      <v-card-text class="pt-5 pb-2 px-6">
        <div class="text-subtitle-1 font-weight-bold mb-1">{{ selectedDateInfo?.date }}</div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          <v-icon size="16" class="mr-1">mdi-account-outline</v-icon>
          {{ selectedDateInfo?.hostName }}
        </div>
        <v-list density="compact" class="pa-0">
          <v-list-item
            prepend-icon="mdi-swap-horizontal"
            rounded="lg"
            :title="$t('meetings.hostSchedule.actionSwap')"
            :subtitle="$t('meetings.hostSchedule.actionSwapHint')"
            @click="startSwapFromDate"
          />
          <v-list-item
            prepend-icon="mdi-calendar-remove-outline"
            rounded="lg"
            color="warning"
            :title="$t('meetings.hostSchedule.actionExclude')"
            :subtitle="$t('meetings.hostSchedule.actionExcludeHint')"
            @click="confirmExcludeDate"
          />
          <v-list-item
            prepend-icon="mdi-calendar-arrow-right"
            rounded="lg"
            color="error"
            :title="$t('meetings.hostSchedule.actionTruncate')"
            :subtitle="$t('meetings.hostSchedule.actionTruncateHint')"
            @click="confirmTruncateDate"
          />
        </v-list>
      </v-card-text>
      <v-card-actions class="px-6 pb-4 pt-0 justify-end">
        <v-btn variant="text" rounded="lg" @click="showDateActionDialog = false">{{
          $t('common.cancel')
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Exclude / Truncate confirm -->
  <v-dialog v-model="showDateConfirmDialog" max-width="400" persistent>
    <v-card rounded="xl">
      <v-card-text class="pt-6 pb-2 px-6">
        <div class="text-h6 font-weight-bold mb-2">{{ dateConfirmTitle }}</div>
        <div class="text-body-2 text-medium-emphasis">{{ dateConfirmBody }}</div>
      </v-card-text>
      <v-card-actions class="px-6 pb-4 pt-2 d-flex justify-end ga-2">
        <v-btn variant="text" rounded="lg" @click="showDateConfirmDialog = false">{{
          $t('common.cancel')
        }}</v-btn>
        <v-btn
          :color="dateConfirmAction === 'truncate' ? 'error' : 'warning'"
          variant="flat"
          rounded="lg"
          :loading="isDateActionLoading"
          @click="executeDateAction"
        >
          {{ $t('common.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Swap confirm -->
  <v-dialog v-model="showSwapConfirmDialog" max-width="420" persistent>
    <v-card rounded="xl">
      <v-card-text class="pt-6 pb-2 px-6">
        <div class="text-h6 font-weight-bold mb-3">
          {{ $t('meetings.hostSchedule.swapConfirmTitle') }}
        </div>
        <div class="d-flex align-center ga-3 mb-2">
          <div class="swap-date-chip">
            <div class="text-caption text-medium-emphasis">{{ swapState?.dateA }}</div>
            <div class="text-body-2 font-weight-medium">{{ swapState?.hostNameA }}</div>
          </div>
          <v-icon color="primary">mdi-swap-horizontal</v-icon>
          <div class="swap-date-chip">
            <div class="text-caption text-medium-emphasis">{{ swapState?.dateB }}</div>
            <div class="text-body-2 font-weight-medium">{{ swapState?.hostNameB }}</div>
          </div>
        </div>
        <div class="text-body-2 text-medium-emphasis mt-2">
          {{ $t('meetings.hostSchedule.swapConfirmBody') }}
        </div>
      </v-card-text>
      <v-card-actions class="px-6 pb-4 pt-2 d-flex justify-end ga-2">
        <v-btn variant="text" rounded="lg" @click="cancelSwap">{{ $t('common.cancel') }}</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          :loading="isDateActionLoading"
          @click="executeSwap"
        >
          {{ $t('meetings.hostSchedule.swapConfirmButton') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import moment from 'moment'
import MeetingHostScheduleService from '@/services/MeetingHostScheduleService'
import type {
  MeetingHostSchedule,
  HostScheduleType,
} from '@/interfaces/models/MeetingHostScheduleModel'
import type { Meeting } from '@/interfaces/models/MeetingModel'
/** END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps<{
  modelValue: boolean
  meetingUuid: string
  meeting?: Meeting | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
/** END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { t } = useI18n()
const isLoading = ref(false)
const isDeleting = ref(false)
const isDateActionLoading = ref(false)
const viewMode = ref<'calendar' | 'list'>('calendar')
const schedules = ref<MeetingHostSchedule[]>([])
const showCreateDialog = ref(false)
const showDeleteConfirm = ref(false)
const editingSchedule = ref<MeetingHostSchedule | null>(null)
const deletingSchedule = ref<MeetingHostSchedule | null>(null)
const resolvedHostName = ref<string | null>(null)

// Date action state
interface SelectedDateInfo {
  date: string
  hostName: string
  scheduleId: number
}
const showDateActionDialog = ref(false)
const showDateConfirmDialog = ref(false)
const showSwapConfirmDialog = ref(false)
const selectedDateInfo = ref<SelectedDateInfo | null>(null)
const dateConfirmAction = ref<'exclude' | 'truncate'>('exclude')

interface SwapState {
  dateA: string
  hostNameA: string
  scheduleIdA: number
  dateB?: string
  hostNameB?: string
  scheduleIdB?: number
}
const swapState = ref<SwapState | null>(null)
/** END DEFINE STATE */

/** START DEFINE COMPUTED */
const resolvedHostLabel = computed(() => resolvedHostName.value)

const dateConfirmTitle = computed(() => {
  if (dateConfirmAction.value === 'truncate') {
    return t('meetings.hostSchedule.truncateConfirmTitle')
  }
  return t('meetings.hostSchedule.excludeConfirmTitle')
})

const dateConfirmBody = computed(() => {
  const date = selectedDateInfo.value?.date ?? ''
  const name = selectedDateInfo.value?.hostName ?? ''
  if (dateConfirmAction.value === 'truncate') {
    return t('meetings.hostSchedule.truncateConfirmBody', { date, name })
  }
  return t('meetings.hostSchedule.excludeConfirmBody', { date, name })
})
/** END DEFINE COMPUTED */

/** START DEFINE METHOD */
function scheduleTypeColor(type: HostScheduleType): string {
  const colorMap: Record<HostScheduleType, string> = {
    one_time: 'teal',
    date_list: 'blue',
    date_range: 'indigo',
    recurring: 'purple',
  }
  return colorMap[type]
}

function scheduleTypeIcon(type: HostScheduleType): string {
  const iconMap: Record<HostScheduleType, string> = {
    one_time: 'mdi-calendar-check',
    date_list: 'mdi-calendar-multiple',
    date_range: 'mdi-calendar-range',
    recurring: 'mdi-calendar-sync',
  }
  return iconMap[type]
}

function formatScheduleDescription(schedule: MeetingHostSchedule): string {
  const dayName = (day: number) => t(`meetings.days.${day}`)

  switch (schedule.schedule_type) {
    case 'one_time':
      return `${t('meetings.hostSchedule.type.one_time')}: ${schedule.date}`

    case 'date_list':
      return `${t('meetings.hostSchedule.type.date_list')}: ${(schedule.dates ?? []).join(', ')}`

    case 'date_range':
      return `${t('meetings.hostSchedule.type.date_range')}: ${schedule.date_from} → ${schedule.date_to}`

    case 'recurring': {
      const day = schedule.day_of_week !== undefined ? dayName(schedule.day_of_week) : '?'
      const interval = schedule.interval_weeks ?? 1
      const intervalLabel =
        interval === 1
          ? t('meetings.hostSchedule.everyWeek')
          : t('meetings.hostSchedule.everyNWeeks', { count: interval })
      return `${intervalLabel} ${day}`
    }

    default:
      return ''
  }
}

function openEdit(schedule: MeetingHostSchedule) {
  editingSchedule.value = schedule
  showCreateDialog.value = true
}

function confirmDelete(schedule: MeetingHostSchedule) {
  deletingSchedule.value = schedule
  showDeleteConfirm.value = true
}

async function deleteSchedule() {
  if (!deletingSchedule.value) return
  isDeleting.value = true
  try {
    await MeetingHostScheduleService.remove(props.meetingUuid, deletingSchedule.value.id)
    schedules.value = schedules.value.filter((item) => item.id !== deletingSchedule.value!.id)
    showDeleteConfirm.value = false
  } catch {
    // non-critical
  } finally {
    isDeleting.value = false
  }
}

function onScheduleSaved(saved: MeetingHostSchedule) {
  const index = schedules.value.findIndex((item) => item.id === saved.id)
  if (index >= 0) {
    schedules.value[index] = saved
  } else {
    schedules.value.unshift(saved)
  }
  editingSchedule.value = null
}

function close() {
  emit('update:modelValue', false)
}

/** Resolves the schedule ID for a given date by finding the best-match active schedule. */
function resolveScheduleIdForDate(date: string): number | null {
  const active = schedules.value.filter((item) => item.is_active)
  const PRIORITY: Record<string, number> = {
    one_time: 4,
    date_list: 3,
    date_range: 2,
    recurring: 1,
  }

  const matching = active.filter((item) => {
    if ((item.excluded_dates ?? []).includes(date)) return false
    switch (item.schedule_type) {
      case 'one_time':
        return item.date === date
      case 'date_list':
        return (item.dates ?? []).includes(date)
      case 'date_range':
        return !!item.date_from && !!item.date_to && date >= item.date_from && date <= item.date_to
      case 'recurring': {
        if (!item.recur_start_date || item.day_of_week === undefined) return false
        if (item.recur_end_date && date > item.recur_end_date) return false
        const target = new Date(date + 'T00:00:00Z')
        if (target.getUTCDay() !== item.day_of_week) return false
        const anchor = new Date(item.recur_start_date + 'T00:00:00Z')
        const daysUntilFirst = (item.day_of_week - anchor.getUTCDay() + 7) % 7
        const first = new Date(anchor)
        first.setUTCDate(first.getUTCDate() + daysUntilFirst)
        if (target < first) return false
        const msPerWeek = 7 * 24 * 60 * 60 * 1000
        const weekDiff = (target.getTime() - first.getTime()) / msPerWeek
        return weekDiff % (item.interval_weeks ?? 1) === 0
      }
      default:
        return false
    }
  })

  if (matching.length === 0) return null
  matching.sort(
    (scheduleA, scheduleB) =>
      (PRIORITY[scheduleB.schedule_type] ?? 0) - (PRIORITY[scheduleA.schedule_type] ?? 0),
  )
  return matching[0]!.id
}

function onCalendarDateClick(date: string, hostEntry: { userId: number; name: string }) {
  const scheduleId = resolveScheduleIdForDate(date)
  if (!scheduleId) return

  if (swapState.value && !swapState.value.dateB) {
    // Second selection in swap mode
    if (swapState.value.dateA === date) return // same date, ignore
    swapState.value.dateB = date
    swapState.value.hostNameB = hostEntry.name
    swapState.value.scheduleIdB = scheduleId
    showSwapConfirmDialog.value = true
    return
  }

  selectedDateInfo.value = { date, hostName: hostEntry.name, scheduleId }
  showDateActionDialog.value = true
}

function startSwapFromDate() {
  if (!selectedDateInfo.value) return
  swapState.value = {
    dateA: selectedDateInfo.value.date,
    hostNameA: selectedDateInfo.value.hostName,
    scheduleIdA: selectedDateInfo.value.scheduleId,
  }
  showDateActionDialog.value = false
}

function cancelSwap() {
  swapState.value = null
  showSwapConfirmDialog.value = false
}

function confirmExcludeDate() {
  dateConfirmAction.value = 'exclude'
  showDateActionDialog.value = false
  showDateConfirmDialog.value = true
}

function confirmTruncateDate() {
  dateConfirmAction.value = 'truncate'
  showDateActionDialog.value = false
  showDateConfirmDialog.value = true
}

async function executeDateAction() {
  if (!selectedDateInfo.value) return
  isDateActionLoading.value = true
  try {
    const { date, scheduleId } = selectedDateInfo.value
    if (dateConfirmAction.value === 'exclude') {
      await MeetingHostScheduleService.excludeDate(props.meetingUuid, scheduleId, date)
    } else {
      await MeetingHostScheduleService.truncateFromDate(props.meetingUuid, scheduleId, date)
    }
    showDateConfirmDialog.value = false
    await load()
  } catch {
    // non-critical
  } finally {
    isDateActionLoading.value = false
  }
}

async function executeSwap() {
  if (!swapState.value?.dateB) return
  isDateActionLoading.value = true
  try {
    await MeetingHostScheduleService.swapDates(
      props.meetingUuid,
      swapState.value.dateA,
      swapState.value.dateB,
    )
    showSwapConfirmDialog.value = false
    swapState.value = null
    await load()
  } catch {
    // non-critical
  } finally {
    isDateActionLoading.value = false
  }
}

async function load() {
  isLoading.value = true
  try {
    schedules.value = await MeetingHostScheduleService.findAll(props.meetingUuid)

    const today = moment().format('YYYY-MM-DD')
    const resolved = await MeetingHostScheduleService.resolve(props.meetingUuid, today)

    const userFromSchedule = schedules.value
      .flatMap((item) => (item.user ? [item.user] : []))
      .find((user) => user.id === resolved.host_user_id)

    const ownerName =
      props.meeting?.host_id === resolved.host_user_id ? props.meeting?.host?.full_name : null

    resolvedHostName.value = userFromSchedule?.full_name ?? ownerName ?? null
  } catch {
    // non-critical
  } finally {
    isLoading.value = false
  }
}
/** END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      load()
    } else {
      // Reset all nested dialog states so stale overlays don't block reopening
      editingSchedule.value = null
      deletingSchedule.value = null
      swapState.value = null
      selectedDateInfo.value = null
      showCreateDialog.value = false
      showDeleteConfirm.value = false
      showDateActionDialog.value = false
      showDateConfirmDialog.value = false
      showSwapConfirmDialog.value = false
    }
  },
)

watch(showCreateDialog, (isOpen) => {
  if (!isOpen) editingSchedule.value = null
})
/** END DEFINE WATCHER */
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.swap-date-chip {
  flex: 1;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 8px;
  padding: 8px 12px;
  text-align: center;
}
</style>
