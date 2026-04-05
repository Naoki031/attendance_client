<template>
  <v-dialog :model-value="dialog" max-width="600" persistent scrollable>
    <v-card rounded="xl" elevation="2">
      <!-- Header -->
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">{{ $t('chat.inviteMembers') }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ $t('chat.inviteMembersSubtitle') }}
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="handleClose">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0" style="max-height: 70vh; overflow-y: auto">
        <v-container class="pa-0">
          <v-row>
            <!-- ── MEMBERS ── -->
            <v-col cols="12">
              <div class="section-label">{{ $t('chat.members').toUpperCase() }}</div>
            </v-col>

            <!-- User multi-select -->
            <v-col cols="12">
              <div class="field-label">{{ $t('chat.selectUsers').toUpperCase() }}</div>
              <v-autocomplete
                v-model="selectedUsers"
                v-model:search="userSearch"
                :items="filteredUsers"
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

            <!-- Team selector -->
            <v-col cols="12">
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
          :loading="isInviting"
          :disabled="selectedUsers.length === 0 && selectedGroupIds.length === 0"
          @click="handleInvite"
        >
          {{ $t('chat.invite') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import ChatRoomService from '@/services/ChatRoomService'
import GroupService from '@/services/GroupService'
import UserService from '@/services/UserService'
import type { ChatRoomMemberModel } from '@/interfaces/models/ChatRoomModel'
import type { UserModel } from '@/interfaces/models/UserModel'
import type { GroupModel } from '@/interfaces/models/GroupModel'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  dialog: {
    type: Boolean,
    required: true,
  },
  roomUuid: {
    type: String,
    required: true,
  },
  existingMemberIds: {
    type: Array as PropType<number[]>,
    required: false,
    default: () => [],
  },
})

const emit = defineEmits<{
  invited: [members: ChatRoomMemberModel[]]
  'close-modal': []
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const selectedUsers = ref<Array<UserModel>>([])
const selectedGroupIds = ref<number[]>([])
const allGroups = ref<Array<GroupModel>>([])
const userSearch = ref('')
const searchedUsers = ref<Array<UserModel>>([])
const isSearchingUsers = ref(false)
const isInviting = ref(false)
const formError = ref('')
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
/* END DEFINE STATE */

/** START DEFINE METHOD */
async function fetchGroups() {
  if (allGroups.value.length > 0) return

  try {
    allGroups.value = await GroupService.getAll()
  } catch (error) {
    console.error('Failed to fetch groups:', error)
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

async function handleInvite() {
  isInviting.value = true
  formError.value = ''

  try {
    const members = await ChatRoomService.inviteUsers(props.roomUuid, {
      user_ids: selectedUsers.value.map((user) => user.id),
      groupIds: selectedGroupIds.value.length > 0 ? selectedGroupIds.value : undefined,
    })
    emit('invited', members)
    resetForm()
    handleClose()
  } catch (error) {
    formError.value = error instanceof Error ? error.message : 'Failed to invite users'
  } finally {
    isInviting.value = false
  }
}

function handleClose() {
  emit('close-modal')
}

function resetForm() {
  selectedUsers.value = []
  selectedGroupIds.value = []
  userSearch.value = ''
  searchedUsers.value = []
  formError.value = ''
}
/* END DEFINE METHOD */

/** START DEFINE COMPUTED */
const filteredUsers = computed(() =>
  searchedUsers.value.filter((user) => !props.existingMemberIds.includes(user.id)),
)
/* END DEFINE COMPUTED */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (value) => {
    if (value) {
      resetForm()
      fetchGroups()
    }
  },
)

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
