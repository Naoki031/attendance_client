import ChatRoomService from '@/services/ChatRoomService'
import type { UnreadMessageModel } from '@/interfaces/models/UnreadMessageModel'

const unreadCounts = ref<Record<string, number>>({})
const unreadMessages = ref<Array<UnreadMessageModel>>([])
let fetchPromise: Promise<void> | null = null

export function useChatUnread() {
  const totalUnread = computed(() =>
    Object.values(unreadCounts.value).reduce((sum, count) => sum + count, 0),
  )

  const fetchUnreadCounts = async (): Promise<void> => {
    if (fetchPromise) return fetchPromise

    fetchPromise = (async () => {
      try {
        const [counts, messages] = await Promise.all([
          ChatRoomService.getUnreadCounts(),
          ChatRoomService.getUnreadMessages(),
        ])
        unreadCounts.value = counts
        unreadMessages.value = messages
      } catch (error) {
        console.error('Failed to fetch unread counts:', error)
      } finally {
        fetchPromise = null
      }
    })()

    return fetchPromise
  }

  const markAsRead = async (roomUuid: string) => {
    try {
      await ChatRoomService.markAsRead(roomUuid)
      // Clear local unread state immediately so badge updates
      const newCounts = { ...unreadCounts.value }
      delete newCounts[roomUuid]
      unreadCounts.value = newCounts
      unreadMessages.value = unreadMessages.value.filter(
        (message) => message.roomUuid !== roomUuid,
      )
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  let messageFetchTimer: ReturnType<typeof setTimeout> | null = null

  const incrementUnread = (roomUuid: string) => {
    const current = unreadCounts.value[roomUuid] ?? 0
    unreadCounts.value = {
      ...unreadCounts.value,
      [roomUuid]: current + 1,
    }

    // Debounce message list refresh for dropdown
    if (messageFetchTimer) clearTimeout(messageFetchTimer)
    messageFetchTimer = setTimeout(async () => {
      try {
        const messages = await ChatRoomService.getUnreadMessages()
        unreadMessages.value = messages
      } catch (error) {
        console.error('Failed to refresh unread messages:', error)
      }
    }, 2000)
  }

  return {
    unreadCounts,
    unreadMessages,
    totalUnread,
    fetchUnreadCounts,
    markAsRead,
    incrementUnread,
  }
}
