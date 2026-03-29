import type { UserModel } from '@/interfaces/models/UserModel'

export interface AttendanceLogEditModel {
  id: number
  attendance_log_id: number
  admin_id: number
  old_clock_in: string | null
  new_clock_in: string | null
  old_clock_out: string | null
  new_clock_out: string | null
  reason: string
  created_at?: string
  admin?: UserModel
}

export interface AttendanceLogModel {
  id: number
  user_id: number
  date: string
  clock_in: string | null
  clock_out: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  schedule_type: 'company' | 'custom' | null
  attendance_count: number
  created_at?: string
  updated_at?: string
  user?: UserModel
}

export interface TodayStatusModel {
  date: string
  clockIn: string | null
  clockOut: string | null
  isWfhToday: boolean
}

export interface TodayQrModel {
  token: string
  date: string
  companyId: number
}

export interface ClockQrResultModel {
  log: AttendanceLogModel
  action: 'clock_in' | 'clock_out'
}
