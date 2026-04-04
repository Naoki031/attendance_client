<template>
  <v-container fluid class="py-6 px-6">
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">{{ $t('googleSheets.title') }}</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="addItem()">
        {{ $t('googleSheets.createConfig') }}
      </v-btn>
    </div>

    <!-- Table card -->
    <v-card rounded="xl" elevation="0" border class="table-responsive-card">
      <div class="d-flex align-center px-4 py-3 ga-2 border-b table-toolbar">
        <v-spacer></v-spacer>
        <span class="text-caption text-medium-emphasis">{{
          $t('googleSheets.configsCount', { count: items.length })
        }}</span>
      </div>

      <v-data-table
        :headers="headers"
        :items="items"
        :loading="isLoading"
        :hover="true"
        items-per-page="50"
      >
        <!-- Company -->
        <template #item.company="{ item }">
          <span>{{ item.company?.name ?? '—' }}</span>
        </template>

        <!-- Request Type -->
        <template #item.request_type="{ item }">
          <v-chip size="x-small" variant="tonal" color="primary">
            {{ item.request_type ?? 'all' }}
          </v-chip>
        </template>

        <!-- Spreadsheet ID masked for security -->
        <template #item.spreadsheet_id>
          <span class="text-caption text-medium-emphasis">••••••••••••••••</span>
        </template>

        <!-- Status badge -->
        <template #item.is_active="{ item }">
          <v-chip size="x-small" :color="item.is_active ? 'success' : 'default'" variant="tonal">
            {{ item.is_active ? $t('common.active') : $t('common.inactive') }}
          </v-chip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center ga-1">
            <v-btn
              size="x-small"
              variant="tonal"
              color="primary"
              rounded="lg"
              class="btn-shine"
              @click="editItem(item)"
            >
              <v-icon size="16">mdi-pencil-outline</v-icon>
              <v-tooltip activator="parent" location="top">{{ $t('common.edit') }}</v-tooltip>
            </v-btn>
            <v-btn
              size="x-small"
              variant="tonal"
              color="error"
              rounded="lg"
              class="btn-shine"
              @click="deleteItem(item)"
            >
              <v-icon size="16">mdi-delete-outline</v-icon>
              <v-tooltip activator="parent" location="top">{{ $t('common.delete') }}</v-tooltip>
            </v-btn>
          </div>
        </template>

        <template #loading>
          <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
        </template>
      </v-data-table>
    </v-card>

    <DialogCreateOrUpdateGoogleSheet
      v-if="dialog"
      :item="editedItem"
      :dialog="dialog"
      :companies="availableCompanies"
      @confirm="onConfirm"
      @close-modal="onClose"
    />

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="dialogDelete" max-width="400px" persistent>
      <v-card rounded="xl">
        <v-card-title class="text-h6 px-6 pt-6">{{ $t('googleSheets.deleteConfig') }}</v-card-title>
        <v-card-text class="px-6">
          {{ $t('googleSheets.deleteConfirm', { name: selectedItem?.company?.name }) }}
        </v-card-text>
        <div class="d-flex justify-end ga-3 px-6 py-4">
          <v-btn color="default" variant="text" rounded="lg" @click="onCloseDelete">{{
            $t('common.cancel')
          }}</v-btn>
          <v-btn
            color="error"
            variant="elevated"
            rounded="lg"
            :loading="isDeleting"
            @click="onConfirmDelete"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import DialogCreateOrUpdateGoogleSheet from '@/components/google_sheets/DialogCreateOrUpdate.vue'
import type { CompanyGoogleSheetModel } from '@/interfaces/models/CompanyGoogleSheetModel'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import CompanyGoogleSheetService from '@/services/CompanyGoogleSheetService'
import CompanyService from '@/services/CompanyService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.google-sheets.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const items = ref<CompanyGoogleSheetModel[]>([])
const availableCompanies = ref<CompanyModel[]>([])
const isLoading = ref<boolean>(false)
const isDeleting = ref<boolean>(false)
const dialog = ref<boolean>(false)
const dialogDelete = ref<boolean>(false)
const editedItem = ref<CompanyGoogleSheetModel | null>(null)
const selectedItem = ref<CompanyGoogleSheetModel | null>(null)

const { t } = useI18n()
const headers = computed(() => [
  { title: t('common.id'), key: 'id', sortable: true },
  { title: t('common.company'), key: 'company', sortable: false },
  { title: t('googleSheets.requestType'), key: 'request_type', sortable: false },
  { title: t('googleSheets.spreadsheetId'), key: 'spreadsheet_id', sortable: false },
  { title: t('googleSheets.sheetName'), key: 'sheet_name', sortable: false },
  { title: t('common.status'), key: 'is_active', sortable: false },
  { title: t('common.actions'), key: 'actions', sortable: false },
])
/* END DEFINE STATE */

/** START DEFINE METHOD */
const getItems = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    items.value = Object.values(await CompanyGoogleSheetService.getAll())
  } catch (error) {
    console.error('Failed to fetch google sheet configs:', error)
  } finally {
    isLoading.value = false
  }
}

const addItem = () => {
  editedItem.value = null
  dialog.value = true
}

const editItem = (item: CompanyGoogleSheetModel) => {
  editedItem.value = { ...item }
  dialog.value = true
}

const onConfirm = async () => {
  onClose()
  await getItems()
}

const onClose = () => {
  dialog.value = false
  nextTick(() => {
    editedItem.value = null
  })
}

const deleteItem = (item: CompanyGoogleSheetModel) => {
  selectedItem.value = { ...item }
  dialogDelete.value = true
}

const onConfirmDelete = async () => {
  if (!selectedItem.value?.id) return
  isDeleting.value = true

  try {
    await CompanyGoogleSheetService.delete(selectedItem.value.id)
    dialogDelete.value = false
    selectedItem.value = null
    await getItems()
  } catch (error) {
    console.error('Failed to delete google sheet config:', error)
  } finally {
    isDeleting.value = false
  }
}

const onCloseDelete = () => {
  dialogDelete.value = false
  nextTick(() => {
    selectedItem.value = null
  })
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(async () => {
  const companies = await CompanyService.getAll()
  availableCompanies.value = Object.values(companies)
  await getItems()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.table-toolbar {
  background-color: var(--color-table-toolbar);
}
</style>
