<template>
  <v-container fluid class="py-6 px-6">
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">{{ $t('attendanceSync.title') }}</div>
      </div>
      <div class="d-flex ga-3">
        <v-btn
          variant="tonal"
          color="secondary"
          prepend-icon="mdi-lan-connect"
          rounded="lg"
          :loading="isTesting"
          @click="testConnection"
        >
          {{ $t('attendanceSync.syncDevice') }}
        </v-btn>
        <v-btn
          variant="tonal"
          color="primary"
          prepend-icon="mdi-eye-outline"
          rounded="lg"
          :loading="isPreviewing"
          @click="loadPreview"
        >
          {{ $t('attendanceSync.previewData') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-sync"
          rounded="lg"
          :loading="isSyncing"
          :disabled="!previewResult"
          @click="openSyncConfirm"
        >
          {{ $t('attendanceSync.saveData') }}
        </v-btn>
      </div>
    </div>

    <!-- Device connection info card -->
    <v-card v-if="deviceInfo" rounded="xl" elevation="0" border class="mb-5 pa-4">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3">
        <div class="d-flex align-center ga-3">
          <v-icon :color="deviceInfo.connected ? 'success' : 'error'" size="32">
            {{ deviceInfo.connected ? 'mdi-lan-check' : 'mdi-lan-disconnect' }}
          </v-icon>
          <div>
            <div class="text-subtitle-2 font-weight-bold">
              {{ deviceInfo.connected ? 'Device Connected' : 'Device Unreachable' }}
              <span class="text-caption text-medium-emphasis ml-2">
                {{ deviceInfo.ip }}:{{ deviceInfo.port }}
              </span>
            </div>
            <div v-if="deviceInfo.error" class="text-caption text-error mt-1">
              {{ deviceInfo.error }}
            </div>
            <div v-if="deviceInfo.deviceTime" class="text-caption text-medium-emphasis mt-1">
              Device time: {{ new Date(deviceInfo.deviceTime).toLocaleString('vi-VN') }}
            </div>
          </div>
        </div>
        <div v-if="deviceInfo.connected" class="d-flex ga-4">
          <div class="text-center">
            <div class="text-h6 font-weight-bold text-primary">
              {{ deviceInfo.userCount ?? '—' }}
            </div>
            <div class="text-caption text-medium-emphasis">Enrolled Users</div>
          </div>
          <v-divider vertical></v-divider>
          <div class="text-center">
            <div class="text-h6 font-weight-bold text-primary">
              {{ deviceInfo.attendanceCount ?? '—' }}
            </div>
            <div class="text-caption text-medium-emphasis">Stored Records</div>
          </div>
        </div>
      </div>
    </v-card>

    <!-- Summary cards -->
    <v-row v-if="previewResult" class="mb-5" dense>
      <v-col cols="6" sm="3">
        <v-card rounded="xl" elevation="0" border class="pa-4 text-center">
          <div class="text-h4 font-weight-bold text-primary">{{ previewResult.fetched }}</div>
          <div class="text-caption text-medium-emphasis mt-1">Total Punches</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="xl" elevation="0" border class="pa-4 text-center">
          <div class="text-h4 font-weight-bold text-success">{{ previewResult.matched }}</div>
          <div class="text-caption text-medium-emphasis mt-1">Matched Users</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="xl" elevation="0" border class="pa-4 text-center">
          <div
            class="text-h4 font-weight-bold"
            :class="previewResult.unmatched > 0 ? 'text-error' : 'text-success'"
          >
            {{ previewResult.unmatched }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">Unmatched Users</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="xl" elevation="0" border class="pa-4 text-center">
          <div class="text-body-2 font-weight-medium text-truncate">
            {{ previewResult.deviceIp }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">Device IP</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Unmatched warning -->
    <v-alert
      v-if="previewResult && previewResult.unmatched > 0"
      type="warning"
      variant="tonal"
      rounded="xl"
      class="mb-5"
    >
      <strong>{{ previewResult.unmatched }} device user(s) not mapped</strong> — device IDs:
      <strong>{{ previewResult.unmappedDeviceUserIds.join(', ') }}</strong
      >. Go to User Management and set the <code>device_user_id</code> field for each user.
    </v-alert>

    <!-- Error banner -->
    <v-alert
      v-if="fetchError"
      type="error"
      variant="tonal"
      rounded="xl"
      class="mb-5"
      closable
      @click:close="fetchError = ''"
    >
      <strong>Failed to connect to device:</strong> {{ fetchError }}
    </v-alert>

    <!-- Sync result banner -->
    <v-alert
      v-if="syncResult"
      type="success"
      variant="tonal"
      rounded="xl"
      class="mb-5"
      closable
      @click:close="syncResult = null"
    >
      Sync complete —
      <strong>{{ syncResult.saved }}</strong> records saved,
      <strong>{{ syncResult.skipped }}</strong> skipped (unmapped),
      <strong>{{ syncResult.errors }}</strong> errors. (fetched {{ syncResult.fetched }} punches
      from device)
    </v-alert>

    <!-- Filter toolbar -->
    <v-card rounded="xl" elevation="0" border class="table-responsive-card">
      <div class="d-flex align-center px-4 py-3 ga-3 border-b table-toolbar flex-wrap">
        <v-btn-toggle v-model="statusFilter" rounded="lg" density="compact" mandatory>
          <v-btn value="all" size="small">{{ $t('common.all') }}</v-btn>
          <v-btn value="matched" size="small" color="success">{{
            $t('attendanceSync.matched')
          }}</v-btn>
          <v-btn value="unmatched" size="small" color="error">{{
            $t('attendanceSync.unmatched')
          }}</v-btn>
        </v-btn-toggle>
        <v-text-field
          v-model="dateFilter"
          type="date"
          density="compact"
          variant="outlined"
          rounded="lg"
          hide-details
          clearable
          style="max-width: 180px"
          :label="$t('attendanceSync.filterByDate')"
        ></v-text-field>
        <v-spacer></v-spacer>
        <span class="text-caption text-medium-emphasis">{{ filteredRecords.length }} records</span>
      </div>

      <v-data-table
        :headers="headers"
        :items="filteredRecords"
        :loading="isPreviewing"
        :hover="true"
        items-per-page="50"
      >
        <!-- Status chip -->
        <template #item.status="{ item }">
          <v-chip
            size="x-small"
            :color="item.status === 'matched' ? 'success' : 'error'"
            variant="tonal"
          >
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Device user ID -->
        <template #item.deviceUserId="{ item }">
          <span class="font-weight-medium">{{ item.deviceUserId }}</span>
        </template>

        <!-- System user -->
        <template #item.userName="{ item }">
          <div v-if="item.userName">
            <div class="text-body-2 font-weight-medium">{{ item.userName }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.userEmail }}</div>
          </div>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>

        <!-- Clock in -->
        <template #item.clockIn="{ item }">
          <span :class="item.clockIn ? '' : 'text-medium-emphasis'">
            {{ item.clockIn ?? '—' }}
          </span>
        </template>

        <!-- Clock out -->
        <template #item.clockOut="{ item }">
          <span :class="item.clockOut ? '' : 'text-medium-emphasis'">
            {{ item.clockOut ?? '—' }}
          </span>
        </template>

        <!-- All punches -->
        <template #item.allPunches="{ item }">
          <div class="d-flex flex-wrap ga-1 py-1">
            <v-chip
              v-for="(punch, index) in item.allPunches"
              :key="index"
              size="x-small"
              variant="tonal"
              color="default"
            >
              {{ punch }}
            </v-chip>
          </div>
        </template>

        <template #loading>
          <v-skeleton-loader type="table-row@8"></v-skeleton-loader>
        </template>

        <template #no-data>
          <div class="text-center py-10 text-medium-emphasis">
            <v-icon size="48" class="mb-3">mdi-clock-time-four-outline</v-icon>
            <div>Click <strong>Load Preview</strong> to fetch data from device</div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Sync confirmation dialog -->
    <v-dialog v-model="dialogSync" max-width="420px" persistent>
      <v-card rounded="xl">
        <v-card-title class="text-h6 px-6 pt-6">Confirm Sync</v-card-title>
        <v-card-text class="px-6">
          This will write
          <strong>{{ previewResult?.matched ?? 0 }} matched records</strong> into the
          <code>attendance_logs</code> table.
          <span v-if="previewResult && previewResult.unmatched > 0">
            <strong>{{ previewResult.unmatched }} unmatched</strong> records will be skipped.
          </span>
        </v-card-text>
        <div class="d-flex justify-end ga-3 px-6 py-4">
          <v-btn color="default" variant="text" rounded="lg" @click="dialogSync = false">{{
            $t('common.cancel')
          }}</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            rounded="lg"
            :loading="isSyncing"
            @click="confirmSync"
          >
            {{ $t('attendanceSync.syncNow') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type {
  DeviceInfo,
  PreviewRecord,
  PreviewResult,
  SyncResult,
} from '@/interfaces/models/AttendanceSyncModel'
import AttendanceSyncService from '@/services/AttendanceSyncService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.attendance-sync.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const deviceInfo = ref<DeviceInfo | null>(null)
const previewResult = ref<PreviewResult | null>(null)
const syncResult = ref<SyncResult | null>(null)
const fetchError = ref<string>('')
const isTesting = ref<boolean>(false)
const isPreviewing = ref<boolean>(false)
const isSyncing = ref<boolean>(false)
const dialogSync = ref<boolean>(false)
const statusFilter = ref<string>('all')
const dateFilter = ref<string>('')

const headers = ref([
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Device UID', key: 'deviceUserId', sortable: true },
  { title: 'System User', key: 'userName', sortable: false },
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Clock In', key: 'clockIn', sortable: true },
  { title: 'Clock Out', key: 'clockOut', sortable: true },
  { title: 'Punches', key: 'allPunches', sortable: false },
])
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const filteredRecords = computed<PreviewRecord[]>(() => {
  if (!previewResult.value) return []

  return previewResult.value.records.filter((record) => {
    const matchesStatus = statusFilter.value === 'all' || record.status === statusFilter.value
    const matchesDate = !dateFilter.value || record.date === dateFilter.value
    return matchesStatus && matchesDate
  })
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const testConnection = async () => {
  if (isTesting.value) return
  isTesting.value = true
  fetchError.value = ''

  try {
    deviceInfo.value = await AttendanceSyncService.getDeviceInfo()
  } catch (error: unknown) {
    const message =
      (error as { data?: { message?: string }; message?: string })?.data?.message ??
      (error as { message?: string })?.message ??
      'Unknown error'
    fetchError.value = message
    console.error('Failed to test connection:', error)
  } finally {
    isTesting.value = false
  }
}

const loadPreview = async () => {
  if (isPreviewing.value) return
  isPreviewing.value = true
  syncResult.value = null
  fetchError.value = ''

  try {
    previewResult.value = await AttendanceSyncService.preview()
  } catch (error: unknown) {
    const message =
      (error as { data?: { message?: string }; message?: string })?.data?.message ??
      (error as { message?: string })?.message ??
      'Unknown error'
    fetchError.value = message
    console.error('Failed to load preview:', error)
  } finally {
    isPreviewing.value = false
  }
}

const openSyncConfirm = () => {
  dialogSync.value = true
}

const confirmSync = async () => {
  if (isSyncing.value) return
  isSyncing.value = true

  try {
    syncResult.value = await AttendanceSyncService.trigger()
    dialogSync.value = false
    await loadPreview()
  } catch (error) {
    console.error('Failed to trigger sync:', error)
  } finally {
    isSyncing.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.table-toolbar {
  background-color: #f5ede4;
}
</style>
