<template>
  <v-container class="py-6" max-width="1000">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">{{ $t('chat.rooms') }}</div>
        <div class="text-body-2 text-medium-emphasis">{{ $t('chat.roomsDesc') }}</div>
      </div>
      <v-btn
        variant="elevated"
        color="primary"
        rounded="lg"
        prepend-icon="mdi-plus"
        @click="createDialog = true"
      >
        {{ $t('chat.createRoom') }}
      </v-btn>
    </div>

    <!-- Tabs -->
    <v-tabs v-model="activeTab" color="primary" class="mb-5">
      <v-tab value="mine">
        <v-icon start size="16">mdi-account-circle-outline</v-icon>
        {{ $t('chat.myRooms') }}
        <v-chip
          v-if="myRooms.length > 0"
          size="x-small"
          color="primary"
          variant="tonal"
          class="ml-2"
          >{{ myRooms.length }}</v-chip
        >
      </v-tab>
      <v-tab value="discover">
        <v-icon start size="16">mdi-compass-outline</v-icon>
        {{ $t('chat.discoverRooms') }}
        <v-chip
          v-if="discoverableRooms.length > 0"
          size="x-small"
          color="primary"
          variant="tonal"
          class="ml-2"
          >{{ discoverableRooms.length }}</v-chip
        >
      </v-tab>
    </v-tabs>

    <!-- Loading -->
    <div v-if="isLoading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="36" />
    </div>

    <template v-else>
      <v-window v-model="activeTab">
        <!-- ── My Rooms tab ───────────────────────────────────────── -->
        <v-window-item value="mine">
          <!-- Search -->
          <v-text-field
            v-model="mySearch"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            prepend-inner-icon="mdi-magnify"
            :placeholder="$t('common.search')"
            clearable
            hide-details
            class="mb-4"
          />

          <!-- Empty state (no rooms at all) -->
          <div v-if="myRooms.length === 0" class="empty-state text-center py-10 mb-6">
            <div class="empty-icon-wrap mx-auto mb-4">
              <v-icon size="36" color="medium-emphasis">mdi-chat-outline</v-icon>
            </div>
            <div class="text-body-1 font-weight-medium mb-1">{{ $t('chat.noRooms') }}</div>
            <div class="text-body-2 text-medium-emphasis mb-4">{{ $t('chat.roomsDesc') }}</div>
            <v-btn
              variant="tonal"
              color="primary"
              rounded="lg"
              class="btn-shine"
              size="small"
              prepend-icon="mdi-plus"
              @click="createDialog = true"
            >
              {{ $t('chat.createFirstRoom') }}
            </v-btn>
          </div>

          <!-- Search returned nothing -->
          <div
            v-else-if="filteredMyChannelRooms.length === 0 && filteredMyDirectRooms.length === 0"
            class="text-center py-8 text-body-2 text-disabled"
          >
            {{ $t('common.noData') }}
          </div>

          <template v-else>
            <!-- Channels -->
            <template v-if="filteredMyChannelRooms.length > 0">
              <div class="section-header mb-2">
                <v-icon size="14" color="medium-emphasis" class="mr-1">mdi-pound</v-icon>
                <span class="text-caption text-medium-emphasis text-uppercase font-weight-bold">
                  {{ $t('chat.channels') }}
                </span>
                <span class="text-caption text-disabled ml-2">
                  ({{ filteredMyChannelRooms.length }})
                </span>
              </div>

              <v-card rounded="xl" elevation="0" border class="mb-4 overflow-hidden">
                <template v-for="(room, index) in filteredMyChannelRooms" :key="room.id">
                  <v-divider v-if="index > 0" />
                  <div
                    class="room-list-item d-flex align-center ga-3 px-4 py-3"
                    @click="navigateTo(`/chat/${room.uuid}`)"
                  >
                    <!-- Left accent bar -->
                    <div
                      :class="[
                        'room-list-accent',
                        room.visibility === 'private'
                          ? 'room-list-accent--private'
                          : 'room-list-accent--public',
                      ]"
                    />

                    <v-avatar
                      size="36"
                      rounded="lg"
                      :color="room.visibility === 'private' ? 'warning' : 'success'"
                      variant="tonal"
                      class="flex-shrink-0"
                    >
                      <v-icon size="17">mdi-pound</v-icon>
                    </v-avatar>

                    <div class="flex-grow-1 min-width-0">
                      <div class="d-flex align-center ga-1">
                        <span class="text-body-2 font-weight-semibold room-list-name">
                          {{ room.name }}
                        </span>
                        <v-icon v-if="room.visibility === 'private'" size="11" color="warning">
                          mdi-lock
                        </v-icon>
                        <v-icon v-if="isMyRoom(room)" size="12" color="warning">
                          mdi-crown-outline
                          <v-tooltip activator="parent" location="top">Tôi tạo</v-tooltip>
                        </v-icon>
                      </div>
                      <div class="text-caption text-disabled room-list-sub">
                        {{ $t('chat.createdBy', { name: room.creator?.full_name }) }}
                      </div>
                    </div>

                    <div class="d-flex align-center ga-2 flex-shrink-0">
                      <v-chip
                        v-if="getUnreadCount(room.uuid) > 0"
                        size="x-small"
                        color="error"
                        variant="flat"
                      >
                        {{ getUnreadCount(room.uuid) }}
                      </v-chip>

                      <!-- Avatar stack -->
                      <div class="avatar-stack">
                        <v-avatar
                          v-for="member in (room.preview_members ?? []).slice(0, 4)"
                          :key="member.id"
                          size="22"
                          :color="member.avatar ? undefined : 'primary'"
                          class="avatar-stack-item"
                        >
                          <v-img v-if="member.avatar" :src="member.avatar" cover />
                          <span v-else class="text-white avatar-stack-initials">
                            {{ member.full_name.charAt(0).toUpperCase() }}
                          </span>
                        </v-avatar>
                        <div
                          v-if="(room.member_count ?? 0) > 4"
                          class="avatar-stack-item avatar-stack-overflow text-caption"
                        >
                          +{{ (room.member_count ?? 0) - 4 }}
                        </div>
                      </div>

                      <v-btn
                        v-if="room.description"
                        size="x-small"
                        variant="text"
                        color="medium-emphasis"
                        icon
                        @click.stop="openDescriptionDialog(room)"
                      >
                        <v-icon size="16">mdi-information-outline</v-icon>
                        <v-tooltip activator="parent" location="top">
                          {{ $t('chat.roomDescriptionTitle') }}
                        </v-tooltip>
                      </v-btn>
                      <v-icon size="14" color="medium-emphasis">mdi-chevron-right</v-icon>
                    </div>
                  </div>
                </template>
              </v-card>
            </template>

            <!-- Direct Messages -->
            <template v-if="filteredMyDirectRooms.length > 0">
              <div class="section-header mb-2">
                <v-icon size="14" color="medium-emphasis" class="mr-1">mdi-message-outline</v-icon>
                <span class="text-caption text-medium-emphasis text-uppercase font-weight-bold">
                  {{ $t('chat.directMessages') }}
                </span>
                <span class="text-caption text-disabled ml-2">
                  ({{ filteredMyDirectRooms.length }})
                </span>
              </div>

              <v-card rounded="xl" elevation="0" border class="overflow-hidden">
                <template v-for="(room, index) in filteredMyDirectRooms" :key="room.id">
                  <v-divider v-if="index > 0" />
                  <div
                    class="room-list-item d-flex align-center ga-3 px-4 py-3"
                    @click="navigateTo(`/chat/${room.uuid}`)"
                  >
                    <v-avatar
                      size="36"
                      :color="room.direct_user?.avatar ? undefined : 'primary'"
                      class="flex-shrink-0"
                    >
                      <v-img v-if="room.direct_user?.avatar" :src="room.direct_user.avatar" cover />
                      <span v-else class="text-body-2 font-weight-bold text-white">
                        {{ (room.direct_user?.full_name ?? room.name).charAt(0).toUpperCase() }}
                      </span>
                    </v-avatar>

                    <div class="flex-grow-1 min-width-0">
                      <div class="d-flex align-center ga-2">
                        <span class="text-body-2 font-weight-semibold room-list-name">
                          {{ room.direct_user?.full_name ?? room.name }}
                        </span>
                        <v-chip
                          v-if="getUnreadCount(room.uuid) > 0"
                          size="x-small"
                          color="error"
                          variant="flat"
                        >
                          {{ getUnreadCount(room.uuid) }}
                        </v-chip>
                      </div>
                      <div class="text-caption text-disabled room-list-sub">
                        {{ room.direct_user?.email }}
                      </div>
                    </div>

                    <v-icon size="14" color="medium-emphasis" class="flex-shrink-0">
                      mdi-chevron-right
                    </v-icon>
                  </div>
                </template>
              </v-card>
            </template>
          </template>
        </v-window-item>

        <!-- ── Discover tab ───────────────────────────────────────── -->
        <v-window-item value="discover">
          <!-- Search -->
          <v-text-field
            v-model="discoverSearch"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            prepend-inner-icon="mdi-magnify"
            :placeholder="$t('common.search')"
            clearable
            hide-details
            class="mb-4"
          />

          <v-row v-if="filteredDiscoverableRooms.length > 0" dense>
            <v-col v-for="room in filteredDiscoverableRooms" :key="room.id" cols="12" sm="6">
              <v-card rounded="xl" elevation="0" border class="discover-card h-100">
                <!-- Accent strip -->
                <div class="room-card-accent room-card-accent--public" />

                <div class="pa-4 d-flex flex-column h-100">
                  <!-- Header -->
                  <div class="d-flex align-center ga-3 mb-3">
                    <v-avatar
                      size="40"
                      rounded="lg"
                      color="success"
                      variant="tonal"
                      class="flex-shrink-0"
                    >
                      <v-icon size="20">mdi-pound</v-icon>
                    </v-avatar>
                    <div class="flex-grow-1 min-width-0">
                      <div class="d-flex align-center ga-1">
                        <span class="text-body-2 font-weight-bold room-card-name">{{
                          room.name
                        }}</span>
                        <v-icon v-if="isMyRoom(room)" size="13" color="warning">
                          mdi-crown-outline
                          <v-tooltip activator="parent" location="top">Tôi tạo</v-tooltip>
                        </v-icon>
                      </div>
                      <div class="text-caption text-disabled mt-0-5 room-card-meta">
                        {{ $t('chat.createdBy', { name: room.creator?.full_name }) }}
                      </div>
                    </div>
                    <v-btn
                      variant="tonal"
                      color="primary"
                      size="small"
                      rounded="lg"
                      class="btn-shine flex-shrink-0"
                      :loading="joiningRoomId === room.id"
                      @click.stop="handleJoin(room)"
                    >
                      {{ $t('chat.joinRoom') }}
                    </v-btn>
                  </div>

                  <!-- Description -->
                  <div class="room-description-wrap flex-grow-1 mb-3">
                    <template v-if="room.description">
                      <div class="text-body-2 text-medium-emphasis room-description">
                        {{ stripMarkdown(room.description) }}
                      </div>
                      <v-btn
                        variant="text"
                        size="x-small"
                        color="primary"
                        class="px-0 mt-1"
                        @click.stop="openDescriptionDialog(room)"
                      >
                        {{ $t('chat.seeMore') }}
                      </v-btn>
                    </template>
                  </div>

                  <!-- Footer -->
                  <div class="room-card-footer d-flex align-center justify-space-between pt-2">
                    <v-chip size="x-small" variant="tonal" color="success" prepend-icon="mdi-earth">
                      {{ $t('chat.visibilityPublic') }}
                    </v-chip>
                    <div class="d-flex align-center ga-2">
                      <!-- Avatar stack -->
                      <div class="avatar-stack">
                        <v-avatar
                          v-for="member in (room.preview_members ?? []).slice(0, 4)"
                          :key="member.id"
                          size="22"
                          :color="member.avatar ? undefined : 'primary'"
                          class="avatar-stack-item"
                        >
                          <v-img v-if="member.avatar" :src="member.avatar" cover />
                          <span v-else class="text-white avatar-stack-initials">
                            {{ member.full_name.charAt(0).toUpperCase() }}
                          </span>
                        </v-avatar>
                        <div
                          v-if="(room.member_count ?? 0) > 4"
                          class="avatar-stack-item avatar-stack-overflow text-caption"
                        >
                          +{{ (room.member_count ?? 0) - 4 }}
                        </div>
                      </div>
                      <span class="text-caption text-disabled">{{ room.member_count ?? 0 }}</span>
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <div v-else class="text-center py-8 text-body-2 text-disabled">
            {{ $t('chat.noPublicRooms') }}
          </div>
        </v-window-item>
      </v-window>
    </template>

    <!-- Create room dialog -->
    <DialogCreateChatRoom
      :dialog="createDialog"
      @confirm="onRoomCreated"
      @close-modal="createDialog = false"
    />

    <!-- Room description dialog -->
    <v-dialog v-model="descriptionDialog" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="pa-4 pb-2 d-flex align-center ga-2">
          <v-icon size="18" color="medium-emphasis">mdi-pound</v-icon>
          <span class="text-h6">{{ selectedDescriptionRoom?.name }}</span>
        </v-card-title>
        <v-divider />
        <div class="pa-4">
          <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium mb-2">
            {{ $t('chat.roomDescriptionTitle') }}
          </div>
          <div class="text-body-2" style="white-space: pre-wrap; line-height: 1.7">
            {{
              selectedDescriptionRoom
                ? stripMarkdown(selectedDescriptionRoom.description ?? '')
                : ''
            }}
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
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import DialogCreateChatRoom from '@/components/chat/DialogCreateChatRoom.vue'
import ChatRoomService from '@/services/ChatRoomService'
import { useChatUnread } from '@/composables/useChatUnread'
import type { ChatRoomModel } from '@/interfaces/models/ChatRoomModel'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  layout: 'default',
  name: 'chat.index',
})
/* END DEFINE NAME COMPONENT */

/** START DEFINE STATE */
const userStore = useUserStore()
const myRooms = ref<Array<ChatRoomModel>>([])
const publicRooms = ref<Array<ChatRoomModel>>([])
const isLoading = ref(false)
const activeTab = ref<'mine' | 'discover'>('mine')
const mySearch = ref('')
const discoverSearch = ref('')
const createDialog = ref(false)
const joiningRoomId = ref<number | null>(null)
const descriptionDialog = ref(false)
const selectedDescriptionRoom = ref<ChatRoomModel | null>(null)
const { unreadCounts, fetchUnreadCounts } = useChatUnread()
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const myRoomIds = computed(() => new Set(myRooms.value.map((room) => room.id)))

const discoverableRooms = computed(() =>
  publicRooms.value.filter((room) => !myRoomIds.value.has(room.id)),
)

/** Sort: rooms with unread messages bubble to the top */
const sortedMyRooms = computed(() =>
  [...myRooms.value].sort((roomA, roomB) => {
    const unreadA = getUnreadCount(roomA.uuid)
    const unreadB = getUnreadCount(roomB.uuid)
    if (unreadA !== unreadB) return unreadB - unreadA
    return (roomA.name ?? '').localeCompare(roomB.name ?? '')
  }),
)

const filteredMyChannelRooms = computed(() => {
  const query = mySearch.value.toLowerCase().trim()
  const channels = sortedMyRooms.value.filter((room) => room.type === 'channel')
  if (!query) return channels
  return channels.filter((room) => room.name?.toLowerCase().includes(query))
})

const filteredMyDirectRooms = computed(() => {
  const query = mySearch.value.toLowerCase().trim()
  const directs = sortedMyRooms.value.filter((room) => room.type === 'direct')
  if (!query) return directs
  return directs.filter(
    (room) =>
      room.direct_user?.full_name?.toLowerCase().includes(query) ||
      room.direct_user?.email?.toLowerCase().includes(query),
  )
})

const filteredDiscoverableRooms = computed(() => {
  const query = discoverSearch.value.toLowerCase().trim()
  if (!query) return discoverableRooms.value
  return discoverableRooms.value.filter((room) => room.name?.toLowerCase().includes(query))
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
function getUnreadCount(roomUuid: string): number {
  return unreadCounts.value[roomUuid] ?? 0
}

function isMyRoom(room: ChatRoomModel): boolean {
  return room.creator_id === userStore.user?.id
}

function openDescriptionDialog(room: ChatRoomModel) {
  selectedDescriptionRoom.value = room
  descriptionDialog.value = true
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\\\n/g, ' ')
    .replace(/\\(.)/g, '$1')
    .replace(/:[a-z0-9-]+:/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^(?:\d+\.\s+|[>#\-*]\s+)/gm, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
}

const fetchRooms = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    const [myRoomsResult, publicRoomsResult] = await Promise.all([
      ChatRoomService.getMyRooms(),
      ChatRoomService.getPublicRooms(),
      fetchUnreadCounts(),
    ])
    myRooms.value = myRoomsResult
    publicRooms.value = publicRoomsResult
  } catch (error) {
    console.error('Failed to fetch rooms:', error)
  } finally {
    isLoading.value = false
  }
}

const onRoomCreated = (room: ChatRoomModel) => {
  createDialog.value = false
  navigateTo(`/chat/${room.uuid}`)
}

const handleJoin = async (room: ChatRoomModel) => {
  joiningRoomId.value = room.id

  try {
    await ChatRoomService.join(room.uuid)
    myRooms.value = [...myRooms.value, room]
    navigateTo(`/chat/${room.uuid}`)
  } catch (error) {
    console.error('Failed to join room:', error)
  } finally {
    joiningRoomId.value = null
  }
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  fetchRooms()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
}

/* ── Compact list rows (My Rooms tab) ────────────────────── */
.room-list-item {
  cursor: pointer;
  position: relative;
  transition: background-color 0.15s ease;
}

.room-list-item:hover {
  background-color: var(--color-hover-bg);
}

/* Thin left accent bar inside each list row */
.room-list-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 0 2px 2px 0;
}

.room-list-accent--public {
  background-color: rgb(var(--v-theme-success));
}

.room-list-accent--private {
  background-color: rgb(var(--v-theme-warning));
}

.room-list-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-list-sub {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Discover cards (Discover tab) ───────────────────────── */
.discover-card {
  cursor: pointer;
  overflow: hidden;
  transition:
    box-shadow 0.15s ease,
    opacity 0.15s ease;
}

.discover-card:hover {
  box-shadow: 0 4px 20px rgba(var(--v-theme-on-surface), 0.1) !important;
  opacity: 0.92;
}

.room-card-accent {
  height: 4px;
  width: 100%;
}

.room-card-accent--public {
  background-color: rgb(var(--v-theme-success));
}

.room-card-footer {
  border-top: 1px solid var(--color-border);
}

.room-card-name {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
  line-height: 1.3;
}

.room-card-meta {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mt-0-5 {
  margin-top: 2px;
}

.room-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  min-height: 3em;
}

.room-description-wrap {
  min-height: 3.5em;
}

/* ── Avatar stack ────────────────────────────────────────── */
.avatar-stack {
  display: flex;
  align-items: center;
}

.avatar-stack-item {
  border: 2px solid rgb(var(--v-theme-surface));
  border-radius: 50%;
  margin-left: -6px;
}

.avatar-stack-item:first-child {
  margin-left: 0;
}

.avatar-stack-initials {
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
}

.avatar-stack-overflow {
  width: 22px;
  height: 22px;
  background-color: var(--color-section-bg);
  border: 2px solid rgb(var(--v-theme-surface));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: var(--color-muted);
}

/* ── Empty state ──────────────────────────────────────────── */
.empty-state {
  border: 1px dashed var(--color-border-medium);
  border-radius: 16px;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--color-section-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
