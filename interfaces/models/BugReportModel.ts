export interface BugReportModel {
  id: number
  user_id: number
  title: string
  description?: string
  screenshot_path?: string
  status: 'pending' | 'in_progress' | 'resolved'
  admin_note?: string
  user?: {
    id: number
    full_name: string
    email: string
  }
  created_at?: string
  updated_at?: string
}
