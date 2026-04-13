<template>
  <v-dialog :model-value="dialog" max-width="560" persistent scrollable>
    <v-card rounded="xl" elevation="2">
      <!-- Header -->
      <div class="dialog-header px-6 pt-6 pb-4">
        <div class="text-h6 font-weight-bold text-primary">
          {{ $t('meetings.coHost.manageTitle') }}
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0">
        <!-- Add co-host section -->
        <p class="text-body-2 text-medium-emphasis mb-3">
          {{ $t('meetings.coHost.selectUser') }}
        </p>
        <v-autocomplete
          v-model="selectedUser"
          v-model:search="userSearch"
          :items="searchedUsers"
          :loading="isSearchingUsers"
          item-title="display_name"
          item-value="id"
          :placeholder="$t('meetings.invite.searchUsers')"
          :no-data-text="$t('common.noData')"
          variant="filled"
          density="comfortable"
          rounded="lg"
          flat
          hide-details
          return-object
          no-filter
          autocomplete="off"
          clearable
        />

        <div class="d-flex justify-end my-3">
          <v-btn
            color="primary"
            variant="elevated"
            rounded="lg"
            :loading="isAdding"
            :disabled="!selectedUser"
            @click="addCoHost"
          >
            <v-icon start>mdi-account-star-outline</v-icon>
            {{ $t('meetings.coHost.add') }}
          </v-btn>
        </div>
      </v-card-text>

      <v-divider />

      <!-- Co-host list -->
      <v-card-text class="px-6 pt-4 pb-6">
        <p class="text-body-2 font-weight-medium mb-2">
          {{ $t('meetings.coHost.manageTitle') }}
        </p>

        <div v-if="isLoading" class="d-flex justify-center py-4">
          <v-progress-circular indeterminate size="24" color="primary" />
        </div>

        <div v-else-if="coHosts.length === 0" class="text-caption text-medium-emphasis py-2">
          {{ $t('meetings.coHost.noCoHosts') }}
        </div>

        <v-list v-else density="compact" rounded="lg">
          <v-list-item v-for="coHost in coHosts" :key="coHost.user_id" rounded="lg">
            <template #prepend>
              <v-avatar size="32" color="primary" variant="tonal" class="mr-2">
                <v-img v-if="coHost.avatar" :src="coHost.avatar" cover />
                <span v-else class="text-caption font-weight-bold">
                  {{ (coHost.full_name || '?').charAt(0).toUpperCase() }}
                </span>
              </v-avatar>
            </template>
            <template #title>
              <span class="text-body-2">{{ coHost.full_name || '—' }}</span>
            </template>
            <template #append>
              <v-btn
                size="x-small"
                variant="tonal"
                color="error"
                rounded="lg"
                :loading="isRemoving[coHost.user_id]"
                @click="removeCoHost(coHost.user_id)"
              >
                {{ $t('common.remove') }}
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { CoHostUser } from '@/interfaces/models/MeetingModel'
import MeetingService from '@/services/MeetingService'
import UserService from '@/services/UserService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
defineOptions({ name: 'MeetingDialogManageCoHosts' })
/* END DEFINE */

/** START DEFINE PROPERTY AND EMITS */
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

const emit = defineEmits<{
  'close-modal': []
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
type UserOption = { id: number; display_name: string; avatar?: string }

const coHosts = ref<CoHostUser[]>([])
const selectedUser = ref<UserOption | null>(null)
const searchedUsers = ref<UserOption[]>([])
const userSearch = ref('')
const isLoading = ref(false)
const isSearchingUsers = ref(false)
const isAdding = ref(false)
const isRemoving = ref<Record<number, boolean>>({})
let searchTimer: ReturnType<typeof setTimeout> | null = null
/* END DEFINE STATE */

/** START DEFINE METHOD */
async function loadCoHosts() {
  try {
    isLoading.value = true
    coHosts.value = await MeetingService.getCoHosts(props.meetingUuid)
  } catch (error) {
    console.error('Failed to load co-hosts:', error)
  } finally {
    isLoading.value = false
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
      avatar: user.avatar,
    }))
  } catch (error) {
    console.error('Failed to search users:', error)
  } finally {
    isSearchingUsers.value = false
  }
}

async function addCoHost() {
  if (!selectedUser.value) return
  const userId = selectedUser.value.id
  try {
    isAdding.value = true
    await MeetingService.addCoHost(props.meetingUuid, userId)
    await loadCoHosts()
    selectedUser.value = null
    userSearch.value = ''
  } catch (error) {
    console.error('Failed to add co-host:', error)
  } finally {
    isAdding.value = false
  }
}

async function removeCoHost(userId: number) {
  isRemoving.value[userId] = true
  try {
    await MeetingService.removeCoHost(props.meetingUuid, userId)
    coHosts.value = coHosts.value.filter((item) => item.user_id !== userId)
  } catch (error) {
    console.error('Failed to remove co-host:', error)
  } finally {
    isRemoving.value[userId] = false
  }
}

function close() {
  emit('close-modal')
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (value) => {
    if (value) {
      loadCoHosts()
      selectedUser.value = null
      searchedUsers.value = []
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
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
