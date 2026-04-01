import ChatRoomService from '@/services/ChatRoomService'
import type { UnreadMessageModel } from '@/interfaces/models/UnreadMessageModel'

const unreadCounts = ref<Record<string, number>>({})
const unreadMessages = ref<Array<UnreadMessageModel>>([])
const readMessages = ref<Array<UnreadMessageModel>>([])
let fetchPromise: Promise<void> | null = null

export function useChatUnread() {
  const totalUnread = computed(() =>
    Object.values(unreadCounts.value).reduce((sum, count) => sum + count, 0),
  )

  const fetchUnreadCounts = async (): Promise<void> => {
    if (fetchPromise) return fetchPromise

    fetchPromise = (async () => {
      try {
        const [counts, messages, read] = await Promise.all([
          ChatRoomService.getUnreadCounts(),
          ChatRoomService.getUnreadMessages(),
          ChatRoomService.getReadMessages(),
        ])
        unreadCounts.value = counts
        unreadMessages.value = messages
        readMessages.value = read
      } catch (error) {
        console.error('Failed to fetch unread counts:', error)
      } finally {
        fetchPromise = null
      }
    })()

    return fetchPromise
  }

  let messageFetchTimer: ReturnType<typeof setTimeout> | null = null

  const markAsRead = async (roomUuid: string) => {
    try {
      await ChatRoomService.markAsRead(roomUuid)
      const { [roomUuid]: _, ...rest } = unreadCounts.value
      unreadCounts.value = rest
      unreadMessages.value = unreadMessages.value.filter((message) => message.roomUuid !== roomUuid)
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const incrementUnread = (roomUuid: string) => {
    const current = unreadCounts.value[roomUuid] ?? 0
    unreadCounts.value = {
      ...unreadCounts.value,
      [roomUuid]: current + 1,
    }

    // Sync both counts and messages from server
    if (messageFetchTimer) clearTimeout(messageFetchTimer)
    messageFetchTimer = setTimeout(() => fetchUnreadCounts(), 500)
  }

  return {
    unreadCounts,
    unreadMessages,
    readMessages,
    totalUnread,
    fetchUnreadCounts,
    markAsRead,
    incrementUnread,
  }
}
