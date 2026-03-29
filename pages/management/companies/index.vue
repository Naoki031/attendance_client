<template>
  <v-container fluid class="py-6 px-6">
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">{{ $t('companies.title') }}</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="addCompany()">
        {{ $t('companies.createCompany') }}
      </v-btn>
    </div>

    <v-card rounded="xl" elevation="0" border class="table-responsive-card">
      <!-- Toolbar -->
      <div class="d-flex align-center px-4 py-3 ga-2 border-b table-toolbar">
        <v-btn
          :color="isFilterActive ? 'primary' : undefined"
          :variant="isFilterActive ? 'tonal' : 'text'"
          prepend-icon="mdi-filter-outline"
          size="small"
          @click="filterExpanded = !filterExpanded"
        >
          {{ $t('common.filter') }}
          <v-badge
            v-if="activeFilterCount > 0"
            :content="activeFilterCount"
            color="primary"
            floating
          ></v-badge>
        </v-btn>
        <v-spacer></v-spacer>
        <span class="text-caption text-medium-emphasis">{{ companies.length }} records</span>
      </div>

      <!-- Filter panel -->
      <FilterPanel
        v-model="filters"
        :expanded="filterExpanded"
        :search-label="$t('common.search')"
        :fields="filterFields"
        @reset="resetFilters"
      />

      <v-data-table
        v-model:sort-by="sortBy"
        :headers="headers"
        :items="companies"
        :loading="isLoading"
        :hover="true"
        items-per-page="50"
      >
        <template #item.actions="{ item }">
          <div class="d-flex align-center ga-1">
            <v-btn icon size="x-small" variant="text" color="primary" @click="editItem(item)">
              <v-icon size="16">mdi-pencil-outline</v-icon>
              <v-tooltip activator="parent" location="top">{{ $t('common.edit') }}</v-tooltip>
            </v-btn>
            <v-btn
              icon
              size="x-small"
              variant="text"
              color="teal"
              @click="openManageApprovers(item)"
            >
              <v-icon size="16">mdi-account-check-outline</v-icon>
              <v-tooltip activator="parent" location="top">{{
                $t('companies.manageApprovers')
              }}</v-tooltip>
            </v-btn>
            <v-btn icon size="x-small" variant="text" color="error" @click="deleteItem(item)">
              <v-icon size="16">mdi-delete-outline</v-icon>
              <v-tooltip activator="parent" location="top">{{ $t('common.delete') }}</v-tooltip>
            </v-btn>
          </div>
        </template>
        <!-- Allowed IPs -->
        <template #item.allowed_ips="{ item }">
          <div v-if="item.allowed_ips" class="d-flex flex-wrap ga-1 py-1">
            <v-chip
              v-for="ipEntry in item.allowed_ips.split(',')"
              :key="ipEntry"
              size="x-small"
              variant="tonal"
              color="blue-grey"
            >
              {{ ipEntry.trim() }}
            </v-chip>
          </div>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>

        <!-- Work Schedule -->
        <template #item.work_schedule="{ item }">
          <div v-if="item.work_start_time && item.work_end_time" class="d-flex align-center ga-1">
            <v-icon size="14" color="teal">mdi-clock-time-eight-outline</v-icon>
            <span class="text-body-2">{{ item.work_start_time }} – {{ item.work_end_time }}</span>
          </div>
          <span v-else class="text-caption text-medium-emphasis">—</span>
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

    <DialogManageApprovers
      v-if="dialogApprovers"
      :item="approverCompany"
      :dialog="dialogApprovers"
      @confirm="onConfirmApprovers"
      @close-modal="onCloseApprovers"
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
import FilterPanel from '@/components/common/FilterPanel.vue'
import type { FilterFieldConfig } from '@/components/common/FilterPanel.vue'
import DialogCreateOrUpdate from '@/components/companies/DialogCreateOrUpdate.vue'
import DialogDelete from '@/components/companies/DialogDelete.vue'
import DialogManageApprovers from '@/components/companies/DialogManageApprovers.vue'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import type { CountryModel } from '@/interfaces/models/CountryModel'
import type { CityModel } from '@/interfaces/models/CityModel'
import CompanyService from '@/services/CompanyService'
import CountryService from '@/services/CountryService'
import CityService from '@/services/CityService'
/* END IMPORT */

const { t } = useI18n()

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
const dialogApprovers = ref(false)
const approverCompany = ref<CompanyModel | null>(null)
const sortBy = ref<Array<{ key: string; order: boolean | 'asc' | 'desc' | undefined }>>([
  { key: 'name', order: 'asc' },
])
const headers = computed(() => [
  { title: t('common.id'), key: 'id', sortable: true },
  { title: t('common.name'), align: 'start' as const, key: 'name' },
  { title: t('common.slug'), key: 'slug' },
  { title: t('profile.email'), key: 'email' },
  { title: t('common.phone'), key: 'phone' },
  { title: t('common.website'), key: 'website' },
  { title: t('companies.allowedIps'), key: 'allowed_ips', sortable: false },
  { title: t('common.workSchedule'), key: 'work_schedule', sortable: false },
  { title: t('common.actions'), key: 'actions', sortable: false },
])
const editedIndex = ref(-1)
const editedItem = ref<CompanyModel | null>(null)

// Filter state
const filterExpanded = ref(false)
const filters = ref({
  search: '',
  countryId: null as number | null,
  cityId: null as number | null,
})
const availableCountries = ref<CountryModel[]>([])
const availableCities = ref<CityModel[]>([])

let filterDebounceTimer: ReturnType<typeof setTimeout> | null = null

const filterFields = computed<FilterFieldConfig[]>(() => [
  {
    key: 'countryId',
    label: t('cities.country'),
    type: 'autocomplete',
    items: availableCountries.value as unknown as Array<Record<string, unknown>>,
    itemTitle: 'name',
    itemValue: 'id',
  },
  {
    key: 'cityId',
    label: t('companies.city'),
    type: 'autocomplete',
    items: availableCities.value as unknown as Array<Record<string, unknown>>,
    itemTitle: 'name',
    itemValue: 'id',
  },
])

const activeFilterCount = computed(() => {
  const filterValues = filters.value
  return [filterValues.search, filterValues.countryId, filterValues.cityId].filter(
    (filterValue) => filterValue !== '' && filterValue !== null,
  ).length
})

const isFilterActive = computed(() => activeFilterCount.value > 0)
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

const openManageApprovers = (item: CompanyModel) => {
  approverCompany.value = { ...item }
  dialogApprovers.value = true
}

const onConfirmApprovers = () => {
  onCloseApprovers()
}

const onCloseApprovers = () => {
  dialogApprovers.value = false
  nextTick(() => {
    approverCompany.value = null
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
    const filterValues = filters.value
    const hasFilter = filterValues.search || filterValues.countryId || filterValues.cityId

    if (hasFilter) {
      companies.value = await CompanyService.filter({
        search: filterValues.search || undefined,
        countryId: filterValues.countryId,
        cityId: filterValues.cityId,
      })
    } else {
      const data = await CompanyService.getAll()
      companies.value = Object.values(data)
    }
  } catch (error) {
    console.error('Failed to fetch companies:', error)
  } finally {
    isLoading.value = false
  }
}

const resetFilters = () => {
  filters.value = { search: '', countryId: null, cityId: null }
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

watch(
  filters,
  () => {
    if (filterDebounceTimer) clearTimeout(filterDebounceTimer)
    filterDebounceTimer = setTimeout(() => {
      getCompanies()
    }, 300)
  },
  { deep: true },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(async () => {
  const [countries, cities] = await Promise.all([CountryService.getAll(), CityService.getAll()])
  availableCountries.value = Object.values(countries)
  availableCities.value = Object.values(cities)
  getCompanies()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.table-toolbar {
  background-color: #f5ede4;
}
</style>
