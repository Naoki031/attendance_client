<template>
  <v-container fluid class="py-6 px-6">
    <div class="d-flex align-center justify-space-between mb-5">
      <div class="text-h5 font-weight-bold">{{ $t('translationLogs.title') }}</div>
      <v-btn
        color="error"
        variant="tonal"
        prepend-icon="mdi-delete-sweep-outline"
        rounded="lg"
        :loading="isPurging"
        @click="purgeDialog = true"
      >
        {{ $t('translationLogs.purgeOld') }}
      </v-btn>
    </div>

    <!-- Stats cards — 4 columns matching other admin pages -->
    <v-row class="mb-4" dense align="stretch">
      <v-col cols="6" sm="3">
        <v-card rounded="lg" elevation="0" border class="h-100">
          <v-card-text
            class="text-center d-flex flex-column align-center justify-center h-100 py-4"
          >
            <div class="text-caption text-medium-emphasis mb-1">
              {{ $t('translationLogs.stats.total') }}
            </div>
            <div class="text-h5 font-weight-bold">{{ stats?.totalRequests ?? '—' }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="lg" elevation="0" border class="h-100">
          <v-card-text
            class="text-center d-flex flex-column align-center justify-center h-100 py-4"
          >
            <div class="text-caption text-medium-emphasis mb-1">
              {{ $t('translationLogs.stats.cacheHitRate') }}
            </div>
            <div class="text-h5 font-weight-bold">
              {{ stats ? `${stats.cacheHitRate}%` : '—' }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ $t('translationLogs.stats.tokensSaved') }}:
              {{ stats ? `${stats.tokensSavedRate}%` : '—' }}
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
              {{ $t('translationLogs.stats.errorRate') }}
            </div>
            <div class="text-h5 font-weight-bold">{{ errorRate }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="lg" elevation="0" border class="h-100">
          <v-card-text
            class="text-center d-flex flex-column align-center justify-center h-100 py-4"
          >
            <div class="text-caption text-medium-emphasis mb-1">
              {{ $t('translationLogs.stats.avgDuration') }}
            </div>
            <div class="text-h5 font-weight-bold">
              {{ stats ? `${stats.avgDurationMs}ms` : '—' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Cache breakdown by language pair -->
    <v-card v-if="breakdown.length > 0" rounded="xl" elevation="0" border class="mb-4">
      <div class="px-4 py-3 border-b">
        <div class="text-subtitle-2 font-weight-bold">
          {{ $t('translationLogs.cacheBreakdown.title') }}
        </div>
      </div>
      <v-data-table
        :headers="breakdownHeaders"
        :items="breakdown"
        density="compact"
        hide-default-footer
        :items-per-page="-1"
      >
        <template #item.languagePair="{ item }">
          <span class="font-weight-medium">{{ item.sourceLang }} → {{ item.targetLang }}</span>
        </template>

        <template #item.cacheHitRate="{ item }">
          <v-chip :color="breakdownColor(item.cacheHitRate)" variant="tonal" size="small">
            {{ item.cacheHitRate }}%
          </v-chip>
        </template>

        <template #item.avgDurationMs="{ item }">
          <span>{{ item.avgDurationMs }}ms</span>
        </template>
      </v-data-table>
    </v-card>

    <!-- Data table -->
    <v-card rounded="xl" elevation="0" border class="table-responsive-card">
      <!-- Toolbar -->
      <div class="d-flex align-center px-4 py-3 ga-2 border-b table-toolbar">
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          item-title="label"
          item-value="value"
          :label="$t('translationLogs.status')"
          density="compact"
          hide-details
          variant="outlined"
          style="max-width: 160px"
          @update:model-value="fetchData"
        />
        <v-spacer />
        <span class="text-caption text-medium-emphasis">{{ total }} records</span>
      </div>

      <v-data-table
        v-model:expanded="expanded"
        :headers="headers"
        :items="items"
        :loading="isLoading"
        :hover="true"
        :items-per-page="limit"
        :page="page"
        :items-length="total"
        @update:page="onPageChange"
        @click:row="toggleExpand"
      >
        <template #item.sourceLang="{ item }">
          <span>{{ item.sourceLang }} → {{ (item.targetLangs ?? []).join(', ') }}</span>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" variant="tonal" size="small">
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>

        <template #item.inputLength="{ item }">
          <span>{{ item.inputLength }} chars</span>
        </template>

        <template #item.cacheStatus="{ item }">
          <v-chip
            v-if="(item.cacheReadTokens ?? 0) > 0"
            color="success"
            variant="tonal"
            size="small"
          >
            HIT ({{ item.cacheReadTokens }})
          </v-chip>
          <v-chip
            v-else-if="(item.cacheCreationTokens ?? 0) > 0"
            color="warning"
            variant="tonal"
            size="small"
          >
            MISS ({{ item.cacheCreationTokens }})
          </v-chip>
          <v-chip v-else color="grey" variant="tonal" size="small"> BYPASS </v-chip>
        </template>

        <template #item.durationMs="{ item }">
          <span>{{ item.durationMs ? `${item.durationMs}ms` : '—' }}</span>
        </template>

        <template #item.createdAt="{ item }">
          <span>{{ formatDate(item.createdAt) }}</span>
        </template>

        <template #expanded-row="{ item }">
          <tr>
            <td :colspan="headers.length" class="pa-4 bg-grey-lighten-4">
              <div class="mb-2">
                <strong>{{ $t('translationLogs.inputLength') }}:</strong>
                <span class="ml-1">{{ item.inputLength }} chars</span>
              </div>
              <div class="mb-2">
                <strong>{{ $t('translationLogs.targetLangs') }}:</strong>
                <span class="ml-1">{{ (item.targetLangs ?? []).join(', ') }}</span>
              </div>
              <div v-if="item.errorMessage">
                <strong>{{ $t('translationLogs.errorMessage') }}:</strong>
                <pre
                  class="mt-1 pa-2 rounded bg-red-lighten-5 text-body-2"
                  style="white-space: pre-wrap"
                  >{{ item.errorMessage }}</pre
                >
              </div>
            </td>
          </tr>
        </template>

        <template #loading>
          <v-skeleton-loader type="table-row@10" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Purge dialog -->
    <v-dialog v-model="purgeDialog" max-width="420" persistent>
      <v-card rounded="xl" elevation="2">
        <div class="dialog-header px-6 pt-6 pb-4">
          <div>
            <div class="text-h6 font-weight-bold text-primary">
              {{ $t('translationLogs.purgeTitle') }}
            </div>
            <div class="text-body-2 text-medium-emphasis mt-1">
              {{ $t('translationLogs.purgeConfirm') }}
            </div>
          </div>
          <v-btn icon variant="text" size="small" @click="purgeDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-card-text class="px-6 py-0">
          <v-text-field
            v-model="purgeDays"
            :label="$t('translationLogs.purgeDays')"
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
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import moment from 'moment'
import type {
  TranslationLogModel,
  TranslationLogStats,
  CacheBreakdownItem,
} from '@/interfaces/models/TranslationLogModel'
import TranslationLogService from '@/services/TranslationLogService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.translation-logs.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const { t } = useI18n()

const items = ref<Array<TranslationLogModel>>([])
const stats = ref<TranslationLogStats | null>(null)
const breakdown = ref<CacheBreakdownItem[]>([])
const expanded = ref<Array<TranslationLogModel>>([])
const isLoading = ref(false)
const page = ref(1)
const limit = ref(50)
const total = ref(0)
const statusFilter = ref<string>('all')
const purgeDialog = ref(false)
const isPurging = ref(false)
const purgeDays = ref(30)
let fetchGeneration = 0

const statusOptions = computed(() => [
  { label: t('common.all'), value: 'all' },
  { label: t('translationLogs.statusSuccess'), value: 'success' },
  { label: t('translationLogs.statusError'), value: 'error' },
  { label: t('translationLogs.statusPartial'), value: 'partial' },
])
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const headers = computed(() => [
  { title: 'ID', key: 'id', sortable: true },
  { title: t('translationLogs.sourceTarget'), key: 'sourceLang', sortable: false },
  { title: t('translationLogs.inputLength'), key: 'inputLength', sortable: false },
  { title: t('translationLogs.status'), key: 'status', sortable: true },
  { title: t('translationLogs.cache'), key: 'cacheStatus', sortable: false },
  { title: t('translationLogs.tokens'), key: 'inputTokens', sortable: false },
  { title: t('translationLogs.duration'), key: 'durationMs', sortable: true },
  { title: t('common.createdAt'), key: 'createdAt', sortable: true },
])

const breakdownHeaders = computed(() => [
  {
    title: t('translationLogs.cacheBreakdown.languagePair'),
    key: 'languagePair',
    sortable: false,
  },
  { title: t('translationLogs.cacheBreakdown.requests'), key: 'totalRequests', sortable: true },
  { title: t('translationLogs.cacheBreakdown.cacheHitRate'), key: 'cacheHitRate', sortable: true },
  { title: t('translationLogs.cacheBreakdown.avgDuration'), key: 'avgDurationMs', sortable: true },
  {
    title: t('translationLogs.cacheBreakdown.tokensSaved'),
    key: 'totalCacheReadTokens',
    sortable: true,
  },
])

const errorRate = computed(() => {
  if (!stats.value || stats.value.totalRequests === 0) return '—'

  return `${Math.round((stats.value.errorCount / stats.value.totalRequests) * 100)}%`
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

    if (statusFilter.value && statusFilter.value !== 'all') {
      parameters.status = statusFilter.value
    }

    const [logResponse, statsResponse, breakdownResponse] = await Promise.all([
      TranslationLogService.getAll(parameters),
      TranslationLogService.getStats(),
      TranslationLogService.getCacheBreakdown(),
    ])

    // Ignore stale responses from previous fetches
    if (currentGeneration !== fetchGeneration) return

    items.value = logResponse.data
    total.value = logResponse.total
    stats.value = statsResponse
    breakdown.value = breakdownResponse
  } catch (error) {
    console.error('Failed to fetch translation logs:', error)
  } finally {
    isLoading.value = false
  }
}

const onPageChange = (newPage: number) => {
  page.value = newPage
  fetchData()
}

const toggleExpand = (_event: unknown, row: { item: TranslationLogModel }) => {
  const index = expanded.value.findIndex((item) => item.id === row.item.id)

  if (index >= 0) {
    expanded.value.splice(index, 1)
  } else {
    expanded.value.push(row.item)
  }
}

const statusColor = (status: string) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'error':
      return 'error'
    case 'partial':
      return 'warning'
    default:
      return 'default'
  }
}

const statusLabel = (status: string) => {
  switch (status) {
    case 'success':
      return t('translationLogs.statusSuccess')
    case 'error':
      return t('translationLogs.statusError')
    case 'partial':
      return t('translationLogs.statusPartial')
    default:
      return status
  }
}

const breakdownColor = (rate: number) => {
  if (rate >= 70) return 'success'
  if (rate >= 40) return 'warning'

  return 'error'
}

const formatDate = (date: string | undefined) => {
  if (!date) return '—'

  return moment.utc(date).format('YYYY-MM-DD HH:mm')
}

const handlePurge = async () => {
  try {
    isPurging.value = true
    await TranslationLogService.purge(purgeDays.value)
    purgeDialog.value = false
    await fetchData()
  } catch (error) {
    console.error('Failed to purge translation logs:', error)
  } finally {
    isPurging.value = false
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
