<template>
  <v-dialog :model-value="dialog" max-width="560px" @update:model-value="close">
    <v-card rounded="xl">
      <v-card-title class="pa-6 pb-2 text-h6 font-weight-bold">
        {{ $t('groups.manageMembers') }}
      </v-card-title>
      <v-card-subtitle class="px-6 pb-0 text-caption text-medium-emphasis">
        {{ item?.name }}
        <v-chip
          v-if="item?.slack_channel_id"
          color="deep-purple"
          size="x-small"
          variant="tonal"
          prepend-icon="mdi-slack"
          class="ml-1"
        >
          {{ item.slack_channel_id }}
        </v-chip>
      </v-card-subtitle>
      <v-card-text class="pa-6">
        <!-- Member list -->
        <div v-if="isLoadingMembers" class="d-flex justify-center py-4">
          <v-progress-circular indeterminate color="primary" />
        </div>
        <div
          v-else-if="members.length === 0"
          class="text-center text-medium-emphasis py-4 text-body-2"
        >
          {{ $t('groups.noMembers') }}
        </div>
        <v-list v-else density="compact" rounded="lg" border>
          <v-list-item
            v-for="member in members"
            :key="member.id"
            :title="member.user?.full_name ?? `User #${member.user_id}`"
            :subtitle="member.user?.email"
          >
            <template #prepend>
              <v-avatar size="32" color="primary" variant="tonal">
                <span class="text-caption font-weight-bold">
                  {{ (member.user?.first_name?.[0] ?? '') + (member.user?.last_name?.[0] ?? '') }}
                </span>
              </v-avatar>
            </template>
            <template #append>
              <v-btn
                icon="mdi-close"
                size="x-small"
                variant="text"
                color="error"
                :loading="removingId === member.id"
                @click="removeMember(member)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
      <div class="d-flex justify-space-between px-6 py-4">
        <v-btn
          color="primary"
          variant="tonal"
          rounded="lg"
          prepend-icon="mdi-plus"
          @click="addMemberDialog = true"
        >
          {{ $t('groups.addMember') }}
        </v-btn>
        <v-btn variant="text" rounded="lg" @click="close">{{ $t('common.close') }}</v-btn>
      </div>
    </v-card>
  </v-dialog>

  <GroupsDialogAddGroupMember
    v-if="item"
    :group-id="item.id"
    :default-company-id="item.company_id ?? null"
    :dialog="addMemberDialog"
    @confirm="onMemberAdded"
    @close-modal="addMemberDialog = false"
  />
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { GroupModel, UserGroupModel } from '@/interfaces/models/GroupModel'
import GroupService from '@/services/GroupService'
import GroupsDialogAddGroupMember from '~/components/groups/DialogAddGroupMember.vue'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  item: {
    type: Object as PropType<GroupModel | null>,
    required: false,
    default: null,
  },
  dialog: {
    type: Boolean,
    required: true,
  },
})
const emit = defineEmits(['close-modal'])
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const members = ref<UserGroupModel[]>([])
const isLoadingMembers = ref(false)
const removingId = ref<number | null>(null)
const addMemberDialog = ref(false)
/* END DEFINE STATE */

/** START DEFINE METHOD */
const close = () => {
  emit('close-modal')
}

const loadMembers = async () => {
  if (!props.item) return

  try {
    isLoadingMembers.value = true
    members.value = await GroupService.getMembers(props.item.id)
  } catch (error) {
    console.error('Failed to load group members:', error)
  } finally {
    isLoadingMembers.value = false
  }
}

const onMemberAdded = async () => {
  addMemberDialog.value = false
  await loadMembers()
}

const removeMember = async (member: UserGroupModel) => {
  if (!props.item) return

  try {
    removingId.value = member.id
    await GroupService.removeMember(props.item.id, member.id)
    members.value = members.value.filter((memberItem) => memberItem.id !== member.id)
  } catch (error) {
    console.error('Failed to remove member:', error)
  } finally {
    removingId.value = null
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (isOpen) => {
    if (isOpen) {
      loadMembers()
    } else {
      members.value = []
      addMemberDialog.value = false
    }
  },
  { immediate: false },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>
