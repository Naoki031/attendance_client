import moment from 'moment-timezone'
import type {
  EmployeeRequestModel,
  EmployeeRequestType,
} from '@/interfaces/models/EmployeeRequestModel'
import type { CalendarDayEntry } from '@/types'

/**
 * Returns true if the date falls on Saturday (6) or Sunday (0).
 */
export const isWeekend = (dateString: string): boolean => {
  const day = moment(dateString, 'YYYY-MM-DD').day()

  return day === 0 || day === 6
}

/**
 * Lists all dates between `from` and `to` (inclusive).
 * Extracts date part directly to avoid timezone double-shift — API datetimes are
 * VN local time stored as naive UTC strings.
 */
export const enumerateDates = (from: string, to?: string, excludeWeekends = false): string[] => {
  const start = moment(from.substring(0, 10), 'YYYY-MM-DD')
  const end = to ? moment(to.substring(0, 10), 'YYYY-MM-DD') : start.clone()
  const dates: string[] = []
  const current = start.clone()

  while (current.isSameOrBefore(end)) {
    const dateString = current.format('YYYY-MM-DD')

    if (!excludeWeekends || !isWeekend(dateString)) {
      dates.push(dateString)
    }

    current.add(1, 'day')
  }

  return dates
}

/**
 * Extracts HH:mm directly from a datetime string.
 * No timezone conversion — the string is already in local time.
 */
export const extractTime = (datetime?: string): string => {
  if (!datetime) return ''

  return datetime.substring(11, 16)
}

/**
 * Generic helper that maps date strings to calendar entries for a given request type.
 * Replaces 6 nearly-identical computed maps in the home page.
 */
export const mapRequestsByDate = (
  requests: EmployeeRequestModel[],
  options: {
    type: EmployeeRequestType
    excludeWeekends?: boolean
    getName: (request: EmployeeRequestModel) => string
    getDetail?: (request: EmployeeRequestModel) => string | undefined
  },
): Map<string, CalendarDayEntry[]> => {
  const { type, excludeWeekends, getName, getDetail } = options
  const map = new Map<string, CalendarDayEntry[]>()

  requests
    .filter((request) => request.type === type && request.status !== 'rejected')
    .forEach((request) => {
      if (!request.from_datetime) return

      const name = getName(request)
      const pending = request.status === 'pending'
      const detail = getDetail?.(request)

      enumerateDates(request.from_datetime, request.to_datetime, excludeWeekends).forEach(
        (date) => {
          if (!map.has(date)) map.set(date, [])
          map.get(date)!.push({ name, pending, detail })
        },
      )
    })

  return map
}
