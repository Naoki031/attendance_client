<template>
  <v-container fluid class="py-6 px-6">
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">{{ $t('errorLogs.title') }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ $t('errorLogs.description') }}
        </div>
      </div>
      <div class="d-flex ga-2">
        <v-btn
          v-if="selected.length > 0"
          color="success"
          variant="tonal"
          prepend-icon="mdi-check-all"
          rounded="lg"
          :loading="isResolvingBatch"
          @click="handleResolveBatch"
        >
          {{ $t('errorLogs.resolveSelected') }} ({{ selected.length }})
        </v-btn>
        <v-btn
          color="error"
          variant="tonal"
          prepend-icon="mdi-delete-sweep-outline"
          rounded="lg"
          :loading="isPurging"
          @click="purgeDialog = true"
        >
          {{ $t('errorLogs.purgeOld') }}
        </v-btn>
      </div>
    </div>

    <!-- Stats cards -->
    <v-row class="mb-4" dense align="stretch">
      <v-col cols="6" sm="3">
        <v-card rounded="lg" elevation="0" border class="h-100">
          <v-card-text
            class="text-center d-flex flex-column align-center justify-center h-100 py-4"
          >
            <div class="text-caption text-medium-emphasis mb-1">
              {{ $t('errorLogs.stats.total') }}
            </div>
            <div class="text-h5 font-weight-bold">
              {{ stats?.total ?? '—' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="lg" elevation="0" border class="h-100">
          <v-card-text
            class="text-center d-flex flex-column align-center justify-center h-100 py-4"
          >
            <div class="text-caption text-medium-emphasis mb-1">
              {{ $t('errorLogs.stats.unresolved') }}
            </div>
            <div class="text-h5 font-weight-bold text-error">
              {{ stats?.unresolved ?? '—' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="lg" elevation="0" border class="h-100">
          <v-card-text
            class="text-center d-flex flex-column align-center justify-center h-100 py-4"
          >
            <div class="text-caption text-medium-emphasis mb-1">
              {{ $t('errorLogs.levelError') }}
            </div>
            <div class="text-h5 font-weight-bold">
              {{ stats?.errorCount ?? '—' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="lg" elevation="0" border class="h-100">
          <v-card-text
            class="text-center d-flex flex-column align-center justify-center h-100 py-4"
          >
            <div class="text-caption text-medium-emphasis mb-1">
              {{ $t('errorLogs.stats.fatal') }}
            </div>
            <div class="text-h5 font-weight-bold">
              {{ stats?.fatalCount ?? '—' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Data table -->
    <v-card rounded="xl" elevation="0" border class="table-responsive-card">
      <!-- Toolbar filters -->
      <div class="d-flex align-center flex-wrap px-4 py-3 ga-2 border-b table-toolbar">
        <v-select
          v-model="levelFilter"
          :items="levelOptions"
          item-title="label"
          item-value="value"
          :label="$t('errorLogs.level')"
          density="compact"
          hide-details
          variant="outlined"
          style="max-width: 140px"
          @update:model-value="fetchData"
        />
        <v-select
          v-model="resolvedFilter"
          :items="resolvedOptions"
          item-title="label"
          item-value="value"
          :label="$t('errorLogs.resolved')"
          density="compact"
          hide-details
          variant="outlined"
          style="max-width: 160px"
          @update:model-value="fetchData"
        />
        <v-text-field
          v-model="searchFilter"
          :placeholder="$t('errorLogs.searchPlaceholder')"
          density="compact"
          hide-details
          variant="outlined"
          prepend-inner-icon="mdi-magnify"
          clearable
          style="max-width: 260px"
          @update:model-value="onSearchDebounced"
          @click:clear="onSearchClear"
        />
        <v-spacer />
        <span class="text-caption text-medium-emphasis">{{ total }} records</span>
      </div>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="items"
        :loading="isLoading"
        :hover="true"
        :items-per-page="limit"
        :page="page"
        :items-length="total"
        :show-select="true"
        return-object
        @update:page="onPageChange"
        @click:row="openDetail"
      >
        <template #item.level="{ item }">
          <v-chip :color="levelColor(item.level)" variant="tonal" size="small">
            {{ levelLabel(item.level) }}
          </v-chip>
        </template>

        <template #item.message="{ item }">
          <span class="d-inline-block text-truncate" style="max-width: 300px">
            {{ item.message }}
          </span>
        </template>

        <template #item.path="{ item }">
          <span class="d-inline-block text-truncate" style="max-width: 200px">
            {{ item.path || '—' }}
          </span>
        </template>

        <template #item.status_code="{ item }">
          <v-chip
            v-if="item.status_code"
            :color="statusCodeColor(item.status_code)"
            variant="tonal"
            size="small"
          >
            {{ item.status_code }}
          </v-chip>
          <span v-else>—</span>
        </template>

        <template #item.user_name="{ item }">
          <span>{{ item.user_name || item.user_email || '—' }}</span>
        </template>

        <template #item.is_resolved="{ item }">
          <v-chip :color="item.is_resolved ? 'success' : 'warning'" variant="tonal" size="small">
            {{ item.is_resolved ? $t('errorLogs.resolved') : $t('errorLogs.unresolved') }}
          </v-chip>
        </template>

        <template #item.created_at="{ item }">
          <span>{{ formatDate(item.created_at) }}</span>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            v-if="!item.is_resolved"
            icon
            variant="text"
            size="small"
            color="success"
            :loading="resolvingId === item.id"
            @click.stop="handleResolve(item)"
          >
            <v-icon>mdi-check</v-icon>
            <v-tooltip activator="parent" location="top">
              {{ $t('errorLogs.markResolved') }}
            </v-tooltip>
          </v-btn>
        </template>

        <template #loading>
          <v-skeleton-loader type="table-row@10" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Detail dialog -->
    <v-dialog v-model="detailDialog" max-width="700" persistent scrollable>
      <v-card v-if="detailItem" rounded="xl" elevation="2">
        <div class="dialog-header px-6 pt-6 pb-4">
          <div>
            <div class="text-h6 font-weight-bold text-primary">
              {{ $t('errorLogs.detail') }}
            </div>
            <div class="text-body-2 text-medium-emphasis mt-1">
              #{{ detailItem.id }} — {{ formatDate(detailItem.created_at) }}
            </div>
          </div>
          <v-btn icon variant="text" size="small" @click="detailDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-card-text class="px-6 py-0">
          <!-- Level + Status row -->
          <div class="d-flex ga-2 mb-4">
            <v-chip :color="levelColor(detailItem.level)" variant="tonal" size="small">
              {{ levelLabel(detailItem.level) }}
            </v-chip>
            <v-chip
              v-if="detailItem.status_code"
              :color="statusCodeColor(detailItem.status_code)"
              variant="tonal"
              size="small"
            >
              {{ detailItem.status_code }}
            </v-chip>
            <v-chip
              :color="detailItem.is_resolved ? 'success' : 'warning'"
              variant="tonal"
              size="small"
            >
              {{ detailItem.is_resolved ? $t('errorLogs.resolved') : $t('errorLogs.unresolved') }}
            </v-chip>
          </div>

          <!-- Message -->
          <div class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-1">
              {{ $t('errorLogs.message') }}
            </div>
            <div class="text-body-2">{{ detailItem.message }}</div>
          </div>

          <!-- Request info -->
          <div class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-1">
              {{ $t('errorLogs.method') }} / {{ $t('errorLogs.path') }}
            </div>
            <div class="text-body-2">
              <code v-if="detailItem.method">{{ detailItem.method }}</code>
              <code v-if="detailItem.path">{{ detailItem.path }}</code>
              <span v-if="!detailItem.method && !detailItem.path">—</span>
            </div>
          </div>

          <!-- User info -->
          <div class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-1">
              {{ $t('errorLogs.user') }}
            </div>
            <div class="text-body-2">
              {{ detailItem.user_name || detailItem.user_email || '—' }}
              <span v-if="detailItem.ip_address" class="text-medium-emphasis ml-2">
                ({{ detailItem.ip_address }})
              </span>
            </div>
          </div>

          <!-- Stack trace -->
          <div class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-1">
              {{ $t('errorLogs.stackTrace') }}
            </div>
            <pre
              v-if="detailItem.stack_trace"
              class="pa-3 rounded bg-error pa-3 text-body-2 overflow-auto"
              style="max-height: 300px; white-space: pre-wrap"
              >{{ detailItem.stack_trace }}</pre
            >
            <div v-else class="text-body-2 text-medium-emphasis">
              {{ $t('errorLogs.noStackTrace') }}
            </div>
          </div>

          <!-- Request body -->
          <div class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-1">
              {{ $t('errorLogs.requestBody') }}
            </div>
            <pre
              v-if="formattedRequestBody"
              class="pa-3 rounded bg-grey-lighten-4 text-body-2 overflow-auto"
              style="max-height: 200px; white-space: pre-wrap"
              >{{ formattedRequestBody }}</pre
            >
            <div v-else class="text-body-2 text-medium-emphasis">
              {{ $t('errorLogs.noRequestBody') }}
            </div>
          </div>

          <!-- Request query -->
          <div v-if="detailItem.request_query" class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-1">
              {{ $t('errorLogs.requestQuery') }}
            </div>
            <pre
              class="pa-3 rounded bg-grey-lighten-4 text-body-2 overflow-auto"
              style="max-height: 150px; white-space: pre-wrap"
              >{{ formatJson(detailItem.request_query) }}</pre
            >
          </div>

          <!-- User agent -->
          <div v-if="detailItem.user_agent" class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-1">
              {{ $t('errorLogs.userAgent') }}
            </div>
            <div class="text-body-2 text-medium-emphasis">{{ detailItem.user_agent }}</div>
          </div>

          <!-- Resolved info -->
          <div v-if="detailItem.is_resolved" class="mb-4">
            <div class="text-subtitle-2 font-weight-bold mb-1">
              {{ $t('errorLogs.resolved') }}
            </div>
            <div class="text-body-2">
              {{ $t('errorLogs.resolvedBy') }}: #{{ detailItem.resolved_by }}
              <span v-if="detailItem.resolved_at" class="text-medium-emphasis ml-2">
                {{ formatDate(detailItem.resolved_at) }}
              </span>
            </div>
          </div>
        </v-card-text>

        <div class="d-flex justify-end ga-3 px-6 py-4">
          <v-btn variant="text" color="default" rounded="lg" @click="detailDialog = false">
            {{ $t('common.close') }}
          </v-btn>
          <v-btn
            v-if="!detailItem.is_resolved"
            color="success"
            variant="elevated"
            rounded="lg"
            :loading="resolvingId === detailItem.id"
            @click="handleResolve(detailItem)"
          >
            {{ $t('errorLogs.markResolved') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Purge dialog -->
    <v-dialog v-model="purgeDialog" max-width="420" persistent>
      <v-card rounded="xl" elevation="2">
        <div class="dialog-header px-6 pt-6 pb-4">
          <div>
            <div class="text-h6 font-weight-bold text-primary">
              {{ $t('errorLogs.purgeTitle') }}
            </div>
            <div class="text-body-2 text-medium-emphasis mt-1">
              {{ $t('errorLogs.purgeConfirm') }}
            </div>
          </div>
          <v-btn icon variant="text" size="small" @click="purgeDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-card-text class="px-6 py-0">
          <v-text-field
            v-model="purgeDays"
            :label="$t('errorLogs.purgeDays')"
            type="number"
            variant="filled"
            density="comfortable"
            rounded="lg"
            hide-details
            min="1"
          />
        </v-card-text>

        <div class="d-flex justify-end ga-3 px-6 py-4">
          <v-btn variant="text" color="default" rounded="lg" @click="purgeDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            rounded="lg"
            :loading="isPurging"
            @click="handlePurge"
          >
            {{ $t('common.confirm') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Resolve batch confirm dialog -->
    <v-dialog v-model="resolveBatchDialog" max-width="420" persistent>
      <v-card rounded="xl" elevation="2">
        <div class="dialog-header px-6 pt-6 pb-4">
          <div>
            <div class="text-h6 font-weight-bold text-primary">
              {{ $t('errorLogs.resolveSelected') }}
            </div>
            <div class="text-body-2 text-medium-emphasis mt-1">
              {{ $t('errorLogs.resolveSelectedConfirm', { count: selected.length }) }}
            </div>
          </div>
          <v-btn icon variant="text" size="small" @click="resolveBatchDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="d-flex justify-end ga-3 px-6 py-4">
          <v-btn variant="text" color="default" rounded="lg" @click="resolveBatchDialog = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="success"
            variant="elevated"
            rounded="lg"
            :loading="isResolvingBatch"
            @click="confirmResolveBatch"
          >
            {{ $t('common.confirm') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import moment from 'moment'
import type { ErrorLogModel, ErrorLogStats } from '@/interfaces/models/ErrorLogModel'
import ErrorLogService from '@/services/ErrorLogService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.error-logs.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const { t } = useI18n()

const items = ref<Array<ErrorLogModel>>([])
const stats = ref<ErrorLogStats | null>(null)
const selected = ref<Array<ErrorLogModel>>([])
const isLoading = ref(false)
const page = ref(1)
const limit = ref(50)
const total = ref(0)
const levelFilter = ref<string>('all')
const resolvedFilter = ref<string>('all')
const searchFilter = ref<string | null>(null)
const detailDialog = ref(false)
const detailItem = ref<ErrorLogModel | null>(null)
const resolvingId = ref<number | null>(null)
const purgeDialog = ref(false)
const isPurging = ref(false)
const purgeDays = ref(30)
const resolveBatchDialog = ref(false)
const isResolvingBatch = ref(false)
let fetchGeneration = 0
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const levelOptions = computed(() => [
  { label: t('common.all'), value: 'all' },
  { label: t('errorLogs.levelError'), value: 'error' },
  { label: t('errorLogs.levelWarn'), value: 'warn' },
  { label: t('errorLogs.levelFatal'), value: 'fatal' },
])

const resolvedOptions = computed(() => [
  { label: t('common.all'), value: 'all' },
  { label: t('errorLogs.unresolved'), value: 'false' },
  { label: t('errorLogs.resolved'), value: 'true' },
])
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const headers = computed(() => [
  { title: 'ID', key: 'id', sortable: true },
  { title: t('errorLogs.level'), key: 'level', sortable: true, width: '100px' },
  { title: t('errorLogs.message'), key: 'message', sortable: false, minWidth: '250px' },
  { title: t('errorLogs.path'), key: 'path', sortable: false, minWidth: '150px' },
  { title: t('errorLogs.method'), key: 'method', sortable: false, width: '80px' },
  { title: t('errorLogs.statusCode'), key: 'status_code', sortable: true, width: '110px' },
  { title: t('errorLogs.user'), key: 'user_name', sortable: false, width: '130px' },
  { title: t('common.createdAt'), key: 'created_at', sortable: true, width: '150px' },
  { title: t('errorLogs.resolved'), key: 'is_resolved', sortable: true, width: '120px' },
  { title: '', key: 'actions', sortable: false, width: '60px', align: 'end' },
])

const formattedRequestBody = computed(() => {
  if (!detailItem.value?.request_body) return null

  return formatJson(detailItem.value.request_body)
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const fetchData = async () => {
  if (isLoading.value) return

  const currentGeneration = ++fetchGeneration

  try {
    isLoading.value = true
    const parameters: Record<string, unknown> = {
      page: page.value,
      limit: limit.value,
    }

    if (levelFilter.value && levelFilter.value !== 'all') {
      parameters.level = levelFilter.value
    }

    if (resolvedFilter.value && resolvedFilter.value !== 'all') {
      parameters.is_resolved = resolvedFilter.value === 'true'
    }

    if (searchFilter.value) {
      parameters.search = searchFilter.value
    }

    const [logResponse, statsResponse] = await Promise.all([
      ErrorLogService.getAll(parameters),
      ErrorLogService.getStats(),
    ])

    if (currentGeneration !== fetchGeneration) return

    items.value = logResponse.data
    total.value = logResponse.total
    stats.value = statsResponse
  } catch (error) {
    console.error('Failed to fetch error logs:', error)
  } finally {
    isLoading.value = false
  }
}

const onPageChange = (newPage: number) => {
  page.value = newPage
  fetchData()
}

const onSearchDebounced = (value: string | null) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchFilter.value = value
    page.value = 1
    fetchData()
  }, 400)
}

const onSearchClear = () => {
  searchFilter.value = null
  page.value = 1
  fetchData()
}

const openDetail = (_event: unknown, row: { item: ErrorLogModel }) => {
  detailItem.value = row.item
  detailDialog.value = true
}

const handleResolve = async (item: ErrorLogModel) => {
  try {
    resolvingId.value = item.id
    await ErrorLogService.resolve(item.id)
    detailDialog.value = false
    await fetchData()
  } catch (error) {
    console.error('Failed to resolve error log:', error)
  } finally {
    resolvingId.value = null
  }
}

const handleResolveBatch = () => {
  resolveBatchDialog.value = true
}

const confirmResolveBatch = async () => {
  try {
    isResolvingBatch.value = true
    const ids = selected.value.map((item) => item.id)

    await ErrorLogService.resolveBatch(ids)
    selected.value = []
    resolveBatchDialog.value = false
    await fetchData()
  } catch (error) {
    console.error('Failed to batch resolve error logs:', error)
  } finally {
    isResolvingBatch.value = false
  }
}

const handlePurge = async () => {
  try {
    isPurging.value = true
    await ErrorLogService.purge(purgeDays.value)
    purgeDialog.value = false
    await fetchData()
  } catch (error) {
    console.error('Failed to purge error logs:', error)
  } finally {
    isPurging.value = false
  }
}

const levelColor = (level: string) => {
  switch (level) {
    case 'error':
      return 'error'
    case 'warn':
      return 'warning'
    case 'fatal':
      return 'purple'
    default:
      return 'default'
  }
}

const levelLabel = (level: string) => {
  switch (level) {
    case 'error':
      return t('errorLogs.levelError')
    case 'warn':
      return t('errorLogs.levelWarn')
    case 'fatal':
      return t('errorLogs.levelFatal')
    default:
      return level
  }
}

const statusCodeColor = (statusCode: number) => {
  if (statusCode >= 500) return 'error'
  if (statusCode >= 400) return 'warning'
  if (statusCode >= 300) return 'info'

  return 'success'
}

const formatDate = (date: string | undefined) => {
  if (!date) return '—'

  return moment.utc(date).format('YYYY-MM-DD HH:mm')
}

const formatJson = (jsonString: string | undefined): string | null => {
  if (!jsonString) return null

  try {
    return JSON.stringify(JSON.parse(jsonString), null, 2)
  } catch {
    return jsonString
  }
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  fetchData()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.table-responsive-card :deep(.v-data-table__tr) {
  cursor: pointer;
}
</style>
