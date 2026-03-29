<template>
  <v-container fluid class="py-6 px-6">
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="d-flex align-center">
          <div class="text-h5 font-weight-bold">{{ $t('approvals.title') }}</div>
          <v-chip
            v-if="pendingCount > 0"
            :text="pendingCount"
            color="error"
            size="x-small"
            class="ms-2"
            density="comfortable"
          ></v-chip>
        </div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ $t('approvals.reviewSubtitle') }}
        </div>
      </div>
      <!-- Status filter tabs -->
      <div class="d-flex align-center ga-2">
        <v-select
          v-model="selectedMonth"
          :items="monthOptions"
          item-title="label"
          item-value="value"
          :label="$t('requests.filterByMonth')"
          variant="filled"
          rounded="lg"
          flat
          density="compact"
          hide-details
          style="min-width: 140px"
        />
        <v-select
          v-model="selectedYear"
          :items="yearOptions"
          :label="$t('requests.filterByYear')"
          variant="filled"
          rounded="lg"
          flat
          density="compact"
          hide-details
          style="min-width: 100px"
        />
        <v-btn-toggle v-model="statusFilter" rounded="lg" density="compact" mandatory>
          <v-btn value="" size="small">{{ $t('requestStatus.all') }}</v-btn>
          <v-btn value="pending" size="small">{{ $t('requestStatus.pending') }}</v-btn>
          <v-btn value="approved" size="small">{{ $t('requestStatus.approved') }}</v-btn>
          <v-btn value="rejected" size="small">{{ $t('requestStatus.rejected') }}</v-btn>
        </v-btn-toggle>
      </div>
    </div>

    <v-card rounded="xl" elevation="0" border class="table-responsive-card">
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
        <span class="text-caption text-medium-emphasis">{{ filteredItems.length }} requests</span>
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
        :headers="headers"
        :items="filteredItems"
        :loading="isLoading"
        :hover="true"
        items-per-page="50"
      >
        <!-- Employee -->
        <template #item.user="{ item }">
          <div class="d-flex align-center ga-2 py-1">
            <v-avatar size="28" color="primary" rounded="lg">
              <span class="text-caption text-white font-weight-bold">{{
                getInitials(item.user?.full_name)
              }}</span>
            </v-avatar>
            <span class="font-weight-medium text-body-2">{{ item.user?.full_name ?? '—' }}</span>
          </div>
        </template>

        <!-- Type -->
        <template #item.type="{ item }">
          <v-chip size="x-small" :color="typeColor(item.type)" variant="tonal">
            {{ typeLabel(item.type) }}
          </v-chip>
        </template>

        <!-- Status -->
        <template #item.status="{ item }">
          <div class="d-flex align-center ga-2">
            <span class="status-dot" :class="`status-dot--${item.status}`"></span>
            <span class="text-body-2 text-capitalize">{{ item.status }}</span>
          </div>
        </template>

        <!-- Date range -->
        <template #item.date_range="{ item }">
          <span v-if="item.type === 'clock_forget'" class="text-caption">
            {{ formatDate(item.forget_date) }}
          </span>
          <span v-else class="text-caption">
            {{ formatDatetime(item.from_datetime) }} – {{ formatDatetime(item.to_datetime) }}
          </span>
        </template>

        <!-- Approver -->
        <template #item.approver="{ item }">
          <span class="text-body-2">{{ item.approver?.full_name ?? '—' }}</span>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center ga-1">
            <v-btn
              v-if="item.status === 'pending' && canApproveRequests"
              size="x-small"
              variant="tonal"
              color="success"
              rounded="lg"
              class="btn-shine"
              @click="openApprove(item, 'approved')"
            >
              {{ $t('common.approve') }}
            </v-btn>
            <v-btn
              v-if="item.status === 'pending' && canApproveRequests"
              size="x-small"
              variant="tonal"
              color="error"
              rounded="lg"
              class="btn-shine"
              @click="openApprove(item, 'rejected')"
            >
              {{ $t('common.reject') }}
            </v-btn>
            <v-btn
              size="x-small"
              variant="tonal"
              color="primary"
              rounded="lg"
              class="btn-shine"
              @click="openEdit(item)"
            >
              {{ $t('common.edit') }}
            </v-btn>
          </div>
        </template>

        <template #loading>
          <v-skeleton-loader type="table-row@8"></v-skeleton-loader>
        </template>
      </v-data-table>
    </v-card>

    <!-- Edit request dialog -->
    <EmployeeRequestsDialogCreateRequest
      :type="dialogRequestType"
      :dialog="dialogEditOpen"
      :initial-data="dialogInitialData"
      :edit-item-id="dialogEditItemId"
      @confirm="handleEditConfirm"
      @close-modal="dialogEditOpen = false"
    />

    <!-- Confirm approve/reject dialog -->
    <v-dialog v-model="dialogApprove" max-width="440px">
      <v-card rounded="xl" elevation="2" class="pa-6">
        <div class="text-h6 font-weight-bold mb-2">
          {{
            pendingAction === 'approved'
              ? $t('approvals.approveTitle')
              : $t('approvals.rejectTitle')
          }}
        </div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          {{ $t('approvals.requestBy') }} <strong>{{ selectedRequest?.user?.full_name }}</strong> —
          {{ typeLabel(selectedRequest?.type) }}
        </div>
        <div class="field-label">{{ $t('approvals.noteOptional') }}</div>
        <v-textarea
          v-model="approvalNote"
          variant="filled"
          rounded="lg"
          flat
          density="comfortable"
          rows="2"
          no-resize
        ></v-textarea>
        <div class="d-flex justify-end ga-3 mt-2">
          <v-btn variant="text" color="default" rounded="lg" @click="dialogApprove = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            :color="pendingAction === 'approved' ? 'success' : 'error'"
            variant="elevated"
            rounded="lg"
            :loading="isApproving"
            @click="submitApproval"
          >
            {{ pendingAction === 'approved' ? $t('common.approve') : $t('common.reject') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import FilterPanel from '@/components/common/FilterPanel.vue'
import type { FilterFieldConfig } from '@/components/common/FilterPanel.vue'
import type {
  EmployeeRequestModel,
  EmployeeRequestType,
} from '@/interfaces/models/EmployeeRequestModel'
import EmployeeRequestService from '@/services/EmployeeRequestService'
import { useSocketEvent } from '@/composables/useSocket'
import { useApprovalsStore } from '@/stores/approvals'
/* END IMPORT */

const { t } = useI18n()
const { moment, TIMEZONE } = useMoment()

const dialogEditOpen = ref(false)
const dialogRequestType = ref<EmployeeRequestType>('off')
const dialogInitialData = ref<EmployeeRequestModel | null>(null)
const dialogEditItemId = ref<number | null>(null)
const canApproveRequests = ref(false)

const openEdit = (item: EmployeeRequestModel) => {
  dialogRequestType.value = item.type
  dialogInitialData.value = item
  dialogEditItemId.value = item.id
  dialogEditOpen.value = true
}

const handleEditConfirm = async () => {
  dialogEditOpen.value = false
  await getItems()
}

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.approvals.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const items = ref<EmployeeRequestModel[]>([])
const isLoading = ref(false)
const statusFilter = ref<string>('')
const dialogApprove = ref(false)
const selectedRequest = ref<EmployeeRequestModel | null>(null)
const pendingAction = ref<'approved' | 'rejected'>('approved')
const approvalNote = ref<string>('')
const isApproving = ref(false)
const filterExpanded = ref(false)
const filters = ref({
  search: '',
  type: null as string | null,
})

const now = moment().tz(TIMEZONE)
const selectedMonth = ref<number>(now.month() + 1)
const selectedYear = ref<number>(now.year())

const monthOptions = computed(() => [
  { label: t('common.all'), value: 0 },
  ...Array.from({ length: 12 }, (_, index) => ({
    label: t(`months.${index + 1}`),
    value: index + 1,
  })),
])

const currentYear = now.year()
const yearOptions = Array.from({ length: 5 }, (_, index) => currentYear - index)

const requestTypes = [
  { label: t('requestType.wfh'), value: 'wfh' },
  { label: t('requestType.off'), value: 'off' },
  { label: t('requestType.equipment'), value: 'equipment' },
  { label: t('requestType.clockForget'), value: 'clock_forget' },
  { label: t('requestType.overtime'), value: 'overtime' },
]

const filterFields = computed<FilterFieldConfig[]>(() => [
  {
    key: 'type',
    label: t('common.type'),
    type: 'select',
    items: requestTypes as unknown as Array<Record<string, unknown>>,
    itemTitle: 'label',
    itemValue: 'value',
  },
])

const activeFilterCount = computed(() => {
  const filterValues = filters.value
  return [filterValues.search, filterValues.type].filter(
    (filterValue) => filterValue !== '' && filterValue !== null,
  ).length
})

const isFilterActive = computed(() => activeFilterCount.value > 0)

const resetFilters = () => {
  filters.value = { search: '', type: null }
}

const headers = computed(() => [
  { title: t('common.id'), key: 'id', sortable: true },
  { title: t('approvals.employee'), key: 'user', sortable: false },
  { title: t('common.type'), key: 'type' },
  { title: t('common.status'), key: 'status' },
  { title: t('common.date'), key: 'date_range', sortable: false },
  { title: t('approvals.approver'), key: 'approver', sortable: false },
  { title: t('common.actions'), key: 'actions', sortable: false },
])
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const filteredItems = computed(() =>
  items.value.toSorted((left, right) => {
    // Pending status comes first
    const statusOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2 }
    const statusPriorityLeft = statusOrder[left.status] ?? 3
    const statusPriorityRight = statusOrder[right.status] ?? 3
    if (statusPriorityLeft !== statusPriorityRight) return statusPriorityLeft - statusPriorityRight

    // Then by date descending (newest first)
    const dateLeft = left.forget_date ?? left.from_datetime ?? ''
    const dateRight = right.forget_date ?? right.from_datetime ?? ''
    return dateRight.localeCompare(dateLeft)
  }),
)

const pendingCount = computed(() => items.value.filter((item) => item.status === 'pending').length)
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const getItems = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    items.value = await EmployeeRequestService.getAll({
      status: statusFilter.value || undefined,
      type: filters.value.type ?? undefined,
      month: selectedMonth.value || undefined,
      year: selectedYear.value || undefined,
      search: filters.value.search || undefined,
    })
  } catch (error) {
    console.error('Failed to fetch approvals:', error)
  } finally {
    isLoading.value = false
  }
}

const typeLabel = (type?: EmployeeRequestType | string): string => {
  if (!type) return '—'

  const labels: Record<string, string> = {
    wfh: t('requestType.wfh'),
    off: t('requestType.off'),
    equipment: t('requestType.equipment'),
    clock_forget: t('requestType.clockForget'),
    overtime: t('requestType.overtime'),
  }

  return labels[type] ?? type
}

const typeColor = (type?: EmployeeRequestType | string): string => {
  const colors: Record<string, string> = {
    wfh: 'blue',
    off: 'green',
    equipment: 'orange',
    clock_forget: 'purple',
  }

  return colors[type ?? ''] ?? 'default'
}

const getInitials = (name?: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''

  return parts.length >= 2 ? (first + last).toUpperCase() : first.toUpperCase() || '?'
}

const formatDatetime = (value?: string): string => {
  if (!value) return '—'

  return value.substring(0, 16).replace('T', ' ')
}

const formatDate = (value?: string): string => {
  if (!value) return '—'

  return value.substring(0, 10)
}

const openApprove = (item: EmployeeRequestModel, action: 'approved' | 'rejected') => {
  selectedRequest.value = item
  pendingAction.value = action
  approvalNote.value = ''
  dialogApprove.value = true
}

const submitApproval = async () => {
  if (!selectedRequest.value) return
  isApproving.value = true

  try {
    await EmployeeRequestService.approve(selectedRequest.value.id, {
      status: pendingAction.value,
      note: approvalNote.value || undefined,
    })
    dialogApprove.value = false
    selectedRequest.value = null
    await getItems()
    approvalsStore.loadPendingCount()
  } catch (error) {
    console.error('Failed to submit approval:', error)
  } finally {
    isApproving.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch([selectedMonth, selectedYear, statusFilter, () => filters.value.type], () => {
  getItems()
})

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => filters.value.search,
  () => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
    searchDebounceTimer = setTimeout(() => getItems(), 300)
  },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(async () => {
  getItems()
  try {
    canApproveRequests.value = await EmployeeRequestService.canApprove()
  } catch {
    canApproveRequests.value = false
  }
})

const approvalsStore = useApprovalsStore()

// Refresh approvals list in real-time when a new request is submitted or an existing one is updated
useSocketEvent<EmployeeRequestModel>('request:created', () => {
  getItems()
  approvalsStore.loadPendingCount()
})
useSocketEvent<EmployeeRequestModel>('request:updated', () => {
  getItems()
  approvalsStore.loadPendingCount()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.table-toolbar {
  background-color: #f5ede4;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}

.status-dot--pending {
  background-color: #f59e0b;
}

.status-dot--approved {
  background-color: #388e3c;
}

.status-dot--rejected {
  background-color: #e53935;
}
</style>
