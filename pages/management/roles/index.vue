<template>
  <div>
    <v-data-table v-model:sort-by="sortBy" :headers="headers" :items="roles" :loading="isLoading">
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title>List roles</v-toolbar-title>
          <v-divider class="mx-4" inset vertical></v-divider>
          <v-spacer></v-spacer>
          <v-btn rounded="xl" variant="tonal" color="success" @click="addRole()"> New Role </v-btn>
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
      v-if="!!role"
      :item="role"
      :dialog="dialogDelete"
      @confirm-delete="onConfirmDelete"
      @close-delete="onCloseDelete"
    />
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import { ref, watch, onMounted, nextTick } from 'vue'
import DialogCreateOrUpdate from '~/components/roles/DialogCreateOrUpdate.vue'
import DialogDelete from '@/components/roles/DialogDelete.vue'
import type { RoleModel } from '@/interfaces/models/RoleModel'
import RoleService from '@/services/RoleService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.roles.index',
})
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const roles = ref<Array<RoleModel>>([])
const isLoading = ref(false)
const role = ref<RoleModel | null>(null)
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
const editedItem = ref<RoleModel | null>(null)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const onConfirm = async () => {
  try {
    onClose()
    await getRoles()
  } catch (error) {
    console.error('Failed to add role:', error)
  }
}

const addRole = () => {
  editedItem.value = null
  dialog.value = true
}

const editItem = (item: RoleModel) => {
  editedIndex.value = roles.value.indexOf(item)
  editedItem.value = { ...item }
  dialog.value = true
}

const onClose = () => {
  dialog.value = false

  nextTick(() => {
    editedIndex.value = -1
  })
}

const onConfirmDelete = async (item: RoleModel) => {
  try {
    dialogDelete.value = false
    await nextTick()

    if (item.id) {
      await RoleService.delete(item.id)
      await getRoles()
      role.value = null
    } else {
      console.error('Invalid item id:', item.id)
    }
  } catch (error) {
    console.error('Failed to delete role:', error)
  }
}

const onCloseDelete = () => {
  dialogDelete.value = false

  nextTick(() => {
    role.value = null
  })
}

const deleteItem = async (item: any) => {
  role.value = await { ...item }
  dialogDelete.value = true
}

const getRoles = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    const data = await RoleService.getAll()
    roles.value = Object.values(data)

    setTimeout(() => {
      isLoading.value = false
    }, 1000)
  } catch (error) {
    console.error('Failed to fetch roles:', error)
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
  getRoles()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
