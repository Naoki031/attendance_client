<template>
  <div>
    <v-data-table
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="companies"
      :loading="isLoading"
    >
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title>List Companies</v-toolbar-title>
          <v-divider class="mx-4" inset vertical></v-divider>
          <v-spacer></v-spacer>
          <v-btn rounded="xl" variant="tonal" color="success" @click="addCompany()">
            New Company
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
      v-if="!!company"
      :item="company"
      :dialog="dialogDelete"
      @confirm-delete="onConfirmDelete"
      @close-delete="onCloseDelete"
    />
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import DialogCreateOrUpdate from '@/components/companies/DialogCreateOrUpdate.vue'
import DialogDelete from '@/components/companies/DialogDelete.vue'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import CompanyService from '@/services/CompanyService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.companies.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const companies = ref<Array<CompanyModel>>([])
const isLoading = ref(false)
const company = ref<CompanyModel | null>(null)
const dialog = ref(false)
const dialogDelete = ref(false)
const sortBy = ref<Array<{ key: string; order: boolean | 'asc' | 'desc' | undefined }>>([
  { key: 'name', order: 'asc' },
])
const headers = ref<Array<object>>([
  { title: 'Name', align: 'start', key: 'name' },
  { title: 'Slug', key: 'slug' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone' },
  { title: 'Website', key: 'website' },
  { title: 'Actions', key: 'actions', sortable: false },
])
const editedIndex = ref(-1)
const editedItem = ref<CompanyModel | null>(null)
/* END DEFINE STATE */

/** START DEFINE METHOD */
const onConfirm = async () => {
  try {
    onClose()
    await getCompanies()
  } catch (error) {
    console.error('Failed to refresh companies:', error)
  }
}

const addCompany = () => {
  editedItem.value = null
  dialog.value = true
}

const editItem = (item: CompanyModel) => {
  editedIndex.value = companies.value.indexOf(item)
  editedItem.value = { ...item }
  dialog.value = true
}

const onClose = () => {
  dialog.value = false
  nextTick(() => {
    editedIndex.value = -1
  })
}

const onConfirmDelete = async (item: CompanyModel) => {
  try {
    dialogDelete.value = false
    await nextTick()

    if (item.id) {
      await CompanyService.delete(item.id)
      await getCompanies()
      company.value = null
    } else {
      console.error('Invalid item id:', item.id)
    }
  } catch (error) {
    console.error('Failed to delete company:', error)
  }
}

const onCloseDelete = () => {
  dialogDelete.value = false
  nextTick(() => {
    company.value = null
  })
}

const deleteItem = (item: CompanyModel) => {
  company.value = { ...item }
  dialogDelete.value = true
}

const getCompanies = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    const data = await CompanyService.getAll()
    companies.value = Object.values(data)
  } catch (error) {
    console.error('Failed to fetch companies:', error)
  } finally {
    isLoading.value = false
  }
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
  getCompanies()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
