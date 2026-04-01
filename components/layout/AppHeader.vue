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
                <v-list-item
                  v-for="message in sortedUnreadMessages"
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
                    <div class="text-body-2 text-truncate mt-0.5">{{ message.content }}</div>
                  </div>
                </v-list-item>
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
                <v-list-item
                  v-for="message in sortedReadMessages"
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
                    <div class="text-body-2 text-truncate mt-0.5">{{ message.content }}</div>
                  </div>
                </v-list-item>
              </v-list>
              <div v-else class="text-center text-medium-emphasis text-body-2 py-6">
                {{ $t('chat.noReadMessages') }}
              </div>
            </v-window-item>
          </v-window>
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
import { useMoment } from '@/composables/useMoment'
/* END IMPORT */

/** START DEFINE STATE */
const userStore = useUserStore()
const approvalsStore = useApprovalsStore()
const drawer = useDrawer()
const route = useRoute()
const chatMenuOpen = ref(false)
const chatTab = ref<'unread' | 'read'>('unread')
let pollingTimer: ReturnType<typeof setInterval> | null = null
const { totalUnread, unreadMessages, readMessages, fetchUnreadCounts } = useChatUnread()
const { moment: momentInstance } = useMoment()

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
