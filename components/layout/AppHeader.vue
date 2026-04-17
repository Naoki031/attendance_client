<template>
  <v-app-bar app elevation="0" color="primary">
    <!-- Hamburger button: visible on mobile only -->
    <v-app-bar-nav-icon class="d-flex d-md-none" @click="drawer.toggle()"></v-app-bar-nav-icon>

    <v-app-bar-title>
      <div class="d-flex align-center ga-2">
        <v-icon icon="mdi-briefcase-clock-outline" color="white" size="22"></v-icon>
        <span class="font-weight-bold text-white text-body-1 ml-1 d-none d-sm-inline"
          >Attendance</span
        >
      </div>
    </v-app-bar-title>

    <template #append>
      <!-- Admin notification shortcuts — always visible -->
      <template v-if="userStore.isAdmin">
        <v-tooltip :text="$t('nav.approvals')" location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              class="text-white"
              :to="{ name: 'admin.approvals.index' }"
            >
              <v-badge
                v-if="approvalsStore.pendingCount > 0"
                :content="approvalsStore.pendingCount"
                color="error"
              >
                <v-icon icon="mdi-check-circle-outline"></v-icon>
              </v-badge>
              <v-icon v-else icon="mdi-check-circle-outline"></v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip :text="$t('nav.kycApproval')" location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              class="text-white"
              :to="{ name: 'admin.kyc.index' }"
            >
              <v-badge
                v-if="kycStore.pendingCount > 0"
                :content="kycStore.pendingCount"
                color="error"
              >
                <v-icon icon="mdi-face-recognition"></v-icon>
              </v-badge>
              <v-icon v-else icon="mdi-face-recognition"></v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </template>

      <!-- Notification bell — always visible -->
      <v-menu v-model="notifMenuOpen" :close-on-content-click="false" location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-tooltip :text="$t('nav.notifications')" location="bottom">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-bind="{ ...menuProps, ...tooltipProps }"
                icon
                variant="text"
                class="text-white"
              >
                <v-badge
                  v-if="notificationsStore.unreadCount > 0"
                  :content="
                    notificationsStore.unreadCount > 99 ? '99+' : notificationsStore.unreadCount
                  "
                  color="error"
                >
                  <v-icon icon="mdi-bell-outline"></v-icon>
                </v-badge>
                <v-icon v-else icon="mdi-bell-outline"></v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </template>

        <v-card min-width="360" max-width="420" rounded="lg" elevation="8">
          <div class="d-flex align-center px-4 pt-3 pb-2">
            <span class="text-subtitle-2 font-weight-bold flex-grow-1">
              {{ $t('nav.notifications') }}
            </span>
            <v-btn
              v-if="notificationsStore.hasUnread"
              size="x-small"
              variant="text"
              color="primary"
              @click="markAllRead"
            >
              {{ $t('notifications.markAllRead') }}
            </v-btn>
          </div>
          <v-divider />

          <v-list
            v-if="notificationsStore.items.length > 0"
            density="comfortable"
            class="pa-0"
            max-height="400"
            style="overflow-y: auto"
          >
            <template v-for="(notif, index) in notificationsStore.items" :key="notif.id">
              <v-divider v-if="index > 0" />
              <v-list-item
                class="px-4 py-2"
                :class="notif.is_read ? '' : 'notif-unread'"
                @click="handleNotifClick(notif)"
              >
                <template #prepend>
                  <v-avatar
                    size="36"
                    :color="notif.icon_color ?? 'primary'"
                    variant="tonal"
                    class="mr-3 flex-shrink-0"
                  >
                    <v-icon :icon="notif.icon ?? 'mdi-bell-outline'" size="18" />
                  </v-avatar>
                </template>
                <div style="min-width: 0">
                  <div class="d-flex align-center justify-space-between ga-2">
                    <span
                      class="text-body-2 text-truncate"
                      :class="notif.is_read ? 'text-medium-emphasis' : 'font-weight-bold'"
                    >
                      {{ notif.title }}
                    </span>
                    <span class="text-caption text-medium-emphasis flex-shrink-0">
                      {{ formatNotifTime(notif.created_at) }}
                    </span>
                  </div>
                  <div v-if="notif.body" class="text-caption text-medium-emphasis text-truncate">
                    {{ notif.body }}
                  </div>
                </div>
                <template v-if="!notif.is_read" #append>
                  <div class="notif-dot ml-2" />
                </template>
              </v-list-item>
            </template>
          </v-list>
          <div v-else class="text-center text-medium-emphasis text-body-2 py-6">
            {{ $t('notifications.empty') }}
          </div>
        </v-card>
      </v-menu>

      <!-- Chat — always visible -->
      <v-menu v-model="chatMenuOpen" :close-on-content-click="false" location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-tooltip :text="$t('nav.chat')" location="bottom">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-bind="{ ...menuProps, ...tooltipProps }"
                icon
                variant="text"
                class="text-white"
              >
                <v-badge
                  v-if="totalUnread > 0"
                  :content="totalUnread > 99 ? '99+' : totalUnread"
                  color="error"
                >
                  <v-icon icon="mdi-chat-outline"></v-icon>
                </v-badge>
                <v-icon v-else icon="mdi-chat-outline"></v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </template>

        <v-card min-width="360" max-width="400" rounded="lg" elevation="8">
          <div class="d-flex align-center pr-2">
            <v-tabs
              v-model="chatTab"
              density="compact"
              color="primary"
              class="px-2 pt-1 flex-grow-1"
            >
              <v-tab value="unread" class="text-caption">
                {{ $t('chat.unreadMessages') }}
                <v-badge
                  v-if="totalUnread > 0"
                  :content="totalUnread > 99 ? '99+' : totalUnread"
                  color="error"
                  inline
                  class="ml-1"
                />
              </v-tab>
              <v-tab value="read" class="text-caption">{{ $t('chat.readMessages') }}</v-tab>
            </v-tabs>
            <v-btn
              v-if="totalUnread > 0"
              size="x-small"
              variant="text"
              color="primary"
              :to="'/chat'"
              @click="chatMenuOpen = false"
            >
              {{ $t('chat.viewAll') }}
            </v-btn>
          </div>
          <v-divider />

          <v-window v-model="chatTab">
            <!-- Unread tab -->
            <v-window-item value="unread">
              <v-list
                v-if="sortedUnreadMessages.length > 0"
                density="comfortable"
                class="pa-0"
                max-height="380"
                style="overflow-y: auto"
              >
                <template v-for="(message, index) in sortedUnreadMessages" :key="message.id">
                  <v-divider v-if="index > 0" />
                  <v-list-item class="px-3 py-2" @click="handleUnreadMessageClick(message)">
                    <template #prepend>
                      <v-avatar
                        size="36"
                        :color="message.senderAvatar ? undefined : 'primary'"
                        class="mr-3 flex-shrink-0"
                      >
                        <v-img v-if="message.senderAvatar" :src="message.senderAvatar" cover />
                        <span v-else class="text-caption text-white font-weight-bold">
                          {{ getInitials(message.senderName) }}
                        </span>
                      </v-avatar>
                    </template>
                    <div style="min-width: 0">
                      <div class="d-flex align-center justify-space-between ga-2">
                        <span class="text-body-2 font-weight-bold text-truncate">
                          {{ message.senderName }}
                        </span>
                        <span class="text-caption text-medium-emphasis flex-shrink-0">
                          {{ formatMessageTime(message.createdAt) }}
                        </span>
                      </div>
                      <div class="text-caption text-medium-emphasis text-truncate mb-0.5">
                        <v-icon size="12" class="mr-0.5">
                          {{ message.roomType === 'direct' ? 'mdi-account' : 'mdi-pound' }}
                        </v-icon>
                        {{ message.roomType === 'direct' ? message.senderName : message.roomName }}
                      </div>
                      <div class="text-body-2 text-truncate">
                        {{ stripMarkdown(message.content) || $t('chat.emojiMessage') }}
                      </div>
                    </div>
                  </v-list-item>
                </template>
              </v-list>
              <div v-else class="text-center text-medium-emphasis text-body-2 py-6">
                {{ $t('chat.noUnreadMessages') }}
              </div>
            </v-window-item>

            <!-- Read tab -->
            <v-window-item value="read">
              <v-list
                v-if="sortedReadMessages.length > 0"
                density="comfortable"
                class="pa-0"
                max-height="380"
                style="overflow-y: auto"
              >
                <template v-for="(message, index) in sortedReadMessages" :key="message.id">
                  <v-divider v-if="index > 0" />
                  <v-list-item class="px-3 py-2" @click="handleUnreadMessageClick(message)">
                    <template #prepend>
                      <v-avatar
                        size="36"
                        :color="message.senderAvatar ? undefined : 'primary'"
                        class="mr-3 flex-shrink-0"
                      >
                        <v-img v-if="message.senderAvatar" :src="message.senderAvatar" cover />
                        <span v-else class="text-caption text-white font-weight-bold">
                          {{ getInitials(message.senderName) }}
                        </span>
                      </v-avatar>
                    </template>
                    <div style="min-width: 0">
                      <div class="d-flex align-center justify-space-between ga-2">
                        <span class="text-body-2 font-weight-bold text-truncate">
                          {{ message.senderName }}
                        </span>
                        <span class="text-caption text-medium-emphasis flex-shrink-0">
                          {{ formatMessageTime(message.createdAt) }}
                        </span>
                      </div>
                      <div class="text-caption text-medium-emphasis text-truncate mb-0.5">
                        <v-icon size="12" class="mr-0.5">
                          {{ message.roomType === 'direct' ? 'mdi-account' : 'mdi-pound' }}
                        </v-icon>
                        {{ message.roomType === 'direct' ? message.senderName : message.roomName }}
                      </div>
                      <div class="text-body-2 text-truncate">
                        {{ stripMarkdown(message.content) || $t('chat.emojiMessage') }}
                      </div>
                    </div>
                  </v-list-item>
                </template>
              </v-list>
              <div v-else class="text-center text-medium-emphasis text-body-2 py-6">
                {{ $t('chat.noReadMessages') }}
              </div>
            </v-window-item>
          </v-window>
        </v-card>
      </v-menu>

      <!-- Desktop: theme + language shown directly -->
      <div class="d-none d-md-flex align-center">
        <v-tooltip
          :text="isDark ? $t('common.lightMode') : $t('common.darkMode')"
          location="bottom"
        >
          <template #activator="{ props }">
            <v-btn v-bind="props" icon variant="text" class="text-white" @click="toggleTheme">
              <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <HeaderLanguageSwitcher />
      </div>

      <!-- Mobile: overflow menu with all secondary actions -->
      <v-menu class="d-flex d-md-none" location="bottom end" :close-on-content-click="true">
        <template #activator="{ props }">
          <v-btn v-bind="props" icon variant="text" class="text-white d-flex d-md-none">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list density="compact" min-width="200">
          <!-- Theme toggle -->
          <v-list-item
            :prepend-icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
            :title="isDark ? $t('common.lightMode') : $t('common.darkMode')"
            @click="toggleTheme"
          />
          <v-divider />
          <!-- Language options -->
          <v-list-item
            v-for="locale in availableLocales"
            :key="locale.code"
            prepend-icon="mdi-translate"
            :title="locale.name"
            :active="locale.code === currentLocale"
            active-color="primary"
            @click="changeLanguage(locale.code)"
          />
        </v-list>
      </v-menu>

      <!-- User menu — always visible -->
      <HeaderUserMenu />
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
/** START IMPORT */
import { useTheme } from 'vuetify'
import HeaderLanguageSwitcher from '@/components/layout/HeaderLanguageSwitcher.vue'
import HeaderUserMenu from '@/components/layout/HeaderUserMenu.vue'
import { useDrawer } from '@/composables/useDrawer'
import { useApprovalsStore } from '@/stores/approvals'
import { useKycStore } from '@/stores/kyc'
import { useMoment } from '@/composables/useMoment'
import { useChatUnread } from '@/composables/useChatUnread'
import { useNotificationsStore } from '@/stores/notifications'
import type { NotificationModel } from '@/interfaces/models/NotificationModel'
/* END IMPORT */

/** START DEFINE STATE */
const userStore = useUserStore()
const approvalsStore = useApprovalsStore()
const theme = useTheme()
const THEME_STORAGE_KEY = 'attendance-theme'
const isDark = computed(() => theme.global.name.value === 'sandstone-dark')

const { locale: currentLocale, setLocale, locales } = useI18n()
const availableLocales = computed(() =>
  (locales.value as Array<{ code: string; name: string }>).map((locale) => ({
    code: locale.code,
    name: locale.name,
  })),
)

const toggleTheme = () => {
  const next = isDark.value ? 'light' : 'sandstone-dark'
  theme.global.name.value = next
  localStorage.setItem(THEME_STORAGE_KEY, next)
}

const kycStore = useKycStore()
const drawer = useDrawer()
const route = useRoute()
const router = useRouter()
const notificationsStore = useNotificationsStore()
const notifMenuOpen = ref(false)
const chatMenuOpen = ref(false)
const chatTab = ref<'unread' | 'read'>('unread')
const { totalUnread, unreadMessages, readMessages, fetchUnreadCounts } = useChatUnread()
const { moment: momentInstance } = useMoment()
let pollingTimer: ReturnType<typeof setInterval> | null = null

const sortedUnreadMessages = computed(() =>
  [...unreadMessages.value].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  ),
)

const sortedReadMessages = computed(() =>
  [...readMessages.value].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  ),
)
/* END DEFINE STATE */

/** START DEFINE METHOD */
async function handleNotifClick(notif: NotificationModel) {
  notifMenuOpen.value = false
  await notificationsStore.markAsRead(notif.id)
  if (notif.route) {
    await router.push(notif.route)
  }
}

async function markAllRead() {
  await notificationsStore.markAllAsRead()
}

function formatNotifTime(createdAt: string): string {
  const date = momentInstance.utc(createdAt).local()
  if (!date.isValid()) return ''
  const now = momentInstance()
  const diffMinutes = now.diff(date, 'minutes')
  if (diffMinutes < 1) return 'now'
  if (diffMinutes < 60) return `${diffMinutes}m`
  const diffHours = now.diff(date, 'hours')
  if (diffHours < 24) return `${diffHours}h`
  return date.format('MMM D')
}

async function changeLanguage(code: string) {
  await setLocale(code as 'en' | 'vi' | 'ja')
  await userStore.updateLanguage(code)
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

function getInitials(name: string): string {
  const parts = name.trim().split(' ')

  if (parts.length > 1 && parts[0] && parts.at(-1)) {
    return `${parts[0][0]}${parts.at(-1)![0]}`.toUpperCase()
  }

  return parts[0]?.[0]?.toUpperCase() ?? ''
}

function formatMessageTime(createdAt: string): string {
  const date = momentInstance.utc(createdAt).local()
  if (!date.isValid()) return ''

  const now = momentInstance()
  const diffMinutes = now.diff(date, 'minutes')
  if (diffMinutes < 1) return 'now'
  if (diffMinutes < 60) return `${diffMinutes}m`
  const diffHours = now.diff(date, 'hours')
  if (diffHours < 24) return `${diffHours}h`

  return date.format('MMM D')
}

function handleUnreadMessageClick(message: (typeof unreadMessages.value)[number]) {
  chatMenuOpen.value = false

  if (message.parentId) {
    navigateTo(`/chat/${message.roomUuid}?scrollTo=${message.id}&openThread=${message.parentId}`)
  } else {
    navigateTo(`/chat/${message.roomUuid}?scrollTo=${message.id}`)
  }
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  // Restore saved theme preference; default to 'light' when no preference is saved
  const saved = localStorage.getItem(THEME_STORAGE_KEY)

  if (saved === 'light' || saved === 'sandstone-dark') {
    theme.global.name.value = saved
  } else {
    theme.global.name.value = 'light'
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
  }

  fetchUnreadCounts()

  // Poll every 30s as fallback for when WebSocket isn't connected
  pollingTimer = setInterval(() => {
    fetchUnreadCounts()
  }, 30000)
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
})

// Re-fetch unread counts when navigating to chat index or opening the menu
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/chat') {
      fetchUnreadCounts()
    }
  },
)

watch(chatMenuOpen, (isOpen) => {
  if (isOpen) {
    fetchUnreadCounts()
  }
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.notif-unread {
  background: rgba(var(--v-theme-primary), 0.04);
}

.notif-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}
</style>
