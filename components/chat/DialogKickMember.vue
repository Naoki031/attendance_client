<template>
  <v-dialog :model-value="dialog" max-width="400" @update:model-value="onDialogChange">
    <v-card rounded="xl">
      <v-card-title class="text-h6 pa-4 pb-2">
        {{ $t('chat.removeMemberTitle') }}
      </v-card-title>
      <v-card-text class="px-4">
        {{ $t('chat.removeMemberConfirm', { name: memberName }) }}
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" :disabled="isRemoving" @click="close">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn variant="elevated" color="error" :loading="isRemoving" @click="confirm">
          {{ $t('chat.removeMember') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { ChatRoomMemberModel } from '@/interfaces/models/ChatRoomModel'
import ChatRoomService from '@/services/ChatRoomService'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  dialog: {
    type: Boolean,
    required: true,
  },
  member: {
    type: Object as PropType<ChatRoomMemberModel | null>,
    required: false,
    default: null,
  },
  roomUuid: {
    type: String,
    required: true,
  },
})

const emit = defineEmits<{
  'member-removed': [userId: number]
  'close-modal': []
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const isRemoving = ref(false)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const memberName = computed(
  () => props.member?.user?.full_name ?? props.member?.user?.email ?? 'this member',
)
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
function close() {
  emit('close-modal')
}

function onDialogChange(value: boolean) {
  if (!value) close()
}

async function confirm() {
  if (!props.member) return
  isRemoving.value = true
  try {
    await ChatRoomService.removeMember(props.roomUuid, props.member.user_id)
    emit('member-removed', props.member.user_id)
    close()
  } catch (error) {
    console.error('Failed to remove member:', error)
  } finally {
    isRemoving.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (value) => {
    if (!value) isRemoving.value = false
  },
)
/* END DEFINE WATCHER */
</script>
