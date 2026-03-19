<template>
  <div>
    <v-data-table
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="permissions"
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
      v-if="!!permission"
      :item="permission"
      :dialog="dialogDelete"
      @confirm-delete="onConfirmDelete"
      @close-delete="onCloseDelete"
    />
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import DialogCreateOrUpdate from '~/components/permissions/DialogCreateOrUpdate.vue'
import DialogDelete from '@/components/permissions/DialogDelete.vue'
import type { PermissionModel } from '@/interfaces/models/PermissionModel'
import PermissionService from '@/services/PermissionService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.permissions.index',
})
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const permissions = ref<Array<PermissionModel>>([])
const isLoading = ref(false)
const permission = ref<PermissionModel | null>(null)
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

  { title: 'Key', key: 'key' },

  { title: 'Descriptions', key: 'descriptions' },

  { title: 'Actions', key: 'actions', sortable: false },
])
const editedIndex = ref(-1)
const editedItem = ref<PermissionModel | null>(null)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const onConfirm = async () => {
  try {
    onClose()
    await getPermissions()
  } catch (error) {
    console.error('Failed to add permission:', error)
  }
}

const add = () => {
  editedItem.value = null
  dialog.value = true
}

const editItem = (item: PermissionModel) => {
  editedIndex.value = permissions.value.indexOf(item)
  editedItem.value = { ...item }
  dialog.value = true
}

const onClose = () => {
  dialog.value = false

  nextTick(() => {
    editedIndex.value = -1
  })
}

const onConfirmDelete = async (item: PermissionModel) => {
  try {
    dialogDelete.value = false
    await nextTick()

    if (item.id) {
      await PermissionService.delete(item.id)
      await getPermissions()
      permission.value = null
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
    permission.value = null
  })
}

const deleteItem = async (item: any) => {
  permission.value = await { ...item }
  dialogDelete.value = true
}

const getPermissions = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    const data = await PermissionService.getAll()
    permissions.value = Object.values(data)

    setTimeout(() => {
      isLoading.value = false
    }, 1000)
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
  getPermissions()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
