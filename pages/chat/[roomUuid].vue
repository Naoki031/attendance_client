<template>
  <div class="chat-page">
    <!-- Mobile sidebar drawer -->
    <v-navigation-drawer v-model="showMobileSidebar" temporary :width="280" location="left">
      <UserSidebar
        :online-users="onlineUsers"
        :members="members"
        :my-user-id="userStore.user?.id ?? 0"
        :user-language="userLanguage"
        :auto-translate="autoTranslate"
        :is-admin="isAdmin"
        :room-uuid="roomUuid"
        @language-change="handleLanguageChange"
        @update:auto-translate="autoTranslate = $event"
        @member-removed="onMemberRemoved"
      />
    </v-navigation-drawer>

    <!-- Connection status bar -->
    <div v-if="!isConnected" class="connection-bar text-caption text-center py-1">
      <v-progress-circular size="12" width="2" indeterminate color="warning" class="mr-1" />
      {{ $t('chat.connecting') }}
    </div>

    <div class="chat-layout">
      <!-- Left sidebar: online users -->
      <aside class="chat-sidebar">
        <UserSidebar
          :online-users="onlineUsers"
          :members="members"
          :my-user-id="userStore.user?.id ?? 0"
          :user-language="userLanguage"
          :auto-translate="autoTranslate"
          :is-admin="isAdmin"
          :room-uuid="roomUuid"
          @language-change="handleLanguageChange"
          @update:auto-translate="autoTranslate = $event"
          @member-removed="onMemberRemoved"
        />
      </aside>

      <!-- Main area + thread panel share this container -->
      <div class="chat-content-area">
        <!-- Main chat area -->
        <main class="chat-main">
          <!-- Room header -->
          <div class="chat-header d-flex align-center justify-space-between px-4 py-2">
            <div class="d-flex align-center ga-2">
              <v-btn
                icon
                size="small"
                variant="text"
                class="mobile-sidebar-toggle"
                @click="showMobileSidebar = true"
              >
                <v-icon size="20">mdi-account-group-outline</v-icon>
              </v-btn>
              <v-icon size="18" color="medium-emphasis">
                {{ room?.type === 'direct' ? 'mdi-account-outline' : 'mdi-pound' }}
              </v-icon>
              <div>
                <div class="d-flex align-center ga-2">
                  <span class="text-body-1 font-weight-medium">
                    {{
                      room?.type === 'direct'
                        ? (room?.direct_user?.full_name ?? room?.name)
                        : room?.name
                    }}
                  </span>
                  <v-icon v-if="isPrivateRoom" size="14" color="medium-emphasis">mdi-lock</v-icon>
                  <v-chip v-if="isPrivateRoom" size="x-small" variant="tonal" color="warning">
                    {{ $t('chat.visibilityPrivate') }}
                  </v-chip>
                </div>
                <div
                  v-if="room?.type === 'channel' && room?.description"
                  class="d-flex align-center ga-1"
                >
                  <span class="text-caption text-medium-emphasis room-header-description">
                    {{ room.description }}
                  </span>
                  <v-btn
                    variant="text"
                    size="x-small"
                    color="primary"
                    class="px-1 flex-shrink-0"
                    style="min-width: 0; height: 20px"
                    @click="descriptionDialog = true"
                  >
                    {{ $t('chat.seeMore') }}
                  </v-btn>
                </div>
              </div>
            </div>
            <div class="d-flex align-center ga-2">
              <v-btn
                v-if="showInviteButton"
                variant="tonal"
                color="primary"
                size="small"
                rounded="lg"
                class="btn-shine"
                prepend-icon="mdi-account-plus"
                @click="inviteDialog = true"
              >
                {{ $t('chat.inviteMembers') }}
              </v-btn>

              <v-menu>
                <template #activator="{ props: menuProps }">
                  <v-btn icon size="small" variant="text" v-bind="menuProps">
                    <v-icon size="20">mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list density="comfortable" rounded="lg">
                  <v-list-item
                    base-color="error"
                    prepend-icon="mdi-exit-to-app"
                    @click="leaveConfirmDialog = true"
                  >
                    <v-list-item-title>{{ $t('chat.leaveRoom') }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>
          <v-divider />

          <!-- Pinned messages bar -->
          <div
            v-if="pinnedMessages.length > 0"
            class="pinned-bar d-flex align-center px-4 py-2 ga-2 cursor-pointer"
            @click="pinnedMessagesDialog = true"
          >
            <v-icon size="14" color="warning">mdi-pin</v-icon>
            <span class="text-caption font-weight-medium text-truncate flex-1">
              {{ pinnedMessages[0]?.content }}
            </span>
            <span class="text-caption text-medium-emphasis flex-shrink-0">
              {{ $t('chat.pinnedCount', { count: pinnedMessages.length }) }}
            </span>
          </div>

          <!-- Messages container -->
          <div ref="messagesContainerReference" class="chat-messages">
            <!-- Load more sentinel -->
            <div ref="sentinelReference" class="load-more-sentinel">
              <v-progress-circular
                v-if="isLoadingMore"
                size="20"
                width="2"
                indeterminate
                color="primary"
              />
            </div>

            <!-- Message list -->
            <template v-for="(message, index) in messages" :key="message.id">
              <!-- Date separator -->
              <div
                v-if="shouldShowDateSeparator(index)"
                class="date-separator d-flex align-center ga-3 px-4 py-2"
              >
                <v-divider />
                <span class="text-caption font-weight-medium text-medium-emphasis flex-shrink-0">
                  {{ formatDateLabel(message.createdAt) }}
                </span>
                <v-divider />
              </div>

              <!-- Unread divider -->
              <div
                v-if="message.id === firstUnreadMessageId"
                class="unread-divider d-flex align-center ga-3 px-4 py-2"
              >
                <v-divider />
                <span class="text-caption font-weight-bold text-primary flex-shrink-0">
                  {{ $t('chat.newMessages') }}
                </span>
                <v-divider />
              </div>

              <MessageBubble
                :id="'message-' + message.id"
                :message="message"
                :class="{ 'highlight-message': message.id === scrollToMessageId }"
                :current-user-id="userStore.user?.id ?? 0"
                :user-language="userLanguage"
                :auto-translate="autoTranslate"
                :last-read-at="lastReadAt"
                :members="members"
                :is-admin="isAdmin"
                @edit="handleEditMessage"
                @reply="handleReply"
                @react="handleReact"
                @pin="handlePin"
                @unpin="handleUnpin"
              />
            </template>

            <!-- Empty state -->
            <div
              v-if="messages.length === 0 && !isLoadingMore"
              class="text-center text-medium-emphasis text-body-2 py-8"
            >
              {{ $t('chat.noMessages') }}
            </div>
          </div>

          <!-- Typing indicator -->
          <TypingIndicator :typing-users="typingUsers" />

          <!-- Message input -->
          <MessageInput
            :disabled="!isConnected"
            :members="members"
            :placeholder="$t('chat.messagePlaceholder')"
            @send="sendMessage"
            @typing="setTyping"
          />
        </main>

        <!-- Thread panel -->
        <ThreadPanel
          v-if="activeThreadParent"
          :parent="activeThreadParent"
          :thread-replies="threadReplies"
          :is-connected="isConnected"
          :auto-translate="autoTranslate"
          :user-language="userLanguage"
          :current-user-id="userStore.user?.id ?? 0"
          :last-read-at="lastReadAt"
          :members="members"
          @close="closeThread"
          @edit="handleEditMessage"
          @send="sendThreadReply"
        />
      </div>
      <!-- end chat-content-area -->
    </div>
    <!-- end chat-layout -->

    <!-- Invite user dialog -->
    <DialogInviteUser
      :dialog="inviteDialog"
      :room-uuid="roomUuid"
      :existing-member-ids="existingMemberIds"
      @invited="onUserInvited"
      @close-modal="inviteDialog = false"
    />

    <!-- Mention notification toast -->
    <v-snackbar
      v-if="mentionNotification"
      :model-value="!!mentionNotification"
      location="top right"
      color="primary"
      rounded="lg"
      :timeout="5000"
    >
      <div class="d-flex align-center ga-2">
        <v-avatar size="24" :color="mentionNotification.senderAvatar ? undefined : 'primary'">
          <v-img
            v-if="mentionNotification.senderAvatar"
            :src="mentionNotification.senderAvatar"
            cover
          />
          <span v-else class="text-caption text-white font-weight-bold">{{
            mentionNotification.senderName.charAt(0)
          }}</span>
        </v-avatar>
        <div>
          <div class="text-body-2 font-weight-medium">
            {{ mentionNotification.senderName }}
            <span class="font-weight-regular">{{ $t('chat.mentionedYou') }}</span>
          </div>
          <div
            class="text-caption text-white-emphasis"
            style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap"
          >
            {{ stripMarkdown(mentionNotification.contentPreview) }}
          </div>
        </div>
      </div>
      <template #actions>
        <v-btn variant="text" size="small" @click="goToMentionRoom">
          {{ $t('common.view') }}
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Room description dialog -->
    <v-dialog v-model="descriptionDialog" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="pa-4 pb-2 d-flex align-center ga-2">
          <v-icon size="18" color="medium-emphasis">mdi-pound</v-icon>
          <span class="text-h6">{{ room?.name }}</span>
        </v-card-title>
        <v-divider />
        <div class="pa-4">
          <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2">
            {{ $t('chat.roomDescriptionTitle') }}
          </div>
          <div class="text-body-2" style="white-space: pre-wrap; line-height: 1.7">
            {{ room?.description }}
          </div>
        </div>
        <v-divider />
        <v-card-actions class="pa-3">
          <v-spacer />
          <v-btn variant="text" @click="descriptionDialog = false">
            {{ $t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Pinned messages dialog -->
    <v-dialog v-model="pinnedMessagesDialog" max-width="520" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-4 pb-2 d-flex align-center ga-2">
          <v-icon size="18" color="warning">mdi-pin</v-icon>
          <span class="text-h6">{{ $t('chat.pinnedMessages') }}</span>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <div
            v-for="pinned in pinnedMessages"
            :key="pinned.id"
            class="px-4 py-3 pinned-message-item"
          >
            <div class="d-flex align-start justify-space-between ga-2">
              <div class="flex-1 min-w-0">
                <div class="text-caption text-medium-emphasis mb-1">
                  {{ pinned.username }}
                </div>
                <div class="text-body-2" style="white-space: pre-wrap">{{ pinned.content }}</div>
                <div class="text-caption text-disabled mt-1">
                  {{ $t('chat.pinnedBy', { name: pinned.pinnedByName }) }}
                </div>
              </div>
              <v-btn
                v-if="isAdmin"
                icon
                size="x-small"
                variant="text"
                color="medium-emphasis"
                :title="$t('chat.unpinMessage')"
                @click="handleUnpin(pinned.messageId)"
              >
                <v-icon size="16">mdi-pin-off-outline</v-icon>
              </v-btn>
            </div>
            <v-divider class="mt-3" />
          </div>
          <div
            v-if="pinnedMessages.length === 0"
            class="text-center text-body-2 text-medium-emphasis py-6"
          >
            {{ $t('chat.noPinnedMessages') }}
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-3">
          <v-spacer />
          <v-btn variant="text" @click="pinnedMessagesDialog = false">
            {{ $t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Leave room confirmation dialog -->
    <v-dialog v-model="leaveConfirmDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-h6 pa-4 pb-2">
          {{ $t('chat.leaveRoomTitle') }}
        </v-card-title>
        <v-card-text class="px-4">
          {{ $t('chat.leaveRoomConfirm') }}
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="leaveConfirmDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn variant="elevated" color="error" :loading="isLeaving" @click="handleLeaveRoom">
            {{ $t('chat.leaveRoom') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import UserSidebar from '@/components/chat/UserSidebar.vue'
import MessageBubble from '@/components/chat/MessageBubble.vue'
import MessageInput from '@/components/chat/MessageInput.vue'
import TypingIndicator from '@/components/chat/TypingIndicator.vue'
import DialogInviteUser from '@/components/chat/DialogInviteUser.vue'
import ThreadPanel from '@/components/chat/ThreadPanel.vue'
import ChatRoomService from '@/services/ChatRoomService'
import PinnedMessageService from '@/services/PinnedMessageService'
import { useChat } from '@/composables/useChat'
import { useChatUnread } from '@/composables/useChatUnread'
import type { ChatRoomModel, ChatRoomMemberModel } from '@/interfaces/models/ChatRoomModel'
import type { ChatMessage } from '@/types/chat'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  layout: 'default',
  name: 'chat-room',
})
/* END DEFINE NAME COMPONENT */

/** START DEFINE STATE */
const route = useRoute()
const userStore = useUserStore()

const autoTranslateKey = computed(() => `chat_auto_translate_${route.params.roomUuid}`)
const autoTranslate = ref(false)
const messagesContainerReference = ref<HTMLElement | null>(null)
const sentinelReference = ref<HTMLElement | null>(null)
const inviteDialog = ref(false)
const leaveConfirmDialog = ref(false)
const descriptionDialog = ref(false)
const pinnedMessagesDialog = ref(false)
const showMobileSidebar = ref(false)
const isLeaving = ref(false)
const room = ref<ChatRoomModel | null>(null)
const members = ref<Array<ChatRoomMemberModel>>([])
const lastReadAt = ref<string | null>(null)

const {
  messages,
  onlineUsers,
  typingUsers,
  isConnected,
  isLoadingMore,
  activeThreadParent,
  threadReplies,
  mentionNotification,
  pinnedMessages,
  connect,
  disconnect,
  sendMessage,
  editMessage,
  loadMore,
  setTyping,
  updateLanguage,
  openThread,
  closeThread,
  sendThreadReply,
  toggleReaction,
  pinMessage,
  unpinMessage,
} = useChat()

const { markAsRead } = useChatUnread()

const { t } = useI18n()
const { moment: momentInstance, TIMEZONE } = useMoment()

const scrollToMessageId = ref<number | null>(null)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const roomUuid = computed(() => route.params.roomUuid as string)
const userLanguage = computed(() => userStore.user?.preferred_language ?? 'en')

const isAdmin = computed(() => {
  const userId = userStore.user?.id
  if (!userId) return false

  return members.value.some((member) => member.user_id === userId && member.role === 'admin')
})

const isPrivateRoom = computed(() => room.value?.visibility === 'private')
const showInviteButton = computed(() => isAdmin.value)
const existingMemberIds = computed(() => members.value.map((member) => member.user_id))

const firstUnreadMessageId = computed(() => {
  if (!lastReadAt.value) return null
  const currentUserId = userStore.user?.id
  const firstUnread = messages.value.find(
    (message) =>
      message.userId !== currentUserId && new Date(message.createdAt) > new Date(lastReadAt.value!),
  )

  return firstUnread?.id ?? null
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const initChat = async () => {
  const user = userStore.user
  if (!user || !roomUuid.value) return

  await loadRoomInfo()

  await connect(roomUuid.value, {
    userId: user.id,
    username: user.full_name ?? user.email ?? 'User',
    avatar: user.avatar ?? '',
    language: user.preferred_language ?? 'en',
  })

  markAsRead(roomUuid.value)
  loadPinnedMessages()

  // Check for scrollTo query param
  const scrollToParameter = route.query.scrollTo as string | undefined
  const openThreadParameter = route.query.openThread as string | undefined

  if (scrollToParameter) {
    scrollToMessageId.value = Number(scrollToParameter)
  }

  await nextTick()
  setupIntersectionObserver()

  if (openThreadParameter) {
    const parentMessage = messages.value.find(
      (item: ChatMessage) => item.id === Number(openThreadParameter),
    )
    if (parentMessage) {
      await openThread(parentMessage)
    }
  }

  if (scrollToMessageId.value) {
    await nextTick()
    scrollToMessage(scrollToMessageId.value)
  } else {
    scrollToBottom()
  }
}

const loadRoomInfo = async () => {
  try {
    const [roomResult, membersResult, lastReadAtResult] = await Promise.all([
      ChatRoomService.getOne(roomUuid.value),
      ChatRoomService.getMembers(roomUuid.value),
      ChatRoomService.getLastReadAt(roomUuid.value),
    ])
    room.value = roomResult
    members.value = membersResult
    lastReadAt.value = lastReadAtResult
  } catch (error) {
    console.error('Failed to load room info:', error)
  }
}

const onUserInvited = (member: ChatRoomMemberModel) => {
  members.value = [...members.value, member]
}

const onMemberRemoved = (userId: number) => {
  members.value = members.value.filter((member) => member.user_id !== userId)
}

function handleEditMessage(messageId: number, newContent: string) {
  editMessage(messageId, newContent)
}

function handleReply(message: ChatMessage) {
  openThread(message)
}

function handleReact(messageId: number, emoji: string) {
  toggleReaction(messageId, emoji)
}

function handlePin(messageId: number) {
  pinMessage(messageId)

  // Optimistically add to pinned list
  const message = messages.value.find((item) => item.id === messageId)

  if (message) {
    const user = userStore.user
    pinnedMessages.value.unshift({
      id: Date.now(),
      messageId,
      roomId: 0,
      pinnedByUserId: user?.id ?? 0,
      pinnedByName: user?.full_name ?? '',
      content: message.content,
      userId: message.userId,
      username: message.username,
      avatar: message.avatar,
      createdAt: message.createdAt,
      pinnedAt: new Date().toISOString(),
    })
  }
}

function handleUnpin(messageId: number) {
  unpinMessage(messageId)
  pinnedMessages.value = pinnedMessages.value.filter((pinned) => pinned.messageId !== messageId)
}

async function loadPinnedMessages() {
  try {
    const result = await PinnedMessageService.getByRoom(roomUuid.value)
    pinnedMessages.value = result

    // Mark pinned messages in message list
    const pinnedIds = new Set(result.map((pinned) => pinned.messageId))
    for (const message of messages.value) {
      message.isPinned = pinnedIds.has(message.id)
    }
  } catch (error) {
    console.error('Failed to load pinned messages:', error)
  }
}

function handleLanguageChange(language: string) {
  updateLanguage(language)
  userStore.updateLanguage(language)
}

async function handleLeaveRoom() {
  isLeaving.value = true

  try {
    disconnect()
    await ChatRoomService.leave(roomUuid.value)
    navigateTo('/chat')
  } catch (error) {
    console.error('Failed to leave room:', error)
  } finally {
    isLeaving.value = false
  }
}

function shouldShowDateSeparator(index: number): boolean {
  const message = messages.value[index]
  if (!message) return false
  if (index === 0) return true
  const previousMessage = messages.value[index - 1]
  if (!previousMessage) return true
  const currentDate = momentInstance.utc(message.createdAt).tz(TIMEZONE).format('YYYY-MM-DD')
  const previousDate = momentInstance
    .utc(previousMessage.createdAt)
    .tz(TIMEZONE)
    .format('YYYY-MM-DD')

  return currentDate !== previousDate
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\\\n/g, ' ') // markdown hard line break \<newline> → space
    .replace(/\\(.)/g, '$1') // unescape \[ \] \\ etc.
    .replace(/:[a-z0-9-]+:/g, '') // strip custom emoji codes :blob-thumbs-up:
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/_(.+?)_/g, '$1') // italic
    .replace(/~~(.+?)~~/g, '$1') // strikethrough
    .replace(/`(.+?)`/g, '$1') // inline code
    .replace(/^(?:\d+\.\s+|[>#\-*]\s+)/gm, '') // block prefixes (numbered + bullet lists)
    .replace(/\n+/g, ' ') // newlines → space
    .trim()
}

function formatDateLabel(createdAt: string): string {
  const date = momentInstance.utc(createdAt).tz(TIMEZONE)
  const today = momentInstance().tz(TIMEZONE).startOf('day')
  const yesterday = momentInstance().tz(TIMEZONE).subtract(1, 'day').startOf('day')
  if (date.isSame(today, 'day')) return t('chat.today')
  if (date.isSame(yesterday, 'day')) return t('chat.yesterday')

  return date.format('MMMM D, YYYY')
}

function goToMentionRoom() {
  if (mentionNotification.value) {
    navigateTo(`/chat/${mentionNotification.value.roomUuid}`)
  }
}

function scrollToBottom() {
  const container = messagesContainerReference.value
  if (!container) return
  nextTick(() => {
    container.scrollTop = container.scrollHeight
  })
}

function scrollToMessage(messageId: number) {
  const attempt = () => {
    const element =
      document.getElementById(`message-${messageId}`) ??
      document.getElementById(`reply-${messageId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  nextTick(attempt)
  // Retry in case rendering is delayed
  setTimeout(attempt, 300)

  // Clear highlight after 3 seconds
  setTimeout(() => {
    scrollToMessageId.value = null
  }, 3000)
}

function setupIntersectionObserver() {
  const sentinel = sentinelReference.value
  const container = messagesContainerReference.value
  if (!sentinel || !container) return

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) {
        loadMore()
      }
    },
    { root: container, rootMargin: '100px', threshold: 0.1 },
  )

  observer.observe(sentinel)

  onUnmounted(() => {
    observer.disconnect()
  })
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(autoTranslate, (value) => {
  if (import.meta.client) {
    localStorage.setItem(autoTranslateKey.value, String(value))
  }
})

watch(
  () => messages.value.length,
  (newLength, oldLength) => {
    if (newLength > (oldLength ?? 0)) {
      const container = messagesContainerReference.value
      if (!container) return

      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 150

      if (isNearBottom) {
        scrollToBottom()
      }
    }
  },
)

// Handle scrollTo/openThread from notification clicks while already in room
watch(
  () => route.query.scrollTo as string | undefined,
  (scrollToValue) => {
    if (!scrollToValue) return

    const messageId = Number(scrollToValue)
    const openThreadParameter = route.query.openThread as string | undefined

    scrollToMessageId.value = messageId

    if (openThreadParameter) {
      const parentMessage = messages.value.find(
        (item: ChatMessage) => item.id === Number(openThreadParameter),
      )
      if (parentMessage) {
        openThread(parentMessage)
      }
    }

    nextTick(() => scrollToMessage(messageId))
  },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(async () => {
  const saved = localStorage.getItem(autoTranslateKey.value)

  if (saved === 'true') {
    autoTranslate.value = true
  }

  if (userStore.user) {
    await initChat()
    return
  }

  // Page reload case: user not yet loaded — wait for store to populate
  const unwatch = watch(
    () => userStore.user,
    async (user) => {
      if (!user) return
      unwatch()
      await initChat()
    },
  )
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.chat-page {
  height: calc(100vh - var(--v-layout-top) - var(--v-layout-bottom));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.connection-bar {
  background-color: rgb(var(--v-theme-warning));
  color: white;
  flex-shrink: 0;
}

.chat-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.chat-sidebar {
  width: 280px;
  flex-shrink: 0;
}

/* Wrapper that holds chat-main + thread panel side-by-side */
.chat-content-area {
  flex: 1;
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.chat-header {
  flex-shrink: 0;
  min-height: 48px;
}

.pinned-bar {
  flex-shrink: 0;
  background-color: rgb(var(--v-theme-warning), 0.08);
  border-bottom: 1px solid rgb(var(--v-theme-warning), 0.2);
  min-height: 36px;
}

.pinned-message-item:last-child .v-divider {
  display: none;
}

.room-header-description {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.load-more-sentinel {
  display: flex;
  justify-content: center;
  padding: 8px;
  min-height: 36px;
}

.date-separator {
  background-color: transparent;
}

.unread-divider {
  background-color: transparent;
}

.highlight-message {
  animation: highlight-fade 3s ease-out;
}

@keyframes highlight-fade {
  0% {
    background-color: rgba(var(--v-theme-primary), 0.12);
  }
  100% {
    background-color: transparent;
  }
}

.mobile-sidebar-toggle {
  display: none;
}

@media (max-width: 960px) {
  .chat-sidebar {
    display: none;
  }

  .mobile-sidebar-toggle {
    display: inline-flex;
  }
}
</style>
