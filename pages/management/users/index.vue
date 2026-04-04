<template>
  <v-container fluid class="py-6 px-6">
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">{{ $t('users.title') }}</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-account-plus" rounded="lg" @click="addUser()">
        {{ $t('users.createUser') }}
      </v-btn>
    </div>

    <!-- Table card -->
    <v-card rounded="xl" elevation="0" border class="table-responsive-card">
      <!-- Toolbar -->
      <div class="d-flex align-center px-4 py-3 ga-2 border-b table-toolbar">
        <v-btn
          :color="isFilterActive ? 'primary' : undefined"
          :variant="isFilterActive ? 'tonal' : 'text'"
          prepend-icon="mdi-filter-outline"
          size="small"
          @click="filterExpanded = !filterExpanded"
        >
          {{ $t('common.filter') }}
          <v-badge
            v-if="activeFilterCount > 0"
            :content="activeFilterCount"
            color="primary"
            floating
          ></v-badge>
        </v-btn>
        <v-spacer></v-spacer>
        <span class="text-caption text-medium-emphasis">{{ users.length }} users</span>
      </div>

      <!-- Filter panel -->
      <UserFilterPanel
        v-model="filters"
        :expanded="filterExpanded"
        :companies="availableCompanies"
        :departments="availableDepartments"
        :roles="availableRoles"
        @reset="resetFilters"
      />

      <!-- Data table -->
      <v-data-table
        v-model:sort-by="sortBy"
        :headers="headers"
        :items="users"
        :loading="isLoading"
        :hover="true"
        items-per-page="50"
      >
        <!-- ID: link to detail -->
        <template #item.id="{ item }">
          <nuxt-link :to="`/management/users/${item.id}`" class="row-link">
            {{ item.id }}
          </nuxt-link>
        </template>

        <!-- Name: avatar + full name -->
        <template #item.full_name="{ item }">
          <div class="d-flex align-center ga-3 py-2">
            <v-avatar size="34" color="primary" rounded="lg">
              <span class="text-caption text-white font-weight-bold">{{ getInitials(item) }}</span>
            </v-avatar>
            <nuxt-link :to="`/management/users/${item.id}`" class="row-link font-weight-medium">
              {{ item.full_name }}
            </nuxt-link>
          </div>
        </template>

        <!-- Company -->
        <template #item.company="{ item }">
          <div class="d-flex flex-wrap ga-1 py-1">
            <v-chip
              v-for="company in getUniqueCompanies(item)"
              :key="company.id"
              size="x-small"
              color="secondary"
              variant="tonal"
              >{{ company.name }}</v-chip
            >
            <span v-if="!getUniqueCompanies(item).length" class="text-medium-emphasis text-caption"
              >—</span
            >
          </div>
        </template>

        <!-- Departments -->
        <template #item.departments="{ item }">
          <div class="d-flex flex-wrap ga-1 py-1">
            <v-chip
              v-for="assignment in item.user_departments"
              :key="assignment.id"
              size="x-small"
              color="primary"
              variant="tonal"
              link
              :to="`/management/departments/${assignment.department_id}/users`"
              >{{ assignment.department?.name }}</v-chip
            >
            <span v-if="!item.user_departments?.length" class="text-medium-emphasis text-caption"
              >—</span
            >
          </div>
        </template>

        <!-- Roles -->
        <template #item.roles="{ item }">
          <div class="d-flex flex-wrap ga-1 py-1">
            <v-chip
              v-for="role in item.roles"
              :key="role"
              size="x-small"
              color="primary"
              variant="outlined"
              >{{ role }}</v-chip
            >
            <span v-if="!item.roles?.length" class="text-medium-emphasis text-caption">—</span>
          </div>
        </template>

        <!-- Permanent Remote: chip label -->
        <template #item.permanent_remote="{ item }">
          <div v-if="item.permanent_remote" class="d-flex align-center ga-1">
            <v-chip size="x-small" color="success" variant="tonal" prepend-icon="mdi-home-outline">
              {{ $t('users.permanentRemote') }}
            </v-chip>
            <v-tooltip v-if="item.permanent_remote_reason" activator="parent" location="top">
              {{ item.permanent_remote_reason }}
            </v-tooltip>
          </div>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>

        <!-- Schedule: show custom schedule count badge -->
        <template #item.schedule="{ item }">
          <div v-if="item.user_work_schedules?.length">
            <v-chip
              color="deep-purple"
              size="x-small"
              variant="tonal"
              prepend-icon="mdi-clock-edit-outline"
            >
              {{ $t('users.customSchedule', { count: item.user_work_schedules.length }) }}
            </v-chip>
          </div>
          <span v-else class="text-caption text-medium-emphasis">{{
            $t('users.companyDefault')
          }}</span>
        </template>

        <!-- Status: dot indicator -->
        <template #item.is_activated="{ item }">
          <div class="d-flex align-center ga-2">
            <span
              class="status-dot"
              :class="item.is_activated ? 'status-dot--active' : 'status-dot--inactive'"
            ></span>
            <span class="text-body-2">{{
              item.is_activated ? $t('common.active') : $t('common.inactive')
            }}</span>
          </div>
        </template>

        <!-- Actions: icon buttons with tooltip -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center ga-1">
            <v-btn
              size="x-small"
              variant="tonal"
              color="primary"
              rounded="lg"
              class="btn-shine"
              @click="editItem(item)"
            >
              <v-icon size="16">mdi-pencil-outline</v-icon>
              <v-tooltip activator="parent" location="top">{{ $t('common.edit') }}</v-tooltip>
            </v-btn>
            <v-btn
              size="x-small"
              variant="tonal"
              color="action"
              rounded="lg"
              class="btn-shine"
              @click="manageDepartments(item)"
            >
              <v-icon size="16">mdi-office-building-outline</v-icon>
              <v-tooltip activator="parent" location="top">{{
                $t('users.manageDepartments')
              }}</v-tooltip>
            </v-btn>
            <v-btn
              size="x-small"
              variant="tonal"
              color="action"
              rounded="lg"
              class="btn-shine"
              @click="openWorkSchedule(item)"
            >
              <v-icon size="16">mdi-clock-time-eight-outline</v-icon>
              <v-tooltip activator="parent" location="top">{{
                $t('users.manageWorkSchedule')
              }}</v-tooltip>
            </v-btn>
            <!-- Cancel KYC button: shown whenever a KYC submission exists (any status) -->
            <v-btn
              v-if="item.kyc_status"
              icon
              size="x-small"
              variant="text"
              :color="item.kyc_status === 'approved' ? 'success' : 'warning'"
              @click="openCancelKycDialog(item)"
            >
              <v-icon size="16">{{
                item.kyc_status === 'approved' ? 'mdi-check-circle' : 'mdi-face-recognition'
              }}</v-icon>
              <v-tooltip activator="parent" location="top">{{
                $t('face.kyc.cancelKyc')
              }}</v-tooltip>
            </v-btn>
            <v-btn
              size="x-small"
              variant="tonal"
              color="error"
              rounded="lg"
              class="btn-shine"
              @click="deleteItem(item)"
            >
              <v-icon size="16">mdi-delete-outline</v-icon>
              <v-tooltip activator="parent" location="top">{{ $t('common.delete') }}</v-tooltip>
            </v-btn>
          </div>
        </template>

        <template #loading>
          <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
        </template>
      </v-data-table>
    </v-card>

    <DialogCreateOrUpdate
      v-if="dialog"
      :item="editedItem"
      :dialog="dialog"
      @confirm="onConfirm"
      @close-modal="onClose"
    />

    <DialogDelete
      v-if="!!selectedUser"
      :item="selectedUser"
      :dialog="dialogDelete"
      @confirm-delete="onConfirmDelete"
      @close-delete="onCloseDelete"
    />

    <DialogManageDepartments
      v-if="!!selectedUserForDepartments"
      :user="selectedUserForDepartments"
      :dialog="dialogDepartments"
      @close-modal="dialogDepartments = false"
      @changed="getUsers"
    />

    <DialogManageWorkSchedule
      v-if="!!selectedUserForSchedule"
      :user="selectedUserForSchedule"
      :dialog="dialogWorkSchedule"
      @close-modal="dialogWorkSchedule = false"
      @changed="getUsers"
    />

    <!-- Cancel KYC confirmation dialog -->
    <v-dialog v-model="dialogCancelKyc" max-width="400" persistent>
      <v-card v-if="selectedUserForCancelKyc" rounded="xl">
        <v-card-title class="px-6 pt-6 pb-2 text-h6 font-weight-bold">
          {{ $t('face.kyc.cancelKyc') }}
        </v-card-title>
        <v-card-text class="px-6 pb-2">
          <div class="text-body-2 font-weight-medium mb-1">
            {{ selectedUserForCancelKyc.full_name }}
          </div>
          <div class="text-body-2 text-medium-emphasis">{{ $t('face.kyc.cancelKycConfirm') }}</div>
        </v-card-text>
        <v-card-actions class="px-6 pb-5 ga-2">
          <v-btn
            variant="text"
            rounded="lg"
            :disabled="cancelKycLoading"
            @click="dialogCancelKyc = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-spacer />
          <v-btn
            color="error"
            variant="flat"
            rounded="lg"
            :loading="cancelKycLoading"
            @click="confirmCancelKyc"
          >
            {{ $t('face.kyc.cancelKyc') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import DialogCreateOrUpdate from '~/components/users/DialogCreateOrUpdate.vue'
import DialogDelete from '@/components/users/DialogDelete.vue'
import DialogManageDepartments from '@/components/users/DialogManageDepartments.vue'
import DialogManageWorkSchedule from '@/components/users/DialogManageWorkSchedule.vue'
import UserFilterPanel from '@/components/users/UserFilterPanel.vue'
import FaceAttendanceService from '@/services/FaceAttendanceService'
import type { UserModel } from '@/interfaces/models/UserModel'
import type { DepartmentModel } from '@/interfaces/models/DepartmentModel'
import type { PermissionGroupModel } from '@/interfaces/models/PermissionGroupModel'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import UserService from '@/services/UserService'
import CompanyService from '@/services/CompanyService'
import DepartmentService from '@/services/DepartmentService'
import PermissionGroupService from '@/services/PermissionGroupService'
/* END IMPORT */

const { t } = useI18n()

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.users.index',
})
/* END  DEFINE */

/** START DEFINE STATE */
const users = ref<UserModel[]>([])
const isLoading = ref(false)
const availableCompanies = ref<CompanyModel[]>([])
const availableDepartments = ref<DepartmentModel[]>([])
const availableRoles = ref<PermissionGroupModel[]>([])
const filterExpanded = ref(false)
const filters = ref({
  id: '',
  name: '',
  position: '',
  email: '',
  companyId: null as number | null,
  departmentId: null as number | null,
  role: '',
  status: '' as '' | 'active' | 'inactive',
  contractType: '',
})

const selectedUser = ref<UserModel | null>(null)
const dialog = ref(false)
const dialogDelete = ref(false)
const dialogDepartments = ref(false)
const selectedUserForDepartments = ref<UserModel | null>(null)
const dialogWorkSchedule = ref(false)
const selectedUserForSchedule = ref<UserModel | null>(null)
const editedItem = ref<UserModel | null>(null)
const dialogCancelKyc = ref(false)
const selectedUserForCancelKyc = ref<UserModel | null>(null)
const cancelKycLoading = ref(false)
const sortBy = ref<Array<{ key: string; order: 'asc' | 'desc' }>>([
  { key: 'first_name', order: 'asc' },
])
const headers = computed(() => [
  { title: t('common.id'), key: 'id', sortable: true },
  { title: t('common.name'), align: 'start' as const, key: 'full_name', minWidth: '220px' },
  { title: t('profile.position'), key: 'position' },
  { title: t('profile.email'), key: 'email' },
  { title: t('profile.company'), key: 'company', sortable: false },
  { title: t('departments.title'), key: 'departments', sortable: false },
  { title: t('profile.roles'), key: 'roles', sortable: false },
  { title: t('profile.contractType'), key: 'contract_type', sortable: true },
  { title: t('profile.joinDate'), key: 'join_date' },
  { title: t('users.permanentRemote'), key: 'permanent_remote', sortable: false },
  { title: t('common.schedule'), key: 'schedule', sortable: false },
  { title: t('common.status'), key: 'is_activated' },
  { title: t('common.actions'), key: 'actions', sortable: false },
])

let filterDebounceTimer: ReturnType<typeof setTimeout> | null = null
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const activeFilterCount = computed(() => {
  const filterValues = filters.value

  return [
    filterValues.id,
    filterValues.name,
    filterValues.position,
    filterValues.email,
    filterValues.companyId,
    filterValues.departmentId,
    filterValues.role,
    filterValues.status,
    filterValues.contractType,
  ].filter((filterValue) => filterValue !== '' && filterValue !== null).length
})

const isFilterActive = computed(() => activeFilterCount.value > 0)

/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const getUsers = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    const filterValues = filters.value
    const hasFilter =
      filterValues.id ||
      filterValues.name ||
      filterValues.position ||
      filterValues.email ||
      filterValues.companyId ||
      filterValues.departmentId ||
      filterValues.role ||
      filterValues.status ||
      filterValues.contractType

    if (hasFilter) {
      users.value = await UserService.filter({
        id: filterValues.id || undefined,
        name: filterValues.name || undefined,
        position: filterValues.position || undefined,
        email: filterValues.email || undefined,
        companyId: filterValues.companyId,
        departmentId: filterValues.departmentId,
        role: filterValues.role || undefined,
        status: filterValues.status || undefined,
        contractType: filterValues.contractType || undefined,
      })
    } else {
      users.value = await UserService.getAll()
    }
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    isLoading.value = false
  }
}

const getInitials = (item: UserModel): string => {
  const name = item.full_name ?? ''
  const parts = name.trim().split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  if (parts.length >= 2) return (first + last).toUpperCase()

  return first.toUpperCase() || '?'
}

const getUniqueCompanies = (item: UserModel) => {
  const companyMap = new Map<number, { id: number; name: string }>()

  for (const assignment of item.user_departments ?? []) {
    if (assignment.company?.id && !companyMap.has(assignment.company.id)) {
      companyMap.set(assignment.company.id, {
        id: assignment.company.id,
        name: assignment.company.name,
      })
    }
  }

  return Array.from(companyMap.values())
}

const resetFilters = () => {
  filters.value = {
    id: '',
    name: '',
    position: '',
    email: '',
    companyId: null,
    departmentId: null,
    role: '',
    status: '',
    contractType: '',
  }
}

const addUser = () => {
  editedItem.value = null
  dialog.value = true
}

const editItem = (item: UserModel) => {
  editedItem.value = { ...item }
  dialog.value = true
}

const onConfirm = async () => {
  try {
    onClose()
    await getUsers()
  } catch (error) {
    console.error('Failed to save user:', error)
  }
}

const onClose = () => {
  dialog.value = false
  nextTick(() => {
    editedItem.value = null
  })
}

const manageDepartments = (item: UserModel) => {
  selectedUserForDepartments.value = { ...item }
  dialogDepartments.value = true
}

const openWorkSchedule = (item: UserModel) => {
  selectedUserForSchedule.value = { ...item }
  dialogWorkSchedule.value = true
}

const openCancelKycDialog = (item: UserModel) => {
  selectedUserForCancelKyc.value = { ...item }
  dialogCancelKyc.value = true
}

const confirmCancelKyc = async () => {
  if (!selectedUserForCancelKyc.value?.id) return

  cancelKycLoading.value = true

  try {
    await FaceAttendanceService.cancelKyc(selectedUserForCancelKyc.value.id)
    const user = users.value.find((userItem) => userItem.id === selectedUserForCancelKyc.value?.id)

    if (user) {
      user.kyc_status = null
      user.kyc_rejection_reason = null
    }

    dialogCancelKyc.value = false
    selectedUserForCancelKyc.value = null
  } catch (error) {
    console.error('Failed to cancel KYC:', error)
  } finally {
    cancelKycLoading.value = false
  }
}

const deleteItem = (item: UserModel) => {
  selectedUser.value = { ...item }
  dialogDelete.value = true
}

const onConfirmDelete = async (item: UserModel) => {
  try {
    dialogDelete.value = false

    if (item.id) {
      await UserService.delete(item.id)
      await getUsers()
    }
  } catch (error) {
    console.error('Failed to delete user:', error)
  } finally {
    selectedUser.value = null
  }
}

const onCloseDelete = () => {
  dialogDelete.value = false
  nextTick(() => {
    selectedUser.value = null
  })
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  filters,
  () => {
    if (filterDebounceTimer) clearTimeout(filterDebounceTimer)
    filterDebounceTimer = setTimeout(() => {
      getUsers()
    }, 300)
  },
  { deep: true },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(async () => {
  const [companies, departments, roles] = await Promise.all([
    CompanyService.getAll(),
    DepartmentService.getAll(),
    PermissionGroupService.getAll(),
  ])
  availableCompanies.value = Object.values(companies)
  availableDepartments.value = Object.values(departments)
  availableRoles.value = Object.values(roles)
  await getUsers()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}

.status-dot--active {
  background-color: var(--color-status-active);
}

.status-dot--inactive {
  background-color: var(--color-status-inactive);
}

.table-toolbar {
  background-color: var(--color-table-toolbar);
}

.row-link {
  color: var(--color-row-link);
  text-decoration: none;
}

.row-link:hover {
  text-decoration: underline;
}
</style>
