export interface MeetingAutoCallConfigModel {
  id: number
  meeting_id: number
  minutes_before: number
  retry_count: number
  retry_interval_minutes: number
  is_enabled: boolean
  created_at?: string
  updated_at?: string
}
