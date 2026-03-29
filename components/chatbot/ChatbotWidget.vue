<template>
  <!-- Floating chatbot button + panel (always visible, bottom-right) -->
  <div class="chatbot-container">
    <!-- Chat panel -->
    <v-card v-if="isOpen" class="chatbot-panel" elevation="8" rounded="lg" width="360">
      <!-- Header -->
      <v-toolbar color="primary" density="compact" rounded="t-lg">
        <v-icon icon="mdi-robot-outline" class="ml-2 mr-2"></v-icon>
        <v-toolbar-title class="text-body-2 font-weight-bold">{{
          $t('chatbot.title')
        }}</v-toolbar-title>
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
          <v-icon icon="mdi-robot-outline" size="40" color="primary" class="mb-2"></v-icon>
          <div class="text-body-2 mb-1">{{ $t('chatbot.welcome') }}</div>
          <div class="text-caption mb-3">{{ $t('chatbot.welcomeSubtitle') }}</div>
          <!-- Suggested question chips -->
          <div class="d-flex flex-wrap justify-center ga-1">
            <v-chip
              v-for="question in SUGGESTED_QUESTIONS"
              :key="question"
              size="small"
              variant="tonal"
              color="primary"
              class="chatbot-chip text-caption"
              @click="sendSuggestedQuestion(question)"
            >
              {{ question }}
            </v-chip>
          </div>
        </div>

        <!-- Message list -->
        <div v-for="(message, index) in messages" :key="index" class="mb-3">
          <!-- User message -->
          <div v-if="message.role === 'user'" class="d-flex justify-end">
            <v-sheet
              color="primary"
              class="chatbot-bubble text-white text-body-2 pa-2 px-3"
              rounded="lg"
              max-width="280"
            >
              {{ message.content }}
            </v-sheet>
          </div>

          <!-- Assistant message -->
          <div v-else class="d-flex flex-column align-start">
            <v-sheet
              color="grey-lighten-4"
              class="chatbot-bubble text-body-2 pa-2 px-3"
              rounded="lg"
              max-width="280"
            >
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div
                class="chatbot-markdown text-body-2"
                v-html="renderMarkdown(message.content)"
              ></div>
            </v-sheet>
            <!-- Follow-up suggestion chips -->
            <div
              v-if="message.suggestions && message.suggestions.length > 0"
              class="d-flex flex-wrap ga-1 mt-1"
              style="max-width: 300px"
            >
              <v-chip
                v-for="suggestion in message.suggestions"
                :key="suggestion"
                size="x-small"
                variant="outlined"
                color="primary"
                class="chatbot-chip text-caption"
                :disabled="isLoading"
                @click="sendSuggestedQuestion(suggestion)"
              >
                {{ suggestion }}
              </v-chip>
            </div>
          </div>
        </div>

        <!-- Typing indicator -->
        <div v-if="isLoading" class="d-flex justify-start mb-2">
          <v-sheet color="grey-lighten-4" class="pa-2 px-3" rounded="lg">
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
      <v-icon :icon="isOpen ? 'mdi-close' : 'mdi-robot-outline'"></v-icon>
    </v-btn>
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

// ── Storage keys ──────────────────────────────────────────────────────────────
const STORAGE_TONE = 'chatbot_tone'
const STORAGE_HISTORY_LIMIT = 'chatbot_history_limit'

// ── Suggested questions ───────────────────────────────────────────────────────
const SUGGESTED_QUESTIONS = computed<string[]>(() => {
  const employeeQuestions = [
    t('chatbot.suggestions.createLeave'),
    t('chatbot.suggestions.clockQr'),
    t('chatbot.suggestions.createWfh'),
    t('chatbot.suggestions.forgetClock'),
  ]
  const adminQuestions = [t('chatbot.suggestions.adminApproval')]

  return userStore.isAdmin ? [...employeeQuestions, ...adminQuestions] : employeeQuestions
})

// ── Descriptions ──────────────────────────────────────────────────────────────
const TONE_DESCRIPTIONS = computed<Record<string, string>>(() => ({
  professional: t('chatbot.settings.professionalDesc'),
  friendly: t('chatbot.settings.friendlyDesc'),
  concise: t('chatbot.settings.conciseDesc'),
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
const messages = ref<ChatbotMessage[]>([])
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const selectedTone = ref<string>(loadStorage(STORAGE_TONE, 'professional'))
const selectedHistoryLimit = ref<number>(loadStorageInt(STORAGE_HISTORY_LIMIT, 10))
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const toneDescription = computed(() => TONE_DESCRIPTIONS.value[selectedTone.value] ?? '')
const historyLimitDescription = computed(
  () => HISTORY_LIMIT_DESCRIPTIONS.value[selectedHistoryLimit.value] ?? '',
)
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
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
  } catch (error) {
    console.error('Chatbot error:', error)
    messages.value.push({
      role: 'assistant',
      content: t('chatbot.error'),
    })
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

.chatbot-settings {
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.chatbot-help {
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  max-height: 420px;
  overflow-y: auto;
}

.chatbot-messages {
  flex: 1;
  overflow-y: auto;
  min-height: 280px;
  max-height: 360px;
}

.chatbot-bubble {
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
  background: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
  padding: 1px 4px;
  font-size: 0.85em;
  font-family: monospace;
}
.chatbot-markdown :deep(pre) {
  background: rgba(0, 0, 0, 0.06);
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
  border-left: 3px solid #ccc;
  margin: 4px 0;
  padding-left: 8px;
  color: #666;
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
  background-color: #aaa;
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
</style>
