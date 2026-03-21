<template>
  <div>
    <v-data-table v-model:sort-by="sortBy" :headers="headers" :items="users" :loading="isLoading">
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title>List Users</v-toolbar-title>
          <v-divider class="mx-4" inset vertical></v-divider>
          <v-spacer></v-spacer>
          <v-btn rounded="xl" variant="tonal" color="success" @click="addUser()">New User</v-btn>
        </v-toolbar>
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
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import DialogCreateOrUpdate from '~/components/users/DialogCreateOrUpdate.vue'
import DialogDelete from '@/components/users/DialogDelete.vue'
import type { UserModel } from '@/interfaces/models/UserModel'
import UserService from '@/services/UserService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.users.index',
})
/* END  DEFINE */

/** START DEFINE STATE */
const users = ref<UserModel[]>([])
const isLoading = ref(false)
const selectedUser = ref<UserModel | null>(null)
const dialog = ref(false)
const dialogDelete = ref(false)
const editedItem = ref<UserModel | null>(null)
const sortBy = ref<Array<{ key: string; order: 'asc' | 'desc' }>>([
  { key: 'first_name', order: 'asc' },
])
const headers = ref([
  { title: 'Name', align: 'start' as const, key: 'full_name' },
  { title: 'Position', key: 'position' },
  { title: 'Email', key: 'email' },
  { title: 'Roles', key: 'roles', sortable: false },
  { title: 'Join Date', key: 'join_date' },
  { title: 'Status', key: 'is_activated' },
  { title: 'Actions', key: 'actions', sortable: false },
])
/* END DEFINE STATE */

/** START DEFINE METHOD */
const getUsers = async () => {
  if (isLoading.value) return
  try {
    isLoading.value = true
    users.value = await UserService.getAll()
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    isLoading.value = false
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

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  getUsers()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
