<template>
  <div>
    <v-data-table v-model:sort-by="sortBy" :headers="headers" :items="users" :loading="isLoading">
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title>List Users</v-toolbar-title>
          <v-divider class="mx-4" inset vertical></v-divider>
          <v-spacer></v-spacer>
          <v-btn
            :color="isFilterActive ? 'primary' : undefined"
            variant="tonal"
            prepend-icon="mdi-filter"
            class="mr-2"
            @click="filterExpanded = !filterExpanded"
          >
            Filter
            <v-badge
              v-if="activeFilterCount > 0"
              :content="activeFilterCount"
              color="primary"
              floating
            ></v-badge>
          </v-btn>
          <v-btn rounded="xl" variant="tonal" color="success" @click="addUser()">New User</v-btn>
        </v-toolbar>

        <!-- Filter panel -->
        <UserFilterPanel
          v-model="filters"
          :expanded="filterExpanded"
          :departments="availableDepartments"
          :roles="availableRoles"
          @reset="resetFilters"
        />
      </template>

      <template #item.id="{ item }">
        <nuxt-link
          :to="`/management/users/${item.id}`"
          class="text-decoration-none text-medium-emphasis"
        >
          {{ item.id }}
        </nuxt-link>
      </template>

      <template #item.full_name="{ item }">
        <nuxt-link
          :to="`/management/users/${item.id}`"
          class="text-decoration-none font-weight-medium"
        >
          {{ item.full_name }}
        </nuxt-link>
      </template>

      <template #item.departments="{ item }">
        <div class="d-flex flex-wrap gap-1 py-1">
          <v-chip
            v-for="assignment in item.user_departments"
            :key="assignment.id"
            size="x-small"
            color="teal"
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

      <template #item.roles="{ item }">
        <div class="d-flex flex-wrap gap-1 py-1">
          <v-chip
            v-for="role in item.roles"
            :key="role"
            size="x-small"
            color="primary"
            variant="tonal"
            >{{ role }}</v-chip
          >
          <span v-if="!item.roles?.length" class="text-medium-emphasis text-caption">—</span>
        </div>
      </template>

      <template #item.is_activated="{ item }">
        <v-chip :color="item.is_activated ? 'success' : 'error'" size="small">
          {{ item.is_activated ? 'Active' : 'Inactive' }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <v-icon class="me-2" size="small" @click="editItem(item)">mdi-pencil</v-icon>
        <v-icon class="me-2" size="small" color="teal" @click="manageDepartments(item)"
          >mdi-office-building</v-icon
        >
        <v-icon size="small" color="error" @click="deleteItem(item)">mdi-delete</v-icon>
      </template>

      <template #loading>
        <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
      </template>
    </v-data-table>

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
  </div>
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
  { title: 'Name', align: 'start' as const, key: 'full_name' },
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

<style scoped></style>
