<template>
  <div class="meeting-chat">
    <!-- Thread view: replaces the main chat entirely when a thread is open -->
    <template v-if="activeThreadParent">
      <div class="meeting-chat__thread-wrapper">
        <ThreadPanel
          :parent="activeThreadParent"
          :thread-replies="threadReplies"
          :is-connected="isConnected"
          :auto-translate="autoTranslate"
          :user-language="selectedLanguage"
          :current-user-id="userId"
          :last-read-at="null"
          :members="[]"
          @close="closeThread"
          @edit="handleEdit"
          @send="sendThreadReply"
        />
      </div>
    </template>

    <!-- Main chat view -->
    <template v-else>
      <!-- Header -->
      <div class="meeting-chat__header">
        <span class="meeting-chat__title">{{ $t('meetings.chat.title') }}</span>
        <div class="d-flex align-center gap-1">
          <!-- Pinned messages button -->
          <v-btn
            v-if="pinnedMessages.length > 0"
            size="x-small"
            variant="text"
            color="on-surface"
            :title="$t('chat.pinnedMessages')"
            @click="showPinnedDialog = true"
          >
            <v-icon size="14" class="mr-1">mdi-pin</v-icon>
            <span style="font-size: 11px">{{ pinnedMessages.length }}</span>
          </v-btn>

          <!-- Language selector -->
          <v-menu location="bottom end" :close-on-content-click="true">
            <template #activator="{ props: menuProps }">
              <v-btn
                size="x-small"
                variant="text"
                color="on-surface"
                :title="$t('chat.selectLanguage')"
                v-bind="menuProps"
              >
                <span class="meeting-chat__lang-badge">{{ selectedLanguage.toUpperCase() }}</span>
              </v-btn>
            </template>
            <v-list density="compact" rounded="lg" min-width="130" bg-color="#1e1e1e">
              <v-list-item
                v-for="option in languageOptions"
                :key="option.value"
                :active="selectedLanguage === option.value"
                active-color="primary"
                @click="handleLanguageChange(option.value)"
              >
                <v-list-item-title class="text-body-2" style="color: rgba(255, 255, 255, 0.87)">
                  {{ option.label }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <!-- Auto-translate toggle -->
          <v-btn
            :icon="autoTranslate ? 'mdi-translate' : 'mdi-translate-off'"
            :color="autoTranslate ? 'primary' : 'on-surface'"
            size="x-small"
            variant="text"
            :title="$t('chat.autoTranslate')"
            @click="autoTranslate = !autoTranslate"
          />

          <v-btn
            icon="mdi-close"
            size="x-small"
            variant="text"
            color="on-surface"
            @click="emit('close')"
          />
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isInitializing" class="meeting-chat__loading">
        <v-progress-circular indeterminate size="28" color="primary" />
      </div>

      <!-- Error state -->
      <div v-else-if="initError" class="meeting-chat__error">
        <v-icon size="20" color="error">mdi-alert-circle-outline</v-icon>
        <span class="text-caption">{{ initError }}</span>
      </div>

      <!-- Messages -->
      <template v-else>
        <div ref="messageListReference" class="meeting-chat__messages" @scroll="handleScroll">
          <div v-if="hasMore" class="d-flex justify-center py-2">
            <v-btn
              size="x-small"
              variant="text"
              color="on-surface"
              :loading="isLoadingMore"
              @click="loadMore"
            >
              {{ $t('chat.loadMore') }}
            </v-btn>
          </div>

          <div v-if="messages.length === 0 && !isLoadingMore" class="meeting-chat__empty">
            <v-icon size="32" color="on-surface" style="opacity: 0.3">mdi-chat-outline</v-icon>
            <p class="text-caption mt-2" style="opacity: 0.5">{{ $t('meetings.chat.empty') }}</p>
          </div>

          <v-theme-provider theme="sandstone-dark" with-background style="background: transparent">
            <MessageBubble
              v-for="message in messages"
              :key="message.id"
              :message="message"
              :current-user-id="userId"
              :user-language="selectedLanguage"
              :auto-translate="autoTranslate"
              :members="[]"
              @edit="handleEdit"
              @delete="handleDelete"
              @react="toggleReaction"
              @reply="handleReply"
              @pin="handlePin"
              @unpin="handleUnpin"
            />
          </v-theme-provider>
        </div>

        <div v-if="typingUsers.length > 0" class="meeting-chat__typing">
          <span class="text-caption" style="opacity: 0.6">
            {{ typingUsers.join(', ') }} {{ $t('chat.isTyping') }}
          </span>
        </div>

        <div class="meeting-chat__input">
          <MessageInput
            :members="[]"
            :placeholder="$t('meetings.chat.placeholder')"
            @send="handleSend"
            @typing="handleTyping"
          />
        </div>
      </template>
    </template>

    <!-- Pinned messages dialog -->
    <v-dialog v-model="showPinnedDialog" max-width="420" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-4 pb-2 d-flex align-center ga-2">
          <v-icon size="16" color="primary">mdi-pin</v-icon>
          <span class="text-h6">{{ $t('chat.pinnedMessages') }}</span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-2">
          <div
            v-for="pinned in pinnedMessages"
            :key="pinned.id"
            class="pa-3 rounded-lg mb-1"
            style="background: rgba(var(--v-theme-on-surface), 0.04)"
          >
            <div class="text-caption text-medium-emphasis mb-1">{{ pinned.username }}</div>
            <div class="text-body-2">{{ pinned.content }}</div>
          </div>
          <div
            v-if="pinnedMessages.length === 0"
            class="text-center py-4 text-caption text-medium-emphasis"
          >
            {{ $t('common.noData') }}
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-3">
          <v-spacer />
          <v-btn variant="text" size="small" @click="showPinnedDialog = false">
            {{ $t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import MessageBubble from '@/components/chat/MessageBubble.vue'
import MessageInput from '@/components/chat/MessageInput.vue'
import ThreadPanel from '@/components/chat/ThreadPanel.vue'
import { useChat } from '@/composables/useChat'
import { useMoment } from '@/composables/useMoment'
import type { ChatMessage } from '@/types/chat'
import MeetingService from '@/services/MeetingService'
/* END IMPORT */

/** START DEFINE PROPS */
const props = defineProps({
  meetingUuid: {
    type: String,
    required: true,
  },
  userId: {
    type: Number,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  language: {
    type: String as PropType<string>,
    default: 'en',
  },
})
/* END DEFINE PROPS */

/** START DEFINE EMITS */
const emit = defineEmits<{
  close: []
  'new-message': []
}>()
/* END DEFINE EMITS */

/** START DEFINE STATE */
const isInitializing = ref(true)
const initError = ref('')
const chatRoomUuid = ref<string | null>(null)
const messageListReference = ref<HTMLElement | null>(null)
const autoTranslate = ref(false)
const selectedLanguage = ref(props.language)

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Tiếng Việt', value: 'vi' },
  { label: '日本語', value: 'ja' },
]

const {
  messages,
  typingUsers,
  hasMore,
  isLoadingMore,
  activeThreadParent,
  threadReplies,
  isConnected,
  pinnedMessages,
  connect,
  disconnect,
  sendMessage,
  editMessage,
  deleteMessage,
  loadMore,
  setTyping,
  toggleReaction,
  updateLanguage,
  openThread,
  closeThread,
  sendThreadReply,
  pinMessage,
  unpinMessage,
} = useChat()

const { moment } = useMoment()
const showPinnedDialog = ref(false)
/* END DEFINE STATE */

/** START DEFINE METHOD */
async function initialize() {
  try {
    isInitializing.value = true
    initError.value = ''

    const response = await MeetingService.getChatRoom(props.meetingUuid)
    chatRoomUuid.value = response.chatRoomUuid

    connect(chatRoomUuid.value, {
      userId: props.userId,
      username: props.username,
      avatar: props.avatar,
      language: props.language,
    })
  } catch {
    initError.value = 'Failed to load meeting chat'
  } finally {
    isInitializing.value = false
  }
}

function handleSend(content: string, mentionedUserIds: number[]) {
  sendMessage(content, mentionedUserIds)
  scrollToBottom()
}

function handleEdit(messageId: number, newContent: string) {
  editMessage(messageId, newContent)
}

function handleDelete(messageId: number) {
  deleteMessage(messageId)
}

function handleReply(message: ChatMessage) {
  openThread(message)
}

function handlePin(messageId: number) {
  pinMessage(messageId)

  const message = messages.value.find((item) => item.id === messageId)
  if (message) {
    pinnedMessages.value.unshift({
      id: moment().valueOf(),
      messageId,
      roomId: 0,
      pinnedByUserId: props.userId,
      pinnedByName: props.username,
      content: message.content,
      userId: message.userId,
      username: message.username,
      avatar: message.avatar ?? null,
      createdAt: message.createdAt,
      pinnedAt: moment().toISOString(),
    })
  }
}

function handleUnpin(messageId: number) {
  unpinMessage(messageId)
  pinnedMessages.value = pinnedMessages.value.filter((pinned) => pinned.messageId !== messageId)
}

function handleTyping(isTyping: boolean) {
  setTyping(isTyping)
}

function handleLanguageChange(language: string) {
  selectedLanguage.value = language
  updateLanguage(language)
}

function handleScroll() {
  const element = messageListReference.value
  if (!element) return
  // Load more when scrolled near the top
  if (element.scrollTop < 80 && hasMore.value && !isLoadingMore.value) {
    loadMore()
  }
}

function scrollToBottom() {
  nextTick(() => {
    const element = messageListReference.value
    if (element) {
      element.scrollTop = element.scrollHeight
    }
  })
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => messages.value.length,
  (newLength, oldLength) => {
    // Auto-scroll only when a new message arrives at the bottom (not loading older ones)
    if (newLength > oldLength) {
      const element = messageListReference.value
      if (!element) return
      const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 120
      if (isNearBottom) {
        scrollToBottom()
      }
      // Notify parent so it can show the unread badge when the panel is hidden
      emit('new-message')
    }
  },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFECYCLE */
onMounted(() => {
  initialize()
})

onUnmounted(() => {
  disconnect()
})
/* END DEFINE LIFECYCLE */
</script>

<style scoped>
.meeting-chat {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.87);
}

.meeting-chat__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.meeting-chat__title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.87);
}

.meeting-chat__loading,
.meeting-chat__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 8px;
  color: rgba(255, 255, 255, 0.5);
}

.meeting-chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
}

.meeting-chat__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
}

.meeting-chat__typing {
  padding: 2px 16px 4px;
  flex-shrink: 0;
  min-height: 20px;
  color: rgba(255, 255, 255, 0.6);
}

.meeting-chat__input {
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.meeting-chat__lang-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
}

.meeting-chat__thread-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.meeting-chat__thread-wrapper :deep(.thread-panel) {
  flex: 1 !important;
  height: 100% !important;
  border-left: none;
}
</style>
