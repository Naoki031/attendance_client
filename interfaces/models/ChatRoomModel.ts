export type ChatRoomType = 'channel' | 'direct'

export type ChatRoomMemberRole = 'admin' | 'member'

export type ChatRoomVisibility = 'public' | 'private'

export interface ChatRoomModel {
  id: number
  uuid: string
  name: string
  description?: string
  type: ChatRoomType
  visibility: ChatRoomVisibility
  creator_id: number
  creator?: {
    id: number
    full_name: string
    email: string
  }
  direct_user?: {
    id: number
    full_name: string
    email: string
    avatar?: string
  } | null
  member_count?: number
  created_at?: string
  updated_at?: string
}

export interface ChatRoomMemberModel {
  id: number
  room_id: number
  user_id: number
  role: ChatRoomMemberRole
  user?: {
    id: number
    full_name: string
    email: string
    avatar?: string
  }
  joined_at: string
}
