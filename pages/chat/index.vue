<template>
  <v-container class="py-8" max-width="900">
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
    <div v-if="isLoading" class="d-flex justify-center py-8">
      <v-progress-circular indeterminate color="primary" size="32" />
    </div>

    <template v-else>
      <!-- My Rooms section -->
      <template v-if="myRooms.length > 0">
        <!-- Channels section -->
        <template v-if="myChannelRooms.length > 0">
          <div class="text-subtitle-2 text-medium-emphasis mb-2 text-uppercase">
            {{ $t('chat.channels') }}
          </div>
          <div class="d-flex flex-column ga-2 mb-6">
            <v-card
              v-for="room in myChannelRooms"
              :key="room.id"
              rounded="xl"
              elevation="0"
              border
              class="room-card"
              @click="navigateTo(`/chat/${room.uuid}`)"
            >
              <div class="d-flex align-center justify-space-between pa-4">
                <div class="d-flex align-center ga-3">
                  <v-avatar size="40" rounded="lg" color="primary" variant="tonal">
                    <v-icon size="20">mdi-pound</v-icon>
                  </v-avatar>
                  <div>
                    <div class="d-flex align-center ga-2">
                      <span class="text-body-1 font-weight-medium">{{ room.name }}</span>
                      <v-icon
                        v-if="room.visibility === 'private'"
                        size="14"
                        color="medium-emphasis"
                      >
                        mdi-lock
                      </v-icon>
                      <v-chip
                        v-if="getUnreadCount(room.uuid) > 0"
                        size="x-small"
                        color="error"
                        variant="flat"
                      >
                        {{ getUnreadCount(room.uuid) }}
                      </v-chip>
                    </div>
                    <div v-if="room.description" class="text-caption text-medium-emphasis">
                      {{ room.description }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ $t('chat.createdBy', { name: room.creator?.full_name }) }}
                      <span v-if="room.member_count !== undefined" class="ml-2">
                        · {{ $t('chat.memberCount', { count: room.member_count }) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="d-flex align-center ga-2">
                  <v-chip
                    size="small"
                    variant="tonal"
                    :color="room.visibility === 'private' ? 'orange' : 'green'"
                  >
                    {{
                      room.visibility === 'private'
                        ? $t('chat.visibilityPrivate')
                        : $t('chat.visibilityPublic')
                    }}
                  </v-chip>
                  <v-icon size="18" color="medium-emphasis">mdi-chevron-right</v-icon>
                </div>
              </div>
            </v-card>
          </div>
        </template>

        <!-- Direct Messages section -->
        <template v-if="myDirectRooms.length > 0">
          <v-divider v-if="myChannelRooms.length > 0" class="mb-4" />
          <div class="text-subtitle-2 text-medium-emphasis mb-2 text-uppercase">
            {{ $t('chat.directMessages') }}
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
              <div class="d-flex align-center justify-space-between pa-4">
                <div class="d-flex align-center ga-3">
                  <v-avatar
                    size="40"
                    rounded="lg"
                    :color="room.direct_user?.avatar ? undefined : 'primary'"
                  >
                    <v-img v-if="room.direct_user?.avatar" :src="room.direct_user.avatar" cover />
                    <span v-else class="text-caption text-white font-weight-bold">
                      {{ (room.direct_user?.full_name ?? room.name).charAt(0).toUpperCase() }}
                    </span>
                  </v-avatar>
                  <div>
                    <div class="d-flex align-center ga-2">
                      <span class="text-body-1 font-weight-medium">
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
                    <div class="text-caption text-medium-emphasis">
                      {{ room.direct_user?.email }}
                    </div>
                  </div>
                </div>
                <v-icon size="18" color="medium-emphasis">mdi-chevron-right</v-icon>
              </div>
            </v-card>
          </div>
        </template>
      </template>

      <div v-else class="text-center py-6 mb-6">
        <v-icon size="40" color="medium-emphasis" class="mb-2">mdi-chat-outline</v-icon>
        <div class="text-body-2 text-medium-emphasis">{{ $t('chat.noRooms') }}</div>
        <v-btn
          variant="tonal"
          color="primary"
          rounded="lg"
          size="small"
          class="mt-3"
          prepend-icon="mdi-plus"
          @click="createDialog = true"
        >
          {{ $t('chat.createFirstRoom') }}
        </v-btn>
      </div>

      <!-- Discover Public Rooms section -->
      <v-divider class="mb-4" />
      <div class="text-subtitle-2 text-medium-emphasis mb-2 text-uppercase">
        {{ $t('chat.discoverRooms') }}
      </div>

      <div v-if="discoverableRooms.length > 0" class="d-flex flex-column ga-2">
        <v-card v-for="room in discoverableRooms" :key="room.id" rounded="xl" elevation="0" border>
          <div class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center ga-3">
              <v-avatar size="40" rounded="lg" color="secondary" variant="tonal">
                <v-icon size="20">mdi-pound</v-icon>
              </v-avatar>
              <div>
                <div class="text-body-1 font-weight-medium">{{ room.name }}</div>
                <div v-if="room.description" class="text-caption text-medium-emphasis">
                  {{ room.description }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ $t('chat.createdBy', { name: room.creator?.full_name }) }}
                  <span v-if="room.member_count !== undefined" class="ml-2">
                    · {{ $t('chat.memberCount', { count: room.member_count }) }}
                  </span>
                </div>
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
        </v-card>
      </div>

      <div v-else class="text-center py-4 text-body-2 text-medium-emphasis">
        {{ $t('chat.noPublicRooms') }}
      </div>
    </template>

    <!-- Create room dialog -->
    <DialogCreateChatRoom
      :dialog="createDialog"
      @confirm="onRoomCreated"
      @close-modal="createDialog = false"
    />
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

/** START DEFINE METHOD */
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
.room-card {
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.room-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08) !important;
}
</style>
