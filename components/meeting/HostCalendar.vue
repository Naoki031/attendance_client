<template>
  <div class="host-calendar">
    <!-- Month navigation -->
    <div class="d-flex align-center justify-space-between mb-2">
      <v-btn
        icon="mdi-chevron-left"
        variant="text"
        size="small"
        density="comfortable"
        @click="previousMonth"
      />
      <span class="text-body-2 font-weight-semibold">{{ monthLabel }}</span>
      <v-btn
        icon="mdi-chevron-right"
        variant="text"
        size="small"
        density="comfortable"
        @click="nextMonth"
      />
    </div>

    <!-- Day-of-week headers -->
    <div class="cal-grid mb-1">
      <div v-for="dowLabel in dowLabels" :key="dowLabel" class="cal-header-cell">
        {{ dowLabel }}
      </div>
    </div>

    <!-- Day cells -->
    <div class="cal-grid">
      <v-tooltip
        v-for="calDay in calendarDays"
        :key="calDay.dateStr"
        :text="calDay.hostEntry ? calDay.hostEntry.name : ''"
        :disabled="!calDay.hostEntry"
        location="top"
      >
        <template #activator="{ props: tooltipProps }">
          <div
            v-bind="tooltipProps"
            class="cal-day-cell"
            :class="{
              'cal-day-cell--other': !calDay.isCurrentMonth,
              'cal-day-cell--today': calDay.isToday,
              'cal-day-cell--has-host': !!calDay.hostEntry,
            }"
          >
            <span class="cal-day-num">{{ calDay.day }}</span>
            <v-avatar
              v-if="calDay.hostEntry"
              :color="calDay.hostEntry.avatar ? undefined : hostColor(calDay.hostEntry.userId)"
              size="22"
              class="cal-host-avatar"
            >
              <v-img v-if="calDay.hostEntry.avatar" :src="calDay.hostEntry.avatar" cover />
              <span v-else class="cal-host-initials">{{ calDay.hostEntry.initials }}</span>
            </v-avatar>
          </div>
        </template>
      </v-tooltip>
    </div>

    <!-- Legend -->
    <div v-if="legendItems.length > 0" class="d-flex flex-wrap ga-3 mt-3 pt-3 cal-legend">
      <div
        v-for="legendItem in legendItems"
        :key="legendItem.userId"
        class="d-flex align-center ga-1"
      >
        <v-avatar :color="legendItem.avatar ? undefined : hostColor(legendItem.userId)" size="16">
          <v-img v-if="legendItem.avatar" :src="legendItem.avatar" cover />
          <span v-else class="cal-legend-initials">{{ legendItem.initials }}</span>
        </v-avatar>
        <span class="text-caption text-medium-emphasis">{{ legendItem.name }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type {
  MeetingHostSchedule,
  HostScheduleType,
} from '@/interfaces/models/MeetingHostScheduleModel'
/** END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps<{
  schedules: MeetingHostSchedule[]
  meetingHostId: number
}>()
/** END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { locale } = useI18n()
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())

const SCHEDULE_TYPE_PRIORITY: Record<HostScheduleType, number> = {
  one_time: 4,
  date_list: 3,
  date_range: 2,
  recurring: 1,
}

const HOST_COLORS = ['teal', 'blue', 'purple', 'deep-orange', 'pink', 'cyan', 'green', 'indigo']
/** END DEFINE STATE */

/** START DEFINE COMPUTED */
const monthLabel = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value, 1)
  return date.toLocaleDateString(locale.value, { month: 'long', year: 'numeric' })
})

const dowLabels = computed(() => {
  const labels: string[] = []
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    // 2006-01-01 was a Sunday — use as anchor for DOW label order
    const date = new Date(2006, 0, 1 + dayIndex)
    labels.push(date.toLocaleDateString(locale.value, { weekday: 'short' }))
  }
  return labels
})

interface HostEntry {
  userId: number
  name: string
  initials: string
  avatar?: string
}

interface CalendarDay {
  dateStr: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  hostEntry: HostEntry | null
}

const calendarDays = computed((): CalendarDay[] => {
  const today = new Date().toISOString().slice(0, 10)
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const leadingDays = firstDay.getDay()
  const days: CalendarDay[] = []

  for (let offset = leadingDays - 1; offset >= 0; offset--) {
    const date = new Date(firstDay)
    date.setDate(date.getDate() - offset - 1)
    const dateString = date.toISOString().slice(0, 10)
    days.push({
      dateStr: dateString,
      day: date.getDate(),
      isCurrentMonth: false,
      isToday: dateString === today,
      hostEntry: resolveHostForDate(dateString),
    })
  }

  for (let dayNumber = 1; dayNumber <= lastDay.getDate(); dayNumber++) {
    const date = new Date(currentYear.value, currentMonth.value, dayNumber)
    const dateString = date.toISOString().slice(0, 10)
    days.push({
      dateStr: dateString,
      day: dayNumber,
      isCurrentMonth: true,
      isToday: dateString === today,
      hostEntry: resolveHostForDate(dateString),
    })
  }

  const totalCells = 42
  const trailingCount = totalCells - days.length
  for (let offset = 1; offset <= trailingCount; offset++) {
    const date = new Date(lastDay)
    date.setDate(date.getDate() + offset)
    const dateString = date.toISOString().slice(0, 10)
    days.push({
      dateStr: dateString,
      day: date.getDate(),
      isCurrentMonth: false,
      isToday: dateString === today,
      hostEntry: resolveHostForDate(dateString),
    })
  }

  return days
})

const userColorIndexMap = computed(() => {
  const map = new Map<number, number>()
  let index = 0
  for (const schedule of props.schedules) {
    if (!map.has(schedule.user_id)) {
      map.set(schedule.user_id, index % HOST_COLORS.length)
      index++
    }
  }
  return map
})

const legendItems = computed(() => {
  const seen = new Set<number>()
  const items: HostEntry[] = []
  for (const schedule of props.schedules) {
    if (schedule.is_active && !seen.has(schedule.user_id)) {
      seen.add(schedule.user_id)
      const name = schedule.user?.full_name ?? `#${schedule.user_id}`
      items.push({
        userId: schedule.user_id,
        name,
        initials: getInitials(name),
        avatar: schedule.user?.avatar,
      })
    }
  }
  return items
})
/** END DEFINE COMPUTED */

/** START DEFINE METHOD */
function matchesDate(schedule: MeetingHostSchedule, dateString: string): boolean {
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

function resolveHostForDate(dateString: string): HostEntry | null {
  const activeSchedules = props.schedules.filter((schedule) => schedule.is_active)
  const matching = activeSchedules.filter((schedule) => matchesDate(schedule, dateString))
  if (matching.length === 0) return null
  matching.sort(
    (scheduleA, scheduleB) =>
      SCHEDULE_TYPE_PRIORITY[scheduleB.schedule_type] -
      SCHEDULE_TYPE_PRIORITY[scheduleA.schedule_type],
  )
  const winner = matching[0]!
  const name = winner.user?.full_name ?? `#${winner.user_id}`
  return { userId: winner.user_id, name, initials: getInitials(name), avatar: winner.user?.avatar }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

function hostColor(userId: number): string {
  const colorIndex = userColorIndexMap.value.get(userId) ?? 0
  return HOST_COLORS[colorIndex]!
}

function previousMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}
/** END DEFINE METHOD */
</script>

<style scoped>
.host-calendar {
  user-select: none;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-header-cell {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 2px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.cal-day-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 5px 2px 4px;
  border-radius: 6px;
  min-height: 54px;
  cursor: default;
  transition: background 0.15s;
}

.cal-day-cell--other .cal-day-num {
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
}

.cal-day-cell--today {
  background: rgba(var(--v-theme-primary), 0.1);
}

.cal-day-cell--today .cal-day-num {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}

.cal-day-cell--has-host:not(.cal-day-cell--today):hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.cal-day-num {
  font-size: 12px;
  line-height: 1.4;
  color: rgb(var(--v-theme-on-surface));
}

.cal-host-avatar {
  flex-shrink: 0;
}

.cal-host-initials {
  font-size: 8px;
  font-weight: 700;
  line-height: 1;
  color: white;
}

.cal-legend {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.cal-legend-initials {
  font-size: 7px;
  font-weight: 700;
  color: white;
}
</style>
