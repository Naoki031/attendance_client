<template>
  <v-dialog
    :model-value="!!photo"
    max-width="900px"
    content-class="photo-detail-dialog"
    :fullscreen="$vuetify.display.xs"
    @update:model-value="
      (value) => {
        if (!value) emit('close')
      }
    "
  >
    <div v-if="photo" class="photo-detail">
      <!-- ── Left: image viewer ──────────────────────────────── -->
      <div class="photo-detail__viewer">
        <img :src="photo.url" :alt="photo.caption ?? ''" class="photo-detail__image" />

        <!-- Prev / Next navigation -->
        <button
          v-if="hasPrevious"
          class="photo-detail__nav photo-detail__nav--prev"
          :aria-label="t('memories.prevPhoto')"
          @click="emit('prev')"
        >
          <v-icon size="22">mdi-chevron-left</v-icon>
        </button>

        <button
          v-if="hasNext"
          class="photo-detail__nav photo-detail__nav--next"
          :aria-label="t('memories.nextPhoto')"
          @click="emit('next')"
        >
          <v-icon size="22">mdi-chevron-right</v-icon>
        </button>

        <!-- Position indicator -->
        <div v-if="allPhotos.length > 1" class="photo-detail__indicator">
          {{ currentIndex + 1 }} / {{ allPhotos.length }}
        </div>

        <!-- More actions menu — subtle, top-right corner of image -->
        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <button
              v-bind="menuProps"
              class="photo-detail__more-btn"
              :aria-label="t('common.more')"
            >
              <v-icon size="18">mdi-dots-vertical</v-icon>
            </button>
          </template>
          <v-list density="compact" rounded="lg" min-width="180">
            <v-list-item
              prepend-icon="mdi-share-variant-outline"
              :title="t('memories.shareToChat')"
              @click="emit('share')"
            />
            <v-list-item
              prepend-icon="mdi-link-variant"
              :title="t('memories.copyLink')"
              @click="copyLink"
            />
            <template v-if="canDelete">
              <v-divider class="my-1" />
              <v-list-item
                prepend-icon="mdi-delete-outline"
                :title="t('common.delete')"
                base-color="error"
                @click="confirmDelete"
              />
            </template>
          </v-list>
        </v-menu>
      </div>

      <!-- ── Right: interaction panel ──────────────────────── -->
      <div class="photo-detail__panel">
        <!-- 1. Header: uploader + time -->
        <div class="photo-detail__header">
          <v-avatar size="36" color="primary-lighten">
            <span class="photo-detail__avatar-initials">{{ uploaderInitials }}</span>
          </v-avatar>

          <div class="photo-detail__header-info">
            <span class="photo-detail__uploader">{{
              photo.uploadedByName ?? photo.uploadedById
            }}</span>
            <span class="photo-detail__time">{{ formattedTime }}</span>
          </div>

          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            density="compact"
            class="ml-auto"
            @click="emit('close')"
          />
        </div>

        <v-divider />

        <!-- 2. Caption -->
        <p v-if="photo.caption" class="photo-detail__caption">{{ photo.caption }}</p>

        <!-- 3. Reaction bar -->
        <div class="photo-detail__reactions">
          <!-- Emoji picker trigger -->
          <v-menu location="top start" :close-delay="120" open-on-hover>
            <template #activator="{ props: menuProps }">
              <button v-bind="menuProps" class="photo-react-trigger">
                <v-icon size="14">mdi-emoticon-outline</v-icon>
                {{ t('memories.addReaction') }}
              </button>
            </template>
            <div class="photo-reactions-picker">
              <button
                v-for="opt in PHOTO_REACTION_OPTIONS"
                :key="opt.type"
                class="photo-reactions-picker__btn"
                :class="{
                  'photo-reactions-picker__btn--active': userReactions[photo.id] === opt.type,
                }"
                @click="toggleReaction(photo.id, opt.type)"
              >
                {{ opt.emoji }}
              </button>
            </div>
          </v-menu>

          <!-- Reaction badges -->
          <template v-for="opt in PHOTO_REACTION_OPTIONS" :key="opt.type">
            <v-tooltip
              v-if="reactionCount(opt.type) > 0"
              location="top"
              :text="reactionTooltipText(opt.type)"
            >
              <template #activator="{ props: tipProps }">
                <button
                  v-bind="tipProps"
                  class="photo-reaction-badge"
                  :class="{
                    'photo-reaction-badge--active': userReactions[photo.id] === opt.type,
                  }"
                  @click="toggleReaction(photo.id, opt.type)"
                >
                  {{ opt.emoji }} {{ reactionCount(opt.type) }}
                </button>
              </template>
            </v-tooltip>
          </template>
        </div>

        <v-divider />

        <!-- Mobile comment toggle -->
        <button
          class="photo-detail__comment-toggle"
          @click="showMobileComments = !showMobileComments"
        >
          <v-icon size="15">mdi-comment-outline</v-icon>
          <span>
            {{
              currentComments.length > 0
                ? `${currentComments.length} bình luận`
                : t('memories.firstComment')
            }}
          </span>
          <v-icon size="14" class="ml-auto">
            {{ showMobileComments ? 'mdi-chevron-down' : 'mdi-chevron-up' }}
          </v-icon>
        </button>

        <!-- 4. Comment thread -->
        <div
          ref="commentListReference"
          class="photo-detail__comments"
          :class="{ 'photo-detail__comments--mobile-open': showMobileComments }"
        >
          <template v-if="currentComments.length === 0">
            <div class="photo-detail__comments-empty">
              <v-icon size="28" color="primary" class="mb-2" style="opacity: 0.5">
                mdi-comment-outline
              </v-icon>
              <span>{{ t('memories.firstComment') }}</span>
            </div>
          </template>

          <div v-for="comment in currentComments" :key="comment.id" class="comment-item">
            <v-avatar size="28" color="primary-lighten" class="comment-item__avatar">
              <span class="comment-item__initials">{{ comment.user.initials }}</span>
            </v-avatar>

            <div class="comment-item__body">
              <!-- Inline edit mode -->
              <div v-if="editingCommentId === comment.id" class="comment-item__edit">
                <textarea
                  ref="editTextareaReference"
                  v-model="editingText"
                  class="comment-item__edit-input"
                  rows="2"
                  @keydown.enter.exact.prevent="handleSaveEdit(comment.id, comment.photoId)"
                  @keydown.esc="cancelEdit"
                />
                <div class="comment-item__edit-actions">
                  <button class="comment-item__edit-cancel" @click="cancelEdit">
                    {{ t('common.cancel') }}
                  </button>
                  <button
                    class="comment-item__edit-save"
                    :disabled="!editingText.trim() || editingText.trim() === comment.text"
                    @click="handleSaveEdit(comment.id, comment.photoId)"
                  >
                    {{ t('common.save') }}
                  </button>
                </div>
              </div>

              <!-- Normal display mode -->
              <template v-else>
                <div class="comment-item__bubble">
                  <span class="comment-item__author">{{ comment.user.name }}</span>
                  <span class="comment-item__text">{{
                    commentDisplayText(comment.id, comment.text)
                  }}</span>
                </div>
                <div class="comment-item__footer">
                  <span class="comment-item__time">{{ formatCommentTime(comment.createdAt) }}</span>

                  <!-- Translate toggle -->
                  <button
                    v-if="
                      !comment.id.startsWith('optimistic-') &&
                      comment.detectedLanguage &&
                      comment.detectedLanguage !== userLanguage
                    "
                    class="comment-item__translate-btn"
                    :disabled="commentTranslating[comment.id]"
                    @click="handleToggleCommentTranslation(comment.id)"
                  >
                    <v-progress-circular
                      v-if="commentTranslating[comment.id]"
                      indeterminate
                      size="9"
                      width="1.5"
                    />
                    <v-icon v-else size="11">
                      {{
                        commentShowTranslation[comment.id] ? 'mdi-translate-off' : 'mdi-translate'
                      }}
                    </v-icon>
                    <span>{{
                      commentShowTranslation[comment.id]
                        ? t('memories.showOriginal')
                        : t('memories.showTranslated')
                    }}</span>
                  </button>

                  <!-- Reaction picker trigger -->
                  <v-menu location="top start" :close-delay="120" open-on-hover>
                    <template #activator="{ props: menuProps }">
                      <button v-bind="menuProps" class="comment-item__react-btn">
                        <v-icon size="12">mdi-emoticon-outline</v-icon>
                      </button>
                    </template>
                    <div class="comment-reactions-picker">
                      <button
                        v-for="opt in COMMENT_REACTION_OPTIONS"
                        :key="opt.type"
                        class="comment-reactions-picker__btn"
                        :class="{
                          'comment-reactions-picker__btn--active':
                            userCommentReaction(comment) === opt.type,
                        }"
                        @click="handleCommentReaction(comment.id, opt.type)"
                      >
                        {{ opt.emoji }}
                      </button>
                    </div>
                  </v-menu>

                  <!-- Reaction badges -->
                  <template v-for="opt in COMMENT_REACTION_OPTIONS" :key="opt.type">
                    <v-tooltip
                      v-if="(comment.reactions?.[opt.type] ?? []).length > 0"
                      location="top"
                      :text="reactionTooltip(comment.reactions?.[opt.type] ?? [])"
                    >
                      <template #activator="{ props: tipProps }">
                        <button
                          v-bind="tipProps"
                          class="comment-item__reaction-badge"
                          :class="{
                            'comment-item__reaction-badge--active':
                              userCommentReaction(comment) === opt.type,
                          }"
                          @click="handleCommentReaction(comment.id, opt.type)"
                        >
                          {{ opt.emoji }}
                          {{ (comment.reactions?.[opt.type] ?? []).length }}
                        </button>
                      </template>
                    </v-tooltip>
                  </template>
                </div>
              </template>
            </div>

            <!-- Actions menu (own comments only) -->
            <v-menu
              v-if="comment.userId === currentUserId && editingCommentId !== comment.id"
              location="bottom end"
            >
              <template #activator="{ props: menuProps }">
                <button v-bind="menuProps" class="comment-item__menu-btn">
                  <v-icon size="15">mdi-dots-vertical</v-icon>
                </button>
              </template>
              <v-list density="compact" rounded="lg" min-width="140">
                <v-list-item
                  prepend-icon="mdi-pencil-outline"
                  :title="t('common.edit')"
                  @click="startEdit(comment.id, comment.text)"
                />
                <v-divider class="my-1" />
                <v-list-item
                  prepend-icon="mdi-delete-outline"
                  :title="t('common.delete')"
                  base-color="error"
                  @click="confirmDeleteComment(comment.id)"
                />
              </v-list>
            </v-menu>
          </div>
        </div>

        <!-- 5. Comment input -->
        <div
          class="photo-detail__input-row"
          :class="{ 'photo-detail__input-row--mobile-open': showMobileComments }"
        >
          <v-avatar size="28" color="primary-lighten">
            <span style="font-size: 0.55rem; font-weight: 700">
              {{ currentUserInitials }}
            </span>
          </v-avatar>

          <v-text-field
            v-model="newComment"
            :placeholder="t('memories.addComment')"
            density="compact"
            hide-details
            rounded="lg"
            variant="outlined"
            class="photo-detail__comment-field"
            @keydown.enter.prevent="submitComment"
          />

          <v-btn
            icon="mdi-send"
            size="small"
            :color="newComment.trim() ? 'primary' : undefined"
            :variant="newComment.trim() ? 'flat' : 'text'"
            density="compact"
            :disabled="!newComment.trim()"
            @click="submitComment"
          />
        </div>

        <v-divider />
      </div>
    </div>

    <!-- Delete confirm dialog -->
    <!-- Comment delete confirm -->
    <v-dialog
      :model-value="!!deletingCommentId"
      max-width="340"
      @update:model-value="deletingCommentId = null"
    >
      <v-card rounded="xl">
        <v-card-title class="pt-6 px-6 text-subtitle-1 font-weight-bold">
          {{ t('memories.confirmDeleteComment') }}
        </v-card-title>
        <v-card-text class="px-6">
          {{ t('memories.confirmDeleteCommentBody') }}
        </v-card-text>
        <v-card-actions class="px-6 pb-5 ga-3 justify-end">
          <v-btn variant="text" rounded="lg" @click="deletingCommentId = null">
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn color="error" variant="flat" rounded="lg" @click="handleDeleteComment">
            {{ t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteConfirming" max-width="360">
      <v-card rounded="xl">
        <v-card-title class="pt-6 px-6 text-h6 font-weight-bold">
          {{ t('memories.confirmDelete') }}
        </v-card-title>
        <v-card-text class="px-6">
          {{ t('memories.confirmDeleteOne') }}
        </v-card-text>
        <v-card-actions class="px-6 pb-5 ga-3 justify-end">
          <v-btn variant="text" rounded="lg" @click="deleteConfirming = false">
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn color="error" variant="flat" rounded="lg" @click="handleDelete">
            {{ t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { Photo, Album, Comment, CommentReactionEntry, ReactionType } from '@/types/memories'
import { useMoment } from '@/composables/useMoment'
import { usePhotoInteraction } from '@/composables/usePhotoInteraction'
import { useAppNotifications } from '@/composables/useAppNotifications'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  photo: {
    type: Object as PropType<Photo | null>,
    required: false,
    default: null,
  },
  album: {
    type: Object as PropType<Album>,
    required: true,
  },
  allPhotos: {
    type: Array as PropType<Photo[]>,
    required: true,
  },
})

const emit = defineEmits<{
  close: []
  prev: []
  next: []
  share: []
  delete: [id: string]
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { t } = useI18n()
const { moment } = useMoment()
const {
  reactionCounts,
  photoReactors,
  comments,
  userReactions,
  commentTranslations,
  commentTranslating,
  fetchReactions,
  fetchComments,
  toggleReaction,
  addComment,
  editComment,
  deleteComment,
  translateComment,
  toggleCommentReaction,
} = usePhotoInteraction()
const { notifySuccess, notifyError } = useAppNotifications()
const userStore = useUserStore()

const newComment = ref('')
const showMobileComments = ref(false)
const commentListReference = ref<HTMLElement | null>(null)
const deleteConfirming = ref(false)
const commentShowTranslation = ref<Record<string, boolean>>({})
const editingCommentId = ref<string | null>(null)
const editingText = ref('')
const editTextareaReference = ref<HTMLTextAreaElement | null>(null)
const deletingCommentId = ref<string | null>(null)

/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const COMMENT_REACTION_OPTIONS = [
  { type: 'heart', emoji: '❤️' },
  { type: 'care', emoji: '🥰' },
  { type: 'laugh', emoji: '😄' },
  { type: 'wow', emoji: '😲' },
  { type: 'angry', emoji: '😡' },
  { type: 'sad', emoji: '😢' },
]

const PHOTO_REACTION_OPTIONS = [
  { type: 'heart' as ReactionType, emoji: '❤️' },
  { type: 'care' as ReactionType, emoji: '🥰' },
  { type: 'laugh' as ReactionType, emoji: '😄' },
  { type: 'wow' as ReactionType, emoji: '😲' },
  { type: 'angry' as ReactionType, emoji: '😡' },
  { type: 'sad' as ReactionType, emoji: '😢' },
]

const currentUserId = computed(() => String(userStore.user?.id ?? ''))
const userLanguage = computed(() => userStore.user?.preferred_language ?? 'en')

const currentUserInitials = computed(() => {
  const name = userStore.user?.full_name ?? ''
  const parts = name.trim().split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.at(-1)?.[0] ?? ''
  return parts.length >= 2 ? (first + last).toUpperCase() : first.toUpperCase() || 'U'
})

const currentIndex = computed(() =>
  props.photo ? props.allPhotos.findIndex((photoItem) => photoItem.id === props.photo!.id) : -1,
)

const canDelete = computed(() => {
  if (!props.photo) return false
  const isCreator = String(props.album.createdById) === currentUserId.value
  return isCreator || props.photo.uploadedById === currentUserId.value
})

const hasPrevious = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < props.allPhotos.length - 1)

const uploaderInitials = computed(() => {
  if (!props.photo) return ''
  const name = props.photo.uploadedByName
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return (parts[0]?.[0] ?? '').toUpperCase() || 'U'
  }
  return props.photo.uploadedById.slice(-2).toUpperCase()
})

const formattedTime = computed(() => {
  if (!props.photo) return ''
  return moment.utc(props.photo.createdAt).local().format('HH:mm · DD/MM/YYYY')
})

const currentComments = computed(() => (props.photo ? (comments.value[props.photo.id] ?? []) : []))

function reactionCount(type: ReactionType): number {
  if (!props.photo) return 0
  return reactionCounts.value[props.photo.id]?.[type] ?? 0
}

function reactionTooltipText(type: ReactionType): string {
  if (!props.photo) return ''
  return (photoReactors.value[props.photo.id]?.[type] ?? [])
    .map((reactor) => reactor.name)
    .join(', ')
}
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
function userCommentReaction(comment: Comment): string | null {
  const uid = Number(currentUserId.value)
  for (const [type, entries] of Object.entries(comment.reactions ?? {})) {
    if (!Array.isArray(entries)) continue
    if (
      entries.some((entry) =>
        typeof entry === 'object' && entry !== null ? entry.id === uid : Number(entry) === uid,
      )
    )
      return type
  }
  return null
}

function reactionTooltip(entries: CommentReactionEntry[]): string {
  if (!Array.isArray(entries)) return ''
  return entries
    .filter((entry) => typeof entry === 'object' && entry !== null)
    .map((entry) => entry.name)
    .join(', ')
}

async function handleCommentReaction(commentId: string, type: string): Promise<void> {
  await toggleCommentReaction(commentId, type)
}

function startEdit(commentId: string, currentText: string): void {
  editingCommentId.value = commentId
  editingText.value = currentText
  nextTick(() => editTextareaReference.value?.focus())
}

function cancelEdit(): void {
  editingCommentId.value = null
  editingText.value = ''
}

async function handleSaveEdit(commentId: string, photoId: string): Promise<void> {
  const text = editingText.value.trim()
  if (!text || text === '') return
  cancelEdit()
  await editComment(photoId, commentId, text)
}

function commentDisplayText(commentId: string, original: string): string {
  if (!commentShowTranslation.value[commentId]) return original
  return commentTranslations.value[commentId]?.[userLanguage.value] ?? original
}

async function handleToggleCommentTranslation(commentId: string): Promise<void> {
  if (!commentTranslations.value[commentId]) {
    await translateComment(commentId)
  }
  const hasTranslation = !!commentTranslations.value[commentId]?.[userLanguage.value]
  if (hasTranslation) {
    commentShowTranslation.value[commentId] = !commentShowTranslation.value[commentId]
  }
}

function formatCommentTime(iso: string): string {
  return moment.utc(iso).local().format('HH:mm · DD/MM')
}

function confirmDelete(): void {
  deleteConfirming.value = true
}

function handleDelete(): void {
  if (!props.photo) return
  emit('delete', props.photo.id)
  deleteConfirming.value = false
}

async function submitComment(): Promise<void> {
  const text = newComment.value.trim()
  if (!text || !props.photo) return

  newComment.value = ''

  await addComment(props.photo.id, text)

  await nextTick()
  if (commentListReference.value) {
    commentListReference.value.scrollTop = commentListReference.value.scrollHeight
  }
}

function confirmDeleteComment(commentId: string): void {
  deletingCommentId.value = commentId
}

async function handleDeleteComment(): Promise<void> {
  if (!props.photo || !deletingCommentId.value) return
  const commentId = deletingCommentId.value
  deletingCommentId.value = null
  await deleteComment(props.photo.id, commentId)
}

async function copyLink(): Promise<void> {
  if (!props.photo) return

  const url = `${window.location.origin}/memories/${props.album.id}?photo=${props.photo.id}`

  try {
    await navigator.clipboard.writeText(url)
    notifySuccess(t('memories.linkCopied'))
  } catch {
    notifyError(t('memories.errors.copyLink'))
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (!props.photo) return

  if (event.key === 'ArrowLeft' && hasPrevious.value) emit('prev')
  if (event.key === 'ArrowRight' && hasNext.value) emit('next')
  if (event.key === 'Escape') emit('close')
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.photo,
  async (newPhoto) => {
    if (!newPhoto) return
    const toFetch: Promise<void>[] = []
    if (!reactionCounts.value[newPhoto.id]) toFetch.push(fetchReactions(newPhoto.id))
    if (!comments.value[newPhoto.id]) toFetch.push(fetchComments(newPhoto.id))
    if (toFetch.length) await Promise.all(toFetch)
  },
  { immediate: true },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style>
/* Not scoped — targets the Vuetify dialog wrapper */
.photo-detail-dialog {
  border-radius: 16px !important;
  overflow: hidden;
}
</style>

<style scoped>
/* ── Dialog shell ───────────────────────────────────────── */
.photo-detail {
  display: flex;
  height: 600px;
  background: rgb(var(--v-theme-surface));
}

/* ── Left: image viewer ─────────────────────────────────── */
.photo-detail__viewer {
  flex: 1;
  position: relative;
  background: rgba(var(--v-theme-on-surface), 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-width: 0;
}

.photo-detail__image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  user-select: none;
}

/* Prev / Next buttons */
.photo-detail__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(var(--v-theme-surface), 0.85);
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background 0.15s ease,
    opacity 0.15s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.photo-detail__nav:hover {
  background: rgb(var(--v-theme-surface));
}

.photo-detail__nav--prev {
  left: 10px;
}
.photo-detail__nav--next {
  right: 10px;
}

/* Position indicator */
.photo-detail__indicator {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.72rem;
  color: rgb(var(--v-theme-on-surface));
  background: rgba(var(--v-theme-surface), 0.85);
  padding: 3px 10px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
}
.photo-detail__more-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.18s;
  backdrop-filter: blur(4px);
}
.photo-detail__viewer:hover .photo-detail__more-btn {
  opacity: 1;
}

/* ── Right: panel ───────────────────────────────────────── */
.photo-detail__panel {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  overflow: hidden;
}

/* Header */
.photo-detail__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
}

.photo-detail__avatar-initials {
  font-size: 0.6rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.photo-detail__header-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.photo-detail__uploader {
  font-size: 0.82rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.photo-detail__time {
  font-size: 0.7rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

/* Caption */
.photo-detail__caption {
  padding: 10px 14px;
  font-size: 0.82rem;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.5;
  margin: 0;
}

/* Reaction bar */
.photo-detail__reactions {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  flex-wrap: wrap;
}

.photo-react-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 0.72rem;
  font-family: inherit;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  transition:
    border-color 0.15s,
    color 0.15s;
}

.photo-react-trigger:hover {
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-primary));
}

.photo-reactions-picker {
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  background: rgb(var(--v-theme-surface));
  border-radius: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.photo-reactions-picker__btn {
  font-size: 1.1rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 5px;
  border-radius: 8px;
  line-height: 1;
  transition: transform 0.1s ease;
}

.photo-reactions-picker__btn:hover {
  transform: scale(1.3);
  background: rgba(var(--v-theme-on-surface), 0.07);
}

.photo-reactions-picker__btn--active {
  background: rgba(var(--v-theme-primary), 0.12);
}

.photo-reaction-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.72rem;
  padding: 3px 8px;
  border-radius: 20px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.04);
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-family: inherit;
  transition: border-color 0.12s;
}

.photo-reaction-badge:hover {
  border-color: rgb(var(--v-theme-primary));
}

.photo-reaction-badge--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

/* Comment list */
.photo-detail__comments {
  flex: 1;
  overflow-y: auto;
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.photo-detail__comments-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.comment-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  position: relative;
}

.comment-item__body {
  flex: 1;
  min-width: 0;
}

.comment-item__bubble {
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 0 10px 10px 10px;
  padding: 6px 10px;
  display: inline-block;
  max-width: 100%;
}

.comment-item__author {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 2px;
}

.comment-item__text {
  font-size: 0.8rem;
  color: rgb(var(--v-theme-on-surface));
  word-break: break-word;
}

.comment-item__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
}

.comment-item__time {
  font-size: 0.65rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  display: block;
  padding-left: 4px;
}

.comment-item__avatar {
  flex-shrink: 0;
}

.comment-item__initials {
  font-size: 0.55rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.comment-item__menu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  opacity: 0;
  transition:
    opacity 0.15s,
    background 0.12s;
  align-self: flex-start;
  margin-top: 1px;
}

.comment-item:hover .comment-item__menu-btn {
  opacity: 1;
}

.comment-item__menu-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.comment-item__edit {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.comment-item__edit-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid rgba(var(--v-theme-primary), 0.5);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  background: rgba(var(--v-theme-surface), 1);
  color: rgb(var(--v-theme-on-surface));
  outline: none;
}

.comment-item__edit-input:focus {
  border-color: rgb(var(--v-theme-primary));
}

.comment-item__edit-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.comment-item__edit-cancel,
.comment-item__edit-save {
  font-size: 12px;
  font-family: inherit;
  padding: 3px 10px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.comment-item__edit-cancel {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgb(var(--v-theme-on-surface));
}

.comment-item__edit-cancel:hover {
  background: rgba(var(--v-theme-on-surface), 0.14);
}

.comment-item__edit-save {
  background: rgb(var(--v-theme-primary));
  color: #fff;
}

.comment-item__edit-save:hover:not(:disabled) {
  opacity: 0.9;
}

.comment-item__edit-save:disabled {
  opacity: 0.4;
  cursor: default;
}

.comment-item__translate-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 10.5px;
  font-family: inherit;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  transition: color 0.15s;
}

.comment-item__translate-btn:hover:not(:disabled) {
  color: rgb(var(--v-theme-primary));
}

.comment-item__translate-btn:disabled {
  cursor: default;
}

.comment-item__react-btn {
  display: inline-flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 6px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  opacity: 0;
  transition: opacity 0.15s ease;
  font-family: inherit;
}

.comment-item__react-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.07);
}

.comment-item:hover .comment-item__react-btn {
  opacity: 1;
}

.comment-reactions-picker {
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  background: rgb(var(--v-theme-surface));
  border-radius: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.comment-reactions-picker__btn {
  font-size: 1.1rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 5px;
  border-radius: 8px;
  line-height: 1;
  transition: transform 0.1s ease;
}

.comment-reactions-picker__btn:hover {
  transform: scale(1.3);
  background: rgba(var(--v-theme-on-surface), 0.07);
}

.comment-reactions-picker__btn--active {
  background: rgba(var(--v-theme-primary), 0.12);
}

.comment-item__reaction-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.65rem;
  padding: 1px 5px;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-on-surface), 0.04);
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-family: inherit;
  transition: border-color 0.12s;
}

.comment-item__reaction-badge:hover {
  border-color: rgb(var(--v-theme-primary));
}

.comment-item__reaction-badge--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

/* Comment input row */
.photo-detail__input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
}

.photo-detail__comment-field {
  flex: 1;
}

/* Mobile comment toggle button — hidden on desktop */
.photo-detail__comment-toggle {
  display: none;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  font-size: 0.8rem;
  font-family: inherit;
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  opacity: 0.75;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.photo-detail__comment-toggle:hover {
  opacity: 1;
  background: rgba(var(--v-theme-on-surface), 0.04);
}

/* ── Mobile: stack vertically ───────────────────────────── */
@media (max-width: 599px) {
  .photo-detail {
    flex-direction: column;
    height: 100dvh;
    overflow: hidden;
  }

  .photo-detail__viewer {
    flex: 1;
    min-height: 0;
  }

  .photo-detail__panel {
    flex: none;
    width: 100%;
    border-left: none;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.1);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    display: flex;
    flex-direction: column;
  }

  .photo-detail__caption {
    display: none;
  }

  .photo-detail__comment-toggle {
    display: flex;
  }

  .photo-detail__comments {
    display: none;
  }
  .photo-detail__comments--mobile-open {
    display: flex;
    max-height: 40dvh;
    overflow-y: auto;
  }

  .photo-detail__input-row {
    display: none;
  }
  .photo-detail__input-row--mobile-open {
    display: flex;
  }

  .photo-detail__reactions {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding: 10px 14px;
  }
  .photo-detail__reactions::-webkit-scrollbar {
    display: none;
  }

  .reaction-btn {
    flex-shrink: 0;
  }

  .photo-detail__more-btn {
    opacity: 1;
  }
}
</style>
