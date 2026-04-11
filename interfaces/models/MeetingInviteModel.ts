export type MeetingInviteStatus = 'pending' | 'accepted' | 'declined' | 'maybe' | 'missed'

export interface MeetingInviteModel {
  id: number
  meeting_id: number
  user_id: number
  invited_by: number
  status: MeetingInviteStatus
  meeting?: {
    id: number
    title: string
    uuid: string
  }
  user?: {
    id: number
    first_name: string
    last_name: string
    email: string
    avatar?: string
  }
  created_at?: string
  updated_at?: string
}
