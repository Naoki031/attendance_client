export interface NotificationModel {
  id: number
  user_id: number
  type: string
  title: string
  body?: string
  icon?: string
  icon_color?: string
  route?: string
  data?: Record<string, unknown>
  is_read: boolean
  read_at?: string
  created_at: string
}

export interface NotificationListResult {
  items: NotificationModel[]
  unreadCount: number
}
