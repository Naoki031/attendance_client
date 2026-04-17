export interface NotificationAction {
  label: string
  primary?: boolean
  handler: () => void
}

export interface NotificationRow {
  label: string
  value: string
  chip?: { color: string }
}

export interface GlobalNotificationItem {
  id: string
  icon: string
  iconColor: string
  title: string
  rows?: NotificationRow[]
  body?: string
  actions?: NotificationAction[]
}
