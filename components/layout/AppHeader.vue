<template>
  <v-app-bar app elevation="0" color="primary">
    <!-- Hamburger button: visible on mobile only -->
    <v-app-bar-nav-icon class="d-flex d-md-none" @click="drawer.toggle()"></v-app-bar-nav-icon>

    <v-app-bar-title>
      <div class="d-flex align-center ga-2">
        <v-icon icon="mdi-briefcase-clock-outline" color="white" size="22"></v-icon>
        <span class="font-weight-bold text-white text-body-1 ml-1">Attendance</span>
      </div>
    </v-app-bar-title>

    <template #append>
      <!-- Admin shortcuts -->
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
      </template>

      <!-- Chat -->
      <v-menu v-model="chatMenuOpen" :close-on-content-click="true" location="bottom end">
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
          <div class="d-flex align-center justify-space-between pa-3 pb-1">
            <span class="text-subtitle-2 font-weight-bold">{{ $t('chat.unreadMessages') }}</span>
            <v-btn
              v-if="totalUnread > 0"
              size="x-small"
              variant="text"
              color="primary"
              :to="'/chat'"
            >
              {{ $t('chat.viewAll') }}
            </v-btn>
          </div>
          <v-divider />

          <v-list
            v-if="unreadMessages.length > 0"
            density="comfortable"
            class="pa-0"
            max-height="400"
          >
            <v-list-item
              v-for="message in unreadMessages"
              :key="message.id"
              class="px-3 py-2"
              @click="handleUnreadMessageClick(message)"
            >
              <template #prepend>
                <v-avatar
                  size="32"
                  :color="message.senderAvatar ? undefined : 'primary'"
                  class="mr-3"
                >
                  <v-img v-if="message.senderAvatar" :src="message.senderAvatar" cover />
                  <span v-else class="text-caption text-white font-weight-bold">
                    {{ getInitials(message.senderName) }}
                  </span>
                </v-avatar>
              </template>

              <div style="min-width: 0">
                <div class="d-flex align-center ga-1">
                  <span class="text-body-2 font-weight-medium text-truncate">
                    {{ message.senderName }}
                  </span>
                  <span class="text-caption text-medium-emphasis flex-shrink-0">
                    {{ formatMessageTime(message.createdAt) }}
                  </span>
                </div>
                <div class="text-caption text-medium-emphasis text-truncate">
                  {{ message.roomType === 'direct' ? message.senderName : message.roomName }}
                </div>
                <div class="text-body-2 text-truncate mt-0.5">
                  {{ message.content }}
                </div>
              </div>
            </v-list-item>
          </v-list>

          <div v-else class="text-center text-medium-emphasis text-body-2 py-6">
            {{ $t('chat.noUnreadMessages') }}
          </div>
        </v-card>
      </v-menu>

      <!-- Language switcher -->
      <HeaderLanguageSwitcher />

      <!-- User menu -->
      <HeaderUserMenu />
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
/** START IMPORT */
import HeaderLanguageSwitcher from '@/components/layout/HeaderLanguageSwitcher.vue'
import HeaderUserMenu from '@/components/layout/HeaderUserMenu.vue'
import { useDrawer } from '@/composables/useDrawer'
import { useApprovalsStore } from '@/stores/approvals'
/* END IMPORT */

/** START DEFINE STATE */
const userStore = useUserStore()
const approvalsStore = useApprovalsStore()
const drawer = useDrawer()
const route = useRoute()
const chatMenuOpen = ref(false)
let pollingTimer: ReturnType<typeof setInterval> | null = null
const { totalUnread, unreadMessages, fetchUnreadCounts } = useChatUnread()
/* END DEFINE STATE */

/** START DEFINE METHOD */
function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length > 1 && parts[0] && parts.at(-1)) {
    return `${parts[0][0]}${parts.at(-1)![0]}`.toUpperCase()
  }
  return parts[0]?.[0]?.toUpperCase() ?? ''
}

function formatMessageTime(createdAt: string): string {
  const date = new Date(createdAt)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return date.toLocaleDateString()
}

function handleUnreadMessageClick(message: (typeof unreadMessages.value)[number]) {
  chatMenuOpen.value = false
  navigateTo(`/chat/${message.roomUuid}?scrollTo=${message.id}`)
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
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
