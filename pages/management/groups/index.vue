<template>
  <v-container class="pa-4" max-width="1200">
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="text-h6 font-weight-bold text-primary">{{ $t('groups.title') }}</div>
      <v-btn
        color="primary"
        variant="elevated"
        rounded="lg"
        prepend-icon="mdi-plus"
        @click="openCreateDialog"
      >
        {{ $t('groups.create') }}
      </v-btn>
    </div>

    <v-card rounded="xl" elevation="0" border class="table-responsive-card">
      <v-data-table
        :headers="tableHeaders"
        :items="groups"
        :loading="isLoading"
        :items-per-page="25"
        density="comfortable"
      >
        <!-- Company -->
        <template #item.company_id="{ item }">
          <span class="text-body-2">{{ companyName(item.company_id) }}</span>
        </template>

        <!-- Slack channel -->
        <template #item.slack_channel_id="{ item }">
          <span v-if="item.slack_channel_id" class="text-caption text-medium-emphasis">
            ••••••••••••••••
          </span>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>

        <!-- Slack user group -->
        <template #item.slack_user_group_id="{ item }">
          <span v-if="item.slack_user_group_id" class="text-caption text-medium-emphasis">
            ••••••••••••••••
          </span>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-btn
              icon="mdi-account-multiple-outline"
              size="x-small"
              variant="text"
              color="teal"
              :title="$t('groups.manageMembers')"
              @click="openMembersDialog(item)"
            />
            <v-btn
              icon="mdi-pencil-outline"
              size="x-small"
              variant="text"
              color="primary"
              :title="$t('common.edit')"
              @click="openEditDialog(item)"
            />
            <v-btn
              icon="mdi-delete-outline"
              size="x-small"
              variant="text"
              color="error"
              :title="$t('common.delete')"
              @click="openDeleteDialog(item)"
            />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / Edit dialog -->
    <GroupsDialogCreateOrUpdate
      :item="editingGroup"
      :dialog="createOrUpdateDialog"
      :companies="availableCompanies"
      :default-company-id="defaultCompanyId"
      @confirm="onSaveConfirm"
      @close-modal="createOrUpdateDialog = false"
    />

    <!-- Manage members dialog -->
    <GroupsDialogManageMembers
      :item="managingGroup"
      :dialog="membersDialog"
      @close-modal="membersDialog = false"
    />

    <!-- Delete dialog -->
    <GroupsDialogDelete
      :item="deletingGroup"
      :dialog="deleteDialog"
      @confirm="onDeleteConfirm"
      @close-modal="deleteDialog = false"
    />
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { GroupModel } from '@/interfaces/models/GroupModel'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import GroupService from '@/services/GroupService'
import CompanyService from '@/services/CompanyService'
import GroupsDialogCreateOrUpdate from '~/components/groups/DialogCreateOrUpdate.vue'
import GroupsDialogManageMembers from '~/components/groups/DialogManageMembers.vue'
import GroupsDialogDelete from '~/components/groups/DialogDelete.vue'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.groups.index',
})
/* END DEFINE */

const { t } = useI18n()
const userStore = useUserStore()

/** START DEFINE STATE */
const groups = ref<GroupModel[]>([])
const availableCompanies = ref<CompanyModel[]>([])
const isLoading = ref(false)
const createOrUpdateDialog = ref(false)
const editingGroup = ref<GroupModel | null>(null)
const membersDialog = ref(false)
const managingGroup = ref<GroupModel | null>(null)
const deleteDialog = ref(false)
const deletingGroup = ref<GroupModel | null>(null)

const defaultCompanyId = computed<number | null>(
  () => userStore.user?.user_departments?.[0]?.company_id ?? null,
)

const tableHeaders = computed(() => [
  { title: t('common.id'), key: 'id', sortable: true, width: '60px' },
  { title: t('common.name'), key: 'name', sortable: true },
  { title: t('groups.slug'), key: 'slug', sortable: true },
  { title: t('common.company'), key: 'company_id', sortable: false },
  { title: t('groups.slackChannelId'), key: 'slack_channel_id', sortable: false },
  { title: t('groups.slackUserGroupId'), key: 'slack_user_group_id', sortable: false },
  { title: '', key: 'actions', sortable: false, width: '100px' },
])
/* END DEFINE STATE */

/** START DEFINE METHOD */
const fetchGroups = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    const data = await GroupService.getAll()
    groups.value = Object.values(data)
  } catch (error) {
    console.error('Failed to fetch groups:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchCompanies = async () => {
  try {
    const data = await CompanyService.getAll()
    availableCompanies.value = Object.values(data)
  } catch (error) {
    console.error('Failed to fetch companies:', error)
  }
}

const companyName = (companyIdValue: number | undefined) => {
  if (!companyIdValue) return '—'

  return availableCompanies.value.find((company) => company.id === companyIdValue)?.name ?? '—'
}

const openCreateDialog = () => {
  editingGroup.value = null
  createOrUpdateDialog.value = true
}

const openEditDialog = (group: GroupModel) => {
  editingGroup.value = group
  createOrUpdateDialog.value = true
}

const openMembersDialog = (group: GroupModel) => {
  managingGroup.value = group
  membersDialog.value = true
}

const openDeleteDialog = (group: GroupModel) => {
  deletingGroup.value = group
  deleteDialog.value = true
}

const onSaveConfirm = (saved: GroupModel) => {
  const index = groups.value.findIndex((group) => group.id === saved.id)

  if (index !== -1) {
    groups.value[index] = saved
  } else {
    groups.value.unshift(saved)
  }

  createOrUpdateDialog.value = false
}

const onDeleteConfirm = (id: number) => {
  groups.value = groups.value.filter((group) => group.id !== id)
  deleteDialog.value = false
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  fetchGroups()
  fetchCompanies()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
