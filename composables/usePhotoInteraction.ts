import { apiClient } from '@/utils/apiClient'
import type { Comment, CommentReactionEntry, ReactionType } from '@/types/memories'
import { useUserStore } from '@/stores/user'
import { useMoment } from '@/composables/useMoment'
import { useAppNotifications } from '@/composables/useAppNotifications'

type ApiResponse<T> = { success: boolean; data: T }

type ReactionCountMap = Partial<Record<ReactionType, number>>

function normalizeReactions(raw: unknown): Record<string, CommentReactionEntry[]> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const result: Record<string, CommentReactionEntry[]> = {}
  for (const [type, entries] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(entries)) continue
    result[type] = entries
      .map((entry) =>
        typeof entry === 'object' && entry !== null
          ? (entry as CommentReactionEntry)
          : { id: Number(entry), name: String(entry) },
      )
      .filter((entry) => entry.id > 0)
  }
  return result
}

function computeInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.at(-1)?.[0] ?? ''
  return parts.length >= 2 ? (first + last).toUpperCase() : first.toUpperCase() || '?'
}

export function usePhotoInteraction() {
  const userStore = useUserStore()
  const { moment } = useMoment()
  const { notifyError } = useAppNotifications()

  /** START DEFINE STATE */
  const reactionCounts = ref<Record<string, ReactionCountMap>>({})
  const photoReactors = ref<Record<string, Record<string, { id: string; name: string }[]>>>({})
  const comments = ref<Record<string, Comment[]>>({})
  const commentCounts = ref<Record<string, number>>({})
  const userReactions = ref<Record<string, ReactionType | null>>({})
  // commentId → { lang: translatedText }
  const commentTranslations = ref<Record<string, Record<string, string>>>({})
  // commentId → true while translation request is in flight
  const commentTranslating = ref<Record<string, boolean>>({})
  /** END DEFINE STATE */

  /** START DEFINE METHOD */

  async function fetchBulkReactions(albumId: string): Promise<void> {
    try {
      const result = await apiClient.get<
        ApiResponse<{
          counts: Record<string, Record<string, number>>
          userReactions: Record<string, string | null>
        }>
      >(`memories/albums/${albumId}/reactions-summary`)

      for (const [photoId, typeCounts] of Object.entries(result.data.counts)) {
        reactionCounts.value[photoId] = typeCounts as ReactionCountMap
      }
      for (const [photoId, type] of Object.entries(result.data.userReactions)) {
        userReactions.value[photoId] = type as ReactionType | null
      }
    } catch {
      // silently fail — grid shows no reaction counts until next refresh
    }
  }

  async function fetchBulkCommentCounts(albumId: string): Promise<void> {
    try {
      const result = await apiClient.get<ApiResponse<Record<string, number>>>(
        `memories/albums/${albumId}/comments-count`,
      )
      for (const [photoId, count] of Object.entries(result.data)) {
        commentCounts.value[photoId] = count
      }
    } catch {
      // silently fail
    }
  }

  async function fetchReactions(photoId: string): Promise<void> {
    try {
      const result = await apiClient.get<
        ApiResponse<{
          counts: Record<string, number>
          reactorsByType: Record<string, { id: string; name: string }[]>
        }>
      >(`memories/photos/${photoId}/reactions`)
      reactionCounts.value[photoId] = result.data.counts as ReactionCountMap
      photoReactors.value[photoId] = result.data.reactorsByType

      const currentUserId = String(userStore.user?.id ?? '')
      const foundType = Object.keys(result.data.reactorsByType).find((type) =>
        result.data.reactorsByType[type]?.some((reactor) => reactor.id === currentUserId),
      )
      userReactions.value[photoId] = (foundType as ReactionType) ?? null
    } catch {
      reactionCounts.value[photoId] = {}
      photoReactors.value[photoId] = {}
    }
  }

  async function toggleReaction(photoId: string, type: ReactionType): Promise<void> {
    const currentType = userReactions.value[photoId]
    const myId = String(userStore.user?.id ?? '')
    const myName = userStore.user?.full_name ?? ''

    // Optimistic update — counts
    const currentCounts = { ...(reactionCounts.value[photoId] ?? {}) }
    // Optimistic update — reactors
    const currentReactors: Record<string, { id: string; name: string }[]> = JSON.parse(
      JSON.stringify(photoReactors.value[photoId] ?? {}),
    )

    if (currentType === type) {
      userReactions.value[photoId] = null
      currentCounts[type] = Math.max(0, (currentCounts[type] ?? 1) - 1)
      currentReactors[type] = (currentReactors[type] ?? []).filter((reactor) => reactor.id !== myId)
    } else {
      if (currentType) {
        currentCounts[currentType] = Math.max(0, (currentCounts[currentType] ?? 1) - 1)
        currentReactors[currentType] = (currentReactors[currentType] ?? []).filter(
          (reactor) => reactor.id !== myId,
        )
      }
      userReactions.value[photoId] = type
      currentCounts[type] = (currentCounts[type] ?? 0) + 1
      currentReactors[type] = [...(currentReactors[type] ?? []), { id: myId, name: myName }]
    }
    reactionCounts.value[photoId] = currentCounts
    photoReactors.value[photoId] = currentReactors

    try {
      const result = await apiClient.post<
        ApiResponse<{ userReactionType: string | null; counts: Record<string, number> }>
      >(`memories/photos/${photoId}/reactions`, { type })
      reactionCounts.value[photoId] = result.data.counts as ReactionCountMap
      userReactions.value[photoId] = result.data.userReactionType as ReactionType | null
    } catch {
      await fetchReactions(photoId)
    }
  }

  async function fetchComments(photoId: string): Promise<void> {
    try {
      const result = await apiClient.get<
        ApiResponse<
          Array<{
            id: string
            photoId: string
            userId: string
            text: string
            detectedLanguage?: string | null
            createdAt: string
            updatedAt: string
            user: { id: number; name: string; avatar: string | null }
          }>
        >
      >(`memories/photos/${photoId}/comments`)

      comments.value[photoId] = result.data.map((row) => ({
        id: row.id,
        photoId: row.photoId,
        userId: row.userId,
        text: row.text,
        reactions: normalizeReactions((row as { reactions?: unknown }).reactions),
        detectedLanguage: row.detectedLanguage ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: {
          name: row.user?.name ?? '',
          avatar: row.user?.avatar ?? undefined,
          initials: computeInitials(row.user?.name ?? ''),
        },
      }))
    } catch {
      comments.value[photoId] = []
    }
  }

  async function addComment(photoId: string, text: string): Promise<void> {
    const currentUserId = String(userStore.user?.id ?? '')
    const existing = comments.value[photoId] ?? []

    const optimistic: Comment = {
      id: `optimistic-${Date.now()}`,
      photoId,
      userId: currentUserId,
      reactions: {},
      user: {
        name: userStore.user?.full_name ?? '',
        avatar: (userStore.user as { avatar?: string } | null)?.avatar ?? undefined,
        initials: computeInitials(userStore.user?.full_name ?? ''),
      },
      text: text.trim(),
      createdAt: moment().toISOString(),
      updatedAt: moment().toISOString(),
    }
    comments.value[photoId] = [...existing, optimistic]
    commentCounts.value[photoId] = (commentCounts.value[photoId] ?? existing.length) + 1

    try {
      const result = await apiClient.post<
        ApiResponse<{
          id: string
          photoId: string
          userId: string
          text: string
          createdAt: string
          updatedAt: string
        }>
      >(`memories/photos/${photoId}/comments`, { text: text.trim() })

      comments.value[photoId] = comments.value[photoId]!.map((comment) =>
        comment.id === optimistic.id
          ? { ...result.data, reactions: {}, detectedLanguage: null, user: optimistic.user }
          : comment,
      )
      // Deduplicate: socket may have pushed real comment before HTTP response arrived
      const seen = new Set<string>()
      comments.value[photoId] = comments.value[photoId]!.filter((item) => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
    } catch {
      comments.value[photoId] = existing
      commentCounts.value[photoId] = Math.max(0, (commentCounts.value[photoId] ?? 1) - 1)
    }
  }

  async function editComment(photoId: string, commentId: string, text: string): Promise<void> {
    const existing = comments.value[photoId] ?? []
    const original = existing.find((comment) => comment.id === commentId)

    // Optimistic update
    comments.value[photoId] = existing.map((comment) =>
      comment.id === commentId
        ? { ...comment, text: text.trim(), detectedLanguage: null }
        : comment,
    )
    // Clear stale translation cache for this comment
    commentTranslations.value = Object.fromEntries(
      Object.entries(commentTranslations.value).filter(([key]) => key !== commentId),
    )

    try {
      const result = await apiClient.patch<
        ApiResponse<{ id: string; text: string; updatedAt: string }>
      >(`memories/comments/${commentId}`, { text: text.trim() })
      comments.value[photoId] = (comments.value[photoId] ?? []).map((comment) =>
        comment.id === commentId ? { ...comment, text: result.data.text } : comment,
      )
    } catch {
      // Rollback
      if (original) {
        comments.value[photoId] = existing
      }
    }
  }

  async function deleteComment(photoId: string, commentId: string): Promise<void> {
    const existing = comments.value[photoId] ?? []

    comments.value[photoId] = existing.filter((comment) => comment.id !== commentId)
    commentCounts.value[photoId] = Math.max(
      0,
      (commentCounts.value[photoId] ?? existing.length) - 1,
    )

    try {
      await apiClient.delete(`memories/comments/${commentId}`)
    } catch {
      comments.value[photoId] = existing
      commentCounts.value[photoId] = existing.length
      notifyError(useI18n().t('memories.errors.deleteComment'))
    }
  }

  /**
   * Fetches translations for a comment on demand.
   * Cached in commentTranslations for the session so subsequent toggles are instant.
   */
  async function translateComment(commentId: string): Promise<void> {
    if (commentTranslations.value[commentId] || commentTranslating.value[commentId]) return

    commentTranslating.value[commentId] = true
    try {
      const result = await apiClient.post<ApiResponse<Record<string, string>>>(
        `memories/comments/${commentId}/translate`,
        {},
      )
      commentTranslations.value[commentId] = result.data
    } catch {
      // silently fail — user stays on original text
    } finally {
      commentTranslating.value[commentId] = false
    }
  }

  async function toggleCommentReaction(commentId: string, type: string): Promise<void> {
    let previousReactions: Record<string, CommentReactionEntry[]> | null = null
    let targetComment: Comment | undefined

    for (const photoComments of Object.values(comments.value)) {
      const found = photoComments.find((commentItem) => commentItem.id === commentId)
      if (found) {
        targetComment = found
        previousReactions = JSON.parse(JSON.stringify(found.reactions))
        break
      }
    }

    try {
      const result = await apiClient.post<Record<string, CommentReactionEntry[]>>(
        `memories/comments/${commentId}/react`,
        { type },
      )
      if (targetComment) {
        targetComment.reactions = result
      }
    } catch {
      if (targetComment && previousReactions) {
        targetComment.reactions = previousReactions
      }
      notifyError(useI18n().t('memories.errors.toggleReaction'))
    }
  }

  /** END DEFINE METHOD */

  return {
    reactionCounts,
    photoReactors,
    comments,
    commentCounts,
    userReactions,
    commentTranslations,
    commentTranslating,
    fetchBulkReactions,
    fetchBulkCommentCounts,
    fetchReactions,
    toggleReaction,
    fetchComments,
    addComment,
    editComment,
    deleteComment,
    translateComment,
    toggleCommentReaction,
  }
}
