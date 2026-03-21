<template>
  <div>
    <v-data-table
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="departments"
      :loading="isLoading"
    >
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title>List Departments</v-toolbar-title>
          <v-divider class="mx-4" inset vertical></v-divider>
          <v-spacer></v-spacer>
          <v-btn rounded="xl" variant="tonal" color="success" @click="addDepartment()">
            New Department
          </v-btn>
        </v-toolbar>
      </template>

      <template #item.actions="{ item }">
        <v-btn
          icon
          variant="text"
          size="small"
          color="primary"
          :to="`/management/departments/${item.id}/users`"
        >
          <v-icon>mdi-account-group</v-icon>
          <v-tooltip activator="parent">Manage Users</v-tooltip>
        </v-btn>
        <v-icon class="me-2" small @click="editItem(item)">mdi-pencil</v-icon>
        <v-icon small @click="deleteItem(item)">mdi-delete</v-icon>
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
      v-if="!!deletedItem"
      :item="deletedItem"
      :dialog="dialogDelete"
      @confirm-delete="onConfirmDelete"
      @close-delete="onCloseDelete"
    />
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import DialogCreateOrUpdate from '~/components/departments/DialogCreateOrUpdate.vue'
import DialogDelete from '@/components/departments/DialogDelete.vue'
import type { DepartmentModel } from '@/interfaces/models/DepartmentModel'
import DepartmentService from '@/services/DepartmentService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.departments.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const departments = ref<Array<DepartmentModel>>([])
const isLoading = ref(false)
const deletedItem = ref<DepartmentModel | null>(null)
const dialog = ref(false)
const dialogDelete = ref(false)
const sortBy = ref<Array<{ key: string; order: boolean | 'asc' | 'desc' | undefined }>>([
  { key: 'name', order: 'asc' },
])
const headers = ref<Array<object>>([
  { title: 'Name', align: 'start', key: 'name' },
  { title: 'Slug', key: 'slug' },
  { title: 'Descriptions', key: 'descriptions' },
  { title: 'Actions', key: 'actions', sortable: false },
])
const editedIndex = ref(-1)
const editedItem = ref<DepartmentModel | null>(null)
/* END DEFINE STATE */

/** START DEFINE METHOD */
const getDepartments = async () => {
  if (isLoading.value) return
  try {
    isLoading.value = true
    const data = await DepartmentService.getAll()
    departments.value = Object.values(data)
  } catch (error) {
    console.error('Failed to fetch departments:', error)
  } finally {
    isLoading.value = false
  }
}

const addDepartment = () => {
  editedItem.value = null
  dialog.value = true
}

const editItem = (item: DepartmentModel) => {
  editedIndex.value = departments.value.indexOf(item)
  editedItem.value = { ...item }
  dialog.value = true
}

const onConfirm = async () => {
  try {
    onClose()
    await getDepartments()
  } catch (error) {
    console.error('Failed to save department:', error)
  }
}

const onClose = () => {
  dialog.value = false
  nextTick(() => {
    editedIndex.value = -1
  })
}

const deleteItem = (item: DepartmentModel) => {
  deletedItem.value = { ...item }
  dialogDelete.value = true
}

const onConfirmDelete = async (item: DepartmentModel) => {
  try {
    dialogDelete.value = false
    await nextTick()
    if (item.id) {
      await DepartmentService.delete(item.id)
      await getDepartments()
      deletedItem.value = null
    }
  } catch (error) {
    console.error('Failed to delete department:', error)
  }
}

const onCloseDelete = () => {
  dialogDelete.value = false
  nextTick(() => {
    deletedItem.value = null
  })
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => dialog,
  (newValue) => {
    if (!newValue) onClose()
  },
  { immediate: false },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  getDepartments()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
