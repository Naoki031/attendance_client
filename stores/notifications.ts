import { defineStore } from 'pinia'
import NotificationService from '@/services/NotificationService'
import type { NotificationModel } from '@/interfaces/models/NotificationModel'

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    items: [] as NotificationModel[],
    unreadCount: 0,
    isLoaded: false,
  }),

  getters: {
    hasUnread(state): boolean {
      return state.unreadCount > 0
    },
  },

  actions: {
    /** Fetches notifications from the API and refreshes the store. */
    async load(): Promise<void> {
      try {
        const result = await NotificationService.getAll()
        this.items = result.items
        this.unreadCount = result.unreadCount
        this.isLoaded = true
      } catch {
        // Fail silently — non-critical feature
      }
    },

    /** Prepends a real-time notification received via socket without refetching. */
    pushFromSocket(notification: NotificationModel): void {
      this.items.unshift(notification)
      this.unreadCount++
    },

    /** Marks a single notification as read locally and persists to API. */
    async markAsRead(id: number): Promise<void> {
      const item = this.items.find((notification) => notification.id === id)
      if (!item || item.is_read) return

      item.is_read = true
      this.unreadCount = Math.max(0, this.unreadCount - 1)

      try {
        await NotificationService.markAsRead(id)
      } catch {
        // Revert on failure
        item.is_read = false
        this.unreadCount++
      }
    },

    /** Marks all notifications as read locally and persists to API. */
    async markAllAsRead(): Promise<void> {
      const unreadIds = this.items
        .filter((notification) => !notification.is_read)
        .map((notification) => notification.id)
      if (!unreadIds.length) return

      this.items.forEach((notification) => {
        notification.is_read = true
      })
      this.unreadCount = 0

      try {
        await NotificationService.markAllAsRead()
      } catch {
        // Revert on failure
        await this.load()
      }
    },
  },
})
