<template>
  <v-container fluid class="py-6 px-6">
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">Departments</div>
        <div class="text-body-2 text-medium-emphasis mt-1">Manage company departments</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="addDepartment()">
        New Department
      </v-btn>
    </div>

    <!-- Table card -->
    <v-card rounded="xl" elevation="0" border>
      <v-data-table
        v-model:sort-by="sortBy"
        :headers="headers"
        :items="departments"
        :loading="isLoading"
        :hover="true"
      >
        <template #item.actions="{ item }">
          <div class="d-flex align-center ga-1">
            <v-btn
              icon
              size="x-small"
              variant="text"
              color="primary"
              :to="`/management/departments/${item.id}/users`"
            >
              <v-icon size="16">mdi-account-group</v-icon>
              <v-tooltip activator="parent" location="top">Manage Users</v-tooltip>
            </v-btn>
            <v-btn icon size="x-small" variant="text" color="primary" @click="editItem(item)">
              <v-icon size="16">mdi-pencil-outline</v-icon>
              <v-tooltip activator="parent" location="top">Edit</v-tooltip>
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
      v-if="!!deletedItem"
      :item="deletedItem"
      :dialog="dialogDelete"
      @confirm-delete="onConfirmDelete"
      @close-delete="onCloseDelete"
    />
  </v-container>
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
