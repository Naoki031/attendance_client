<template>
  <v-container class="pa-4" max-width="1400">
    <div class="text-h6 font-weight-bold text-primary mb-4">{{ $t('attendanceLogs.title') }}</div>

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
      <v-col v-if="isSuperAdmin" cols="12" sm="4" md="3">
        <v-select
          v-model="selectedCompanyId"
          :items="[{ name: $t('common.all'), id: null }, ...companies]"
          item-title="name"
          item-value="id"
          :label="$t('profile.company')"
          variant="filled"
          rounded="lg"
          flat
          density="comfortable"
          hide-details
          clearable
        />
      </v-col>
      <v-col cols="12" sm="4" md="3">
        <v-text-field
          v-model="searchUser"
          :label="$t('common.search')"
          variant="filled"
          rounded="lg"
          flat
          density="comfortable"
          hide-details
          prepend-inner-icon="mdi-magnify"
          clearable
        />
      </v-col>
      <v-col cols="12" sm="auto" class="d-flex align-center ga-2">
        <v-btn
          color="primary"
          variant="tonal"
          rounded="lg"
          prepend-icon="mdi-refresh"
          :loading="isLoading"
          @click="fetchLogs"
        >
          {{ $t('common.refresh') }}
        </v-btn>
        <v-btn
          color="action"
          variant="tonal"
          rounded="lg"
          prepend-icon="mdi-google-spreadsheet"
          :loading="isExporting"
          @click="openExportDialog"
        >
          {{ $t('attendanceLogs.exportToSheets') }}
        </v-btn>
        <span class="text-caption text-medium-emphasis">{{ filteredLogs.length }} records</span>
      </v-col>
    </v-row>

    <!-- Table -->
    <v-card rounded="xl" elevation="0" border class="table-responsive-card">
      <v-data-table
        :headers="tableHeaders"
        :items="filteredLogs"
        :items-per-page="50"
        :loading="isLoading"
        density="comfortable"
      >
        <!-- User -->
        <template #item.user="{ item }">
          <div class="d-flex align-center ga-2 py-1">
            <v-avatar size="28" color="primary" variant="tonal">
              <span class="text-caption font-weight-bold">
                {{ (item.user?.first_name?.[0] ?? '') + (item.user?.last_name?.[0] ?? '') }}
              </span>
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">
                {{ item.user?.full_name ?? `User #${item.user_id}` }}
              </div>
              <div class="text-caption text-medium-emphasis">{{ item.user?.email }}</div>
            </div>
          </div>
        </template>

        <!-- Date -->
        <template #item.date="{ item }">
          <span class="text-body-2">{{ item.date }}</span>
        </template>

        <!-- Scheduled hours -->
        <template #item.scheduled="{ item }">
          <div v-if="item.scheduled_start && item.scheduled_end" class="d-flex flex-column">
            <span class="text-caption">{{ item.scheduled_start }} – {{ item.scheduled_end }}</span>
            <v-chip
              :color="item.schedule_type === 'custom' ? 'deep-purple' : 'blue-grey'"
              size="x-small"
              variant="tonal"
              class="mt-1"
            >
              {{ item.schedule_type === 'custom' ? $t('common.custom') : $t('profile.company') }}
            </v-chip>
          </div>
          <span v-else class="text-medium-emphasis text-caption">—</span>
        </template>

        <!-- Clock In -->
        <template #item.clock_in="{ item }">
          <v-chip
            v-if="item.clock_in"
            color="success"
            size="x-small"
            variant="tonal"
            prepend-icon="mdi-login"
          >
            {{ item.clock_in.substring(0, 5) }}
          </v-chip>
          <span v-else class="text-medium-emphasis text-caption">—</span>
        </template>

        <!-- Clock Out -->
        <template #item.clock_out="{ item }">
          <v-chip
            v-if="item.clock_out"
            color="error"
            size="x-small"
            variant="tonal"
            prepend-icon="mdi-logout"
          >
            {{ item.clock_out.substring(0, 5) }}
          </v-chip>
          <span v-else class="text-medium-emphasis text-caption">—</span>
        </template>

        <!-- Duration -->
        <template #item.duration="{ item }">
          <span v-if="item.clock_in && item.clock_out" class="text-body-2">
            {{ calcDuration(item.clock_in, item.clock_out) }}
          </span>
          <span v-else class="text-medium-emphasis text-caption">—</span>
        </template>

        <!-- Count -->
        <template #item.attendance_count="{ item }">
          <v-chip
            :color="item.attendance_count > 0 ? 'success' : 'default'"
            size="x-small"
            variant="tonal"
          >
            {{ item.attendance_count }}
          </v-chip>
        </template>

        <!-- Status -->
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item)" size="x-small" variant="tonal">
            {{ statusLabel(item) }}
          </v-chip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex ga-1">
            <v-btn
              icon="mdi-history"
              size="x-small"
              variant="tonal"
              color="secondary"
              rounded="lg"
              class="btn-shine"
              :title="$t('attendanceLogs.historyTitle')"
              @click="openHistoryDialog(item)"
            />
            <!-- Face check-in image: only shown when image exists -->
            <v-btn
              v-if="item.checkin_image_url"
              icon="mdi-face-recognition"
              size="x-small"
              variant="text"
              color="action"
              :title="$t('attendanceLogs.checkinImageTitle')"
              @click="openCheckinImageDialog(item)"
            />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- History dialog -->
    <DialogAttendanceLogHistory
      :item="historyLog"
      :dialog="historyDialog"
      @close-modal="historyDialog = false"
    />

    <!-- Face check-in image preview dialog -->
    <DialogCheckinImage
      :item="checkinImageLog"
      :dialog="checkinImageDialog"
      @close-modal="checkinImageDialog = false"
    />

    <!-- Export dialog -->
    <v-dialog v-model="exportDialog" max-width="480px" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-h6 font-weight-bold">{{
          $t('attendanceLogs.exportToSheets')
        }}</v-card-title>
        <v-card-subtitle class="px-6 pb-0 text-caption text-medium-emphasis">
          {{ $t('attendanceLogs.exportSubtitle') }}
        </v-card-subtitle>
        <v-card-text class="pa-6">
          <v-row dense>
            <v-col cols="6">
              <v-select
                v-model="exportMonth"
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
            <v-col cols="6">
              <v-select
                v-model="exportYear"
                :items="yearOptions"
                :label="$t('requests.filterByYear')"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                hide-details
              />
            </v-col>
            <v-col cols="12" class="mt-2">
              <v-select
                v-model="exportCompanyId"
                :items="companies"
                item-title="name"
                item-value="id"
                :label="$t('profile.company')"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                hide-details
              />
            </v-col>
          </v-row>
          <v-alert
            v-if="exportError"
            type="error"
            variant="tonal"
            rounded="lg"
            class="mt-3"
            density="compact"
          >
            {{ exportError }}
          </v-alert>
          <v-alert
            v-if="exportSuccess"
            type="success"
            variant="tonal"
            rounded="lg"
            class="mt-3"
            density="compact"
          >
            {{ $t('attendanceLogs.exportSuccess') }}
            <a
              :href="exportSheetUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-decoration-none font-weight-medium ml-1"
              >{{ $t('attendanceLogs.openSheet') }}</a
            >
          </v-alert>
        </v-card-text>
        <div class="d-flex justify-end ga-2 px-6 py-4">
          <v-btn variant="text" rounded="lg" @click="closeExportDialog">{{
            $t('common.cancel')
          }}</v-btn>
          <v-btn
            color="action"
            variant="elevated"
            rounded="lg"
            :loading="isExporting"
            :disabled="!exportCompanyId"
            @click="doExport"
          >
            {{ $t('attendanceLogs.export') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { AttendanceLogModel } from '@/interfaces/models/AttendanceLogModel'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import AttendanceLogService from '@/services/AttendanceLogService'
import CompanyService from '@/services/CompanyService'
import { useUserStore } from '@/stores/user'
import DialogAttendanceLogHistory from '~/components/attendance_logs/DialogAttendanceLogHistory.vue'
import DialogCheckinImage from '~/components/attendance_logs/DialogCheckinImage.vue'
/* END IMPORT */

const { t } = useI18n()
const userStore = useUserStore()
const isSuperAdmin = computed(() => userStore.isSuperAdmin)

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.attendance-logs.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const { moment } = useMoment()
const logs = ref<AttendanceLogModel[]>([])
const isLoading = ref<boolean>(false)
const searchUser = ref<string>('')

const now = moment()
const selectedMonth = ref(now.month() + 1)
const selectedYear = ref(now.year())

const companies = ref<CompanyModel[]>([])
const selectedCompanyId = ref<number | null>(null)
const historyDialog = ref<boolean>(false)
const historyLog = ref<AttendanceLogModel | null>(null)
const checkinImageDialog = ref<boolean>(false)
const checkinImageLog = ref<AttendanceLogModel | null>(null)

const exportDialog = ref<boolean>(false)
const isExporting = ref<boolean>(false)
const exportMonth = ref(now.month() + 1)
const exportYear = ref(now.year())
const exportCompanyId = ref<number | null>(null)
const exportError = ref<string>('')
const exportSuccess = ref<boolean>(false)
const exportSheetUrl = ref<string>('')

const monthOptions = computed(() =>
  Array.from({ length: 12 }, (_, index) => ({
    label: t(`months.${index + 1}`),
    value: index + 1,
  })),
)

const yearOptions = Array.from({ length: 3 }, (_, index) => now.year() - index)

const tableHeaders = computed(() => [
  { title: t('common.user'), key: 'user', sortable: false, minWidth: '200px' },
  { title: t('common.date'), key: 'date', sortable: true },
  { title: t('common.schedule'), key: 'scheduled', sortable: false },
  { title: t('attendanceLogs.clockIn'), key: 'clock_in', sortable: true },
  { title: t('attendanceLogs.clockOut'), key: 'clock_out', sortable: true },
  { title: t('common.duration'), key: 'duration', sortable: false },
  { title: t('attendanceLogs.attendanceCount'), key: 'attendance_count', sortable: true },
  { title: t('common.status'), key: 'status', sortable: false },
  { title: '', key: 'actions', sortable: false, width: '80px' },
])
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const filteredLogs = computed(() => {
  if (!searchUser.value.trim()) return logs.value
  const query = searchUser.value.toLowerCase()

  return logs.value.filter((log) => {
    const name = log.user?.full_name ?? `${log.user?.first_name} ${log.user?.last_name}`
    const email = log.user?.email ?? ''

    return name.toLowerCase().includes(query) || email.toLowerCase().includes(query)
  })
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const getDateRange = () => {
  const month = String(selectedMonth.value).padStart(2, '0')
  const year = selectedYear.value
  const lastDay = moment({ year, month: selectedMonth.value - 1 }).daysInMonth()

  return {
    from: `${year}-${month}-01`,
    to: `${year}-${month}-${lastDay}`,
  }
}

const fetchLogs = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    const { from, to } = getDateRange()
    const companyId = isSuperAdmin.value ? selectedCompanyId.value : null
    const data = await AttendanceLogService.getAll(from, to, companyId)
    logs.value = data
  } catch (error) {
    console.error('Failed to fetch attendance logs:', error)
  } finally {
    isLoading.value = false
  }
}

const calcDuration = (clockIn: string, clockOut: string): string => {
  const [inH, inM] = clockIn.split(':').map(Number)
  const [outH, outM] = clockOut.split(':').map(Number)
  const totalMinutes = outH! * 60 + outM! - (inH! * 60 + inM!) - 60 // Subtract 1 hour for lunch break
  if (totalMinutes <= 0) return '—'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

const statusLabel = (log: AttendanceLogModel): string => {
  if (!log.clock_in) return t('attendanceLogs.noRecord')
  if (!log.clock_out) return t('attendanceLogs.notClockedOut')

  return t('attendanceLogs.complete')
}

const statusColor = (log: AttendanceLogModel): string => {
  if (!log.clock_in) return 'error'
  if (!log.clock_out) return 'warning'

  return 'success'
}

const openHistoryDialog = (log: AttendanceLogModel) => {
  historyLog.value = log
  historyDialog.value = true
}

const openCheckinImageDialog = (log: AttendanceLogModel) => {
  checkinImageLog.value = log
  checkinImageDialog.value = true
}

const openExportDialog = () => {
  exportMonth.value = selectedMonth.value
  exportYear.value = selectedYear.value
  exportError.value = ''
  exportSuccess.value = false
  exportSheetUrl.value = ''
  exportDialog.value = true
}

const closeExportDialog = () => {
  exportDialog.value = false
}

const doExport = async () => {
  if (!exportCompanyId.value) return

  try {
    isExporting.value = true
    exportError.value = ''
    exportSuccess.value = false
    const month = `${exportYear.value}-${String(exportMonth.value).padStart(2, '0')}`
    const result = await AttendanceLogService.exportToSheet(exportCompanyId.value, month)
    exportSheetUrl.value = result.spreadsheetUrl
    exportSuccess.value = true
  } catch (error) {
    console.error('Failed to export to sheet:', error)
    exportError.value = 'Export failed. Please check Google Sheets configuration for this company.'
  } finally {
    isExporting.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch([selectedMonth, selectedYear, selectedCompanyId], () => {
  fetchLogs()
})
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(async () => {
  const data = await CompanyService.getAll()
  companies.value = Object.values(data)
  await fetchLogs()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
