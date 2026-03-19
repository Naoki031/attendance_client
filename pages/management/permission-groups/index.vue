<template>
  <div>
    <v-data-table
      :sort-by.sync="sortBy"
      :headers="headers"
      :items="permissionGroups"
      :loading="isLoading"
    >
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title>List Permissions</v-toolbar-title>
          <v-divider class="mx-4" inset vertical></v-divider>
          <v-spacer></v-spacer>
          <v-btn rounded="xl" variant="tonal" color="success" @click="add()">
            New Permission
          </v-btn>
        </v-toolbar>
      </template>
      <template #item.actions="{ item }">
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
      v-if="!!permissionGroup"
      :item="permissionGroup"
      :dialog="dialogDelete"
      @confirm-delete="onConfirmDelete"
      @close-delete="onCloseDelete"
    />
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import DialogCreateOrUpdate from '@/components/permission_groups/DialogCreateOrUpdate.vue'
import DialogDelete from '@/components/permission_groups/DialogDelete.vue'
import type { PermissionGroupModel } from '~/interfaces/models/PermissionGroupModel'
import PermissionGroupService from '@/services/PermissionGroupService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.permission_groups.index',
})
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const permissionGroups = ref<Array<PermissionGroupModel>>([])
const isLoading = ref(false)
const permissionGroup = ref<PermissionGroupModel | null>(null)
const dialog = ref(false)
const dialogDelete = ref(false)
const sortBy = ref<Array<{ key: string; order: boolean | 'asc' | 'desc' | undefined }>>([
  { key: 'name', order: 'asc' },
])
const headers = ref<Array<object>>([
  {
    title: 'Name',
    align: 'start',
    key: 'name',
  },

  { title: 'permissions', key: 'permissions' },

  { title: 'Descriptions', key: 'descriptions' },

  { title: 'Actions', key: 'actions', sortable: false },
])
const editedIndex = ref(-1)
const editedItem = ref<PermissionGroupModel | null>(null)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const onConfirm = async () => {
  try {
    onClose()
    await getPermissionGroups()
  } catch (error) {
    console.error('Failed to add permission:', error)
  }
}

const add = () => {
  editedItem.value = null
  dialog.value = true
}

const editItem = (item: PermissionGroupModel) => {
  editedIndex.value = permissionGroups.value.indexOf(item)
  editedItem.value = { ...item }
  dialog.value = true
}

const onClose = () => {
  dialog.value = false

  nextTick(() => {
    editedIndex.value = -1
  })
}

const onConfirmDelete = async (item: PermissionGroupModel) => {
  try {
    dialogDelete.value = false
    await nextTick()

    if (item.id) {
      await PermissionGroupService.delete(item.id)
      await getPermissionGroups()
      permissionGroup.value = null
    } else {
      console.error('Invalid item id:', item.id)
    }
  } catch (error) {
    console.error('Failed to delete permission:', error)
  }
}

const onCloseDelete = () => {
  dialogDelete.value = false

  nextTick(() => {
    permissionGroup.value = null
  })
}

const deleteItem = async (item: any) => {
  permissionGroup.value = await { ...item }
  dialogDelete.value = true
}

const getPermissionGroups = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    const data = await PermissionGroupService.getAll()
    permissionGroups.value = Object.values(data)

    setTimeout(() => {
      isLoading.value = false
    }, 500)
  } catch (error) {
    console.error('Failed to fetch permissions:', error)
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => dialog,
  (val) => {
    if (!val) {
      close()
    }
  },
  { immediate: false },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  getPermissionGroups()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
