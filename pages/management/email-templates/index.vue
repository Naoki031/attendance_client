<template>
  <v-container fluid class="py-6 px-6">
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">{{ $t('emailTemplates.title') }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ $t('emailTemplates.pageDescription') }}
        </div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="addItem()">
        {{ $t('emailTemplates.createTemplate') }}
      </v-btn>
    </div>

    <v-card rounded="xl" elevation="0" border class="table-responsive-card">
      <!-- Toolbar with filters -->
      <div class="d-flex align-center px-4 py-3 ga-2 border-b table-toolbar">
        <v-select
          v-model="filterCompany"
          :items="companyFilterItems"
          item-title="title"
          item-value="value"
          density="compact"
          variant="filled"
          :label="$t('emailTemplates.filterCompany')"
          hide-details
          clearable
          style="max-width: 220px"
          rounded="lg"
        />
        <v-select
          v-model="filterKey"
          :items="keyFilterItems"
          density="compact"
          variant="filled"
          :label="$t('emailTemplates.filterKey')"
          hide-details
          clearable
          style="max-width: 260px"
          rounded="lg"
        />
        <v-spacer />
        <span class="text-caption text-medium-emphasis">{{ filteredItems.length }} records</span>
      </div>

      <v-data-table
        v-model:sort-by="sortBy"
        :headers="headers"
        :items="filteredItems"
        :loading="isLoading"
        :hover="true"
        expand-on-click
        items-per-page="50"
      >
        <template #item.key="{ item }">
          <code class="text-body-2">{{ item.key }}</code>
        </template>

        <template #item.company="{ item }">
          <v-chip :color="item.company?.name ? 'primary' : 'default'" variant="tonal" size="small">
            {{ item.company?.name ?? $t('emailTemplates.globalTemplate') }}
          </v-chip>
        </template>

        <template #item.subject="{ item }">
          <div class="text-truncate" style="max-width: 260px">
            {{ item.subject }}
          </div>
        </template>

        <template #item.is_system="{ item }">
          <v-chip :color="item.is_system ? 'info' : 'default'" variant="tonal" size="small">
            {{ item.is_system ? $t('emailTemplates.system') : $t('emailTemplates.custom') }}
          </v-chip>
        </template>

        <template #expanded-row="{ item }">
          <tr>
            <td :colspan="headers.length" class="pa-0">
              <div class="pa-4 bg-grey-lighten-4">
                <div class="text-caption text-medium-emphasis mb-1">
                  {{ $t('emailTemplates.subject') }}
                </div>
                <div class="text-body-2 font-weight-medium mb-3">
                  {{ item.subject }}
                </div>
                <v-divider class="mb-3" />
                <div class="text-caption text-medium-emphasis mb-1">
                  {{ $t('emailTemplates.bodyHtml') }}
                </div>
                <div class="text-body-2" v-html="sanitizeHtml(item.body_html)" />
              </div>
            </td>
          </tr>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center ga-1">
            <v-btn
              size="x-small"
              variant="tonal"
              color="primary"
              rounded="lg"
              @click.stop="editItem(item)"
            >
              <v-icon size="16">mdi-pencil-outline</v-icon>
              <v-tooltip activator="parent" location="top">{{ $t('common.edit') }}</v-tooltip>
            </v-btn>
            <v-btn
              v-if="!item.is_system"
              size="x-small"
              variant="tonal"
              color="error"
              rounded="lg"
              @click.stop="deleteItem(item)"
            >
              <v-icon size="16">mdi-delete-outline</v-icon>
              <v-tooltip activator="parent" location="top">{{ $t('common.delete') }}</v-tooltip>
            </v-btn>
          </div>
        </template>

        <template #loading>
          <v-skeleton-loader type="table-row@10" />
        </template>
      </v-data-table>
    </v-card>

    <DialogCreateOrUpdate
      v-if="dialog"
      :item="editedItem"
      :dialog="dialog"
      :existing-templates="items"
      @confirm="onConfirm"
      @close-modal="onClose"
    />

    <DialogDelete
      v-if="!!entityToDelete"
      :item="entityToDelete"
      :dialog="dialogDelete"
      @confirm-delete="onConfirmDelete"
      @close-delete="onCloseDelete"
    />
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import DOMPurify from 'dompurify'
import DialogCreateOrUpdate from '~/components/email-template/DialogCreateOrUpdate.vue'
import DialogDelete from '~/components/email-template/DialogDelete.vue'
import type { EmailTemplateModel } from '@/interfaces/models/EmailTemplateModel'
import EmailTemplateService from '@/services/EmailTemplateService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.email-templates.index',
})
/* END DEFINE NAME COMPONENT */

/** START DEFINE STATE */
const { t } = useI18n()

const items = ref<Array<EmailTemplateModel>>([])
const isLoading = ref(false)
const dialog = ref(false)
const dialogDelete = ref(false)
const editedItem = ref<EmailTemplateModel | null>(null)
const entityToDelete = ref<EmailTemplateModel | null>(null)
const filterCompany = ref<number | null>(null)
const filterKey = ref<string | null>(null)
const sortBy = ref<Array<{ key: string; order: boolean | 'asc' | 'desc' | undefined }>>([
  { key: 'id', order: 'asc' },
])

const headers = computed(() => [
  { title: t('common.id'), key: 'id', sortable: true, width: '60px' },
  { title: t('emailTemplates.key'), key: 'key', sortable: true, minWidth: '180px' },
  { title: t('emailTemplates.company'), key: 'company', sortable: false, width: '160px' },
  { title: t('emailTemplates.subject'), key: 'subject', sortable: false, minWidth: '200px' },
  { title: t('emailTemplates.type'), key: 'is_system', sortable: true, width: '100px' },
  { title: t('common.actions'), key: 'actions', sortable: false, width: '120px', align: 'end' },
])

const companyFilterItems = computed(() => {
  const companies = new Map<number, string>()
  for (const item of items.value) {
    if (item.company?.id && item.company.name) {
      companies.set(item.company.id, item.company.name)
    }
  }
  return Array.from(companies.entries()).map(([companyId, name]) => ({
    title: name,
    value: companyId,
  }))
})

const keyFilterItems = computed(() => {
  const keys = new Set<string>()
  for (const item of items.value) {
    if (item.key) keys.add(item.key)
  }
  return Array.from(keys).sort()
})

const filteredItems = computed(() => {
  let result = items.value
  if (filterCompany.value !== null) {
    result = result.filter(
      (item) => item.company_id === filterCompany.value || item.company_id === null,
    )
  }
  if (filterKey.value !== null) {
    result = result.filter((item) => item.key === filterKey.value)
  }
  return result
})
/* END DEFINE STATE */

/** START DEFINE METHOD */
const sanitizeHtml = (html: string | undefined | null): string => {
  if (!html) return ''
  return DOMPurify.sanitize(html)
}

const fetchData = async () => {
  if (isLoading.value) return
  try {
    isLoading.value = true
    const data = await EmailTemplateService.getAll()
    items.value = Array.isArray(data) ? data : Object.values(data)
  } catch (error) {
    console.error('Failed to fetch email templates:', error)
  } finally {
    isLoading.value = false
  }
}

const addItem = () => {
  editedItem.value = null
  dialog.value = true
}

const editItem = (item: EmailTemplateModel) => {
  editedItem.value = { ...item }
  dialog.value = true
}

const onConfirm = async () => {
  onClose()
  await fetchData()
}

const onClose = () => {
  dialog.value = false
  nextTick(() => {
    editedItem.value = null
  })
}

const deleteItem = (item: EmailTemplateModel) => {
  entityToDelete.value = { ...item }
  dialogDelete.value = true
}

const onConfirmDelete = async (item: EmailTemplateModel) => {
  try {
    dialogDelete.value = false
    await nextTick()
    if (item.id) {
      await EmailTemplateService.delete(item.id)
      await fetchData()
      entityToDelete.value = null
    }
  } catch (error) {
    console.error('Failed to delete email template:', error)
  }
}

const onCloseDelete = () => {
  dialogDelete.value = false
  nextTick(() => {
    entityToDelete.value = null
  })
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  fetchData()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.table-toolbar {
  background-color: var(--color-table-toolbar);
}
</style>
