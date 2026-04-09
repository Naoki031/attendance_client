<template>
  <!-- Floating chatbot button + panel (always visible, bottom-right) -->
  <div class="chatbot-container">
    <!-- Chat panel -->
    <v-card v-if="isOpen" class="chatbot-panel" elevation="8" rounded="lg" width="360">
      <!-- Header -->
      <v-toolbar color="primary" density="compact" rounded="t-lg">
        <button
          class="chatbot-avatar-btn flex-shrink-0"
          @click="openAvatarPreview('/chatbot-avatar.png', chatbotName)"
        >
          <v-avatar size="28" class="ml-2 mr-2">
            <v-img src="/chatbot-avatar.png" alt="chatbot"></v-img>
          </v-avatar>
        </button>
        <v-toolbar-title class="text-body-2 font-weight-bold">{{ chatbotName }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          :icon="isHelpOpen ? 'mdi-close-circle-outline' : 'mdi-help-circle-outline'"
          size="small"
          variant="text"
          @click="toggleHelp"
        ></v-btn>
        <v-btn
          :icon="isSettingsOpen ? 'mdi-close-circle-outline' : 'mdi-cog-outline'"
          size="small"
          variant="text"
          @click="toggleSettings"
        ></v-btn>
        <v-btn icon="mdi-close" size="small" variant="text" @click="isOpen = false"></v-btn>
      </v-toolbar>

      <!-- Help panel -->
      <v-expand-transition>
        <ChatbotHelpPanel v-if="isHelpOpen" @select="selectHelpQuestion" />
      </v-expand-transition>

      <!-- Settings panel -->
      <v-expand-transition>
        <div v-if="isSettingsOpen" class="chatbot-settings pa-3">
          <!-- Tone -->
          <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">
            {{ $t('chatbot.settings.tone') }}
          </div>
          <v-btn-toggle
            v-model="selectedTone"
            mandatory
            density="compact"
            rounded="lg"
            class="w-100 mb-1"
          >
            <v-btn value="professional" size="small" class="flex-1-1">
              <v-icon icon="mdi-tie" size="14" class="mr-1"></v-icon>
              {{ $t('chatbot.settings.professional') }}
            </v-btn>
            <v-btn value="friendly" size="small" class="flex-1-1">
              <v-icon icon="mdi-emoticon-happy-outline" size="14" class="mr-1"></v-icon>
              {{ $t('chatbot.settings.friendly') }}
            </v-btn>
            <v-btn value="concise" size="small" class="flex-1-1">
              <v-icon icon="mdi-lightning-bolt" size="14" class="mr-1"></v-icon>
              {{ $t('chatbot.settings.concise') }}
            </v-btn>
            <v-btn value="rapper" size="small" class="flex-1-1">
              <v-icon icon="mdi-microphone-variant" size="14" class="mr-1"></v-icon>
              {{ $t('chatbot.settings.rapper') }}
            </v-btn>
          </v-btn-toggle>
          <div class="text-caption text-medium-emphasis mb-3">{{ toneDescription }}</div>

          <!-- History limit -->
          <div class="text-caption text-medium-emphasis mb-1 font-weight-medium">
            {{ $t('chatbot.settings.history') }}
          </div>
          <v-btn-toggle
            v-model="selectedHistoryLimit"
            mandatory
            density="compact"
            rounded="lg"
            class="w-100 mb-1"
          >
            <v-btn :value="5" size="small" class="flex-1-1">5</v-btn>
            <v-btn :value="10" size="small" class="flex-1-1">10</v-btn>
          </v-btn-toggle>
          <div class="text-caption text-medium-emphasis mb-3">{{ historyLimitDescription }}</div>

          <v-divider class="mb-2"></v-divider>
          <div class="d-flex align-center justify-space-between">
            <span class="text-caption text-medium-emphasis">{{ $t('chatbot.clearHistory') }}</span>
            <v-btn size="x-small" variant="tonal" color="error" @click="clearMessages">{{
              $t('chatbot.clear')
            }}</v-btn>
          </div>
        </div>
      </v-expand-transition>

      <v-divider v-if="!isSettingsOpen && !isHelpOpen"></v-divider>

      <!-- Messages -->
      <div
        v-show="!isSettingsOpen && !isHelpOpen"
        ref="messagesContainer"
        class="chatbot-messages pa-3"
      >
        <!-- Welcome + suggested questions -->
        <div v-if="messages.length === 0" class="text-center text-medium-emphasis py-4">
          <button
            class="chatbot-avatar-btn flex-shrink-0"
            @click="openAvatarPreview('/chatbot-avatar.png', chatbotName)"
          >
            <v-avatar size="64" class="mb-2">
              <v-img src="/chatbot-avatar.png" alt="chatbot"></v-img>
            </v-avatar>
          </button>
          <div class="text-body-1 mb-1">{{ $t('chatbot.welcome') }}</div>
          <div class="text-body-2 mb-3">{{ $t('chatbot.welcomeSubtitle') }}</div>
          <!-- Suggested question chips -->
          <div class="d-flex flex-wrap justify-center ga-1">
            <v-chip
              v-for="question in SUGGESTED_QUESTIONS"
              :key="question"
              size="small"
              variant="tonal"
              color="primary"
              class="chatbot-chip text-body-2"
              @click="sendSuggestedQuestion(question)"
            >
              {{ question }}
            </v-chip>
          </div>
        </div>

        <!-- Message list -->
        <div v-for="(message, index) in messages" :key="index" class="mb-3">
          <!-- User message -->
          <div v-if="message.role === 'user'" class="d-flex justify-end align-end ga-1">
            <v-sheet
              color="primary"
              class="chatbot-bubble text-body-1 pa-2 px-3"
              rounded="lg"
              max-width="260"
            >
              {{ message.content }}
            </v-sheet>
            <button
              class="chatbot-avatar-btn flex-shrink-0"
              @click="
                openAvatarPreview(
                  userStore.user?.avatar ?? null,
                  userStore.user?.full_name ?? 'User',
                )
              "
            >
              <v-avatar size="24" :color="userStore.user?.avatar ? undefined : 'primary'">
                <v-img v-if="userStore.user?.avatar" :src="userStore.user.avatar" cover />
                <span v-else class="text-caption font-weight-bold" style="font-size: 12px">
                  {{ (userStore.user?.full_name ?? 'U').charAt(0).toUpperCase() }}
                </span>
              </v-avatar>
            </button>
          </div>

          <!-- Assistant message -->
          <div v-else class="d-flex align-end ga-1">
            <button
              class="chatbot-avatar-btn flex-shrink-0"
              @click="openAvatarPreview('/chatbot-avatar.png', chatbotName)"
            >
              <v-avatar size="24">
                <v-img src="/chatbot-avatar.png" alt="chatbot" cover />
              </v-avatar>
            </button>
            <div class="d-flex flex-column align-start">
              <v-sheet
                class="chatbot-bubble chatbot-bubble--assistant text-body-1 pa-2 px-3"
                rounded="lg"
                max-width="260"
              >
                <!-- eslint-disable vue/no-v-html -->
                <div
                  class="chatbot-markdown text-body-1"
                  v-html="renderMarkdown(message.content)"
                ></div>
                <!-- eslint-enable vue/no-v-html -->
              </v-sheet>
              <!-- Follow-up suggestion chips -->
              <div
                v-if="message.suggestions && message.suggestions.length > 0"
                class="d-flex flex-wrap ga-1 mt-1"
                style="max-width: 280px"
              >
                <v-chip
                  v-for="suggestion in message.suggestions"
                  :key="suggestion"
                  size="small"
                  variant="outlined"
                  color="primary"
                  class="chatbot-chip text-body-2"
                  :disabled="isLoading"
                  @click="sendSuggestedQuestion(suggestion)"
                >
                  {{ suggestion }}
                </v-chip>
              </div>
            </div>
          </div>
        </div>

        <!-- Typing indicator -->
        <div v-if="isLoading" class="d-flex justify-start mb-2">
          <v-sheet class="chatbot-bubble--assistant pa-2 px-3" rounded="lg">
            <div class="chatbot-typing"><span></span><span></span><span></span></div>
          </v-sheet>
        </div>
      </div>

      <v-divider v-if="!isSettingsOpen && !isHelpOpen"></v-divider>

      <!-- Input -->
      <div v-show="!isSettingsOpen && !isHelpOpen" class="pa-2 d-flex align-center ga-2">
        <v-text-field
          v-model="inputMessage"
          density="compact"
          variant="outlined"
          :placeholder="$t('chatbot.placeholder')"
          hide-details
          rounded="lg"
          class="flex-grow-1"
          :disabled="isLoading"
          @keyup.enter="sendMessage"
        ></v-text-field>
        <v-btn
          icon="mdi-send"
          color="primary"
          size="small"
          :loading="isLoading"
          :disabled="!inputMessage.trim()"
          @click="sendMessage"
        ></v-btn>
      </div>
    </v-card>

    <!-- Floating toggle button -->
    <v-btn
      class="chatbot-toggle-button"
      :color="isOpen ? 'grey' : 'primary'"
      icon
      size="large"
      elevation="6"
      @click="isOpen = !isOpen"
    >
      <v-icon v-if="isOpen" icon="mdi-close"></v-icon>
      <v-avatar v-else size="36">
        <v-img src="/chatbot-avatar.png" alt="chatbot"></v-img>
      </v-avatar>
    </v-btn>
    <!-- Avatar preview overlay -->
    <div
      v-if="avatarPreviewOpen"
      class="chatbot-avatar-overlay"
      @click.self="avatarPreviewOpen = false"
    >
      <div class="chatbot-avatar-card">
        <div class="chatbot-avatar-card-name">{{ avatarPreviewName }}</div>
        <img
          v-if="avatarPreviewSource"
          :src="avatarPreviewSource"
          class="chatbot-avatar-card-img"
          alt="avatar"
        />
        <div v-else class="chatbot-avatar-card-initials">
          {{ (avatarPreviewName ?? 'U').charAt(0).toUpperCase() }}
        </div>
        <button class="chatbot-avatar-close-btn" @click="avatarPreviewOpen = false">✕</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import { apiClient } from '@/utils/apiClient'
import { marked } from 'marked'
import type { ChatbotMessage } from '@/types'
/* END IMPORT */

const { t } = useI18n()
const userStore = useUserStore()
const runtimeConfig = useRuntimeConfig()
const chatbotName = computed<string>(
  () => (runtimeConfig.public.chatbotName as string) || t('chatbot.title'),
)

// ── Storage keys ──────────────────────────────────────────────────────────────
const STORAGE_TONE = 'chatbot_tone'
const STORAGE_HISTORY_LIMIT = 'chatbot_history_limit'
const STORAGE_MESSAGES = 'chatbot_messages'
const MAX_ASSISTANT_REPLIES = 20

// ── Suggested questions ───────────────────────────────────────────────────────
const SUGGESTED_QUESTIONS = computed<string[]>(() => {
  const employeeQuestions = [
    t('chatbot.suggestions.createLeave'),
    t('chatbot.suggestions.clockQr'),
    t('chatbot.suggestions.createWfh'),
    t('chatbot.suggestions.forgetClock'),
    t('chatbot.suggestions.registerKyc'),
  ]
  const adminQuestions = [
    t('chatbot.suggestions.adminApproval'),
    t('chatbot.suggestions.reviewKyc'),
  ]

  return userStore.isAdmin ? [...employeeQuestions, ...adminQuestions] : employeeQuestions
})

// ── Descriptions ──────────────────────────────────────────────────────────────
const TONE_DESCRIPTIONS = computed<Record<string, string>>(() => ({
  professional: t('chatbot.settings.professionalDesc'),
  friendly: t('chatbot.settings.friendlyDesc'),
  concise: t('chatbot.settings.conciseDesc'),
  rapper: t('chatbot.settings.rapperDesc'),
}))

const HISTORY_LIMIT_DESCRIPTIONS = computed<Record<number, string>>(() => ({
  5: t('chatbot.settings.history5'),
  10: t('chatbot.settings.history10'),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
const loadStorage = (key: string, defaultValue: string): string => {
  if (typeof localStorage === 'undefined') return defaultValue

  return localStorage.getItem(key) ?? defaultValue
}

const loadStorageInt = (key: string, defaultValue: number): number => {
  if (typeof localStorage === 'undefined') return defaultValue
  const stored = localStorage.getItem(key)

  return stored !== null ? parseInt(stored, 10) : defaultValue
}

const loadStorageMessages = (): ChatbotMessage[] => {
  if (typeof localStorage === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_MESSAGES)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed as ChatbotMessage[]
  } catch {
    return []
  }
}

/**
 * Removes oldest user+assistant pairs from the front until
 * the number of assistant replies is within MAX_ASSISTANT_REPLIES.
 */
const trimMessages = (msgs: ChatbotMessage[]): ChatbotMessage[] => {
  let result = [...msgs]
  while (result.filter((message) => message.role === 'assistant').length > MAX_ASSISTANT_REPLIES) {
    const firstAssistantIndex = result.findIndex((message) => message.role === 'assistant')
    if (firstAssistantIndex === -1) break
    result = result.slice(firstAssistantIndex + 1)
  }
  return result
}

/**
 * Detects the language of a given text using simple character-set heuristics.
 * Returns 'Vietnamese', 'Japanese', or 'English'.
 */
const detectLanguage = (text: string): string => {
  if (/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(text)) return 'Japanese'
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text))
    return 'Vietnamese'

  return 'English'
}

/** START DEFINE STATE */
const isOpen = ref(false)
const isSettingsOpen = ref(false)
const isHelpOpen = ref(false)
const inputMessage = ref('')
const messages = ref<ChatbotMessage[]>(loadStorageMessages())
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const selectedTone = ref<string>(loadStorage(STORAGE_TONE, 'professional'))
const selectedHistoryLimit = ref<number>(loadStorageInt(STORAGE_HISTORY_LIMIT, 10))
const avatarPreviewOpen = ref(false)
const avatarPreviewSource = ref<string | null>(null)
const avatarPreviewName = ref<string>('')
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const toneDescription = computed(() => TONE_DESCRIPTIONS.value[selectedTone.value] ?? '')
const historyLimitDescription = computed(
  () => HISTORY_LIMIT_DESCRIPTIONS.value[selectedHistoryLimit.value] ?? '',
)
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const openAvatarPreview = (source: string | null, name: string) => {
  avatarPreviewSource.value = source
  avatarPreviewName.value = name
  avatarPreviewOpen.value = true
}

const toggleHelp = () => {
  isHelpOpen.value = !isHelpOpen.value
  if (isHelpOpen.value) isSettingsOpen.value = false
}

const toggleSettings = () => {
  isSettingsOpen.value = !isSettingsOpen.value
  if (isSettingsOpen.value) isHelpOpen.value = false
}

const selectHelpQuestion = async (question: string) => {
  isHelpOpen.value = false
  await doSend(question)
}

const renderMarkdown = (content: string): string => {
  return marked.parse(content) as string
}

const scrollToBottom = async () => {
  await nextTick()

  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const clearMessages = () => {
  messages.value = []
  if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_MESSAGES)
  isSettingsOpen.value = false
}

/**
 * Returns the slice of messages to send to the API based on the history limit.
 * Always ends with the most recent message.
 */
const getMessagesToSend = (): ChatbotMessage[] => {
  return messages.value.slice(-selectedHistoryLimit.value)
}

const doSend = async (text: string) => {
  messages.value.push({ role: 'user', content: text })
  isLoading.value = true
  await scrollToBottom()

  try {
    const response = await apiClient.post<{ reply: string; suggestions: string[] }>(
      '/chatbot/message',
      {
        messages: getMessagesToSend(),
        tone: selectedTone.value,
        language: detectLanguage(text),
      },
    )
    messages.value.push({
      role: 'assistant',
      content: response.reply,
      suggestions: response.suggestions ?? [],
    })
    messages.value = trimMessages(messages.value)
  } catch (error) {
    console.error('Chatbot error:', error)
    messages.value.push({
      role: 'assistant',
      content: t('chatbot.error'),
    })
    messages.value = trimMessages(messages.value)
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}

const sendMessage = async () => {
  const text = inputMessage.value.trim()
  if (!text || isLoading.value) return
  inputMessage.value = ''
  await doSend(text)
}

const sendSuggestedQuestion = async (question: string) => {
  if (isLoading.value) return
  await doSend(question)
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(isOpen, async (value) => {
  if (value) {
    isSettingsOpen.value = false
    isHelpOpen.value = false
    await scrollToBottom()
  }
})

watch(
  messages,
  (value) => {
    if (typeof localStorage !== 'undefined')
      localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(value))
  },
  { deep: true },
)

watch(selectedTone, (value) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_TONE, value)
})

watch(selectedHistoryLimit, (value) => {
  if (typeof localStorage !== 'undefined')
    localStorage.setItem(STORAGE_HISTORY_LIMIT, String(value))
})
/* END DEFINE WATCHER */
</script>

<style scoped>
.chatbot-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.chatbot-panel {
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

.chatbot-panel :deep(.v-toolbar-title__placeholder) {
  overflow: visible;
  text-overflow: unset;
  white-space: nowrap;
}

.chatbot-settings {
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.chatbot-help {
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  max-height: 420px;
  overflow-y: auto;
}

.chatbot-messages {
  flex: 1;
  overflow-y: auto;
  min-height: 280px;
  max-height: 360px;
  color: rgb(var(--v-theme-on-surface));
}

.chatbot-bubble {
  word-break: break-word;
}

.chatbot-bubble--assistant {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
  color: rgb(var(--v-theme-on-surface));
  word-break: break-word;
}

.chatbot-chip {
  cursor: pointer;
  height: auto !important;
  white-space: normal !important;
}

.chatbot-chip :deep(.v-chip__content) {
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
  line-height: 1.4;
  padding: 3px 0;
}

.chatbot-toggle-button {
  flex-shrink: 0;
}

.chatbot-avatar-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  border-radius: 50%;
  transition: opacity 0.15s;
  position: relative;
  z-index: 1;
}

.chatbot-avatar-btn:hover {
  opacity: 0.8;
}

.chatbot-avatar-btn :deep(.v-avatar) {
  pointer-events: auto;
}

/* Markdown rendered content */
.chatbot-markdown :deep(p) {
  margin: 0 0 6px 0;
}
.chatbot-markdown :deep(p:last-child) {
  margin-bottom: 0;
}
.chatbot-markdown :deep(ul),
.chatbot-markdown :deep(ol) {
  margin: 4px 0 6px 16px;
  padding: 0;
}
.chatbot-markdown :deep(li) {
  margin-bottom: 2px;
}
.chatbot-markdown :deep(strong) {
  font-weight: 600;
}
.chatbot-markdown :deep(code) {
  background: rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 0.85em;
  font-family: monospace;
}
.chatbot-markdown :deep(pre) {
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-radius: 6px;
  padding: 8px;
  overflow-x: auto;
  margin: 6px 0;
}
.chatbot-markdown :deep(pre code) {
  background: none;
  padding: 0;
}
.chatbot-markdown :deep(h1),
.chatbot-markdown :deep(h2),
.chatbot-markdown :deep(h3) {
  font-size: 1em;
  font-weight: 600;
  margin: 6px 0 4px;
}
.chatbot-markdown :deep(blockquote) {
  border-left: 3px solid rgba(var(--v-theme-on-surface), 0.3);
  margin: 4px 0;
  padding-left: 8px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

/* Typing indicator animation */
.chatbot-typing {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 2px 4px;
}

.chatbot-typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: rgba(var(--v-theme-on-surface), 0.4);
  animation: chatbot-bounce 1.2s infinite;
}

.chatbot-typing span:nth-child(2) {
  animation-delay: 0.2s;
}

.chatbot-typing span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes chatbot-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

.chatbot-avatar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chatbot-avatar-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  position: relative;
  min-width: 240px;
}

.chatbot-avatar-card-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: rgb(var(--v-theme-on-surface));
}

.chatbot-avatar-card-img {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
  margin: 0 auto;
}

.chatbot-avatar-card-initials {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 64px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.chatbot-avatar-close-btn {
  position: absolute;
  top: 8px;
  right: 10px;
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.6;
  line-height: 1;
}

.chatbot-avatar-close-btn:hover {
  opacity: 1;
}
</style>
