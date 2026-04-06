<template>
  <v-card rounded="0" elevation="0" height="100%" class="user-sidebar d-flex flex-column">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between px-4 py-3 flex-shrink-0">
      <div class="text-body-2 font-weight-bold">
        <v-icon size="16" class="mr-1">mdi-account-group-outline</v-icon>
        {{ onlineUserIds.size }}/{{ members.length }} {{ $t('chat.members') }}
      </div>
    </div>
    <v-divider />

    <!-- User lists: fills remaining space and scrolls -->
    <div class="user-list-area px-2">
      <!-- Online section -->
      <div class="px-2 pt-2 pb-1 text-caption font-weight-bold text-medium-emphasis">
        {{ $t('chat.online') }} — {{ onlineMembers.length }}
      </div>
      <v-list density="compact" bg-color="transparent" class="pa-0">
        <v-list-item
          v-for="member in onlineMembers"
          :key="member.user_id"
          rounded="lg"
          class="mb-1"
        >
          <template #prepend>
            <div class="position-relative mr-3">
              <v-avatar size="28" :color="member.user?.avatar ? undefined : 'primary'">
                <v-img v-if="member.user?.avatar" :src="member.user.avatar" cover />
                <span v-else class="text-caption text-white font-weight-bold">
                  {{ getInitials(member.user?.full_name ?? member.user?.email ?? '?') }}
                </span>
              </v-avatar>
              <span class="status-dot status-online" />
            </div>
          </template>

          <div class="d-flex align-center" style="min-width: 0">
            <span class="text-body-2 text-truncate">
              {{ getDisplayName(member) }}
            </span>
            <v-chip
              v-if="member.user_id === myUserId"
              size="x-small"
              variant="tonal"
              color="primary"
              class="ml-1 flex-shrink-0"
            >
              {{ $t('chat.you') }}
            </v-chip>
            <v-chip
              size="x-small"
              :color="getLanguageColor(getOnlineLanguage(member.user_id))"
              variant="tonal"
              class="ml-1 flex-shrink-0"
            >
              {{ getOnlineLanguage(member.user_id) }}
            </v-chip>
          </div>

          <template v-if="isAdmin && member.user_id !== myUserId" #append>
            <v-menu>
              <template #activator="{ props: menuProps }">
                <v-btn icon size="x-small" variant="text" v-bind="menuProps" @click.stop>
                  <v-icon size="16">mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list density="compact" rounded="lg">
                <v-list-item
                  base-color="error"
                  prepend-icon="mdi-account-remove"
                  @click="openKickDialog(member)"
                >
                  <v-list-item-title>{{ $t('chat.removeMember') }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-list-item>
      </v-list>

      <!-- Offline section -->
      <template v-if="offlineMembers.length > 0">
        <v-divider class="mx-2 my-1" />
        <div class="px-2 pt-1 pb-1 text-caption font-weight-bold text-medium-emphasis">
          {{ $t('chat.offline') }} — {{ offlineMembers.length }}
        </div>
        <v-list density="compact" bg-color="transparent" class="pa-0">
          <v-list-item
            v-for="member in offlineMembers"
            :key="member.user_id"
            rounded="lg"
            class="mb-1"
          >
            <template #prepend>
              <div class="position-relative mr-3">
                <v-avatar size="28" :color="member.user?.avatar ? undefined : 'grey'">
                  <v-img v-if="member.user?.avatar" :src="member.user.avatar" cover />
                  <span v-else class="text-caption font-weight-bold">
                    {{ getInitials(member.user?.full_name ?? member.user?.email ?? '?') }}
                  </span>
                </v-avatar>
                <span class="status-dot status-offline" />
              </div>
            </template>

            <div class="d-flex flex-column" style="min-width: 0">
              <div class="d-flex align-center">
                <span class="text-body-2 text-truncate text-medium-emphasis">
                  {{ getDisplayName(member) }}
                </span>
                <v-chip
                  v-if="member.user_id === myUserId"
                  size="x-small"
                  variant="tonal"
                  color="primary"
                  class="ml-1 flex-shrink-0"
                >
                  {{ $t('chat.you') }}
                </v-chip>
              </div>
              <span v-if="member.user?.last_seen_at" class="text-caption text-disabled">
                {{ formatLastSeen(member.user.last_seen_at) }}
              </span>
            </div>

            <template v-if="isAdmin && member.user_id !== myUserId" #append>
              <v-menu>
                <template #activator="{ props: menuProps }">
                  <v-btn icon size="x-small" variant="text" v-bind="menuProps" @click.stop>
                    <v-icon size="16">mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact" rounded="lg">
                  <v-list-item
                    base-color="error"
                    prepend-icon="mdi-account-remove"
                    @click="openKickDialog(member)"
                  >
                    <v-list-item-title>{{ $t('chat.removeMember') }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-list-item>
        </v-list>
      </template>
    </div>

    <!-- Kick member confirmation dialog -->
    <DialogKickMember
      :dialog="kickDialog"
      :member="memberToKick"
      :room-uuid="roomUuid"
      @member-removed="onMemberRemoved"
      @close-modal="kickDialog = false"
    />

    <!-- Bottom controls -->
    <div class="flex-shrink-0">
      <v-divider />
      <!-- Language selector for current user -->
      <div class="px-4 py-3">
        <div class="text-caption font-weight-bold text-medium-emphasis mb-2">
          {{ $t('chat.yourLanguage') }}
        </div>
        <v-select
          v-model="selectedLanguage"
          :items="languageOptions"
          item-title="label"
          item-value="value"
          density="compact"
          variant="outlined"
          hide-details
          rounded="lg"
          @update:model-value="handleLanguageChange"
        />
      </div>

      <!-- Auto-translate toggle -->
      <div class="px-4 pb-3">
        <v-switch
          :model-value="autoTranslate"
          :label="$t('chat.autoTranslate')"
          density="compact"
          color="primary"
          hide-details
          @update:model-value="handleAutoTranslateChange"
        />
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
/** START IMPORT */
import type { PropType } from 'vue'
import type { ChatOnlineUser } from '@/types/chat'
import type { ChatRoomMemberModel } from '@/interfaces/models/ChatRoomModel'
import DialogKickMember from '@/components/chat/DialogKickMember.vue'
/* END IMPORT */

/** START DEFINE PROPS */
const props = defineProps({
  onlineUsers: {
    type: Array as PropType<ChatOnlineUser[]>,
    required: true,
  },
  members: {
    type: Array as PropType<ChatRoomMemberModel[]>,
    required: true,
  },
  myUserId: {
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
  isAdmin: {
    type: Boolean,
    default: false,
  },
  roomUuid: {
    type: String,
    required: true,
  },
})
/* END DEFINE PROPS */

/** START DEFINE EMITS */
const emit = defineEmits<{
  'language-change': [language: string]
  'update:auto-translate': [value: boolean]
  'member-removed': [userId: number]
}>()
/* END DEFINE EMITS */

/** START DEFINE COMPUTED */
const onlineUserIds = computed(() => new Set(props.onlineUsers.map((user) => user.userId)))

const onlineUserMap = computed(() => new Map(props.onlineUsers.map((user) => [user.userId, user])))

const onlineMembers = computed(() =>
  props.members.filter((member) => onlineUserIds.value.has(member.user_id)),
)

const offlineMembers = computed(() =>
  props.members.filter((member) => !onlineUserIds.value.has(member.user_id)),
)
/* END DEFINE COMPUTED */

/** START DEFINE STATE */
const selectedLanguage = ref(props.userLanguage)

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Tiếng Việt', value: 'vi' },
  { label: '日本語', value: 'ja' },
]

const kickDialog = ref(false)
const memberToKick = ref<ChatRoomMemberModel | null>(null)
/* END DEFINE STATE */

/** START DEFINE METHOD */
const { t } = useI18n()

function getDisplayName(member: ChatRoomMemberModel): string {
  return member.user?.full_name ?? member.user?.email ?? 'User'
}

function openKickDialog(member: ChatRoomMemberModel) {
  memberToKick.value = member
  kickDialog.value = true
}

function onMemberRemoved(userId: number) {
  kickDialog.value = false
  memberToKick.value = null
  emit('member-removed', userId)
}

function getOnlineLanguage(userId: number): string {
  return onlineUserMap.value.get(userId)?.language ?? 'en'
}

function getInitials(username: string): string {
  const parts = username.trim().split(' ')

  if (parts.length > 1 && parts[0] && parts.at(-1)) {
    return `${parts[0][0]}${parts.at(-1)![0]}`.toUpperCase()
  }

  return parts[0]?.[0]?.toUpperCase() ?? ''
}

function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    en: 'blue',
    vi: 'red',
    ja: 'purple',
  }

  return colors[language] ?? 'grey'
}

function formatLastSeen(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return String(t('chat.lastSeenNow'))
  if (diffMinutes < 60) return String(t('chat.lastSeenMinutes', { minutes: diffMinutes }))
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return String(t('chat.lastSeenHours', { hours: diffHours }))
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return String(t('chat.lastSeenDays', { days: diffDays }))

  return date.toLocaleDateString()
}

function handleLanguageChange(language: string) {
  emit('language-change', language)
}

function handleAutoTranslateChange(value: boolean | null) {
  emit('update:auto-translate', value ?? false)
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.userLanguage,
  (language) => {
    selectedLanguage.value = language
  },
)
/* END DEFINE WATCHER */
</script>

<style scoped>
.user-sidebar {
  overflow: hidden;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.position-relative {
  position: relative;
}

.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid rgb(var(--v-theme-surface));
}

.status-online {
  background-color: rgb(var(--v-theme-success));
}

.status-offline {
  background-color: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.5;
}

.user-list-area {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
