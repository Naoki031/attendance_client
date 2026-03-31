export interface UnreadMessageModel {
  id: number
  content: string
  createdAt: string
  roomUuid: string
  roomName: string
  roomType: string
  senderId: number
  senderName: string
  senderAvatar: string | null
}
