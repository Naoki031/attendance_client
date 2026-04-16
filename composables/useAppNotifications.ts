export interface AppNotificationAction {
  label: string
  handler: () => void
  dismissOnClick?: boolean
}

export interface AppNotification {
  id: string
  icon: string
  iconColor: string
  title: string
  timeout: number
  actions?: AppNotificationAction[]
}

// Module-level singleton — shared across all composable calls
const items = ref<AppNotification[]>([])

export function useAppNotifications() {
  function push(notification: Omit<AppNotification, 'id'>): string {
    const id = Math.random().toString(36).slice(2, 9)
    items.value.push({ ...notification, id })

    if (notification.timeout > 0) {
      setTimeout(() => dismiss(id), notification.timeout)
    }

    return id
  }

  function dismiss(id: string): void {
    const index = items.value.findIndex((notification) => notification.id === id)
    if (index !== -1) items.value.splice(index, 1)
  }

  function notifyError(title: string): void {
    push({ icon: 'mdi-alert-circle-outline', iconColor: 'error', title, timeout: 4000 })
  }

  function notifySuccess(title: string): void {
    push({ icon: 'mdi-check-circle-outline', iconColor: 'success', title, timeout: 4000 })
  }

  return { notifications: readonly(items), push, dismiss, notifyError, notifySuccess }
}
