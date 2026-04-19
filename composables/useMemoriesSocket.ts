import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'

interface PhotoCommentEventData {
  photoId: string
  comment: unknown
}

interface PhotoCommentUpdatedEventData {
  photoId: string
  commentId: string
  text: string
}

interface PhotoCommentDeletedEventData {
  photoId: string
  commentId: string
}

interface AlbumCommentEventData {
  albumId: string
  comment: unknown
}

interface AlbumCommentUpdatedEventData {
  albumId: string
  commentId: string
  text: string
}

interface AlbumCommentDeletedEventData {
  albumId: string
  commentId: string
}

export interface MemoriesSocketCallbacks {
  onPhotoCommentNew?: (data: PhotoCommentEventData) => void
  onPhotoCommentUpdated?: (data: PhotoCommentUpdatedEventData) => void
  onPhotoCommentDeleted?: (data: PhotoCommentDeletedEventData) => void
  onAlbumCommentNew?: (data: AlbumCommentEventData) => void
  onAlbumCommentUpdated?: (data: AlbumCommentUpdatedEventData) => void
  onAlbumCommentDeleted?: (data: AlbumCommentDeletedEventData) => void
}

export function useMemoriesSocket(callbacks: MemoriesSocketCallbacks = {}) {
  const config = useRuntimeConfig()
  const wsUrl = (config.public.wsUrl as string) || 'http://localhost:3001'

  let socket: Socket | null = null

  function connect(albumId: string) {
    if (socket) return

    const token = localStorage.getItem('token') ?? ''

    socket = io(`${wsUrl}/memories`, {
      path: '/ws',
      auth: { token },
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      socket?.emit('join_album', { albumId })
    })

    socket.on('photo_comment_new', (data: PhotoCommentEventData) => {
      callbacks.onPhotoCommentNew?.(data)
    })
    socket.on('photo_comment_updated', (data: PhotoCommentUpdatedEventData) => {
      callbacks.onPhotoCommentUpdated?.(data)
    })
    socket.on('photo_comment_deleted', (data: PhotoCommentDeletedEventData) => {
      callbacks.onPhotoCommentDeleted?.(data)
    })
    socket.on('album_comment_new', (data: AlbumCommentEventData) => {
      callbacks.onAlbumCommentNew?.(data)
    })
    socket.on('album_comment_updated', (data: AlbumCommentUpdatedEventData) => {
      callbacks.onAlbumCommentUpdated?.(data)
    })
    socket.on('album_comment_deleted', (data: AlbumCommentDeletedEventData) => {
      callbacks.onAlbumCommentDeleted?.(data)
    })
  }

  function disconnect(albumId: string) {
    if (!socket) return
    socket.emit('leave_album', { albumId })
    socket.disconnect()
    socket = null
  }

  return { connect, disconnect }
}
