<template>
  <v-card rounded="xl" elevation="0" border>
    <!-- Header: navigation + title + view toggle -->
    <div class="d-flex align-center justify-space-between px-5 py-4 border-b">
      <v-btn icon variant="text" size="small" @click="previousPeriod">
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>
      <div class="d-flex align-center ga-3">
        <div class="text-body-1 font-weight-bold">{{ calendarTitle }}</div>
        <v-btn-toggle
          :model-value="view"
          mandatory
          density="compact"
          rounded="lg"
          @update:model-value="onViewChange"
        >
          <v-btn value="month" size="x-small">{{ t('home.monthView') }}</v-btn>
          <v-btn value="week" size="x-small">{{ t('home.weekView') }}</v-btn>
        </v-btn-toggle>
      </div>
      <v-btn icon variant="text" size="small" @click="nextPeriod">
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <!-- Day-of-week headers -->
    <div v-if="view === 'month'" class="calendar-grid calendar-header px-4 pt-3">
      <div
        v-for="(day, index) in weekDayLabels"
        :key="day"
        class="calendar-cell-header text-caption font-weight-bold"
        :class="{
          'calendar-sat': index === 5,
          'calendar-sun': index === 6,
          'text-medium-emphasis': index !== 5 && index !== 6,
        }"
      >
        {{ day }}
      </div>
    </div>

    <!-- Month view grid -->
    <div v-if="view === 'month'" class="calendar-grid px-4 pb-4">
      <div
        v-for="(cell, index) in calendarCells"
        :key="index"
        class="calendar-cell"
        :class="{
          'calendar-cell--other': !cell.currentMonth,
          'calendar-cell--today': cell.isToday,
          'calendar-cell--selected': modelValue === cell.dateStr,
          'calendar-cell--clickable': cell.dateStr !== '',
        }"
        @click="cell.dateStr && selectDate(cell)"
      >
        <span
          v-if="cell.day"
          class="calendar-day-number"
          :class="{
            'calendar-sat': cell.dayOfWeek === 6,
            'calendar-sun': cell.dayOfWeek === 0,
          }"
          >{{ cell.day }}</span
        >
        <!-- Slot for month cell content (entries, labels, etc.) -->
        <slot name="month-cell" :cell="cell" />
      </div>
    </div>

    <!-- Week view grid: single grid ensures header and cells align -->
    <div v-else class="calendar-week-wrapper px-4 pt-3 pb-4">
      <div class="calendar-week-grid">
        <!-- Day-of-week headers (grid row 1) -->
        <div
          v-for="(day, index) in weekDayLabels"
          :key="'header-' + day"
          class="calendar-cell-header text-caption font-weight-bold"
          :class="{
            'calendar-sat': index === 5,
            'calendar-sun': index === 6,
            'text-medium-emphasis': index !== 5 && index !== 6,
          }"
        >
          {{ day }}
        </div>
        <!-- Day cells (grid row 2) -->
        <div
          v-for="cell in calendarCells"
          :key="cell.dateStr"
          class="calendar-week-cell"
          :class="{
            'calendar-cell--today': cell.isToday,
            'calendar-cell--selected': modelValue === cell.dateStr,
          }"
          @click="selectDate(cell)"
        >
          <div class="calendar-week-day-header">
            <span
              class="calendar-day-number"
              :class="{
                'calendar-sat': cell.dayOfWeek === 6,
                'calendar-sun': cell.dayOfWeek === 0,
              }"
              >{{ cell.day }}</span
            >
          </div>
          <slot name="week-cell" :cell="cell" />
        </div>
      </div>
    </div>

    <!-- Footer: legend slot (left) + Today button (right, week view only) -->
    <div class="d-flex align-center ga-4 px-5 pb-4">
      <slot name="footer" />
      <v-spacer />
      <v-btn
        v-if="view === 'week'"
        variant="text"
        size="x-small"
        color="primary"
        @click="goToToday"
      >
        {{ t('home.today') }}
      </v-btn>
    </div>
  </v-card>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { CalendarCell, CalendarView } from '@/types'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = withDefaults(
  defineProps<{
    /** Selected date in YYYY-MM-DD format */
    modelValue: string
    /** Calendar view mode */
    view?: CalendarView
  }>(),
  {
    view: 'week',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:view': [value: CalendarView]
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { moment, TIMEZONE } = useMoment()
const { t, locale } = useI18n()

const todayVn = moment().tz(TIMEZONE)
const currentYear = ref(todayVn.year())
const currentMonth = ref(todayVn.month()) // 0-indexed
const currentWeekStart = ref<string>(todayVn.clone().startOf('isoWeek').format('YYYY-MM-DD'))
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const weekDayLabels = computed(() => [
  t('weekDays.mon'),
  t('weekDays.tue'),
  t('weekDays.wed'),
  t('weekDays.thu'),
  t('weekDays.fri'),
  t('weekDays.sat'),
  t('weekDays.sun'),
])

const calendarTitle = computed(() => {
  const localeMap: Record<string, string> = { en: 'en-US', vi: 'vi-VN', ja: 'ja-JP' }
  const dateLocale = localeMap[locale.value] ?? 'en-US'

  if (props.view === 'week') {
    const weekStart = moment(currentWeekStart.value)
    const weekEnd = weekStart.clone().add(6, 'days')
    const startString = weekStart.toDate().toLocaleDateString(dateLocale, {
      day: 'numeric',
      month: 'short',
    })
    const endString = weekEnd.toDate().toLocaleDateString(dateLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    return `${startString} – ${endString}`
  }

  return moment({ year: currentYear.value, month: currentMonth.value })
    .toDate()
    .toLocaleDateString(dateLocale, {
      month: 'long',
      year: 'numeric',
    })
})

const calendarCells = computed((): CalendarCell[] => {
  const todayString = todayVn.format('YYYY-MM-DD')

  if (props.view === 'week') {
    const weekStart = moment(currentWeekStart.value).tz(TIMEZONE)

    return Array.from({ length: 7 }, (_, index) => {
      const day = weekStart.clone().add(index, 'days')
      const dateString = day.format('YYYY-MM-DD')
      return {
        day: day.date(),
        dateStr: dateString,
        currentMonth: true,
        isToday: dateString === todayString,
        dayOfWeek: day.day(),
      }
    })
  }

  // Month view
  const year = currentYear.value
  const month = currentMonth.value
  const firstOfMonth = moment.tz({ year, month, day: 1 }, TIMEZONE)
  const startOffset = (firstOfMonth.day() + 6) % 7
  const daysInMonth = firstOfMonth.daysInMonth()

  const cells: CalendarCell[] = []

  for (let index = 0; index < startOffset; index++) {
    cells.push({
      day: null,
      dateStr: '',
      currentMonth: false,
      isToday: false,
      dayOfWeek: null,
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayMoment = moment.tz({ year, month, day }, TIMEZONE)
    cells.push({
      day,
      dateStr: dayMoment.format('YYYY-MM-DD'),
      currentMonth: true,
      isToday: dayMoment.format('YYYY-MM-DD') === todayString,
      dayOfWeek: dayMoment.day(),
    })
  }

  const remainder = cells.length % 7
  if (remainder !== 0) {
    for (let index = 0; index < 7 - remainder; index++) {
      cells.push({
        day: null,
        dateStr: '',
        currentMonth: false,
        isToday: false,
        dayOfWeek: null,
      })
    }
  }

  return cells
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const previousMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value -= 1
  } else {
    currentMonth.value -= 1
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value += 1
  } else {
    currentMonth.value += 1
  }
}

const previousPeriod = () => {
  if (props.view === 'week') {
    currentWeekStart.value = moment(currentWeekStart.value).subtract(7, 'days').format('YYYY-MM-DD')
  } else {
    previousMonth()
  }
}

const nextPeriod = () => {
  if (props.view === 'week') {
    currentWeekStart.value = moment(currentWeekStart.value).add(7, 'days').format('YYYY-MM-DD')
  } else {
    nextMonth()
  }
}

const onViewChange = (newView: CalendarView) => {
  if (props.view === newView) return
  emit('update:view', newView)

  // Sync navigation state when switching views
  if (newView === 'week') {
    const anchor = props.modelValue || todayVn.format('YYYY-MM-DD')
    currentWeekStart.value = moment(anchor).tz(TIMEZONE).startOf('isoWeek').format('YYYY-MM-DD')
  } else {
    const weekMoment = moment(currentWeekStart.value)
    currentYear.value = weekMoment.year()
    currentMonth.value = weekMoment.month()
  }
}

const selectDate = (cell: CalendarCell) => {
  const newValue = props.modelValue === cell.dateStr ? '' : cell.dateStr
  emit('update:modelValue', newValue)
}

const goToToday = () => {
  currentWeekStart.value = todayVn.clone().startOf('isoWeek').format('YYYY-MM-DD')
}
/* END DEFINE METHOD */
</script>

<style scoped>
/* Saturday / Sunday label colors — use theme info/error tokens */
.calendar-sat {
  color: rgb(var(--v-theme-info));
}
.calendar-sun {
  color: rgb(var(--v-theme-error));
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-header {
  padding-bottom: 4px;
}

.calendar-cell-header {
  text-align: center;
  padding: 4px 0;
  font-size: clamp(10px, 2vw, 12px);
}

/* Responsive calendar header navigation */
@media (max-width: 600px) {
  .d-flex.align-center.justify-space-between.px-5.py-4 {
    padding: 12px !important;
  }

  .text-body-1.font-weight-bold {
    font-size: 14px !important;
  }
}

.calendar-cell {
  min-height: 72px;
  border-radius: 8px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
}

/* Responsive: smaller cells on mobile */
@media (max-width: 768px) {
  .calendar-cell {
    min-height: 56px;
    padding: 2px;
  }

  .calendar-day-number {
    font-size: 11px;
    width: 22px;
    height: 22px;
  }

  .calendar-name {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .calendar-cell {
    min-height: 44px;
    padding: 1px;
  }

  .calendar-day-number {
    font-size: 10px;
    width: 20px;
    height: 20px;
  }

  .calendar-name {
    font-size: 9px;
    padding: 0 2px;
  }
}

.calendar-cell--clickable {
  cursor: pointer;
}

.calendar-cell--clickable:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.calendar-cell--other {
  opacity: 0.3;
}

.calendar-cell--today .calendar-day-number {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.calendar-cell--selected {
  background-color: rgba(var(--v-theme-primary), 0.12);
  outline: 1.5px solid rgb(var(--v-theme-primary));
}

.calendar-day-number {
  font-size: 13px;
  font-weight: 500;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.calendar-week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

/* Scrollable wrapper for week view on mobile */
.calendar-week-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.calendar-week-cell {
  min-height: 160px;
  min-width: 100px;
  border-radius: 8px;
  padding: 6px 5px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
  transition: background-color 0.15s;
}

/* Responsive: week view on mobile */
@media (max-width: 768px) {
  .calendar-week-cell {
    min-height: 120px;
    padding: 4px 3px;
  }
}

@media (max-width: 480px) {
  .calendar-week-cell {
    min-height: 100px;
    padding: 2px;
  }
}

.calendar-week-cell:hover {
  background-color: rgba(var(--v-theme-primary), 0.06);
}

.calendar-week-day-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
</style>
