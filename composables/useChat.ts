import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import type {
  ReactionGroup,
  ChatMessage,
  ChatOnlineUser,
  ChatUserInfo,
  ChatMessagesResponse,
} from '@/types/chat'

function transformMessage(raw: Record<string, unknown>): ChatMessage {
  return {
    id: raw.id as number,
    roomId: (raw.roomId ?? raw.room_id) as number,
    userId: (raw.userId ?? raw.user_id) as number,
    username: raw.username as string,
    avatar: (raw.avatar ?? '') as string,
    content: raw.content as string,
    detectedLang: (raw.detectedLang ?? raw.detected_lang ?? 'en') as string,
    translations: (raw.translations ?? {}) as Record<string, string>,
    isEdited: (raw.isEdited ?? raw.is_edited ?? false) as boolean,
    editedAt: (raw.editedAt ?? raw.updated_at) as string | undefined,
    parentId: (raw.parentId ?? raw.parent_id ?? null) as number | null,
    replyCount: Number(raw.reply_count ?? raw.replyCount ?? 0),
    reactions: (raw.reactions ?? []) as ReactionGroup[],
    createdAt: (raw.createdAt ?? raw.created_at) as string,
  }
}

export function useChat() {
  const config = useRuntimeConfig()
  const wsUrl = config.public.wsUrl || 'http://localhost:3001'
  const { $apiFetch } = useNuxtApp()

  // State
  const messages = ref<ChatMessage[]>([])
  const onlineUsers = ref<ChatOnlineUser[]>([])
  const typingUsers = ref<string[]>([])
  const isConnected = ref(false)
  const hasMore = ref(true)
  const isLoadingMore = ref(false)
  const cursor = ref<number | null>(null)

  // Thread state
  const activeThreadParent = ref<ChatMessage | null>(null)
  const threadReplies = ref<ChatMessage[]>([])

  // Mention notification state
  const mentionNotification = ref<{
    roomUuid: string
    roomName: string
    roomType: string
    senderName: string
    senderAvatar: string
    contentPreview: string
  } | null>(null)

  // Internal
  let socket: Socket | null = null
  let currentRoomUuid: string | null = null
  let currentUserInfo: ChatUserInfo | null = null
  let typingDebounceTimer: ReturnType<typeof setTimeout> | null = null
  const typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

  // --- Event Handlers ---

  function handleMessageNew(messageData: ChatMessage) {
    messages.value.push(transformMessage(messageData as unknown as Record<string, unknown>))
  }

  /**
   * Finds a message by ID in both messages and threadReplies, applies updater to each found item,
   * and also updates activeThreadParent if it matches.
   */
  function updateInAllLists(id: number, updater: (message: ChatMessage) => Partial<ChatMessage>) {
    for (const list of [messages.value, threadReplies.value]) {
      const message = list.find((item) => item.id === id)
      if (message) Object.assign(message, updater(message))
    }
    if (activeThreadParent.value?.id === id) {
      activeThreadParent.value = {
        ...activeThreadParent.value,
        ...updater(activeThreadParent.value),
      }
    }
  }

  function handleMessageEdited(data: ChatMessage) {
    updateInAllLists(data.id, () => ({
      content: data.content,
      translations: data.translations,
      isEdited: true,
      editedAt: data.editedAt,
    }))
  }

  function handleTranslationsReady(data: { id: number; translations: Record<string, string> }) {
    updateInAllLists(data.id, (message) => ({
      translations: { ...message.translations, ...data.translations },
    }))
  }

  function handleUserJoined(user: ChatOnlineUser) {
    const exists = onlineUsers.value.some((onlineUser) => onlineUser.userId === user.userId)
    if (!exists) {
      onlineUsers.value.push(user)
    }
  }

  function handleUserLeft(data: { userId: number }) {
    onlineUsers.value = onlineUsers.value.filter((user) => user.userId !== data.userId)
  }

  function handleTyping(data: { username: string; isTyping?: boolean }) {
    if (data.isTyping === false) {
      typingUsers.value = typingUsers.value.filter((username) => username !== data.username)
      const existingTimeout = typingTimeouts.get(data.username)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
        typingTimeouts.delete(data.username)
      }
      return
    }

    if (!typingUsers.value.includes(data.username)) {
      typingUsers.value.push(data.username)
    }

    const existingTimeout = typingTimeouts.get(data.username)
    if (existingTimeout) clearTimeout(existingTimeout)

    typingTimeouts.set(
      data.username,
      setTimeout(() => {
        typingUsers.value = typingUsers.value.filter((username) => username !== data.username)
        typingTimeouts.delete(data.username)
      }, 3000),
    )
  }

  function handleUserUpdated(data: { userId: number; language: string }) {
    const user = onlineUsers.value.find((onlineUser) => onlineUser.userId === data.userId)
    if (user) {
      user.language = data.language
    }
  }

  function handleRoomUsers(users: ChatOnlineUser[]) {
    onlineUsers.value = users
  }

  function handleMentionNotification(data: {
    roomUuid: string
    roomName: string
    roomType: string
    senderId: number
    senderName: string
    senderAvatar: string
    contentPreview: string
    messageId: number
    messageParentId: number | null
    messageCreatedAt: string
  }) {
    mentionNotification.value = data

    // Push directly into unread dropdown so mention appears immediately
    const { unreadMessages } = useChatUnread()
    if (data.messageId) {
      const exists = unreadMessages.value.some((message) => message.id === data.messageId)
      if (!exists) {
        unreadMessages.value = [
          {
            id: data.messageId,
            content: data.contentPreview,
            createdAt: data.messageCreatedAt,
            parentId: data.messageParentId,
            roomUuid: data.roomUuid,
            roomName: data.roomName,
            roomType: data.roomType,
            senderId: data.senderId,
            senderName: data.senderName,
            senderAvatar: data.senderAvatar,
          },
          ...unreadMessages.value,
        ]
      }
    }

    setTimeout(() => {
      if (mentionNotification.value === data) {
        mentionNotification.value = null
      }
    }, 5000)
  }

  function handleReactionUpdated(data: { messageId: number; reactions: ReactionGroup[] }) {
    updateInAllLists(data.messageId, () => ({ reactions: data.reactions }))
  }

  function handleError(data: { message: string }) {
    console.error('Chat error:', data.message)
  }

  function handleThreadReplyNew(data: ChatMessage) {
    const reply = transformMessage(data as unknown as Record<string, unknown>)

    // Add to thread panel if open
    if (activeThreadParent.value && reply.parentId === activeThreadParent.value.id) {
      threadReplies.value.push(reply)
    }

    // Update reply count on parent message in main list
    const parent = messages.value.find((message) => message.id === reply.parentId)
    if (parent) {
      parent.replyCount = parent.replyCount + 1
    }
  }

  // --- Methods ---

  async function connect(roomUuid: string, userInfo: ChatUserInfo) {
    if (socket) {
      disconnect()
    }

    currentRoomUuid = roomUuid
    currentUserInfo = userInfo

    // Reset state
    messages.value = []
    onlineUsers.value = []
    typingUsers.value = []
    hasMore.value = true
    isLoadingMore.value = false
    cursor.value = null

    // Create socket connection to /chat namespace
    const token = import.meta.client ? localStorage.getItem('token') : null
    socket = io(`${wsUrl}/chat`, {
      path: '/ws',
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      isConnected.value = true
      socket?.emit('join_room', { roomUuid, ...currentUserInfo })
    })

    socket.on('disconnect', () => {
      isConnected.value = false
    })

    socket.on('message_new', handleMessageNew)
    socket.on('message_edited', handleMessageEdited)
    socket.on('message_translations_ready', handleTranslationsReady)
    socket.on('thread_reply_new', handleThreadReplyNew)
    socket.on('reaction_updated', handleReactionUpdated)
    socket.on('user_joined', handleUserJoined)
    socket.on('user_left', handleUserLeft)
    socket.on('typing', handleTyping)
    socket.on('user_updated', handleUserUpdated)
    socket.on('room_users', handleRoomUsers)
    socket.on('mention_notification', handleMentionNotification)
    socket.on('error', handleError)

    // Real-time unread updates from other rooms
    const { incrementUnread } = useChatUnread()
    socket.on('unread_update', (data: { roomUuid: string }) => {
      incrementUnread(data.roomUuid)
    })

    // Load initial messages via REST API
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await ($apiFetch as any)(`/messages/${roomUuid}`, {
        params: { limit: 20 },
      })) as ChatMessagesResponse

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages.value = result.messages.map((raw: any) =>
        transformMessage(raw as Record<string, unknown>),
      )
      cursor.value = result.nextCursor
      hasMore.value = result.nextCursor !== null
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  function disconnect() {
    if (socket && currentRoomUuid) {
      socket.emit('leave_room', { roomUuid: currentRoomUuid })
      socket.disconnect()
    }

    socket = null
    currentRoomUuid = null
    currentUserInfo = null
    isConnected.value = false

    if (typingDebounceTimer) {
      clearTimeout(typingDebounceTimer)
      typingDebounceTimer = null
    }

    for (const timeout of typingTimeouts.values()) {
      clearTimeout(timeout)
    }

    typingTimeouts.clear()
  }

  function sendMessage(content: string, mentionedUserIds: number[] = []) {
    if (!socket || !content.trim()) return
    socket.emit('send_message', {
      roomUuid: currentRoomUuid,
      content: content.trim(),
      mentionedUserIds,
    })
  }

  function editMessage(messageId: number, newContent: string) {
    if (!socket || !newContent.trim()) return
    socket.emit('edit_message', {
      roomUuid: currentRoomUuid,
      messageId,
      newContent: newContent.trim(),
    })
  }

  async function loadMore() {
    if (!hasMore.value || isLoadingMore.value || !cursor.value) return

    isLoadingMore.value = true

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await ($apiFetch as any)(`/messages/${currentRoomUuid}`, {
        params: { cursor: cursor.value, limit: 20 },
      })) as ChatMessagesResponse

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const olderMessages = result.messages.map((raw: any) =>
        transformMessage(raw as Record<string, unknown>),
      )

      messages.value = [...olderMessages, ...messages.value]
      cursor.value = result.nextCursor
      hasMore.value = result.nextCursor !== null
    } catch (error) {
      console.error('Failed to load more messages:', error)
    } finally {
      isLoadingMore.value = false
    }
  }

  function setTyping(isTyping: boolean) {
    if (!socket) return

    if (typingDebounceTimer) {
      clearTimeout(typingDebounceTimer)
      typingDebounceTimer = null
    }

    typingDebounceTimer = setTimeout(() => {
      socket?.emit('typing', { roomUuid: currentRoomUuid, isTyping })
    }, 300)
  }

  function updateLanguage(language: string) {
    if (!socket) return
    socket.emit('update_language', { roomUuid: currentRoomUuid, language })
  }

  async function openThread(parentMessage: ChatMessage) {
    activeThreadParent.value = parentMessage
    threadReplies.value = []

    if (!currentRoomUuid) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await ($apiFetch as any)(`/messages/thread/${parentMessage.id}`)) as any[]
      threadReplies.value = result.map((raw: any) =>
        transformMessage(raw as Record<string, unknown>),
      )
    } catch (error) {
      console.error('Failed to load thread replies:', error)
    }
  }

  function closeThread() {
    activeThreadParent.value = null
    threadReplies.value = []
  }

  function sendThreadReply(content: string, mentionedUserIds: number[] = []) {
    if (!socket || !content.trim() || !activeThreadParent.value) return
    socket.emit('send_thread_reply', {
      roomUuid: currentRoomUuid,
      parentMessageId: activeThreadParent.value.id,
      content: content.trim(),
      mentionedUserIds,
    })
  }

  function toggleReaction(messageId: number, emoji: string) {
    if (!socket || !currentRoomUuid) return
    socket.emit('toggle_reaction', { roomUuid: currentRoomUuid, messageId, emoji })
  }

  // Cleanup on component unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    // State
    messages,
    onlineUsers,
    typingUsers,
    isConnected,
    hasMore,
    isLoadingMore,
    activeThreadParent,
    threadReplies,
    mentionNotification,
    // Methods
    connect,
    disconnect,
    sendMessage,
    editMessage,
    loadMore,
    setTyping,
    updateLanguage,
    openThread,
    closeThread,
    sendThreadReply,
    toggleReaction,
  }
}
