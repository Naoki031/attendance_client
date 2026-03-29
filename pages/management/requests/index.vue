<template>
  <v-container class="pa-4" max-width="1200">
    <div class="text-h6 font-weight-bold text-primary mb-4">{{ $t('nav.requestHistory') }}</div>

    <!-- Filters -->
    <v-row class="mb-4" align="center">
      <v-col cols="6" sm="3" md="2">
        <v-select
          v-model="selectedMonth"
          :items="monthOptions"
          item-title="label"
          item-value="value"
          :label="$t('requests.filterByMonth')"
          variant="filled"
          rounded="lg"
          flat
          density="comfortable"
          hide-details
        />
      </v-col>
      <v-col cols="6" sm="3" md="2">
        <v-select
          v-model="selectedYear"
          :items="yearOptions"
          :label="$t('requests.filterByYear')"
          variant="filled"
          rounded="lg"
          flat
          density="comfortable"
          hide-details
        />
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-text-field
          v-model="searchUser"
          :label="$t('users.searchUser')"
          variant="filled"
          rounded="lg"
          flat
          density="comfortable"
          hide-details
          prepend-inner-icon="mdi-magnify"
          clearable
        />
      </v-col>
      <v-col cols="12" sm="6" md="4" class="d-flex align-center ga-2">
        <v-btn
          color="success"
          variant="tonal"
          rounded="lg"
          prepend-icon="mdi-microsoft-excel"
          :disabled="filteredRequests.length === 0"
          @click="exportExcel"
          >{{ $t('requests.exportExcel') }}</v-btn
        >
        <span class="text-caption text-medium-emphasis">{{ filteredRequests.length }} records</span>
      </v-col>
    </v-row>

    <!-- Status filter -->
    <v-btn-toggle v-model="statusFilter" rounded="lg" density="compact" class="mb-3">
      <v-btn value="">{{ $t('requestStatus.all') }}</v-btn>
      <v-btn value="pending">{{ $t('requestStatus.pending') }}</v-btn>
      <v-btn value="approved">{{ $t('requestStatus.approved') }}</v-btn>
      <v-btn value="rejected">{{ $t('requestStatus.rejected') }}</v-btn>
    </v-btn-toggle>

    <!-- Tabs per request type -->
    <v-tabs v-model="activeTab" color="primary" class="mb-2">
      <v-tab value="all">{{ $t('requestStatus.all') }}</v-tab>
      <v-tab value="wfh">{{ $t('requestType.wfh') }}</v-tab>
      <v-tab value="off">{{ $t('requestType.off') }}</v-tab>
      <v-tab value="overtime">{{ $t('requestType.overtime') }}</v-tab>
      <v-tab value="equipment">{{ $t('requestType.equipment') }}</v-tab>
      <v-tab value="clock_forget">{{ $t('requestType.clockForget') }}</v-tab>
    </v-tabs>

    <v-card rounded="xl" elevation="0" border class="table-responsive-card">
      <v-data-table
        :headers="tableHeaders"
        :items="filteredRequests"
        :items-per-page="50"
        density="comfortable"
      >
        <template #item.user="{ item }">
          {{ item.user?.full_name ?? '—' }}
        </template>
        <template #item.type="{ item }">
          <v-chip :color="typeColor(item.type)" size="x-small" variant="tonal">
            {{ typeLabel(item.type) }}
          </v-chip>
        </template>
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="x-small" variant="tonal">
            {{ item.status }}
          </v-chip>
        </template>
        <template #item.from_datetime="{ item }">
          {{ formatDatetime(item.from_datetime) }}
        </template>
        <template #item.to_datetime="{ item }">
          {{ formatDatetime(item.to_datetime) }}
        </template>
        <template #item.unit_hours="{ item }">
          {{ item.unit_hours ?? '—' }}
        </template>
        <template #item.actions="{ item }">
          <v-btn size="x-small" variant="tonal" color="info" rounded="lg" @click="openEdit(item)">
            {{ $t('common.edit') }}
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </v-container>

  <EmployeeRequestsDialogCreateRequest
    :type="dialogRequestType"
    :dialog="dialogOpen"
    :initial-data="dialogInitialData"
    :edit-item-id="dialogEditItemId"
    @confirm="handleDialogConfirm"
    @close-modal="dialogOpen = false"
  />
</template>

<script lang="ts" setup>
import * as XLSX from 'xlsx'
import EmployeeRequestService from '@/services/EmployeeRequestService'
import type {
  EmployeeRequestModel,
  EmployeeRequestType,
  EmployeeRequestStatus,
} from '@/interfaces/models/EmployeeRequestModel'

const { t } = useI18n()

const dialogOpen = ref(false)
const dialogRequestType = ref<EmployeeRequestType>('off')
const dialogInitialData = ref<EmployeeRequestModel | null>(null)
const dialogEditItemId = ref<number | null>(null)

const openEdit = (item: EmployeeRequestModel) => {
  dialogRequestType.value = item.type
  dialogInitialData.value = item
  dialogEditItemId.value = item.id
  dialogOpen.value = true
}

const handleDialogConfirm = async () => {
  dialogOpen.value = false

  try {
    allRequests.value = await EmployeeRequestService.getAll()
  } catch (error) {
    console.error('Failed to reload requests:', error)
  }
}

definePageMeta({ layout: 'default', name: 'admin.requests.index' })

const { moment, TIMEZONE } = useMoment()

const allRequests = ref<EmployeeRequestModel[]>([])
const activeTab = ref<string>('all')
const statusFilter = ref<string>('')
const selectedMonth = ref<number>(moment().tz(TIMEZONE).month() + 1)
const selectedYear = ref<number>(moment().tz(TIMEZONE).year())
const searchUser = ref<string>('')

const monthOptions = computed(() =>
  Array.from({ length: 12 }, (_, index) => ({
    label: t(`months.${index + 1}`),
    value: index + 1,
  })),
)

const currentYear = moment().tz(TIMEZONE).year()
const yearOptions = Array.from({ length: 5 }, (_, index) => currentYear - index)

const tableHeaders = computed(() => [
  { title: t('common.id'), key: 'id', sortable: true },
  { title: t('profile.fullName'), key: 'user', sortable: false },
  { title: t('common.type'), key: 'type', sortable: true },
  { title: t('common.status'), key: 'status', sortable: true },
  { title: t('common.from'), key: 'from_datetime', sortable: true },
  { title: t('common.to'), key: 'to_datetime', sortable: true },
  { title: t('common.hours'), key: 'unit_hours', sortable: true },
  { title: t('common.reason'), key: 'reason', sortable: false },
  { title: t('common.actions'), key: 'actions', sortable: false },
])

const filteredRequests = computed(() => {
  return allRequests.value.filter((request) => {
    const requestDate = request.from_datetime ?? request.forget_date ?? request.created_at
    if (!requestDate) return false
    const parsed = moment(requestDate.substring(0, 10), 'YYYY-MM-DD')
    if (parsed.month() + 1 !== selectedMonth.value || parsed.year() !== selectedYear.value)
      return false
    if (activeTab.value !== 'all' && request.type !== activeTab.value) return false
    if (statusFilter.value && request.status !== statusFilter.value) return false

    if (searchUser.value) {
      const search = searchUser.value.toLowerCase()
      const userName = (request.user?.full_name ?? '').toLowerCase()
      if (!userName.includes(search)) return false
    }

    return true
  })
})

const typeLabel = (type: EmployeeRequestType): string => {
  const labels: Record<EmployeeRequestType, string> = {
    wfh: t('requestType.wfh'),
    off: t('requestType.off'),
    overtime: t('requestType.overtime'),
    equipment: t('requestType.equipment'),
    clock_forget: t('requestType.clockForget'),
  }

  return labels[type] ?? type
}

const typeColor = (type: EmployeeRequestType): string => {
  const colors: Record<EmployeeRequestType, string> = {
    wfh: 'blue',
    off: 'green',
    overtime: 'red',
    equipment: 'orange',
    clock_forget: 'purple',
  }

  return colors[type] ?? 'grey'
}

const statusColor = (status: EmployeeRequestStatus): string => {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'

  return 'warning'
}

const formatDatetime = (datetime?: string): string => {
  if (!datetime) return '—'

  return datetime.substring(0, 16).replace('T', ' ')
}

const exportExcel = () => {
  const rows = filteredRequests.value.map((request) => ({
    User: request.user?.full_name ?? '—',
    Type: typeLabel(request.type),
    Status: request.status,
    From: formatDatetime(request.from_datetime),
    To: formatDatetime(request.to_datetime),
    Hours: request.unit_hours ?? '',
    Reason: request.reason ?? '',
    Note: request.note ?? '',
    'Forget Date': request.forget_date ?? '',
    'Equipment Name': request.equipment_name ?? '',
    Quantity: request.quantity ?? '',
    Location: request.location ?? '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Requests')
  const typeSuffix =
    activeTab.value === 'all' ? 'all' : typeLabel(activeTab.value as EmployeeRequestType)
  XLSX.writeFile(
    workbook,
    `requests-${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${typeSuffix}.xlsx`,
  )
}

onMounted(async () => {
  try {
    allRequests.value = await EmployeeRequestService.getAll()
  } catch (error) {
    console.error('Failed to load requests:', error)
  }
})
</script>
