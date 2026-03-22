<template>
  <v-container fluid class="py-6 px-6">
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">User Management</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          Manage staff accounts, roles, and department assignments
        </div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-account-plus" rounded="lg" @click="addUser()">
        New User
      </v-btn>
    </div>

    <!-- Table card -->
    <v-card rounded="xl" elevation="0" border>
      <!-- Toolbar -->
      <div class="d-flex align-center px-4 py-3 ga-2 border-b table-toolbar">
        <v-btn
          :color="isFilterActive ? 'primary' : undefined"
          :variant="isFilterActive ? 'tonal' : 'text'"
          prepend-icon="mdi-filter-outline"
          size="small"
          @click="filterExpanded = !filterExpanded"
        >
          Filters
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

        <!-- Status: dot indicator -->
        <template #item.is_activated="{ item }">
          <div class="d-flex align-center ga-2">
            <span
              class="status-dot"
              :class="item.is_activated ? 'status-dot--active' : 'status-dot--inactive'"
            ></span>
            <span class="text-body-2">{{ item.is_activated ? 'Active' : 'Inactive' }}</span>
          </div>
        </template>

        <!-- Actions: icon buttons with tooltip -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center ga-1">
            <v-btn icon size="x-small" variant="text" color="primary" @click="editItem(item)">
              <v-icon size="16">mdi-pencil-outline</v-icon>
              <v-tooltip activator="parent" location="top">Edit</v-tooltip>
            </v-btn>
            <v-btn
              icon
              size="x-small"
              variant="text"
              color="primary"
              @click="manageDepartments(item)"
            >
              <v-icon size="16">mdi-office-building-outline</v-icon>
              <v-tooltip activator="parent" location="top">Manage Departments</v-tooltip>
            </v-btn>
            <v-btn icon size="x-small" variant="text" color="error" @click="deleteItem(item)">
              <v-icon size="16">mdi-delete-outline</v-icon>
              <v-tooltip activator="parent" location="top">Delete</v-tooltip>
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
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import DialogCreateOrUpdate from '~/components/users/DialogCreateOrUpdate.vue'
import DialogDelete from '@/components/users/DialogDelete.vue'
import DialogManageDepartments from '@/components/users/DialogManageDepartments.vue'
import UserFilterPanel from '@/components/users/UserFilterPanel.vue'
import type { UserModel } from '@/interfaces/models/UserModel'
import type { DepartmentModel } from '@/interfaces/models/DepartmentModel'
import type { PermissionGroupModel } from '@/interfaces/models/PermissionGroupModel'
import UserService from '@/services/UserService'
import DepartmentService from '@/services/DepartmentService'
import PermissionGroupService from '@/services/PermissionGroupService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.users.index',
})
/* END  DEFINE */

/** START DEFINE STATE */
const users = ref<UserModel[]>([])
const isLoading = ref(false)
const availableDepartments = ref<DepartmentModel[]>([])
const availableRoles = ref<PermissionGroupModel[]>([])
const filterExpanded = ref(false)
const filters = ref({
  id: '',
  name: '',
  position: '',
  email: '',
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
const editedItem = ref<UserModel | null>(null)
const sortBy = ref<Array<{ key: string; order: 'asc' | 'desc' }>>([
  { key: 'first_name', order: 'asc' },
])
const headers = ref([
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Name', align: 'start' as const, key: 'full_name', minWidth: '220px' },
  { title: 'Position', key: 'position' },
  { title: 'Email', key: 'email' },
  { title: 'Departments', key: 'departments', sortable: false },
  { title: 'Roles', key: 'roles', sortable: false },
  { title: 'Contract Type', key: 'contract_type', sortable: true },
  { title: 'Join Date', key: 'join_date' },
  { title: 'Status', key: 'is_activated' },
  { title: 'Actions', key: 'actions', sortable: false },
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

const resetFilters = () => {
  filters.value = {
    id: '',
    name: '',
    position: '',
    email: '',
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
  const [departments, roles] = await Promise.all([
    DepartmentService.getAll(),
    PermissionGroupService.getAll(),
  ])
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
  background-color: #388e3c;
}

.status-dot--inactive {
  background-color: #9e9e9e;
}

.table-toolbar {
  background-color: #f5ede4;
}

.row-link {
  color: #bf6e3a;
  text-decoration: none;
}

.row-link:hover {
  text-decoration: underline;
}
</style>
