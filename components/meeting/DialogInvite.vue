<template>
  <v-dialog :model-value="dialog" max-width="560" persistent scrollable>
    <v-card rounded="xl">
      <!-- Header -->
      <div class="dialog-header px-6 pt-5 pb-4">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary">mdi-email-plus-outline</v-icon>
          <span class="text-h6 font-weight-bold">{{ $t('meetings.invite.title') }}</span>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="pt-0">
        <!-- Send invite section -->
        <p class="text-body-2 text-medium-emphasis mb-3">{{ $t('meetings.invite.selectUsers') }}</p>
        <v-autocomplete
          v-model="selectedUsers"
          v-model:search="userSearch"
          :items="searchedUsers"
          :loading="isSearchingUsers"
          item-title="display_name"
          item-value="id"
          :placeholder="$t('meetings.invite.searchUsers')"
          :no-data-text="$t('common.noData')"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          hide-details
          multiple
          chips
          closable-chips
          return-object
          no-filter
          autocomplete="off"
        />

        <div class="d-flex justify-end mt-3">
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :loading="isSending"
            :disabled="selectedUsers.length === 0"
            @click="sendInvites"
          >
            <v-icon start>mdi-send</v-icon>
            {{ $t('meetings.invite.send') }}
          </v-btn>
        </div>
      </v-card-text>

      <v-divider />

      <!-- Current invites list -->
      <v-card-text class="pt-3">
        <p class="text-body-2 font-weight-medium mb-2">{{ $t('meetings.invite.guestList') }}</p>

        <div v-if="isLoadingInvites" class="d-flex justify-center py-4">
          <v-progress-circular indeterminate size="24" color="primary" />
        </div>

        <div v-else-if="invites.length === 0" class="text-caption text-medium-emphasis py-2">
          {{ $t('meetings.invite.noInvites') }}
        </div>

        <v-list v-else density="compact" rounded="lg">
          <v-list-item
            v-for="invite in invites"
            :key="invite.id"
            :subtitle="invite.user?.email"
            rounded="lg"
          >
            <template #prepend>
              <v-avatar size="32" color="primary" variant="tonal" class="mr-2">
                <v-img v-if="invite.user?.avatar" :src="invite.user.avatar" cover />
                <span v-else class="text-caption font-weight-bold">
                  {{
                    (invite.user?.first_name ?? invite.user?.last_name ?? '?')
                      .charAt(0)
                      .toUpperCase()
                  }}
                </span>
              </v-avatar>
            </template>
            <template #title>
              <span class="text-body-2">
                {{
                  [invite.user?.first_name, invite.user?.last_name].filter(Boolean).join(' ') || '—'
                }}
              </span>
            </template>
            <template #append>
              <div class="d-flex align-center ga-2">
                <MeetingInviteStatusChip :status="invite.status" />
                <v-btn
                  v-if="invite.status === 'missed' || invite.status === 'declined'"
                  size="x-small"
                  variant="tonal"
                  color="primary"
                  rounded="lg"
                  :title="$t('meetings.invite.recall')"
                  :loading="isRecalling[invite.user_id]"
                  @click="recallInvite(invite)"
                >
                  <v-icon size="14" start>mdi-phone-return</v-icon>
                  {{ $t('meetings.invite.recall') }}
                </v-btn>

                <v-btn
                  size="x-small"
                  variant="tonal"
                  color="error"
                  rounded="lg"
                  :loading="isCancelling[invite.user_id]"
                  @click="confirmCancel(invite.user_id)"
                >
                  {{ $t('common.cancel') }}
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { MeetingInviteModel } from '@/interfaces/models/MeetingInviteModel'
import MeetingInviteService from '@/services/MeetingInviteService'
import UserService from '@/services/UserService'
/* END IMPORT */

/** START DEFINE PROPS */
const props = defineProps({
  dialog: {
    type: Boolean,
    required: true,
  },
  meetingUuid: {
    type: String,
    required: true,
  },
})
/* END DEFINE PROPS */

/** START DEFINE EMITS */
const emit = defineEmits<{
  'close-modal': []
}>()
/* END DEFINE EMITS */

/** START DEFINE STATE */
type UserOption = { id: number; display_name: string; email: string; avatar?: string }

const invites = ref<MeetingInviteModel[]>([])
const selectedUsers = ref<UserOption[]>([])
const searchedUsers = ref<UserOption[]>([])
const userSearch = ref('')
const isLoadingInvites = ref(false)
const isSearchingUsers = ref(false)
const isSending = ref(false)
const isRecalling = ref<Record<number, boolean>>({})
const isCancelling = ref<Record<number, boolean>>({})
let searchTimer: ReturnType<typeof setTimeout> | null = null
/* END DEFINE STATE */

/** START DEFINE METHOD */
async function loadInvites() {
  try {
    isLoadingInvites.value = true
    invites.value = await MeetingInviteService.getInvites(props.meetingUuid)
  } catch (error) {
    console.error('Failed to load invites:', error)
  } finally {
    isLoadingInvites.value = false
  }
}

async function searchUsers(query: string) {
  if (!query || query.trim().length < 1) {
    searchedUsers.value = []
    isSearchingUsers.value = false
    return
  }
  try {
    const users = await UserService.search(query.trim())
    searchedUsers.value = users.map((user) => ({
      id: user.id,
      display_name: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      avatar: user.avatar,
    }))
  } catch (error) {
    console.error('Failed to search users:', error)
  } finally {
    isSearchingUsers.value = false
  }
}

async function sendInvites() {
  if (selectedUsers.value.length === 0) return
  try {
    isSending.value = true
    const userIds = selectedUsers.value.map((user) => user.id)
    const newInvites = await MeetingInviteService.createInvites(props.meetingUuid, userIds)
    invites.value = [...invites.value, ...newInvites]
    selectedUsers.value = []
    userSearch.value = ''
  } catch (error) {
    console.error('Failed to send invites:', error)
  } finally {
    isSending.value = false
  }
}

async function recallInvite(invite: MeetingInviteModel) {
  isRecalling.value[invite.user_id] = true
  try {
    const newInvites = await MeetingInviteService.createInvites(props.meetingUuid, [invite.user_id])
    // Update the status of the recalled invite optimistically
    const updatedInvite = newInvites.find((item) => item.user_id === invite.user_id)
    if (updatedInvite) {
      const index = invites.value.findIndex((item) => item.user_id === invite.user_id)
      if (index !== -1) invites.value[index] = updatedInvite
    }
  } catch (error) {
    console.error('Failed to recall invite:', error)
  } finally {
    isRecalling.value[invite.user_id] = false
  }
}

async function confirmCancel(userId: number) {
  isCancelling.value[userId] = true
  try {
    await MeetingInviteService.cancelInvite(props.meetingUuid, userId)
    invites.value = invites.value.filter((invite) => invite.user_id !== userId)
  } catch (error) {
    console.error('Failed to cancel invite:', error)
  } finally {
    isCancelling.value[userId] = false
  }
}

function close() {
  emit('close-modal')
}

function refresh() {
  if (props.dialog) loadInvites()
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (value) => {
    if (value) {
      loadInvites()
      searchedUsers.value = []
      selectedUsers.value = []
      userSearch.value = ''
    }
  },
  { immediate: false },
)

watch(userSearch, (query) => {
  if (searchTimer) clearTimeout(searchTimer)

  if (!query || query.trim().length < 1) {
    searchedUsers.value = []
    isSearchingUsers.value = false
    return
  }

  isSearchingUsers.value = true
  searchTimer = setTimeout(() => searchUsers(query), 300)
})
/* END DEFINE WATCHER */

defineExpose({ refresh })
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
