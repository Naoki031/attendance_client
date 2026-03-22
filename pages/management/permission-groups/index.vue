<template>
  <v-container fluid class="py-6 px-6">
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">Permission Groups</div>
        <div class="text-body-2 text-medium-emphasis mt-1">Manage permission groups</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="add()">
        New Permission Group
      </v-btn>
    </div>

    <v-card rounded="xl" elevation="0" border>
      <v-data-table
        v-model:sort-by="sortBy"
        :headers="headers"
        :items="permissionGroups"
        :loading="isLoading"
        :hover="true"
      >
        <template #item.actions="{ item }">
          <div class="d-flex align-center ga-1">
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
      v-if="!!permissionGroup"
      :item="permissionGroup"
      :dialog="dialogDelete"
      @confirm-delete="onConfirmDelete"
      @close-delete="onCloseDelete"
    />
  </v-container>
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
  (newValue) => {
    if (!newValue) {
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
