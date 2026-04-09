import type { MeetingParticipantUser } from './MeetingModel'

export type HostScheduleType = 'one_time' | 'date_list' | 'date_range' | 'recurring'

export interface MeetingHostSchedule {
  id: number
  meeting_id: number
  user_id: number
  user?: MeetingParticipantUser
  schedule_type: HostScheduleType
  date?: string
  dates?: string[]
  date_from?: string
  date_to?: string
  day_of_week?: number
  interval_weeks?: number
  recur_start_date?: string
  recur_end_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateHostSchedulePayload {
  user_id: number
  schedule_type: HostScheduleType
  date?: string
  dates?: string[]
  date_from?: string
  date_to?: string
  day_of_week?: number
  interval_weeks?: number
  recur_start_date?: string
  recur_end_date?: string
}

export interface UpdateHostSchedulePayload extends Partial<CreateHostSchedulePayload> {
  is_active?: boolean
}
