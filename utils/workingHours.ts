/**
 * Calculates working hours between two datetime strings in Vietnam timezone.
 * Working hours: 08:00–17:00, Mon–Fri, excluding lunch break 12:00–13:00.
 * Returns hours rounded to the nearest 0.25.
 */
export const calculateWorkingHours = (
  momentInstance: ReturnType<(typeof import('moment'))['default']>,
  timezone: string,
  fromDateString: string,
  fromTimeString: string,
  toDateString: string,
  toTimeString: string,
): number => {
  if (!fromDateString || !toDateString) return 0

  const from = momentInstance.tz(
    `${fromDateString} ${fromTimeString || '08:00'}`,
    'YYYY-MM-DD HH:mm',
    timezone,
  )
  const to = momentInstance.tz(
    `${toDateString} ${toTimeString || '17:00'}`,
    'YYYY-MM-DD HH:mm',
    timezone,
  )

  if (!from.isValid() || !to.isValid() || !from.isBefore(to)) return 0

  const WORK_START = 8 * 60
  const LUNCH_START = 12 * 60
  const LUNCH_END = 13 * 60
  const WORK_END = 17 * 60

  let totalMinutes = 0
  const cursor = from.clone().startOf('day').add(8, 'hours')

  // Start cursor at the actual from time if it's after 08:00 on the first day
  if (from.isAfter(cursor)) cursor.add(from.diff(cursor, 'minutes'), 'minutes')

  while (cursor.isBefore(to)) {
    const dayOfWeek = cursor.day() // 0=Sun, 6=Sat

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      cursor.add(1, 'day').startOf('day').add(8, 'hours')

      continue
    }

    const dayEnd = cursor.clone().startOf('day').add(17, 'hours')
    const periodEnd = to.isBefore(dayEnd) ? to.clone() : dayEnd.clone()

    const startMin = cursor.hours() * 60 + cursor.minutes()
    const endMin = periodEnd.hours() * 60 + periodEnd.minutes()
    const clampedStart = Math.max(startMin, WORK_START)
    const clampedEnd = Math.min(endMin, WORK_END)

    if (clampedEnd > clampedStart) {
      let worked = clampedEnd - clampedStart
      const lunchOverlapStart = Math.max(clampedStart, LUNCH_START)
      const lunchOverlapEnd = Math.min(clampedEnd, LUNCH_END)

      if (lunchOverlapEnd > lunchOverlapStart) {
        worked -= lunchOverlapEnd - lunchOverlapStart
      }

      totalMinutes += Math.max(0, worked)
    }

    cursor.add(1, 'day').startOf('day').add(8, 'hours')
  }

  return Math.round((totalMinutes / 60) * 4) / 4
}
