<template>
  <v-container fluid class="py-6 px-6">
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">Companies</div>
        <div class="text-body-2 text-medium-emphasis mt-1">Manage company records</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="addCompany()">
        New Company
      </v-btn>
    </div>

    <v-card rounded="xl" elevation="0" border>
      <v-data-table
        v-model:sort-by="sortBy"
        :headers="headers"
        :items="companies"
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
      v-if="!!company"
      :item="company"
      :dialog="dialogDelete"
      @confirm-delete="onConfirmDelete"
      @close-delete="onCloseDelete"
    />
  </v-container>
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
