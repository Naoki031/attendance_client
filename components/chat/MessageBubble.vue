<template>
  <div
    class="message-bubble"
    :class="{
      'message-bubble--own': isOwnMessage && !flat,
      'message-bubble--editing': isEditing,
      'message-bubble--flat': flat,
      'message-bubble--unread': isUnread,
    }"
  >
    <!-- Avatar -->
    <v-avatar size="36" :color="message.avatar ? undefined : 'primary'" class="message-avatar">
      <v-img v-if="message.avatar" :src="message.avatar" cover />
      <span v-else class="text-caption text-white font-weight-bold">{{ initials }}</span>
    </v-avatar>

    <!-- Bubble content -->
    <div class="message-content">
      <!-- Row 1: name + pin badge + more menu -->
      <div class="message-header">
        <span class="text-body-2 font-weight-medium">{{ message.username }}</span>
        <v-icon
          v-if="message.isPinned"
          size="12"
          color="warning"
          class="ml-1"
          :title="$t('chat.pinnedMessage')"
        >
          mdi-pin
        </v-icon>
        <div v-if="!isEditing" class="message-actions ml-1">
          <v-menu location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn icon size="x-small" variant="text" color="medium-emphasis" v-bind="menuProps">
                <v-icon size="16">mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list density="compact" min-width="140">
              <v-list-item
                :title="$t('chat.reply')"
                prepend-icon="mdi-reply"
                @click="emit('reply', props.message)"
              />
              <v-tooltip
                v-if="isOwnMessage"
                :text="canEdit ? '' : $t('chat.editExpired')"
                location="left"
                :disabled="canEdit"
              >
                <template #activator="{ props: tooltipProps }">
                  <div v-bind="tooltipProps">
                    <v-list-item
                      :title="$t('chat.edit')"
                      prepend-icon="mdi-pencil-outline"
                      :disabled="!canEdit"
                      @click="canEdit && startEdit()"
                    />
                  </div>
                </template>
              </v-tooltip>
              <v-list-item
                v-if="!message.isPinned"
                :title="$t('chat.pinMessage')"
                prepend-icon="mdi-pin-outline"
                @click="emit('pin', props.message.id)"
              />
              <v-list-item
                v-if="message.isPinned && isAdmin"
                :title="$t('chat.unpinMessage')"
                prepend-icon="mdi-pin-off-outline"
                @click="emit('unpin', props.message.id)"
              />
            </v-list>
          </v-menu>
        </div>
      </div>

      <!-- Row 2: translate toggle (before bubble) -->
      <div
        v-if="hasTranslation && !isEditing"
        class="translate-toggle mb-1"
        @click.stop="toggleTranslation"
      >
        <v-icon size="12" class="mr-1">
          {{ showTranslation ? 'mdi-translate-off' : 'mdi-translate' }}
        </v-icon>
        <span>{{ showTranslation ? $t('chat.showOriginal') : $t('chat.showTranslated') }}</span>
      </div>

      <!-- Row 3: message bubble (rendered markdown) -->
      <div v-if="!isEditing" class="message-text text-body-2">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="chat-rendered-markdown" v-html="renderedContent"></div>
      </div>

      <!-- Edit mode -->
      <div v-if="isEditing" class="message-edit">
        <v-textarea
          v-model="editContent"
          auto-grow
          rows="1"
          max-rows="5"
          density="compact"
          variant="outlined"
          hide-details
          autofocus
          class="edit-textarea"
          @keydown.escape="cancelEdit"
        />
        <div class="d-flex ga-2 mt-2">
          <v-btn size="small" density="comfortable" variant="text" @click="cancelEdit">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            size="small"
            density="comfortable"
            variant="elevated"
            color="primary"
            :disabled="!editContent.trim()"
            @click="saveEdit"
          >
            {{ $t('common.save') }}
          </v-btn>
        </div>
      </div>

      <!-- Row 4: reactions -->
      <div
        v-if="message.reactions && message.reactions.length > 0"
        class="message-reactions d-flex flex-wrap ga-1 mt-1"
      >
        <TransitionGroup name="reaction" tag="div" class="d-flex flex-wrap ga-1">
          <v-tooltip
            v-for="group in message.reactions"
            :key="group.emoji"
            location="top"
            :open-delay="300"
          >
            <template #activator="{ props: tooltipProps }">
              <button
                class="reaction-chip"
                :class="{ 'reaction-chip--active': group.userIds.includes(currentUserId) }"
                v-bind="tooltipProps"
                @click="emit('react', message.id, group.emoji)"
              >
                <img
                  v-if="isCustomEmoji(group.emoji)"
                  :src="getCustomEmojiUrl(group.emoji) ?? ''"
                  :alt="getCustomEmojiLabel(group.emoji)"
                  class="reaction-emoji reaction-emoji--img"
                />
                <span v-else class="reaction-emoji">{{ group.emoji }}</span>
                <span :key="group.count" class="reaction-count reaction-count--bump">{{
                  group.count
                }}</span>
              </button>
            </template>
            <div class="reaction-tooltip">
              <div class="reaction-tooltip__emoji">
                <img
                  v-if="isCustomEmoji(group.emoji)"
                  :src="getCustomEmojiUrl(group.emoji) ?? ''"
                  :alt="getCustomEmojiLabel(group.emoji)"
                  class="reaction-tooltip__emoji-img"
                />
                <span v-else>{{ group.emoji }}</span>
              </div>
              <div class="reaction-tooltip__users">
                {{ getReactionUserNames(group.userIds) }}
              </div>
            </div>
          </v-tooltip>
        </TransitionGroup>

        <!-- Add reaction button -->
        <v-menu v-model="reactionMenuOpen" :close-on-content-click="false" location="top start">
          <template #activator="{ props: menuProps }">
            <button class="reaction-add-btn" :title="$t('chat.addReaction')" v-bind="menuProps">
              <v-icon size="14">mdi-emoticon-plus-outline</v-icon>
            </button>
          </template>
          <EmojiPicker @select="onSelectReaction" />
        </v-menu>
      </div>

      <!-- Row 5: time + edited badge + reply count + add reaction (when no reactions yet) -->
      <div class="message-footer d-flex align-center ga-2">
        <span class="text-caption text-medium-emphasis">{{ formattedTime }}</span>
        <span v-if="message.isEdited && !isEditing" class="text-caption text-medium-emphasis"
          >(edited)</span
        >
        <span
          v-if="(message.replyCount ?? 0) > 0"
          class="reply-count d-inline-flex align-center ga-1 text-caption text-primary cursor-pointer"
          @click="emit('reply', props.message)"
        >
          <!-- Participant avatar stack -->
          <span class="reply-avatars">
            <v-avatar
              v-for="participant in (message.replyParticipants ?? []).slice(0, 3)"
              :key="participant.userId"
              size="16"
              :color="participant.avatar ? undefined : 'primary'"
              class="reply-avatar-item"
            >
              <v-img v-if="participant.avatar" :src="participant.avatar" cover />
              <span v-else class="reply-avatar-initial">
                {{ participant.username.charAt(0).toUpperCase() }}
              </span>
            </v-avatar>
          </span>
          {{ message.replyCount }}
          {{ message.replyCount === 1 ? $t('chat.reply') : $t('chat.replies') }}
        </span>

        <!-- Add reaction button (when no reactions exist) -->
        <v-menu
          v-if="!message.reactions || message.reactions.length === 0"
          v-model="reactionMenuOpen"
          :close-on-content-click="false"
          location="top start"
        >
          <template #activator="{ props: menuProps }">
            <button
              class="reaction-add-btn reaction-add-btn--footer"
              :title="$t('chat.addReaction')"
              v-bind="menuProps"
            >
              <v-icon size="14">mdi-emoticon-plus-outline</v-icon>
            </button>
          </template>
          <EmojiPicker @select="onSelectReaction" />
        </v-menu>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/** START IMPORT */
import type { PropType } from 'vue'
import type { ChatMessage } from '@/types/chat'
import type { ChatRoomMemberModel } from '@/interfaces/models/ChatRoomModel'
import { useMoment } from '@/composables/useMoment'
import { renderChatMarkdown } from '@/utils/chatMarkdown'
import EmojiPicker from '@/components/chat/EmojiPicker.vue'
import { isCustomEmoji, getCustomEmojiUrl, getCustomEmojiLabel } from '@/utils/customEmoji'
/* END IMPORT */

/** START DEFINE PROPS */
const props = defineProps({
  message: {
    type: Object as PropType<ChatMessage>,
    required: true,
  },
  currentUserId: {
    type: Number,
    required: true,
  },
  userLanguage: {
    type: String,
    required: true,
  },
  autoTranslate: {
    type: Boolean,
    default: false,
  },
  flat: {
    type: Boolean,
    default: false,
  },
  lastReadAt: {
    type: String as PropType<string | null>,
    default: null,
  },
  members: {
    type: Array as PropType<ChatRoomMemberModel[]>,
    default: () => [],
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
})
/* END DEFINE PROPS */

/** START DEFINE EMITS */
const emit = defineEmits<{
  edit: [messageId: number, newContent: string]
  reply: [message: ChatMessage]
  react: [messageId: number, emoji: string]
  pin: [messageId: number]
  unpin: [messageId: number]
}>()
/* END DEFINE EMITS */

/** START DEFINE STATE */
const { moment } = useMoment()

const showTranslation = ref(props.autoTranslate)
const isEditing = ref(false)
const editContent = ref('')
const reactionMenuOpen = ref(false)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const isOwnMessage = computed(() => props.message.userId === props.currentUserId)

const isUnread = computed(() => {
  if (!props.lastReadAt || isOwnMessage.value) return false
  return new Date(props.message.createdAt) > new Date(props.lastReadAt)
})

const initials = computed(() => {
  const parts = props.message.username.trim().split(' ')

  if (parts.length > 1 && parts[0] && parts.at(-1)) {
    return `${parts[0][0]}${parts.at(-1)![0]}`.toUpperCase()
  }

  return parts[0]?.[0]?.toUpperCase() ?? ''
})

const hasTranslation = computed(() => {
  return !!props.message.translations?.[props.userLanguage]
})

const displayContent = computed(() => {
  if (showTranslation.value && hasTranslation.value) {
    return props.message.translations[props.userLanguage] ?? props.message.content
  }

  return props.message.content
})

const renderedContent = computed(() => {
  return renderChatMarkdown(displayContent.value, props.members)
})

const canEdit = computed(() => {
  if (!isOwnMessage.value) return false
  const fifteenMinutes = 15 * 60 * 1000
  const elapsed = Date.now() - new Date(props.message.createdAt).getTime()

  return elapsed <= fifteenMinutes
})

const formattedTime = computed(() => {
  return moment.utc(props.message.createdAt).local().format('HH:mm')
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
function toggleTranslation() {
  if (hasTranslation.value) {
    showTranslation.value = !showTranslation.value
  }
}

function startEdit() {
  editContent.value = props.message.content
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  editContent.value = ''
}

function saveEdit() {
  if (!editContent.value.trim()) return
  emit('edit', props.message.id, editContent.value.trim())
  isEditing.value = false
  editContent.value = ''
}

function getReactionUserNames(userIds: number[]): string {
  return userIds
    .map((id) => {
      const member = props.members.find((member) => member.user_id === id)
      return member?.user?.full_name ?? `User ${id}`
    })
    .join(', ')
}

function onSelectReaction(emoji: string) {
  reactionMenuOpen.value = false
  emit('react', props.message.id, emoji)
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.autoTranslate,
  (value) => {
    showTranslation.value = value
  },
)
/* END DEFINE WATCHER */
</script>

<style scoped>
.message-bubble {
  display: flex;
  gap: 10px;
  padding: 8px 16px;
}

.message-bubble--own {
  flex-direction: row-reverse;
}

.message-bubble--own .message-content {
  align-items: flex-end;
}

.message-bubble--own .message-header {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  margin-top: 4px;
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: 70%;
  min-width: 0;
}

.message-bubble--editing .message-content {
  flex: 1;
  max-width: 100%;
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
  gap: 2px;
}

.message-actions {
  opacity: 0;
  transition: opacity 0.15s;
}

.message-bubble:hover .message-actions {
  opacity: 1;
}

.message-text {
  background-color: rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 12px;
  padding: 8px 14px;
  word-break: break-word;
}

.message-bubble--own .message-text {
  background-color: rgba(var(--v-theme-primary), 0.12);
}

.message-bubble--unread .message-text {
  border-left: 3px solid rgb(var(--v-theme-primary));
}

.message-bubble--flat .message-text {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
}

.message-bubble--flat.message-bubble--own .message-text {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.translate-toggle {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  user-select: none;
  line-height: 1;
}

.translate-toggle:hover {
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.message-footer {
  margin-top: 3px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.reply-count {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  gap: 4px;
}

.reply-avatars {
  display: inline-flex;
  align-items: center;
}

.reply-avatar-item {
  border: 1.5px solid rgb(var(--v-theme-surface));
  border-radius: 50%;
  margin-left: -4px;
  flex-shrink: 0;
}

.reply-avatar-item:first-child {
  margin-left: 0;
}

.reply-avatar-initial {
  font-size: 8px;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.message-edit {
  width: 100%;
}

.edit-textarea {
  width: 100%;
}

.edit-textarea :deep(.v-field) {
  width: 100%;
}

/* Markdown rendered content */
.chat-rendered-markdown :deep(p) {
  margin: 0 0 6px 0;
}
.chat-rendered-markdown :deep(p:last-child) {
  margin-bottom: 0;
}

/* Custom emoji rendered inline in message content */
.chat-rendered-markdown :deep(.chat-custom-emoji) {
  width: 24px;
  height: 24px;
  object-fit: contain;
  vertical-align: middle;
  display: inline;
  margin: 0 1px;
}
.chat-rendered-markdown :deep(ul),
.chat-rendered-markdown :deep(ol) {
  margin: 4px 0 6px 0;
  padding-left: 20px;
}
.chat-rendered-markdown :deep(ul) {
  list-style-type: disc;
}
.chat-rendered-markdown :deep(ol) {
  list-style-type: decimal;
}
.chat-rendered-markdown :deep(li) {
  margin-bottom: 2px;
}
.chat-rendered-markdown :deep(strong) {
  font-weight: 600;
}
.chat-rendered-markdown :deep(code) {
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 0.85em;
  font-family: monospace;
  color: rgb(var(--v-theme-primary));
}
.chat-rendered-markdown :deep(pre) {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 6px;
  padding: 8px;
  overflow-x: auto;
  margin: 6px 0;
}
.chat-rendered-markdown :deep(pre code) {
  background: none;
  padding: 0;
  color: rgb(var(--v-theme-primary));
}
.chat-rendered-markdown :deep(blockquote) {
  border-left: 3px solid rgb(var(--v-theme-primary));
  margin: 4px 0;
  padding-left: 8px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
.chat-rendered-markdown :deep(del) {
  text-decoration: line-through;
  opacity: 0.7;
}
.chat-rendered-markdown :deep(u) {
  text-decoration: underline;
}

/* Mention highlight */
.chat-rendered-markdown :deep(.chat-mention) {
  background-color: rgba(var(--v-theme-primary), 0.15);
  color: rgb(var(--v-theme-primary));
  border-radius: 4px;
  padding: 0 4px;
  font-weight: 500;
  cursor: default;
}

/* Reactions */
@keyframes reaction-pop-in {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  60% {
    transform: scale(1.2);
  }
  80% {
    transform: scale(0.92);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes emoji-bounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  25% {
    transform: translateY(-4px) scale(1.2);
  }
  50% {
    transform: translateY(-2px) scale(1.15);
  }
  75% {
    transform: translateY(-4px) scale(1.1);
  }
}

@keyframes count-bump {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.4);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
  }
}

/* Vue TransitionGroup classes */
.reaction-enter-active {
  animation: reaction-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.reaction-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.reaction-leave-to {
  opacity: 0;
  transform: scale(0.7);
}

.message-reactions {
  margin-top: 4px;
}

.reaction-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 14px;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    transform 0.1s;
  line-height: 1.4;
  user-select: none;
}

.reaction-chip:hover {
  background: rgba(var(--v-theme-on-surface), 0.12);
  transform: scale(1.08);
}

.reaction-chip:active {
  transform: scale(0.94);
}

.reaction-chip--active {
  background: rgba(var(--v-theme-primary), 0.15);
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.reaction-chip--active:hover {
  background: rgba(var(--v-theme-primary), 0.22);
}

.reaction-emoji {
  display: inline-block;
  line-height: 1;
  transition: transform 0.15s;
}

.reaction-emoji--img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  vertical-align: middle;
}

.reaction-chip:hover .reaction-emoji {
  animation: emoji-bounce 0.5s ease both;
}

.reaction-count {
  font-size: 11px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.7);
  display: inline-block;
}

.reaction-count--bump {
  animation: count-bump 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.reaction-chip--active .reaction-count {
  color: rgb(var(--v-theme-primary));
}

.reaction-add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: transparent;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 12px;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), 0.4);
  transition: all 0.15s;
  opacity: 0;
}

.message-bubble:hover .reaction-add-btn {
  opacity: 1;
}

.reaction-add-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.7);
  border-color: rgba(var(--v-theme-on-surface), 0.4);
  transform: scale(1.1);
}

.reaction-add-btn--footer {
  width: 22px;
  height: 22px;
}

.reaction-tooltip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
  max-width: 200px;
}

.reaction-tooltip__emoji {
  font-size: 22px;
  line-height: 1;
}

.reaction-tooltip__emoji-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.reaction-tooltip__users {
  font-size: 12px;
  text-align: center;
  word-break: break-word;
  opacity: 0.9;
}
</style>
