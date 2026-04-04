<template>
  <v-dialog :model-value="dialog" max-width="500" @update:model-value="handleClose">
    <v-card rounded="xl">
      <v-card-title class="text-h6 pa-4 pb-2">
        {{ $t('chat.createRoom') }}
      </v-card-title>
      <v-divider />

      <div class="pa-4">
        <v-select
          v-model="formType"
          :items="roomTypeOptions"
          item-title="label"
          item-value="value"
          :label="$t('chat.roomType')"
          density="comfortable"
          variant="outlined"
          rounded="lg"
          class="mb-3"
        />

        <v-text-field
          v-if="!isDirect"
          v-model="formName"
          :label="$t('chat.roomName')"
          :error-messages="nameError"
          density="comfortable"
          variant="outlined"
          rounded="lg"
          class="mb-3"
          autofocus
          @input="nameError = ''"
        />

        <v-textarea
          v-if="!isDirect"
          v-model="formDescription"
          :label="$t('chat.roomDescription')"
          density="comfortable"
          variant="outlined"
          rounded="lg"
          rows="2"
          auto-grow
          class="mb-3"
        />

        <!-- Target user selector for direct rooms -->
        <v-autocomplete
          v-if="isDirect"
          v-model="selectedTargetUser"
          v-model:search="userSearch"
          :items="filteredDirectUsers"
          :loading="isSearchingUsers"
          item-title="full_name"
          item-value="id"
          :label="$t('chat.selectUser')"
          :placeholder="$t('chat.searchUsers')"
          :error-messages="targetUserError"
          density="comfortable"
          variant="outlined"
          rounded="lg"
          clearable
          return-object
          no-filter
          class="mb-3"
          @update:model-value="targetUserError = ''"
        >
          <template #item="{ props: itemProps, item: autocompleteItem }">
            <v-list-item v-bind="itemProps">
              <template #prepend>
                <v-avatar size="32" color="primary" variant="tonal">
                  <v-img
                    v-if="autocompleteItem.avatar"
                    :src="autocompleteItem.avatar"
                    :alt="autocompleteItem.full_name"
                  />
                  <span v-else class="text-caption">
                    {{ autocompleteItem.full_name?.charAt(0)?.toUpperCase() }}
                  </span>
                </v-avatar>
              </template>
              <template #subtitle>
                {{ autocompleteItem.email }}
              </template>
            </v-list-item>
          </template>
        </v-autocomplete>

        <!-- Invite members selector for channel rooms -->
        <v-autocomplete
          v-if="!isDirect"
          v-model="selectedMembers"
          v-model:search="userSearch"
          :items="filteredSearchUsers"
          :loading="isSearchingUsers"
          item-title="full_name"
          item-value="id"
          :label="$t('chat.inviteMembers')"
          :placeholder="$t('chat.searchUsers')"
          density="comfortable"
          variant="outlined"
          rounded="lg"
          clearable
          multiple
          chips
          closable-chips
          return-object
          class="mb-3"
          no-filter
        >
          <template #item="{ props: itemProps, item: autocompleteItem }">
            <v-list-item v-bind="itemProps">
              <template #prepend>
                <v-avatar size="32" color="primary" variant="tonal">
                  <v-img
                    v-if="autocompleteItem.avatar"
                    :src="autocompleteItem.avatar"
                    :alt="autocompleteItem.full_name"
                  />
                  <span v-else class="text-caption">
                    {{ autocompleteItem.full_name?.charAt(0)?.toUpperCase() }}
                  </span>
                </v-avatar>
              </template>
              <template #subtitle>
                {{ autocompleteItem.email }}
              </template>
            </v-list-item>
          </template>
        </v-autocomplete>

        <!-- Invite teams/groups selector for channel rooms -->
        <v-autocomplete
          v-if="!isDirect"
          v-model="selectedGroupIds"
          :items="allGroups"
          item-title="name"
          item-value="id"
          :label="$t('chat.inviteTeams')"
          density="comfortable"
          variant="outlined"
          rounded="lg"
          clearable
          multiple
          chips
          closable-chips
          class="mb-3"
        />

        <!-- Visibility selector (hidden for direct rooms) -->
        <v-select
          v-if="!isDirect"
          v-model="formVisibility"
          :items="visibilityOptions"
          item-title="label"
          item-value="value"
          :label="$t('chat.visibility')"
          density="comfortable"
          variant="outlined"
          rounded="lg"
          :hint="
            formVisibility === 'private'
              ? $t('chat.visibilityPrivateHint')
              : $t('chat.visibilityPublicHint')
          "
          persistent-hint
        />
      </div>

      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="handleClose">{{ $t('common.cancel') }}</v-btn>
        <v-btn variant="elevated" color="primary" :loading="isSubmitting" @click="handleCreate">
          {{ $t('chat.create') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import ChatRoomService from '@/services/ChatRoomService'
import UserService from '@/services/UserService'
import GroupService from '@/services/GroupService'
import type { ChatRoomModel } from '@/interfaces/models/ChatRoomModel'
import type { UserModel } from '@/interfaces/models/UserModel'
import type { GroupModel } from '@/interfaces/models/GroupModel'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  dialog: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits<{
  confirm: [room: ChatRoomModel]
  'close-modal': []
}>()
/* END DEFINE PROPERTY AND EMITS */

const { t } = useI18n()

/** START DEFINE STATE */
const formName = ref('')
const formDescription = ref('')
const formType = ref('channel')
const formVisibility = ref('public')
const isSubmitting = ref(false)
const nameError = ref('')
const targetUserError = ref('')
const selectedTargetUser = ref<UserModel | null>(null)
const selectedMembers = ref<Array<UserModel>>([])
const selectedGroupIds = ref<number[]>([])
const allGroups = ref<Array<GroupModel>>([])
const userSearch = ref('')
const searchedUsers = ref<Array<UserModel>>([])
const isSearchingUsers = ref(false)
const groupMemberUserIds = ref<Set<number>>(new Set())
const directPartnerIds = ref<Set<number>>(new Set())
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

const roomTypeOptions = [
  { label: 'Channel', value: 'channel' },
  { label: 'Direct', value: 'direct' },
]
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const isDirect = computed(() => formType.value === 'direct')

const visibilityOptions = computed(() => [
  { label: t('chat.visibilityPublic'), value: 'public' },
  { label: t('chat.visibilityPrivate'), value: 'private' },
])

const filteredSearchUsers = computed(() => {
  return searchedUsers.value.filter((user) => !groupMemberUserIds.value.has(user.id))
})

const filteredDirectUsers = computed(() => {
  return searchedUsers.value.filter((user) => !directPartnerIds.value.has(user.id))
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
async function fetchGroups() {
  if (allGroups.value.length > 0) return

  try {
    allGroups.value = await GroupService.getAll()
  } catch (error) {
    console.error('Failed to fetch groups:', error)
  }
}

async function fetchDirectPartners() {
  try {
    const rooms = await ChatRoomService.getMyRooms()
    const ids = new Set<number>()

    for (const room of rooms) {
      if (room.type === 'direct' && room.direct_user) {
        ids.add(room.direct_user.id)
      }
    }

    directPartnerIds.value = ids
  } catch (error) {
    console.error('Failed to fetch direct partners:', error)
  }
}

async function searchUsers(query: string) {
  if (!query || query.length < 2) {
    searchedUsers.value = []
    isSearchingUsers.value = false
    return
  }

  isSearchingUsers.value = true

  try {
    searchedUsers.value = await UserService.search(query)
  } catch (error) {
    console.error('Failed to search users:', error)
  } finally {
    isSearchingUsers.value = false
  }
}

async function resolveGroupMembers() {
  if (selectedGroupIds.value.length === 0) {
    groupMemberUserIds.value = new Set()

    return
  }

  try {
    const results = await Promise.all(
      selectedGroupIds.value.map((groupId) => GroupService.getMembers(groupId)),
    )
    const userIds = new Set<number>()

    for (const members of results) {
      for (const member of members) {
        userIds.add(member.user_id)
      }
    }

    groupMemberUserIds.value = userIds

    // Auto-deselect individual members already in selected teams
    selectedMembers.value = selectedMembers.value.filter((user) => !userIds.has(user.id))
  } catch (error) {
    console.error('Failed to resolve group members:', error)
  }
}

async function handleCreate() {
  if (!isDirect.value && !formName.value.trim()) {
    nameError.value = 'Room name is required'

    return
  }

  if (isDirect.value && !selectedTargetUser.value) {
    targetUserError.value = 'Please select a user'

    return
  }

  isSubmitting.value = true

  try {
    const room = await ChatRoomService.create({
      name: isDirect.value ? undefined : formName.value.trim(),
      description: isDirect.value ? undefined : formDescription.value.trim() || undefined,
      type: formType.value,
      visibility: isDirect.value ? 'private' : formVisibility.value,
      targetUserId: isDirect.value ? selectedTargetUser.value!.id : undefined,
      memberUserIds: isDirect.value ? undefined : selectedMembers.value.map((user) => user.id),
      groupIds: isDirect.value ? undefined : selectedGroupIds.value,
    })
    emit('confirm', room)
    resetForm()
  } catch (error) {
    console.error('Failed to create room:', error)
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  emit('close-modal')
}

function resetForm() {
  formName.value = ''
  formDescription.value = ''
  formType.value = 'channel'
  formVisibility.value = 'public'
  nameError.value = ''
  targetUserError.value = ''
  selectedTargetUser.value = null
  selectedMembers.value = []
  selectedGroupIds.value = []
  userSearch.value = ''
  searchedUsers.value = []
  groupMemberUserIds.value = new Set()
  directPartnerIds.value = new Set()
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (value) => {
    if (value) {
      resetForm()
      fetchGroups()
      fetchDirectPartners()
    }
  },
)

watch(isDirect, (value) => {
  if (value) {
    formVisibility.value = 'private'
  }
})

watch(userSearch, (query) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)

  if (!query || query.length < 2) {
    searchedUsers.value = []
    isSearchingUsers.value = false

    return
  }

  isSearchingUsers.value = true
  searchDebounceTimer = setTimeout(() => searchUsers(query), 300)
})

watch(selectedGroupIds, () => {
  resolveGroupMembers()
})
/* END DEFINE WATCHER */
</script>
