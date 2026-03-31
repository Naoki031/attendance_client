<template>
  <v-dialog :model-value="dialog" max-width="480" @update:model-value="handleClose">
    <v-card rounded="xl">
      <v-card-title class="text-h6 pa-4 pb-2">
        {{ $t('chat.inviteMembers') }}
      </v-card-title>
      <v-divider />

      <div class="pa-4">
        <v-autocomplete
          v-model="selectedUser"
          :items="filteredUsers"
          item-title="full_name"
          item-value="id"
          :label="$t('chat.searchUsers')"
          :loading="isLoadingUsers"
          density="comfortable"
          variant="outlined"
          rounded="lg"
          clearable
          return-object
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
      </div>

      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="handleClose">{{ $t('common.cancel') }}</v-btn>
        <v-btn
          variant="elevated"
          color="primary"
          :loading="isInviting"
          :disabled="!selectedUser"
          @click="handleInvite"
        >
          {{ $t('chat.invite') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import ChatRoomService from '@/services/ChatRoomService'
import UserService from '@/services/UserService'
import type { UserModel } from '@/interfaces/models/UserModel'
import type { ChatRoomMemberModel } from '@/interfaces/models/ChatRoomModel'
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
  invited: [member: ChatRoomMemberModel]
  'close-modal': []
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const selectedUser = ref<UserModel | null>(null)
const allUsers = ref<Array<UserModel>>([])
const isLoadingUsers = ref(false)
const isInviting = ref(false)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const filteredUsers = computed(() =>
  allUsers.value.filter((user) => !props.existingMemberIds.includes(user.id)),
)
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const fetchUsers = async () => {
  if (allUsers.value.length > 0) return
  isLoadingUsers.value = true

  try {
    allUsers.value = await UserService.getAll()
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    isLoadingUsers.value = false
  }
}

const handleInvite = async () => {
  if (!selectedUser.value) return
  isInviting.value = true

  try {
    const member = await ChatRoomService.inviteUser(props.roomUuid, selectedUser.value.id)
    emit('invited', member)
    selectedUser.value = null
    handleClose()
  } catch (error) {
    console.error('Failed to invite user:', error)
  } finally {
    isInviting.value = false
  }
}

const handleClose = () => {
  emit('close-modal')
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (value) => {
    if (value) fetchUsers()
    else selectedUser.value = null
  },
)
/* END DEFINE WATCHER */
</script>
