<template>
  <v-container class="py-6" max-width="1000">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
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

    <!-- Loading -->
    <div v-if="isLoading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="36" />
    </div>

    <template v-else>
      <!-- My Rooms -->
      <template v-if="myRooms.length > 0">
        <!-- Channels -->
        <template v-if="myChannelRooms.length > 0">
          <div class="section-header mb-3">
            <v-icon size="16" color="medium-emphasis" class="mr-1">mdi-pound</v-icon>
            <span class="text-subtitle-2 text-medium-emphasis text-uppercase">
              {{ $t('chat.channels') }}
            </span>
            <span class="text-caption text-disabled ml-2">({{ myChannelRooms.length }})</span>
          </div>

          <v-row class="mb-6" dense>
            <v-col v-for="room in myChannelRooms" :key="room.id" cols="12" sm="6">
              <v-card
                rounded="xl"
                elevation="0"
                border
                class="room-card h-100"
                @click="navigateTo(`/chat/${room.uuid}`)"
              >
                <div class="pa-4 d-flex flex-column h-100">
                  <!-- Top row: avatar + badge -->
                  <div class="d-flex align-start justify-space-between mb-3">
                    <div class="d-flex align-center ga-3">
                      <v-avatar
                        size="42"
                        rounded="lg"
                        :color="room.visibility === 'private' ? 'orange' : 'primary'"
                        variant="tonal"
                      >
                        <v-icon size="20">mdi-pound</v-icon>
                      </v-avatar>
                      <div>
                        <div class="d-flex align-center ga-1 flex-wrap">
                          <span class="text-body-1 font-weight-semibold room-name">{{
                            room.name
                          }}</span>
                          <v-icon
                            v-if="room.visibility === 'private'"
                            size="13"
                            color="medium-emphasis"
                            >mdi-lock</v-icon
                          >
                        </div>
                        <v-chip
                          size="x-small"
                          variant="tonal"
                          :color="room.visibility === 'private' ? 'orange' : 'success'"
                          class="mt-1"
                        >
                          {{
                            room.visibility === 'private'
                              ? $t('chat.visibilityPrivate')
                              : $t('chat.visibilityPublic')
                          }}
                        </v-chip>
                      </div>
                    </div>
                    <v-chip
                      v-if="getUnreadCount(room.uuid) > 0"
                      size="small"
                      color="error"
                      variant="flat"
                      class="unread-badge"
                    >
                      {{ getUnreadCount(room.uuid) }}
                    </v-chip>
                  </div>

                  <!-- Description -->
                  <template v-if="room.description">
                    <div class="text-body-2 text-medium-emphasis room-description">
                      {{ stripMarkdown(room.description) }}
                    </div>
                    <div class="mb-1">
                      <v-btn
                        variant="text"
                        size="x-small"
                        color="primary"
                        class="px-0 mt-1"
                        @click.stop="openDescriptionDialog(room)"
                      >
                        {{ $t('chat.seeMore') }}
                      </v-btn>
                    </div>
                  </template>
                  <div v-else class="mb-3" />

                  <!-- Footer meta -->
                  <div class="d-flex align-center justify-space-between mt-auto">
                    <div class="text-caption text-disabled room-meta">
                      {{ $t('chat.createdBy', { name: room.creator?.full_name }) }}
                    </div>
                    <div class="d-flex align-center ga-1 text-caption text-disabled">
                      <v-icon size="13">mdi-account-multiple-outline</v-icon>
                      <span>{{ room.member_count ?? 0 }}</span>
                    </div>
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </template>

        <!-- Direct Messages -->
        <template v-if="myDirectRooms.length > 0">
          <v-divider v-if="myChannelRooms.length > 0" class="mb-4" />

          <div class="section-header mb-3">
            <v-icon size="16" color="medium-emphasis" class="mr-1">mdi-message-outline</v-icon>
            <span class="text-subtitle-2 text-medium-emphasis text-uppercase">
              {{ $t('chat.directMessages') }}
            </span>
            <span class="text-caption text-disabled ml-2">({{ myDirectRooms.length }})</span>
          </div>

          <div class="d-flex flex-column ga-2 mb-6">
            <v-card
              v-for="room in myDirectRooms"
              :key="room.id"
              rounded="xl"
              elevation="0"
              border
              class="room-card"
              @click="navigateTo(`/chat/${room.uuid}`)"
            >
              <div class="d-flex align-center justify-space-between px-4 py-3">
                <div class="d-flex align-center ga-3">
                  <v-avatar
                    size="40"
                    rounded="lg"
                    :color="room.direct_user?.avatar ? undefined : 'primary'"
                  >
                    <v-img v-if="room.direct_user?.avatar" :src="room.direct_user.avatar" cover />
                    <span v-else class="text-body-2 font-weight-bold text-white">
                      {{ (room.direct_user?.full_name ?? room.name).charAt(0).toUpperCase() }}
                    </span>
                  </v-avatar>
                  <div>
                    <div class="d-flex align-center ga-2">
                      <span class="text-body-2 font-weight-semibold">
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
                    <div class="text-caption text-disabled">
                      {{ room.direct_user?.email }}
                    </div>
                  </div>
                </div>
                <v-icon size="16" color="medium-emphasis">mdi-chevron-right</v-icon>
              </div>
            </v-card>
          </div>
        </template>
      </template>

      <!-- Empty state -->
      <div v-else class="empty-state text-center py-10 mb-6">
        <div class="empty-icon-wrap mx-auto mb-4">
          <v-icon size="36" color="medium-emphasis">mdi-chat-outline</v-icon>
        </div>
        <div class="text-body-1 font-weight-medium mb-1">{{ $t('chat.noRooms') }}</div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          {{ $t('chat.roomsDesc') }}
        </div>
        <v-btn
          variant="tonal"
          color="primary"
          rounded="lg"
          size="small"
          prepend-icon="mdi-plus"
          @click="createDialog = true"
        >
          {{ $t('chat.createFirstRoom') }}
        </v-btn>
      </div>

      <!-- Discover Public Rooms -->
      <v-divider class="mb-4" />

      <div class="section-header mb-3">
        <v-icon size="16" color="medium-emphasis" class="mr-1">mdi-compass-outline</v-icon>
        <span class="text-subtitle-2 text-medium-emphasis text-uppercase">
          {{ $t('chat.discoverRooms') }}
        </span>
        <span v-if="discoverableRooms.length > 0" class="text-caption text-disabled ml-2">
          ({{ discoverableRooms.length }})
        </span>
      </div>

      <v-row v-if="discoverableRooms.length > 0" dense>
        <v-col v-for="room in discoverableRooms" :key="room.id" cols="12" sm="6">
          <v-card rounded="xl" elevation="0" border class="h-100">
            <div class="pa-4 d-flex flex-column h-100">
              <div class="d-flex align-start justify-space-between mb-3">
                <div class="d-flex align-center ga-3">
                  <v-avatar size="42" rounded="lg" color="secondary" variant="tonal">
                    <v-icon size="20">mdi-pound</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-body-1 font-weight-semibold">{{ room.name }}</div>
                    <v-chip size="x-small" variant="tonal" color="success" class="mt-1">
                      {{ $t('chat.visibilityPublic') }}
                    </v-chip>
                  </div>
                </div>
                <v-btn
                  variant="tonal"
                  color="primary"
                  size="small"
                  rounded="lg"
                  :loading="joiningRoomId === room.id"
                  @click.stop="handleJoin(room)"
                >
                  {{ $t('chat.joinRoom') }}
                </v-btn>
              </div>

              <template v-if="room.description">
                <div class="text-body-2 text-medium-emphasis room-description">
                  {{ stripMarkdown(room.description) }}
                </div>
                <div class="mb-1">
                  <v-btn
                    variant="text"
                    size="x-small"
                    color="primary"
                    class="px-0 mt-1"
                    @click.stop="openDescriptionDialog(room)"
                  >
                    {{ $t('chat.seeMore') }}
                  </v-btn>
                </div>
              </template>
              <div v-else class="mb-3" />

              <div class="d-flex align-center justify-space-between mt-auto">
                <div class="text-caption text-disabled room-meta">
                  {{ $t('chat.createdBy', { name: room.creator?.full_name }) }}
                </div>
                <div class="d-flex align-center ga-1 text-caption text-disabled">
                  <v-icon size="13">mdi-account-multiple-outline</v-icon>
                  <span>{{ room.member_count ?? 0 }}</span>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <div v-else class="text-center py-6 text-body-2 text-disabled">
        {{ $t('chat.noPublicRooms') }}
      </div>
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
const myRooms = ref<Array<ChatRoomModel>>([])
const publicRooms = ref<Array<ChatRoomModel>>([])
const isLoading = ref(false)
const createDialog = ref(false)
const joiningRoomId = ref<number | null>(null)
const descriptionDialog = ref(false)
const selectedDescriptionRoom = ref<ChatRoomModel | null>(null)
const { unreadCounts, fetchUnreadCounts } = useChatUnread()
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const myRoomIds = computed(() => new Set(myRooms.value.map((room) => room.id)))

const myChannelRooms = computed(() => myRooms.value.filter((room) => room.type === 'channel'))

const myDirectRooms = computed(() => myRooms.value.filter((room) => room.type === 'direct'))

const discoverableRooms = computed(() =>
  publicRooms.value.filter((room) => !myRoomIds.value.has(room.id)),
)
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
function getUnreadCount(roomUuid: string): number {
  return unreadCounts.value[roomUuid] ?? 0
}

function openDescriptionDialog(room: ChatRoomModel) {
  selectedDescriptionRoom.value = room
  descriptionDialog.value = true
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\\\n/g, ' ') // markdown hard line break \<newline> → space
    .replace(/\\(.)/g, '$1')
    .replace(/:[a-z0-9-]+:/g, '') // strip custom emoji codes :blob-thumbs-up:
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

.room-card {
  cursor: pointer;
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.room-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08) !important;
}

.room-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.room-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  min-height: 2lh;
}

.room-meta {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.unread-badge {
  flex-shrink: 0;
}

.empty-state {
  border: 1px dashed rgba(0, 0, 0, 0.12);
  border-radius: 16px;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
