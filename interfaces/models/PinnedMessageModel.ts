export interface PinnedMessageModel {
  id: number
  messageId: number
  roomId: number
  pinnedByUserId: number
  pinnedByName: string
  content: string
  userId: number
  username: string
  avatar: string | null
  createdAt: string
  pinnedAt: string
}
