export type EventType = 'team_building' | 'birthday' | 'trip' | 'award' | 'launch' | 'other'
export type Privacy = 'public' | 'private'
export type ReactionType = 'heart' | 'care' | 'laugh' | 'wow' | 'angry' | 'sad'

export interface AlbumMember {
  id: string
  name: string
  avatar?: string | null
}

export interface AlbumViewer {
  id: string
  name: string
  avatar: string | null
}

export interface Album {
  id: string
  title: string
  description?: string
  eventType: EventType
  coverPhotoId?: string
  coverPhotoUrl?: string
  date: string
  privacy: Privacy
  createdById: string
  memberIds: string[]
  members?: AlbumMember[]
  photoCount: number
  viewCount?: number
  recentViewers?: AlbumViewer[]
  createdAt: string
  updatedAt: string
}

export interface Photo {
  id: string
  albumId: string
  url: string
  thumbnailUrl?: string
  caption?: string
  uploadedById: string
  uploadedByName?: string | null
  uploadedByAvatar?: string | null
  width?: number
  height?: number
  size: number
  mimeType: string
  viewCount?: number
  createdAt: string
}

export interface Reaction {
  id: string
  photoId: string
  userId: string
  type: ReactionType
  createdAt: string
}

export interface ReactionSummary {
  userReactionType: string | null
  counts: Record<ReactionType, number>
}

export interface CommentReactionEntry {
  id: number
  name: string
}

export interface Comment {
  id: string
  photoId: string
  userId: string
  user: { name: string; avatar?: string; initials: string }
  text: string
  reactions: Record<string, CommentReactionEntry[]>
  detectedLanguage?: string | null
  createdAt: string
  updatedAt: string
}

export interface AlbumComment {
  id: string
  albumId: string
  userId: string
  user: { id: number; name: string; avatar?: string | null }
  text: string
  detectedLanguage?: string | null
  createdAt: string
  updatedAt: string
}

export interface SharePayload {
  photoId: string
  albumId: string
  chatRoomId: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
