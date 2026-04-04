export type ReactionGroup = {
  emoji: string
  count: number
  userIds: number[]
}

export type ChatMessage = {
  id: number
  roomId: number
  userId: number
  username: string
  avatar: string
  content: string
  detectedLang: string
  translations: Record<string, string>
  isEdited: boolean
  editedAt?: string
  parentId: number | null
  replyCount: number
  reactions: ReactionGroup[]
  createdAt: string
  isPinned?: boolean
}

export type ChatOnlineUser = {
  userId: number
  username: string
  avatar: string
  language: string
}

export type ChatUserInfo = {
  userId: number
  username: string
  avatar: string
  language: string
}

export type ChatMessagesResponse = {
  messages: ChatMessage[]
  nextCursor: number | null
}
