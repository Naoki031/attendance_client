<template>
  <v-sheet class="thread-panel d-flex flex-column" elevation="0" rounded="0">
    <!-- Header — Slack style: title + close -->
    <div class="thread-header d-flex align-center justify-space-between px-4 py-2 flex-shrink-0">
      <span class="text-body-2 font-weight-bold">{{ $t('chat.thread') }}</span>
      <v-btn icon variant="text" density="comfortable" @click="emit('close')">
        <v-icon size="20">mdi-close</v-icon>
      </v-btn>
    </div>
    <v-divider />

    <!-- Scrollable content: original message + replies -->
    <div class="flex-grow-1 overflow-y-auto">
      <!-- Original message -->
      <div v-if="parent" class="thread-original px-4 py-3">
        <div class="d-flex ga-3">
          <v-avatar size="36" :color="parent.avatar ? undefined : 'primary'" class="flex-shrink-0">
            <v-img v-if="parent.avatar" :src="parent.avatar" cover />
            <span v-else class="text-caption text-white font-weight-bold">{{
              parentInitials
            }}</span>
          </v-avatar>
          <div class="flex-grow-1" style="min-width: 0">
            <div class="d-flex align-baseline ga-2 mb-1">
              <span class="text-body-2 font-weight-bold">{{ parent.username }}</span>
              <span class="text-caption text-medium-emphasis">{{ formattedParentTime }}</span>
            </div>
            <div class="text-body-2 reply-content">
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div v-html="parentRenderedContent"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Replies separator -->
      <div
        v-if="threadReplies && threadReplies.length > 0"
        class="d-flex align-center ga-3 px-4 py-1"
      >
        <v-divider />
        <span class="text-caption text-medium-emphasis flex-shrink-0">
          {{ threadReplies.length }}
          {{ threadReplies.length === 1 ? $t('chat.reply') : $t('chat.replies') }}
        </span>
        <v-divider />
      </div>

      <!-- Reply list -->
      <div
        v-if="threadReplies && threadReplies.length === 0"
        class="text-center text-medium-emphasis text-body-2 py-8"
      >
        {{ $t('chat.noReplies') }}
      </div>

      <div class="px-4 py-2">
        <div
          v-for="reply in threadReplies ?? []"
          :id="'reply-' + reply.id"
          :key="reply.id"
          class="thread-reply d-flex ga-3 py-2"
          :class="{ 'thread-reply--unread': isReplyUnread(reply) }"
        >
          <v-avatar size="32" :color="reply.avatar ? undefined : 'grey'" class="flex-shrink-0">
            <v-img v-if="reply.avatar" :src="reply.avatar" cover />
            <span v-else class="text-caption font-weight-bold">{{
              getInitials(reply.username)
            }}</span>
          </v-avatar>
          <div class="flex-grow-1" style="min-width: 0">
            <div class="d-flex align-baseline ga-2 mb-1">
              <span class="text-body-2 font-weight-bold">{{ reply.username }}</span>
              <span class="text-caption text-medium-emphasis">{{
                formatTime(reply.createdAt)
              }}</span>
            </div>
            <div class="text-body-2">
              <div v-if="parseQuote(reply)" class="reply-quote-block">
                <v-icon size="12" class="mr-1">mdi-reply</v-icon>
                <span class="font-weight-medium">{{ parseQuote(reply)?.username }}</span
                >: {{ parseQuote(reply)?.content }}
              </div>
              <div class="reply-content">
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div v-html="getReplyRenderedContent(reply)"></div>
              </div>
            </div>

            <!-- Actions -->
            <div class="d-flex ga-1 mt-1">
              <v-btn
                size="x-small"
                variant="text"
                density="compact"
                class="text-medium-emphasis"
                @click="handleReplyInThread(reply)"
              >
                <v-icon size="14" start>mdi-reply</v-icon>
                {{ $t('chat.reply') }}
              </v-btn>
              <v-btn
                v-if="reply.userId === currentUserId && canEdit(reply)"
                size="x-small"
                variant="text"
                density="compact"
                class="text-medium-emphasis"
                @click="startEditReply(reply)"
              >
                <v-icon size="14" start>mdi-pencil-outline</v-icon>
                {{ $t('chat.edit') }}
              </v-btn>
            </div>

            <!-- Edit mode -->
            <div v-if="editingReplyId === reply.id" class="mt-2">
              <v-textarea
                v-model="editContent"
                auto-grow
                rows="1"
                max-rows="5"
                density="compact"
                variant="outlined"
                hide-details
                autofocus
                @keydown.escape="cancelEditReply"
              />
              <div class="d-flex ga-2 mt-1">
                <v-btn size="x-small" variant="text" @click="cancelEditReply">
                  {{ $t('common.cancel') }}
                </v-btn>
                <v-btn
                  size="x-small"
                  variant="elevated"
                  color="primary"
                  :disabled="!editContent.trim()"
                  @click="saveEditReply(reply.id)"
                >
                  {{ $t('common.save') }}
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reply input — sticky bottom -->
    <div class="flex-shrink-0 pa-3">
      <!-- Quoted reply preview -->
      <div v-if="quotedMessage" class="quoted-reply-preview d-flex align-center pa-2 mb-2 ga-2">
        <v-icon size="14" color="medium-emphasis">mdi-reply</v-icon>
        <div class="quoted-reply-text flex-grow-1 text-body-2 text-medium-emphasis">
          <span class="font-weight-medium">{{ quotedMessage.username }}</span
          >: {{ quotedMessage.content }}
        </div>
        <v-btn icon size="x-small" variant="text" @click="quotedMessage = null">
          <v-icon size="14">mdi-close</v-icon>
        </v-btn>
      </div>

      <MessageInput
        :disabled="!isConnected"
        :members="members"
        :placeholder="$t('chat.replyPlaceholder')"
        @send="handleThreadSend"
        @typing="() => {}"
      />
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
/** START IMPORT */
import type { PropType } from 'vue'
import MessageInput from '@/components/chat/MessageInput.vue'
import type { ChatMessage } from '@/types/chat'
import type { ChatRoomMemberModel } from '@/interfaces/models/ChatRoomModel'
import { useMoment } from '@/composables/useMoment'
import { renderChatMarkdown } from '@/utils/chatMarkdown'
/* END IMPORT */

/** START DEFINE PROPS */
const props = defineProps({
  parent: {
    type: Object as PropType<ChatMessage | null>,
    required: false,
    default: null,
  },
  threadReplies: {
    type: Array as PropType<ChatMessage[]>,
    required: true,
  },
  isConnected: {
    type: Boolean,
    required: true,
  },
  autoTranslate: {
    type: Boolean,
    default: false,
  },
  userLanguage: {
    type: String,
    required: true,
  },
  currentUserId: {
    type: Number,
    required: true,
  },
  lastReadAt: {
    type: String as PropType<string | null>,
    default: null,
  },
  members: {
    type: Array as PropType<ChatRoomMemberModel[]>,
    default: () => [],
  },
})
/* END DEFINE PROPS */

/** START DEFINE EMITS */
const emit = defineEmits<{
  close: []
  send: [content: string, mentionedUserIds: number[]]
  edit: [messageId: number, newContent: string]
}>()
/* END DEFINE EMITS */

/** START DEFINE STATE */
const { moment } = useMoment()
const showTranslation = ref(props.autoTranslate)
const quotedMessage = ref<ChatMessage | null>(null)
const editingReplyId = ref<number | null>(null)
const editContent = ref('')
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const parentInitials = computed(() => {
  if (!props.parent) return ''
  const parts = props.parent.username.trim().split(' ')

  if (parts.length > 1 && parts[0] && parts.at(-1)) {
    return `${parts[0][0]}${parts.at(-1)![0]}`.toUpperCase()
  }

  return parts[0]?.[0]?.toUpperCase() ?? ''
})

const formattedParentTime = computed(() => {
  if (!props.parent) return ''

  return moment.utc(props.parent.createdAt).local().format('HH:mm')
})

const parentDisplayContent = computed(() => {
  if (!props.parent) return ''

  if (showTranslation.value && props.parent.translations?.[props.userLanguage]) {
    return props.parent.translations[props.userLanguage] ?? props.parent.content
  }

  return props.parent.content
})

const parentRenderedContent = computed(() => {
  if (!props.parent) return ''

  return renderChatMarkdown(parentDisplayContent.value, props.members)
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
function getInitials(username: string): string {
  const parts = username.trim().split(' ')

  if (parts.length > 1 && parts[0] && parts.at(-1)) {
    return `${parts[0][0]}${parts.at(-1)![0]}`.toUpperCase()
  }

  return parts[0]?.[0]?.toUpperCase() ?? ''
}

function isReplyUnread(reply: ChatMessage): boolean {
  if (!props.lastReadAt || reply.userId === props.currentUserId) return false
  return new Date(reply.createdAt) > new Date(props.lastReadAt)
}

function formatTime(createdAt: string): string {
  return moment.utc(createdAt).local().format('HH:mm')
}

function getDisplayContent(reply: ChatMessage): string {
  if (showTranslation.value && reply.translations?.[props.userLanguage]) {
    return reply.translations[props.userLanguage] as string
  }

  return reply.content ?? ''
}

function parseQuote(reply: ChatMessage) {
  // Always use original content to parse quote format (translation may break it)
  const text = reply.content ?? ''
  if (!text.startsWith('> ')) return null
  const newlineIndex = text.indexOf('\n')
  const quoteLine = newlineIndex === -1 ? text.substring(2) : text.substring(2, newlineIndex)
  const colonIndex = quoteLine.indexOf(': ')
  if (colonIndex === -1) return null

  return {
    username: quoteLine.substring(0, colonIndex),
    content: quoteLine.substring(colonIndex + 2),
  }
}

function getReplyRenderedContent(reply: ChatMessage): string {
  const originalText = reply.content ?? ''
  const displayText = getDisplayContent(reply)

  // Use original content structure to strip quote, display translated reply part only
  if (originalText.startsWith('> ')) {
    const originalNewline = originalText.indexOf('\n')
    if (originalNewline !== -1) {
      const displayNewline = displayText.indexOf('\n')

      return renderChatMarkdown(
        displayNewline !== -1 ? displayText.substring(displayNewline + 1) : displayText,
        props.members,
      )
    }
  }

  return renderChatMarkdown(displayText, props.members)
}

function canEdit(reply: ChatMessage): boolean {
  const fifteenMinutes = 15 * 60 * 1000

  return Date.now() - new Date(reply.createdAt).getTime() <= fifteenMinutes
}

function startEditReply(reply: ChatMessage) {
  editingReplyId.value = reply.id
  editContent.value = reply.content
}

function cancelEditReply() {
  editingReplyId.value = null
  editContent.value = ''
}

function saveEditReply(messageId: number) {
  if (!editContent.value.trim()) return
  emit('edit', messageId, editContent.value.trim())
  editingReplyId.value = null
  editContent.value = ''
}

function handleReplyInThread(message: ChatMessage) {
  quotedMessage.value = message
}

function handleThreadSend(content: string, mentionedUserIds: number[] = []) {
  if (!content.trim()) return

  let finalContent = content.trim()

  if (quotedMessage.value) {
    let quotedContent = quotedMessage.value.content

    // Strip existing quote block so nested quotes are not carried over
    if (quotedContent.startsWith('> ')) {
      const newlineIndex = quotedContent.indexOf('\n')

      if (newlineIndex !== -1) {
        quotedContent = quotedContent.substring(newlineIndex + 1)
      }
    }

    finalContent = `> ${quotedMessage.value.username}: ${quotedContent}\n${finalContent}`
  }

  emit('send', finalContent, mentionedUserIds)
  quotedMessage.value = null
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
.thread-panel {
  width: 35%;
  min-width: 320px;
  max-width: 500px;
  overflow: hidden;
  border-left: 1px solid rgba(0, 0, 0, 0.08);
  background-color: rgb(var(--v-theme-surface));
}

.thread-header {
  min-height: 48px;
}

.thread-original {
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}

.thread-reply--unread .reply-content {
  border-left: 3px solid rgb(var(--v-theme-primary));
  padding-left: 6px;
}

.quoted-reply-preview {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 8px;
  border-left: 3px solid rgba(var(--v-theme-primary), 0.5);
  overflow: hidden;
}

.quoted-reply-text {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reply-content {
  word-break: break-word;
}

.reply-content :deep(p) {
  margin: 0 0 6px 0;
}
.reply-content :deep(p:last-child) {
  margin-bottom: 0;
}
.reply-content :deep(ul),
.reply-content :deep(ol) {
  margin: 4px 0 6px 16px;
  padding: 0;
}
.reply-content :deep(li) {
  margin-bottom: 2px;
}
.reply-content :deep(strong) {
  font-weight: 600;
}
.reply-content :deep(code) {
  background: #fff3e0;
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 0.85em;
  font-family: monospace;
  color: #e65100;
}
.reply-content :deep(pre) {
  background: #fff3e0;
  border-radius: 6px;
  padding: 8px;
  overflow-x: auto;
  margin: 6px 0;
}
.reply-content :deep(pre code) {
  background: none;
  padding: 0;
  color: #e65100;
}
.reply-content :deep(blockquote) {
  border-left: 3px solid rgb(var(--v-theme-primary));
  margin: 4px 0;
  padding-left: 8px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
.reply-content :deep(del) {
  text-decoration: line-through;
  opacity: 0.7;
}
.reply-content :deep(.chat-mention) {
  background-color: rgba(var(--v-theme-primary), 0.15);
  color: rgb(var(--v-theme-primary));
  border-radius: 4px;
  padding: 0 4px;
  font-weight: 500;
}

.reply-quote-block {
  display: flex;
  align-items: flex-start;
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 6px;
  border-left: 3px solid rgba(var(--v-theme-primary), 0.4);
  padding: 4px 8px;
  margin-bottom: 4px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 960px) {
  .thread-panel {
    position: fixed;
    top: var(--v-layout-top, 0px);
    left: 0;
    right: 0;
    bottom: var(--v-layout-bottom, 0px);
    width: 100%;
    min-width: unset;
    max-width: unset;
    z-index: 999;
    border-left: none;
  }
}
</style>
