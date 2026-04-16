<template>
  <div class="host-info">
    <!-- Effective host today -->
    <div class="d-flex align-center ga-2">
      <template v-if="effectiveHostName">
        <v-avatar size="30" color="primary" rounded="lg">
          <span class="text-caption font-weight-bold text-white">{{
            initials(effectiveHostName)
          }}</span>
        </v-avatar>
        <div class="min-width-0">
          <div class="text-body-2 font-weight-bold text-truncate">{{ effectiveHostName }}</div>
          <div class="text-caption text-disabled">{{ $t('meetings.hostSchedule.todayHost') }}</div>
        </div>
      </template>
      <template v-else>
        <v-avatar size="30" rounded="lg" class="no-host-avatar">
          <v-icon size="16" color="medium-emphasis">mdi-account-question-outline</v-icon>
        </v-avatar>
        <div class="min-width-0">
          <div class="text-body-2 text-medium-emphasis text-truncate">
            {{ $t('meetings.hostSchedule.noHostToday') }}
          </div>
          <div class="text-caption text-disabled">{{ $t('meetings.hostSchedule.todayHost') }}</div>
        </div>
      </template>
    </div>

    <!-- Next host hint -->
    <div v-if="nextHostEntry" class="d-flex align-center ga-1 text-caption text-medium-emphasis">
      <v-icon size="12">mdi-arrow-right-circle-outline</v-icon>
      <span>
        {{ $t('meetings.hostSchedule.nextHost') }}:
        <span class="font-weight-medium">{{ nextHostEntry.name }}</span>
        · {{ formatNextDate(nextHostEntry.dateStr) }}
      </span>
    </div>

    <!-- Calendar trigger -->
    <v-menu
      v-if="schedules.length > 0"
      location="bottom start"
      :close-on-content-click="false"
      max-width="280"
    >
      <template #activator="{ props: menuProps }">
        <div
          v-bind="menuProps"
          class="d-flex align-center ga-1 text-caption text-medium-emphasis schedule-trigger"
          style="cursor: pointer; width: fit-content"
        >
          <v-icon size="12">mdi-calendar-account-outline</v-icon>
          <span>{{ $t('meetings.hostSchedule.viewSchedule') }}</span>
          <v-icon size="11">mdi-chevron-down</v-icon>
        </div>
      </template>

      <v-card rounded="lg" elevation="4" class="pa-3" min-width="300">
        <div class="text-caption font-weight-semibold text-medium-emphasis mb-2">
          {{ $t('meetings.hostSchedule.manageTitle').toUpperCase() }}
        </div>
        <MeetingHostCalendar :schedules="schedules" :meeting-host-id="meetingHostId" />
      </v-card>
    </v-menu>
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import moment from 'moment'
import MeetingHostScheduleService from '@/services/MeetingHostScheduleService'
import type {
  MeetingHostSchedule,
  HostScheduleType,
} from '@/interfaces/models/MeetingHostScheduleModel'
import { useMeetingEvents } from '@/composables/useMeetingEvents'
/** END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps<{
  meetingUuid: string
  meetingHostId: number
  permanentHostName?: string
}>()
/** END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { locale } = useI18n()
const { hostScheduleChangedEvent } = useMeetingEvents()
const schedules = ref<MeetingHostSchedule[]>([])
const todayHostId = ref<number | null>(null)
const hasScheduleToday = ref(false)

const SCHEDULE_TYPE_PRIORITY: Record<HostScheduleType, number> = {
  one_time: 4,
  date_list: 3,
  date_range: 2,
  recurring: 1,
}
/** END DEFINE STATE */

/** START DEFINE COMPUTED */
const effectiveHostName = computed(() => {
  if (!hasScheduleToday.value) return null
  const userFromSchedule = schedules.value
    .flatMap((item) => (item.user ? [item.user] : []))
    .find((user) => user.id === todayHostId.value)
  return userFromSchedule?.full_name ?? null
})

const nextHostEntry = computed(() => {
  if (schedules.value.length === 0) return null
  const todayId = todayHostId.value ?? props.meetingHostId
  for (let offset = 1; offset <= 30; offset++) {
    const dateString = moment().add(offset, 'days').format('YYYY-MM-DD')
    const entry = resolveHostForDate(dateString)
    if (entry && entry.userId !== todayId) {
      return { ...entry, dateStr: dateString }
    }
  }
  return null
})
/** END DEFINE COMPUTED */

/** START DEFINE METHOD */
function matchesDate(schedule: MeetingHostSchedule, dateString: string): boolean {
  if ((schedule.excluded_dates ?? []).includes(dateString)) return false

  switch (schedule.schedule_type) {
    case 'one_time':
      return schedule.date === dateString
    case 'date_list':
      return (schedule.dates ?? []).includes(dateString)
    case 'date_range':
      return (
        !!schedule.date_from &&
        !!schedule.date_to &&
        dateString >= schedule.date_from &&
        dateString <= schedule.date_to
      )
    case 'recurring': {
      if (!schedule.recur_start_date || schedule.day_of_week === undefined) return false
      if (schedule.recur_end_date && dateString > schedule.recur_end_date) return false
      const msPerWeek = 7 * 24 * 60 * 60 * 1000
      const anchor = new Date(schedule.recur_start_date + 'T00:00:00Z')
      const target = new Date(dateString + 'T00:00:00Z')
      const daysUntilFirst = (schedule.day_of_week - anchor.getUTCDay() + 7) % 7
      const firstOccurrence = new Date(anchor.getTime() + daysUntilFirst * 24 * 60 * 60 * 1000)
      if (target < firstOccurrence) return false
      const weekDiff = (target.getTime() - firstOccurrence.getTime()) / msPerWeek
      return weekDiff % (schedule.interval_weeks ?? 1) === 0
    }
    default:
      return false
  }
}

function resolveHostForDate(dateString: string): { userId: number; name: string } | null {
  const active = schedules.value.filter((schedule) => schedule.is_active)
  const matching = active.filter((schedule) => matchesDate(schedule, dateString))
  if (matching.length === 0) return null
  matching.sort(
    (scheduleA, scheduleB) =>
      SCHEDULE_TYPE_PRIORITY[scheduleB.schedule_type] -
      SCHEDULE_TYPE_PRIORITY[scheduleA.schedule_type],
  )
  const winner = matching[0]!
  const name = winner.user?.full_name ?? `#${winner.user_id}`
  return { userId: winner.user_id, name }
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

function formatNextDate(dateString: string): string {
  return new Date(dateString + 'T00:00:00').toLocaleDateString(locale.value, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

async function load() {
  try {
    const today = moment().format('YYYY-MM-DD')
    const [schedulesResult, resolved] = await Promise.all([
      MeetingHostScheduleService.findAll(props.meetingUuid),
      MeetingHostScheduleService.resolve(props.meetingUuid, today),
    ])
    schedules.value = schedulesResult.filter((item) => item.is_active)
    todayHostId.value = resolved.host_user_id
    hasScheduleToday.value = resolved.host_user_id !== null
  } catch {
    // non-critical
  }
}
/** END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(hostScheduleChangedEvent, (event) => {
  if (event?.meetingUuid === props.meetingUuid) load()
})
/** END DEFINE WATCHER */

/** START LIFECYCLE */
onMounted(() => {
  load()
})
/** END LIFECYCLE */
</script>

<style scoped>
.host-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.min-width-0 {
  min-width: 0;
}

.schedule-trigger:hover {
  color: rgb(var(--v-theme-primary));
}

.no-host-avatar {
  background-color: rgba(var(--v-theme-on-surface), 0.08) !important;
}
</style>
