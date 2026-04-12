<template>
  <v-dialog :model-value="dialog" max-width="640" persistent scrollable>
    <v-card rounded="xl">
      <!-- Header -->
      <div class="dialog-header px-6 pt-5 pb-4">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary">mdi-account-multiple-plus-outline</v-icon>
          <span class="text-h6 font-weight-bold">{{
            $t('meetings.scheduledParticipants.title')
          }}</span>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="pt-0">
        <!-- Add participants -->
        <p class="text-body-2 text-medium-emphasis mb-3">
          {{ $t('meetings.scheduledParticipants.selectUsers') }}
        </p>
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
            variant="elevated"
            rounded="lg"
            :loading="isAdding"
            :disabled="selectedUsers.length === 0"
            @click="addParticipants"
          >
            <v-icon start>mdi-account-plus-outline</v-icon>
            {{ $t('meetings.scheduledParticipants.sendInvite') }}
          </v-btn>
        </div>
      </v-card-text>

      <v-divider />

      <!-- Participant list -->
      <v-card-text class="pt-3">
        <p class="text-body-2 font-weight-medium mb-2">
          {{ $t('meetings.scheduledParticipants.participantList') }}
        </p>

        <div v-if="isLoading" class="d-flex justify-center py-4">
          <v-progress-circular indeterminate size="24" color="primary" />
        </div>

        <div v-else-if="participants.length === 0" class="text-caption text-medium-emphasis py-2">
          {{ $t('meetings.scheduledParticipants.noParticipants') }}
        </div>

        <v-list v-else density="compact" rounded="lg">
          <v-list-item
            v-for="participant in participants"
            :key="participant.id"
            :subtitle="participant.user?.email"
            rounded="lg"
          >
            <template #prepend>
              <v-avatar size="32" color="primary" variant="tonal" class="mr-2">
                <v-img v-if="participant.user?.avatar" :src="participant.user.avatar" cover />
                <span v-else class="text-caption font-weight-bold">
                  {{
                    (participant.user?.first_name ?? participant.user?.last_name ?? '?')
                      .charAt(0)
                      .toUpperCase()
                  }}
                </span>
              </v-avatar>
            </template>
            <template #title>
              <span class="text-body-2">
                {{
                  [participant.user?.first_name, participant.user?.last_name]
                    .filter(Boolean)
                    .join(' ') || '—'
                }}
              </span>
            </template>
            <template #append>
              <div class="d-flex align-center ga-2">
                <v-chip
                  :color="statusColor(participant.status)"
                  variant="tonal"
                  size="small"
                  rounded="lg"
                >
                  {{ $t(`meetings.scheduledParticipants.status.${participant.status}`) }}
                </v-chip>
                <v-btn
                  size="x-small"
                  variant="tonal"
                  color="error"
                  rounded="lg"
                  :loading="isRemoving[participant.user_id]"
                  @click="removeParticipant(participant.user_id)"
                >
                  {{ $t('common.remove') }}
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-divider />

      <!-- Auto-call config -->
      <v-card-text class="pt-3">
        <div class="d-flex align-center justify-space-between mb-3">
          <p class="text-body-2 font-weight-medium mb-0">
            {{ $t('meetings.scheduledParticipants.autoCall.title') }}
          </p>
          <v-switch
            v-model="autoCallEnabled"
            color="primary"
            density="compact"
            hide-details
            @update:model-value="saveAutoCallConfig"
          />
        </div>

        <v-row dense>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model.number="minutesBefore"
              :label="$t('meetings.scheduledParticipants.autoCall.minutesBefore')"
              type="number"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              min="1"
              max="120"
              @blur="saveAutoCallConfig"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model.number="retryCount"
              :label="$t('meetings.scheduledParticipants.autoCall.retryCount')"
              type="number"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              min="0"
              max="10"
              @blur="saveAutoCallConfig"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model.number="retryInterval"
              :label="$t('meetings.scheduledParticipants.autoCall.retryInterval')"
              type="number"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              min="1"
              max="60"
              @blur="saveAutoCallConfig"
            />
          </v-col>
          <v-col cols="12">
            <v-checkbox
              v-model="skipWeekends"
              :label="$t('meetings.scheduledParticipants.autoCall.skipWeekends')"
              density="compact"
              hide-details
              color="primary"
              @update:model-value="saveAutoCallConfig"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { MeetingScheduledParticipantModel } from '@/interfaces/models/MeetingScheduledParticipantModel'
import MeetingScheduledParticipantService from '@/services/MeetingScheduledParticipantService'
import UserService from '@/services/UserService'
import { useScheduledParticipantsStore } from '@/stores/scheduled-participants'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
defineOptions({ name: 'MeetingDialogManageScheduledParticipants' })
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
type UserOption = { id: number; display_name: string; email: string; avatar?: string }

const participants = ref<MeetingScheduledParticipantModel[]>([])
const selectedUsers = ref<UserOption[]>([])
const searchedUsers = ref<UserOption[]>([])
const userSearch = ref('')
const isLoading = ref(false)
const isSearchingUsers = ref(false)
const isAdding = ref(false)
const isRemoving = ref<Record<number, boolean>>({})
const autoCallEnabled = ref(true)
const minutesBefore = ref(5)
const retryCount = ref(0)
const retryInterval = ref(2)
const skipWeekends = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const scheduledParticipantsStore = useScheduledParticipantsStore()
/* END DEFINE STATE */

/** START DEFINE METHOD */
function statusColor(status: string): string {
  const map: Record<string, string> = {
    accepted: 'success',
    declined: 'error',
    pending: 'default',
  }
  return map[status] ?? 'default'
}

async function loadParticipants() {
  try {
    isLoading.value = true
    participants.value = await MeetingScheduledParticipantService.getAll(props.meetingUuid)
  } catch (error) {
    console.error('Failed to load scheduled participants:', error)
  } finally {
    isLoading.value = false
  }
}

async function loadAutoCallConfig() {
  try {
    const config = await MeetingScheduledParticipantService.getAutoCallConfig(props.meetingUuid)
    if (config) {
      autoCallEnabled.value = config.is_enabled
      minutesBefore.value = config.minutes_before
      retryCount.value = config.retry_count
      retryInterval.value = config.retry_interval_minutes
      skipWeekends.value = config.skip_weekends
    }
  } catch {
    // Config not set yet — keep defaults
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
      email: user.email ?? '',
      avatar: user.avatar,
    }))
  } catch (error) {
    console.error('Failed to search users:', error)
  } finally {
    isSearchingUsers.value = false
  }
}

async function addParticipants() {
  if (selectedUsers.value.length === 0) return
  try {
    isAdding.value = true
    const userIds = selectedUsers.value.map((user) => user.id)
    const added = await MeetingScheduledParticipantService.create(props.meetingUuid, userIds)
    participants.value = [...participants.value, ...added]
    selectedUsers.value = []
    userSearch.value = ''
  } catch (error) {
    console.error('Failed to add scheduled participants:', error)
  } finally {
    isAdding.value = false
  }
}

async function removeParticipant(userId: number) {
  isRemoving.value[userId] = true
  try {
    await MeetingScheduledParticipantService.remove(props.meetingUuid, userId)
    participants.value = participants.value.filter((item) => item.user_id !== userId)
  } catch (error) {
    console.error('Failed to remove scheduled participant:', error)
  } finally {
    isRemoving.value[userId] = false
  }
}

async function saveAutoCallConfig() {
  try {
    await MeetingScheduledParticipantService.upsertAutoCallConfig(props.meetingUuid, {
      is_enabled: autoCallEnabled.value,
      minutes_before: minutesBefore.value,
      retry_count: retryCount.value,
      retry_interval_minutes: retryInterval.value,
      skip_weekends: skipWeekends.value,
    })
  } catch (error) {
    console.error('Failed to save auto-call config:', error)
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
      loadParticipants()
      loadAutoCallConfig()
      selectedUsers.value = []
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

// Update participant status in real time when invitee responds
watch(
  () => scheduledParticipantsStore.lastRsvpUpdate,
  (update) => {
    if (!update || update.meetingUuid !== props.meetingUuid || !props.dialog) return
    const participant = participants.value.find((item) => item.user_id === update.userId)
    if (participant) {
      participant.status = update.status as MeetingScheduledParticipantModel['status']
    }
  },
)

// Sync auto-call config when another user updates it while this dialog is open
watch(
  () => scheduledParticipantsStore.lastAutoCallConfigUpdate,
  (update) => {
    if (!update || update.meetingUuid !== props.meetingUuid || !props.dialog) return
    const config = update.config
    autoCallEnabled.value = config.is_enabled
    minutesBefore.value = config.minutes_before
    retryCount.value = config.retry_count
    retryInterval.value = config.retry_interval_minutes
    skipWeekends.value = config.skip_weekends
  },
)
/* END DEFINE WATCHER */
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
