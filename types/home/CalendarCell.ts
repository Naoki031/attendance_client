export type CalendarCell = {
  day: number | null
  dateStr: string
  currentMonth: boolean
  isToday: boolean
  /** Day of week from moment: 0 = Sunday, 6 = Saturday. null for padding cells. */
  dayOfWeek: number | null
}
