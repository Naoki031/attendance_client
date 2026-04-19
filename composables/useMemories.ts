import { apiClient } from '@/utils/apiClient'
import type { Album, Photo, EventType, Privacy, AlbumComment, AlbumViewer } from '@/types/memories'
import { useMoment } from '@/composables/useMoment'

export interface AlbumFilters {
  privacy?: Privacy
  eventType?: EventType
}

export interface CreateAlbumPayload {
  title: string
  description?: string
  eventType: EventType
  date: string
  privacy: Privacy
  memberIds?: string[]
}

export interface UpdateAlbumPayload {
  title?: string
  description?: string
  eventType?: EventType
  date?: string
  privacy?: Privacy
  memberIds?: string[]
}

type ApiResponse<T> = { success: boolean; data: T }
type PaginatedData<T> = { items: T[]; total: number; page: number; limit: number; hasMore: boolean }

const PHOTOS_PER_PAGE = 50

export function useMemories() {
  const { t } = useI18n()
  const { moment } = useMoment()

  /** START DEFINE STATE */
  const albums = ref<Album[]>([])
  const currentAlbum = ref<Album | null>(null)
  const photos = ref<Photo[]>([])
  const loading = ref(false)
  const photosLoading = ref(false)
  const photosPage = ref(1)
  const photosHasMore = ref(false)
  const error = ref<string | null>(null)
  const forbidden = ref(false)
  const albumComments = ref<AlbumComment[]>([])
  const albumCommentsLoading = ref(false)
  const albumCommentTranslations = ref<Record<string, Record<string, string>>>({})
  const albumCommentTranslating = ref<Record<string, boolean>>({})
  /** END DEFINE STATE */

  /** START DEFINE METHOD */

  async function fetchAlbums(filters?: AlbumFilters): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const query: Record<string, string> = {}
      if (filters?.privacy) query.privacy = filters.privacy
      if (filters?.eventType) query.eventType = filters.eventType

      const result = await apiClient.get<ApiResponse<PaginatedData<Album>>>(
        'memories/albums',
        query,
      )
      albums.value = result.data.items
    } catch {
      error.value = t('memories.errors.loadAlbums')
    } finally {
      loading.value = false
    }
  }

  async function fetchAlbum(id: string): Promise<void> {
    loading.value = true
    error.value = null
    forbidden.value = false
    photos.value = []
    photosPage.value = 1
    photosHasMore.value = false

    try {
      const result = await apiClient.get<ApiResponse<Album>>(`memories/albums/${id}`)
      currentAlbum.value = result.data
    } catch (error_) {
      const status =
        (error_ as { statusCode?: number; status?: number })?.statusCode ??
        (error_ as { statusCode?: number; status?: number })?.status
      if (status === 403) {
        forbidden.value = true
      } else {
        error.value = t('memories.errors.loadAlbum')
      }
    } finally {
      loading.value = false
    }

    // Load first page of photos immediately after album metadata
    if (!forbidden.value) await fetchPhotosPage(id, 1)
  }

  async function fetchPhotosPage(albumId: string, page: number): Promise<void> {
    if (photosLoading.value) return
    photosLoading.value = true

    try {
      const result = await apiClient.get<ApiResponse<PaginatedData<Photo>>>(
        `memories/albums/${albumId}/photos`,
        { page: String(page), limit: String(PHOTOS_PER_PAGE) },
      )
      const { items, hasMore } = result.data

      if (page === 1) {
        photos.value = items
      } else {
        photos.value = [...photos.value, ...items]
      }

      photosPage.value = page
      photosHasMore.value = hasMore
    } catch {
      error.value = t('memories.errors.loadAlbum')
    } finally {
      photosLoading.value = false
    }
  }

  async function loadMorePhotos(albumId: string): Promise<void> {
    if (!photosHasMore.value || photosLoading.value) return
    await fetchPhotosPage(albumId, photosPage.value + 1)
  }

  async function createAlbum(payload: CreateAlbumPayload): Promise<Album | null> {
    loading.value = true
    error.value = null

    try {
      const result = await apiClient.post<ApiResponse<Album>>(
        'memories/albums',
        payload as Record<string, unknown>,
      )
      albums.value.unshift(result.data)
      return result.data
    } catch {
      error.value = t('memories.errors.createAlbum')
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateAlbum(id: string, payload: UpdateAlbumPayload): Promise<Album | null> {
    error.value = null

    const index = albums.value.findIndex((album) => album.id === id)
    const previous = index !== -1 ? { ...albums.value[index] } : null

    if (index !== -1 && albums.value[index]) {
      albums.value[index] = {
        ...albums.value[index]!,
        ...payload,
        updatedAt: moment().toISOString(),
      }
    }
    if (currentAlbum.value?.id === id) {
      currentAlbum.value = {
        ...currentAlbum.value,
        ...payload,
        updatedAt: moment().toISOString(),
      }
    }

    try {
      const result = await apiClient.patch<ApiResponse<Album>>(
        `memories/albums/${id}`,
        payload as Record<string, unknown>,
      )

      if (index !== -1) albums.value[index] = result.data
      if (currentAlbum.value?.id === id) currentAlbum.value = result.data

      return result.data
    } catch {
      if (index !== -1 && previous) albums.value[index] = previous as Album
      if (currentAlbum.value?.id === id && previous) currentAlbum.value = previous as Album

      error.value = t('memories.errors.updateAlbum')
      return null
    }
  }

  async function updateMembers(id: string, memberIds: string[]): Promise<Album | null> {
    error.value = null
    try {
      const result = await apiClient.patch<ApiResponse<Album>>(`memories/albums/${id}/members`, {
        memberIds,
      } as Record<string, unknown>)
      if (currentAlbum.value?.id === id) {
        currentAlbum.value = { ...currentAlbum.value, memberIds: result.data.memberIds }
      }
      return result.data
    } catch {
      error.value = t('memories.errors.inviteMembers')
      return null
    }
  }

  async function deleteAlbum(id: string): Promise<boolean> {
    error.value = null

    const previous = [...albums.value]
    albums.value = albums.value.filter((album) => album.id !== id)

    try {
      await apiClient.delete(`memories/albums/${id}`)

      if (currentAlbum.value?.id === id) currentAlbum.value = null
      photos.value = photos.value.filter((photo) => photo.albumId !== id)

      return true
    } catch {
      albums.value = previous
      error.value = t('memories.errors.deleteAlbum')
      return false
    }
  }

  async function fetchAlbumComments(albumId: string): Promise<void> {
    albumCommentsLoading.value = true
    try {
      const result = await apiClient.get<{ success: boolean; data: AlbumComment[] }>(
        `memories/albums/${albumId}/album-comments`,
      )
      albumComments.value = result.data
    } catch {
      // silently ignore — comments panel shows empty state
    } finally {
      albumCommentsLoading.value = false
    }
  }

  async function addAlbumComment(albumId: string, text: string): Promise<AlbumComment | null> {
    const userStore = useUserStore()
    const name = userStore.user?.full_name ?? ''
    const optimistic: AlbumComment = {
      id: `optimistic-${Date.now()}`,
      albumId,
      userId: String(userStore.user?.id ?? ''),
      text: text.trim(),
      detectedLanguage: null,
      createdAt: moment().toISOString(),
      updatedAt: moment().toISOString(),
      user: {
        id: userStore.user?.id ?? 0,
        name,
        avatar: (userStore.user as { avatar?: string } | null)?.avatar ?? null,
      },
    }

    albumComments.value.push(optimistic)

    try {
      const result = await apiClient.post<{ success: boolean; data: AlbumComment }>(
        `memories/albums/${albumId}/album-comments`,
        { text: text.trim() } as Record<string, unknown>,
      )

      // Replace optimistic entry with real response
      const index = albumComments.value.findIndex((item) => item.id === optimistic.id)
      if (index !== -1) {
        albumComments.value[index] = { ...result.data, user: optimistic.user }
      }
      // Deduplicate: socket may have already pushed the real comment before HTTP response
      const seen = new Set<string>()
      albumComments.value = albumComments.value.filter((item) => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })

      // Re-fetch after 2s to pick up async language detection result
      setTimeout(() => {
        fetchAlbumComments(albumId).catch(() => {})
      }, 2000)

      return result.data
    } catch {
      // Roll back optimistic entry on failure
      albumComments.value = albumComments.value.filter((item) => item.id !== optimistic.id)
      return null
    }
  }

  async function updateAlbumComment(commentId: string, text: string): Promise<boolean> {
    try {
      await apiClient.patch(`memories/album-comments/${commentId}`, { text } as Record<
        string,
        unknown
      >)
      const comment = albumComments.value.find((item) => item.id === commentId)
      if (comment) comment.text = text
      return true
    } catch {
      return false
    }
  }

  async function translateAlbumComment(commentId: string): Promise<void> {
    if (albumCommentTranslations.value[commentId] || albumCommentTranslating.value[commentId])
      return

    albumCommentTranslating.value[commentId] = true
    try {
      const result = await apiClient.post<{ success: boolean; data: Record<string, string> }>(
        `memories/album-comments/${commentId}/translate`,
        {},
      )
      albumCommentTranslations.value[commentId] = result.data
    } catch {
      // silently fail — user stays on original text
    } finally {
      albumCommentTranslating.value[commentId] = false
    }
  }

  async function deleteAlbumComment(commentId: string): Promise<boolean> {
    const previous = [...albumComments.value]
    albumComments.value = albumComments.value.filter((item) => item.id !== commentId)
    try {
      await apiClient.delete(`memories/album-comments/${commentId}`)
      return true
    } catch {
      albumComments.value = previous
      return false
    }
  }

  async function deletePhoto(id: string, updateCount = true): Promise<boolean> {
    error.value = null

    const previous = [...photos.value]
    photos.value = photos.value.filter((photo) => photo.id !== id)

    try {
      await apiClient.delete(`memories/photos/${id}`)

      if (updateCount && currentAlbum.value) {
        currentAlbum.value = {
          ...currentAlbum.value,
          photoCount: Math.max(0, currentAlbum.value.photoCount - 1),
        }
      }

      return true
    } catch {
      photos.value = previous
      error.value = t('memories.errors.deletePhoto')
      return false
    }
  }

  async function fetchAlbumViewers(
    albumId: string,
  ): Promise<{ viewCount: number; viewers: AlbumViewer[] } | null> {
    try {
      const result = await apiClient.get<{
        success: boolean
        data: { viewCount: number; viewers: (AlbumViewer & { viewedAt: string })[] }
      }>(`memories/albums/${albumId}/viewers`)
      return result.data
    } catch {
      return null
    }
  }

  /** END DEFINE METHOD */

  /** START HELPERS */

  function getPrivacyLabel(privacy: Privacy): string {
    return privacy === 'public' ? t('memories.public') : t('memories.private')
  }

  function getEventTypeLabel(type: EventType): string {
    return t(`memories.eventType.${type}`)
  }

  function formatDate(date: string): string {
    if (!date) return ''
    return moment(date).format(t('memories.dateFormat'))
  }

  /** END HELPERS */

  return {
    albums,
    currentAlbum,
    photos,
    loading,
    photosLoading,
    photosHasMore,
    error,
    forbidden,
    albumComments,
    albumCommentsLoading,
    albumCommentTranslations,
    albumCommentTranslating,
    fetchAlbums,
    fetchAlbum,
    loadMorePhotos,
    createAlbum,
    updateAlbum,
    updateMembers,
    deleteAlbum,
    deletePhoto,
    fetchAlbumComments,
    addAlbumComment,
    updateAlbumComment,
    deleteAlbumComment,
    translateAlbumComment,
    fetchAlbumViewers,
    getPrivacyLabel,
    getEventTypeLabel,
    formatDate,
  }
}
