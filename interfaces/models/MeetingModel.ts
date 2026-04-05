export interface MeetingParticipantUser {
  id: number
  full_name: string
  avatar?: string
}

export interface MeetingParticipant {
  id: number
  user_id: number
  role: 'host' | 'participant'
  left_at?: string | null
  user?: MeetingParticipantUser
}

export interface Meeting {
  id: number
  uuid: string
  title: string
  description?: string
  status: 'scheduled' | 'active'
  meeting_type: 'one_time' | 'recurring' | 'daily' | 'weekly'
  is_private: boolean
  host_id: number
  host?: { full_name: string }
  participants?: MeetingParticipant[]
  scheduled_at?: string
  schedule_time?: string
  schedule_day_of_week?: number
  schedule_interval_weeks?: number
}
