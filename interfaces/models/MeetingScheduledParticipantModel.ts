export type ScheduledParticipantStatus = 'pending' | 'accepted' | 'declined'

export interface MeetingScheduledParticipantModel {
  id: number
  meeting_id: number
  user_id: number
  invited_by: number
  status: ScheduledParticipantStatus
  meeting?: {
    id: number
    uuid: string
    title: string
    description?: string
    meeting_type?: string
    status?: string
    scheduled_at?: string
    host?: {
      id: number
      first_name: string
      last_name: string
      avatar?: string
    }
  }
  user?: {
    id: number
    first_name: string
    last_name: string
    email?: string
    avatar?: string
  }
  created_at?: string
  updated_at?: string
}
