<template>
  <v-dialog :model-value="dialog" max-width="600" persistent scrollable>
    <v-card rounded="xl" elevation="2">
      <!-- Header -->
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">{{ $t('chat.createRoom') }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ $t('chat.createRoomSubtitle') }}
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="handleClose">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0" style="max-height: 70vh; overflow-y: auto">
        <v-container class="pa-0">
          <v-row>
            <!-- ── ROOM INFO ── -->
            <v-col cols="12">
              <div class="section-label">{{ $t('chat.roomInfo').toUpperCase() }}</div>
            </v-col>

            <!-- Room type -->
            <v-col cols="12">
              <div class="field-label">{{ $t('chat.roomType').toUpperCase() }}</div>
              <v-select
                v-model="formType"
                :items="roomTypeOptions"
                item-title="label"
                item-value="value"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                autocomplete="off"
              />
            </v-col>

            <!-- Room name (channel only) -->
            <v-col v-if="!isDirect" cols="12">
              <div class="field-label">
                {{ $t('chat.roomName').toUpperCase() }} <span class="text-error">*</span>
              </div>
              <v-text-field
                v-model="formName"
                :error-messages="nameError"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                autocomplete="off"
                @input="nameError = ''"
              />
            </v-col>

            <!-- Description (channel only) -->
            <v-col v-if="!isDirect" cols="12">
              <div class="field-label">{{ $t('chat.roomDescription').toUpperCase() }}</div>
              <v-textarea
                v-model="formDescription"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                rows="2"
                auto-grow
                autocomplete="off"
              />
            </v-col>

            <!-- ── MEMBERS ── -->
            <v-col cols="12">
              <div class="section-label">{{ $t('chat.members').toUpperCase() }}</div>
            </v-col>

            <!-- Target user selector for direct rooms -->
            <v-col v-if="isDirect" cols="12">
              <div class="field-label">
                {{ $t('chat.selectUser').toUpperCase() }} <span class="text-error">*</span>
              </div>
              <v-autocomplete
                v-model="selectedTargetUser"
                v-model:search="userSearch"
                :items="filteredDirectUsers"
                :loading="isSearchingUsers"
                item-title="full_name"
                item-value="id"
                :placeholder="$t('chat.searchUsers')"
                :error-messages="targetUserError"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                clearable
                return-object
                no-filter
                autocomplete="off"
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
            </v-col>

            <!-- Invite members selector for channel rooms -->
            <v-col v-if="!isDirect" cols="12">
              <div class="field-label">{{ $t('chat.inviteMembers').toUpperCase() }}</div>
              <v-autocomplete
                v-model="selectedMembers"
                v-model:search="userSearch"
                :items="filteredSearchUsers"
                :loading="isSearchingUsers"
                item-title="full_name"
                item-value="id"
                :placeholder="$t('chat.searchUsers')"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                clearable
                multiple
                chips
                closable-chips
                return-object
                no-filter
                autocomplete="off"
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
            </v-col>

            <!-- Invite teams/groups selector for channel rooms -->
            <v-col v-if="!isDirect" cols="12">
              <div class="field-label">{{ $t('chat.inviteTeams').toUpperCase() }}</div>
              <v-autocomplete
                v-model="selectedGroupIds"
                :items="allGroups"
                item-title="name"
                item-value="id"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                clearable
                multiple
                chips
                closable-chips
                autocomplete="off"
              />
            </v-col>

            <!-- ── VISIBILITY ── -->
            <v-col v-if="!isDirect" cols="12">
              <div class="section-label">{{ $t('chat.visibility').toUpperCase() }}</div>
            </v-col>

            <v-col v-if="!isDirect" cols="12">
              <div class="field-label">{{ $t('chat.visibility').toUpperCase() }}</div>
              <v-select
                v-model="formVisibility"
                :items="visibilityOptions"
                item-title="label"
                item-value="value"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                autocomplete="off"
                :hint="
                  formVisibility === 'private'
                    ? $t('chat.visibilityPrivateHint')
                    : $t('chat.visibilityPublicHint')
                "
                persistent-hint
              />
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <!-- Error banner -->
      <v-alert v-if="formError" type="error" variant="tonal" class="mx-6 mb-2" density="compact">
        {{ formError }}
      </v-alert>

      <!-- Footer -->
      <div class="d-flex justify-end ga-3 px-6 py-4">
        <v-btn variant="text" color="default" rounded="lg" @click="handleClose">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          rounded="lg"
          :loading="isSubmitting"
          @click="handleCreate"
        >
          {{ $t('chat.create') }}
        </v-btn>
      </div>
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
const formError = ref('')
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
    formError.value = error instanceof Error ? error.message : 'Failed to create room'
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
  formError.value = ''
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

<style scoped>
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.12);
}

.field-label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-bottom: 4px;
}
</style>
