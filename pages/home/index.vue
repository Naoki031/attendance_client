<template>
  <v-container class="py-8" max-width="1100">
    <!-- KYC banner -->
    <v-alert
      v-if="kycBanner && featureFaceCheckin"
      :color="kycBanner.color"
      :icon="kycBanner.icon"
      variant="tonal"
      rounded="xl"
      class="mb-6"
      density="comfortable"
    >
      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div>
          <div class="text-body-2 font-weight-bold">{{ kycBanner.title }}</div>
          <div class="text-caption text-medium-emphasis">{{ kycBanner.text }}</div>
        </div>
        <v-btn
          :color="kycBanner.color"
          variant="tonal"
          size="small"
          rounded="lg"
          prepend-icon="mdi-account-outline"
          :to="{ name: 'profile.index' }"
        >
          {{ $t('home.kycBanner.goToProfile') }}
        </v-btn>
      </div>
    </v-alert>

    <!-- Quick actions -->
    <div class="text-body-2 font-weight-bold text-medium-emphasis mb-3">
      {{ $t('home.quickActions').toUpperCase() }}
    </div>
    <v-row class="mb-6" align="stretch">
      <v-col cols="6" sm="4" md="2">
        <v-card
          rounded="xl"
          elevation="0"
          border
          class="pa-4 text-center quick-action-card"
          height="100%"
          @click="openRequest('wfh')"
        >
          <v-icon color="blue" size="28" class="mb-2">mdi-home-outline</v-icon>
          <div class="text-body-2 font-weight-semibold">{{ $t('requestType.wfh') }}</div>
          <div class="text-caption text-medium-emphasis">{{ $t('requestType.wfhDesc') }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <v-card
          rounded="xl"
          elevation="0"
          border
          class="pa-4 text-center quick-action-card"
          height="100%"
          @click="openRequest('off')"
        >
          <v-icon color="amber-darken-2" size="28" class="mb-2">mdi-umbrella-beach-outline</v-icon>
          <div class="text-body-2 font-weight-semibold">{{ $t('requestType.off') }}</div>
          <div class="text-caption text-medium-emphasis">{{ $t('requestType.offDesc') }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <v-card
          rounded="xl"
          elevation="0"
          border
          class="pa-4 text-center quick-action-card"
          height="100%"
          @click="openRequest('equipment')"
        >
          <v-icon color="cyan-darken-1" size="28" class="mb-2">mdi-laptop</v-icon>
          <div class="text-body-2 font-weight-semibold">{{ $t('requestType.equipment') }}</div>
          <div class="text-caption text-medium-emphasis">{{ $t('requestType.equipmentDesc') }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <v-card
          rounded="xl"
          elevation="0"
          border
          class="pa-4 text-center quick-action-card"
          height="100%"
          @click="openRequest('clock_forget')"
        >
          <v-icon color="deep-orange" size="28" class="mb-2">mdi-clock-alert-outline</v-icon>
          <div class="text-body-2 font-weight-semibold">{{ $t('requestType.clockForget') }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ $t('requestType.clockForgetDesc') }}
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <v-card
          rounded="xl"
          elevation="0"
          border
          class="pa-4 text-center quick-action-card"
          height="100%"
          @click="openRequest('overtime')"
        >
          <v-icon color="red" size="28" class="mb-2">mdi-fire</v-icon>
          <div class="text-body-2 font-weight-semibold">{{ $t('requestType.overtime') }}</div>
          <div class="text-caption text-medium-emphasis">{{ $t('requestType.overtimeDesc') }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="4" md="2">
        <v-card
          rounded="xl"
          elevation="0"
          border
          class="pa-4 text-center quick-action-card"
          height="100%"
          @click="openRequest('business_trip')"
        >
          <v-icon color="teal-darken-1" size="28" class="mb-2">mdi-briefcase-outline</v-icon>
          <div class="text-body-2 font-weight-semibold">{{ $t('requestType.businessTrip') }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ $t('requestType.businessTripDesc') }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Today's attendance widget -->
    <div class="text-body-2 font-weight-bold text-medium-emphasis mb-3">
      {{ $t('home.todayAttendance').toUpperCase() }}
    </div>
    <v-card rounded="xl" elevation="0" border class="mb-6 pa-4">
      <div v-if="todayStatus === null" class="d-flex align-center ga-2 text-medium-emphasis">
        <v-progress-circular
          size="16"
          width="2"
          indeterminate
          color="primary"
        ></v-progress-circular>
        <span class="text-body-2">{{ $t('common.loading') }}</span>
      </div>
      <div v-else class="d-flex align-center justify-space-between flex-wrap ga-3">
        <!-- Clock times display -->
        <div class="d-flex align-center ga-6">
          <div class="text-center">
            <div
              class="text-h6 font-weight-bold"
              :class="todayStatus.clockIn ? 'text-success' : 'text-medium-emphasis'"
            >
              {{ todayStatus.clockIn ? todayStatus.clockIn.substring(0, 5) : '—' }}
            </div>
            <div class="text-caption text-medium-emphasis">{{ $t('home.clockIn') }}</div>
          </div>
          <v-icon color="medium-emphasis">mdi-arrow-right</v-icon>
          <div class="text-center">
            <div
              class="text-h6 font-weight-bold"
              :class="todayStatus.clockOut ? 'text-primary' : 'text-medium-emphasis'"
            >
              {{ todayStatus.clockOut ? todayStatus.clockOut.substring(0, 5) : '—' }}
            </div>
            <div class="text-caption text-medium-emphasis">{{ $t('home.clockOut') }}</div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="d-flex align-center ga-2">
          <v-chip
            v-if="todayStatus.isWfhToday"
            size="small"
            color="blue"
            variant="tonal"
            prepend-icon="mdi-home-outline"
          >
            {{ $t('home.wfhToday') }}
          </v-chip>
          <template v-if="todayStatus.isWfhToday">
            <v-btn
              v-if="!todayStatus.clockIn"
              color="success"
              variant="elevated"
              rounded="lg"
              prepend-icon="mdi-login"
              :loading="isClockingIn"
              @click="handleClockIn"
            >
              {{ $t('home.clockIn') }}
            </v-btn>
            <v-btn
              v-else-if="!todayStatus.clockOut"
              color="primary"
              variant="elevated"
              rounded="lg"
              prepend-icon="mdi-logout"
              :loading="isClockingOut"
              @click="handleClockOut"
            >
              {{ $t('home.clockOut') }}
            </v-btn>
            <v-chip
              v-else
              size="small"
              color="success"
              variant="tonal"
              prepend-icon="mdi-check-circle"
            >
              {{ $t('home.doneForToday') }}
            </v-chip>
          </template>
          <div v-else class="d-flex align-center ga-2">
            <v-btn
              v-if="featureQrCheckin"
              variant="tonal"
              color="primary"
              rounded="lg"
              prepend-icon="mdi-qrcode-scan"
              class="btn-shine"
              @click="openQrScanner"
            >
              {{ $t('home.scanQr') }}
            </v-btn>
            <v-btn
              v-if="featureFaceCheckin && userStore.user?.kyc_status === 'approved'"
              variant="tonal"
              color="deep-purple"
              rounded="lg"
              prepend-icon="mdi-face-recognition"
              @click="faceCheckinOpen = true"
            >
              {{ $t('face.faceCheckin') }}
            </v-btn>
          </div>
        </div>
      </div>
    </v-card>

    <!-- Calendar + detail panel -->
    <v-row>
      <!-- Calendar -->
      <v-col cols="12" md="8">
        <CalendarGrid v-model="selectedDate" v-model:view="calendarView">
          <!-- Month view: name labels per request type -->
          <template #month-cell="{ cell }">
            <div v-if="cell.dateStr" class="calendar-names">
              <template
                v-for="entry in (wfhByDate.get(cell.dateStr) ?? []).slice(0, 2)"
                :key="'w-' + entry.name"
              >
                <span
                  class="calendar-name calendar-name--wfh"
                  :class="{ 'calendar-name--pending': entry.pending }"
                  >{{ entry.name }}</span
                >
              </template>
              <span
                v-if="(wfhByDate.get(cell.dateStr) ?? []).length > 2"
                class="calendar-name-overflow"
                >+{{ (wfhByDate.get(cell.dateStr) ?? []).length - 2 }}</span
              >
              <template
                v-for="entry in (offByDate.get(cell.dateStr) ?? []).slice(0, 2)"
                :key="'o-' + entry.name"
              >
                <span
                  class="calendar-name calendar-name--off"
                  :class="{ 'calendar-name--pending': entry.pending }"
                  >{{ entry.name }}</span
                >
              </template>
              <span
                v-if="(offByDate.get(cell.dateStr) ?? []).length > 2"
                class="calendar-name-overflow"
                >+{{ (offByDate.get(cell.dateStr) ?? []).length - 2 }}</span
              >
              <template
                v-for="entry in (overtimeByDate.get(cell.dateStr) ?? []).slice(0, 1)"
                :key="'ot-' + entry.name"
              >
                <span
                  class="calendar-name calendar-name--overtime"
                  :class="{ 'calendar-name--pending': entry.pending }"
                  >{{ entry.name }}</span
                >
              </template>
              <span
                v-if="(overtimeByDate.get(cell.dateStr) ?? []).length > 1"
                class="calendar-name-overflow"
                >+{{ (overtimeByDate.get(cell.dateStr) ?? []).length - 1 }}</span
              >
              <template
                v-for="entry in (businessTripByDate.get(cell.dateStr) ?? []).slice(0, 1)"
                :key="'bt-' + entry.name"
              >
                <span
                  class="calendar-name calendar-name--business-trip"
                  :class="{ 'calendar-name--pending': entry.pending }"
                  >{{ entry.name }}</span
                >
              </template>
              <span
                v-if="(businessTripByDate.get(cell.dateStr) ?? []).length > 1"
                class="calendar-name-overflow"
                >+{{ (businessTripByDate.get(cell.dateStr) ?? []).length - 1 }}</span
              >
            </div>
          </template>

          <!-- Week view: entries with icons and details -->
          <template #week-cell="{ cell }">
            <!-- WFH entries -->
            <div
              v-for="entry in wfhFullByDate.get(cell.dateStr) ?? []"
              :key="'w-' + entry.name"
              class="calendar-week-entry calendar-week-entry--wfh"
              :class="{ 'calendar-week-entry--pending': entry.pending }"
            >
              <div class="calendar-week-entry-row">
                <v-icon size="10">mdi-home-outline</v-icon>
                <span>{{ entry.name }}</span>
              </div>
            </div>
            <!-- Off entries -->
            <div
              v-for="entry in offFullByDate.get(cell.dateStr) ?? []"
              :key="'o-' + entry.name"
              class="calendar-week-entry calendar-week-entry--off"
              :class="{ 'calendar-week-entry--pending': entry.pending }"
            >
              <div class="calendar-week-entry-row">
                <v-icon size="10">mdi-umbrella-beach-outline</v-icon>
                <span>{{ entry.name }}</span>
              </div>
              <div v-if="entry.detail" class="calendar-week-entry-detail">
                {{ entry.detail }}
              </div>
            </div>
            <!-- OT entries -->
            <div
              v-for="entry in overtimeFullByDate.get(cell.dateStr) ?? []"
              :key="'ot-' + entry.name"
              class="calendar-week-entry calendar-week-entry--overtime"
              :class="{ 'calendar-week-entry--pending': entry.pending }"
            >
              <div class="calendar-week-entry-row">
                <v-icon size="10">mdi-fire</v-icon>
                <span>{{ entry.name }}</span>
              </div>
              <div v-if="entry.detail" class="calendar-week-entry-detail">
                {{ entry.detail }}
              </div>
            </div>
            <!-- Business trip entries -->
            <div
              v-for="entry in businessTripFullByDate.get(cell.dateStr) ?? []"
              :key="'bt-' + entry.name"
              class="calendar-week-entry calendar-week-entry--business-trip"
              :class="{ 'calendar-week-entry--pending': entry.pending }"
            >
              <div class="calendar-week-entry-row">
                <v-icon size="10">mdi-briefcase-outline</v-icon>
                <span>{{ entry.name }}</span>
              </div>
              <div v-if="entry.detail" class="calendar-week-entry-detail">
                {{ entry.detail }}
              </div>
            </div>
          </template>

          <!-- Legend -->
          <template #footer>
            <div class="d-flex align-center ga-1">
              <span class="calendar-name calendar-name--wfh">{{ $t('requestType.wfh') }}</span>
            </div>
            <div class="d-flex align-center ga-1">
              <span class="calendar-name calendar-name--off">{{ $t('home.offLabel') }}</span>
            </div>
            <div class="d-flex align-center ga-1">
              <span class="calendar-name calendar-name--overtime">{{ $t('home.otLabel') }}</span>
            </div>
            <div class="d-flex align-center ga-1">
              <span class="calendar-name calendar-name--business-trip">{{
                $t('requestType.businessTrip')
              }}</span>
            </div>
            <div class="d-flex align-center ga-1">
              <span class="calendar-name calendar-name--wfh calendar-name--pending">{{
                $t('home.pendingLabel')
              }}</span>
            </div>
          </template>
        </CalendarGrid>
      </v-col>

      <!-- Side panel: QR (admin) + selected day summary + quick links -->
      <v-col cols="12" md="4">
        <!-- QR Clock widget — admin only -->
        <template v-if="userStore.isAdmin">
          <v-card rounded="xl" elevation="0" border class="mb-4">
            <div class="d-flex align-center justify-space-between px-4 py-3">
              <div class="text-caption font-weight-bold text-medium-emphasis">
                {{ $t('qrClock.title').toUpperCase() }}
              </div>
              <v-btn
                icon
                size="x-small"
                variant="text"
                color="primary"
                :loading="isLoadingQr"
                @click="loadHomeQr"
              >
                <v-icon size="16">mdi-refresh</v-icon>
              </v-btn>
            </div>
            <v-divider></v-divider>
            <div class="d-flex flex-column align-center pa-4 ga-2">
              <canvas ref="homeQrCanvas" class="home-qr-canvas"></canvas>
              <div class="text-caption text-medium-emphasis">
                {{ homeQrData?.date ?? '—' }}
              </div>
              <div class="text-caption text-medium-emphasis text-center">
                {{ $t('qrClock.scanInstruction') }}
              </div>
            </div>
          </v-card>
        </template>

        <!-- Selected day detail — 3-column approved summary -->
        <v-card rounded="xl" elevation="0" border class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-bold">
            <v-icon size="16" color="primary" class="mr-1">mdi-calendar-today</v-icon>
            {{ selectedDate ?? $t('home.selectDate') }}
          </v-card-title>
          <v-divider></v-divider>

          <div class="pa-3 day-summary-sections">
            <!-- WFH section -->
            <div class="day-summary-section">
              <div class="day-summary-header text-caption font-weight-bold text-blue">
                <v-icon size="12" color="blue" class="mr-1">mdi-home-outline</v-icon>
                {{ $t('requestType.wfh') }}
                <span class="text-medium-emphasis font-weight-regular ms-1"
                  >({{ selectedDayWfhUsers.length }})</span
                >
              </div>
              <div
                v-if="selectedDayWfhUsers.length === 0"
                class="text-caption text-medium-emphasis pl-1"
              >
                —
              </div>
              <div v-else class="day-summary-list">
                <div
                  v-for="name in selectedDayWfhUsers"
                  :key="name"
                  class="day-summary-row text-caption"
                >
                  <span class="day-summary-dot bg-blue"></span>{{ name }}
                </div>
              </div>
            </div>

            <!-- Leave section -->
            <div class="day-summary-section">
              <div class="day-summary-header text-caption font-weight-bold text-amber-darken-2">
                <v-icon size="12" color="amber-darken-2" class="mr-1"
                  >mdi-umbrella-beach-outline</v-icon
                >
                {{ $t('requestType.off') }}
                <span class="text-medium-emphasis font-weight-regular ms-1"
                  >({{ selectedDayOffUsers.length }})</span
                >
              </div>
              <div
                v-if="selectedDayOffUsers.length === 0"
                class="text-caption text-medium-emphasis pl-1"
              >
                —
              </div>
              <div v-else class="day-summary-list">
                <div
                  v-for="entry in selectedDayOffUsers"
                  :key="entry.name"
                  class="day-summary-row text-caption"
                >
                  <span class="day-summary-dot bg-amber-darken-2"></span>
                  <span>{{ entry.name }}</span>
                  <span class="text-medium-emphasis ms-1">· {{ entry.timeLabel }}</span>
                </div>
              </div>
            </div>

            <!-- Overtime section -->
            <div class="day-summary-section">
              <div class="day-summary-header text-caption font-weight-bold text-red">
                <v-icon size="12" color="red" class="mr-1">mdi-fire</v-icon>
                {{ $t('requestType.overtime') }}
                <span class="text-medium-emphasis font-weight-regular ms-1"
                  >({{ selectedDayOvertimeUsers.length }})</span
                >
              </div>
              <div
                v-if="selectedDayOvertimeUsers.length === 0"
                class="text-caption text-medium-emphasis pl-1"
              >
                —
              </div>
              <div v-else class="day-summary-list">
                <div
                  v-for="name in selectedDayOvertimeUsers"
                  :key="name"
                  class="day-summary-row text-caption"
                >
                  <span class="day-summary-dot bg-red"></span>{{ name }}
                </div>
              </div>
            </div>

            <!-- Business trip section -->
            <div class="day-summary-section">
              <div class="day-summary-header text-caption font-weight-bold text-teal-darken-1">
                <v-icon size="12" color="teal-darken-1" class="mr-1">mdi-briefcase-outline</v-icon>
                {{ $t('requestType.businessTrip') }}
                <span class="text-medium-emphasis font-weight-regular ms-1"
                  >({{ selectedDayBusinessTripUsers.length }})</span
                >
              </div>
              <div
                v-if="selectedDayBusinessTripUsers.length === 0"
                class="text-caption text-medium-emphasis pl-1"
              >
                —
              </div>
              <div v-else class="day-summary-list">
                <div
                  v-for="entry in selectedDayBusinessTripUsers"
                  :key="entry.name"
                  class="day-summary-row text-caption"
                >
                  <span class="day-summary-dot bg-teal-darken-1"></span>
                  <span>{{ entry.name }}</span>
                  <span v-if="entry.destination" class="text-medium-emphasis ms-1"
                    >· {{ entry.destination }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </v-card>

        <!-- Quick links -->
        <v-card rounded="xl" elevation="0" border>
          <v-card-title class="pa-4 pb-2 text-body-2 font-weight-bold">{{
            $t('home.quickLinks')
          }}</v-card-title>
          <v-divider></v-divider>
          <v-list density="compact" nav class="pa-2">
            <v-list-item
              rounded="lg"
              :to="{ name: 'profile.index' }"
              prepend-icon="mdi-account-outline"
            >
              <v-list-item-title class="text-body-2">{{ $t('home.myProfile') }}</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="userStore.isAdmin"
              rounded="lg"
              :to="{ name: 'admin.approvals.index' }"
              prepend-icon="mdi-check-circle-outline"
            >
              <v-list-item-title class="text-body-2">{{
                $t('home.approvalsLink')
              }}</v-list-item-title>
              <template v-if="pendingApprovalsCount > 0" #append>
                <v-badge :content="pendingApprovalsCount" color="error" inline></v-badge>
              </template>
            </v-list-item>
            <v-list-item
              v-if="userStore.isAdmin"
              rounded="lg"
              :to="{ name: 'admin.users.index' }"
              prepend-icon="mdi-account-multiple-outline"
            >
              <v-list-item-title class="text-body-2">{{
                $t('home.userManagement')
              }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Employee request dialog -->
    <DialogCreateRequest
      v-if="requestDialog"
      :type="requestType"
      :dialog="requestDialog"
      @confirm="onRequestConfirm"
      @close-modal="requestDialog = false"
    />

    <!-- QR Scanner dialog -->
    <QrScannerDialog
      v-if="qrScannerOpen"
      :dialog="qrScannerOpen"
      @scanned="onQrScanned"
      @close="qrScannerOpen = false"
    />

    <!-- Face Check-in dialog -->
    <v-dialog v-model="faceCheckinOpen" max-width="480" persistent>
      <FaceCheckin @success="onFaceCheckinSuccess" @close="faceCheckinOpen = false" />
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import QRCode from 'qrcode'
import DialogCreateRequest from '@/components/employee_requests/DialogCreateRequest.vue'
import QrScannerDialog from '@/components/qr/QrScannerDialog.vue'
import FaceCheckin from '@/components/face/FaceCheckin.vue'
import CalendarGrid from '@/components/common/CalendarGrid.vue'
import EmployeeRequestService from '@/services/EmployeeRequestService'
import AttendanceLogsService from '@/services/AttendanceLogsService'
import { useApprovalsStore } from '@/stores/approvals'
import type {
  EmployeeRequestModel,
  EmployeeRequestType,
} from '@/interfaces/models/EmployeeRequestModel'
import type { TodayStatusModel, TodayQrModel } from '@/interfaces/models/AttendanceLogModel'
import { useSocketEvent } from '@/composables/useSocket'
import { useFeatureFlags } from '@/composables/useFeatureFlags'
import type { CalendarView } from '@/types'
import { enumerateDates, extractTime, mapRequestsByDate } from '@/utils/calendar'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  layout: 'default',
  name: 'home',
})
/* END DEFINE NAME COMPONENT */

/** START DEFINE STATE */
const { moment, TIMEZONE } = useMoment()
const { t } = useI18n()

const userStore = useUserStore()
const approvalsStore = useApprovalsStore()
const {
  load: loadFeatureFlags,
  qrCheckin: featureQrCheckin,
  faceCheckin: featureFaceCheckin,
} = useFeatureFlags()
const requestDialog = ref(false)
const requestType = ref<EmployeeRequestType>('wfh')
const allRequests = ref<EmployeeRequestModel[]>([])

const todayVn = moment().tz(TIMEZONE)
const selectedDate = ref<string>(todayVn.format('YYYY-MM-DD'))
const calendarView = ref<CalendarView>('week')

const todayStatus = ref<TodayStatusModel | null>(null)
const isClockingIn = ref<boolean>(false)
const isClockingOut = ref<boolean>(false)
const qrScannerOpen = ref<boolean>(false)
const faceCheckinOpen = ref<boolean>(false)

const homeQrCanvas = ref<HTMLCanvasElement | null>(null)
const homeQrData = ref<TodayQrModel | null>(null)
const isLoadingQr = ref<boolean>(false)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const selectedDateRequests = computed(() => {
  if (!selectedDate.value) return []

  return allRequests.value.filter((request) => {
    if (!request.from_datetime) return false
    // Exclude weekends for WFH and OFF, but NOT for OVERTIME (can work Sundays)
    const excludeWeekends =
      request.type === 'wfh' || request.type === 'off' || request.type === 'clock_forget'
    const dates = enumerateDates(request.from_datetime, request.to_datetime, excludeWeekends)

    return dates.includes(selectedDate.value)
  })
})

/** Approved WFH users on the selected date */
const selectedDayWfhUsers = computed(() =>
  selectedDateRequests.value
    .filter((request) => request.type === 'wfh' && request.status === 'approved')
    .map((request) => request.user?.full_name ?? 'Unknown'),
)

/** Approved Leave users on the selected date, with time label */
const selectedDayOffUsers = computed(() =>
  selectedDateRequests.value
    .filter((request) => request.type === 'off' && request.status === 'approved')
    .map((request) => {
      const toHour = request.to_datetime ? parseInt(request.to_datetime.substring(11, 13), 10) : 17
      const timeLabel =
        toHour >= 17
          ? t('home.offLabel')
          : `${extractTime(request.from_datetime)} – ${extractTime(request.to_datetime)}`

      return { name: request.user?.full_name ?? 'Unknown', timeLabel }
    }),
)

/** Approved Overtime users on the selected date */
const selectedDayOvertimeUsers = computed(() =>
  selectedDateRequests.value
    .filter((request) => request.type === 'overtime' && request.status === 'approved')
    .map((request) => request.user?.full_name ?? 'Unknown'),
)

/** Short-name maps for month view */
const wfhByDate = computed(() =>
  mapRequestsByDate(allRequests.value, {
    type: 'wfh',
    excludeWeekends: true,
    getName: (request) => request.user?.full_name?.trim().split(' ').at(-1) ?? '?',
  }),
)

const offByDate = computed(() =>
  mapRequestsByDate(allRequests.value, {
    type: 'off',
    excludeWeekends: true,
    getName: (request) => request.user?.full_name?.trim().split(' ').at(-1) ?? '?',
  }),
)

const overtimeByDate = computed(() =>
  mapRequestsByDate(allRequests.value, {
    type: 'overtime',
    getName: (request) => request.user?.full_name?.trim().split(' ').at(-1) ?? '?',
  }),
)

/** Full-name maps for week view */
const wfhFullByDate = computed(() =>
  mapRequestsByDate(allRequests.value, {
    type: 'wfh',
    excludeWeekends: true,
    getName: (request) => request.user?.full_name ?? '?',
  }),
)

const offFullByDate = computed(() =>
  mapRequestsByDate(allRequests.value, {
    type: 'off',
    excludeWeekends: true,
    getName: (request) => request.user?.full_name ?? '?',
    getDetail: (request) => {
      const toHour = request.to_datetime ? parseInt(request.to_datetime.substring(11, 13), 10) : 17

      return toHour >= 17
        ? t('home.offLabel')
        : `${extractTime(request.from_datetime)}–${extractTime(request.to_datetime)}`
    },
  }),
)

const overtimeFullByDate = computed(() =>
  mapRequestsByDate(allRequests.value, {
    type: 'overtime',
    getName: (request) => request.user?.full_name ?? '?',
    getDetail: (request) =>
      request.from_datetime && request.to_datetime
        ? `${extractTime(request.from_datetime)}–${extractTime(request.to_datetime)}`
        : t('home.otLabel'),
  }),
)

const businessTripByDate = computed(() =>
  mapRequestsByDate(allRequests.value, {
    type: 'business_trip',
    getName: (request) => request.user?.full_name?.trim().split(' ').at(-1) ?? '?',
  }),
)

const businessTripFullByDate = computed(() =>
  mapRequestsByDate(allRequests.value, {
    type: 'business_trip',
    getName: (request) => request.user?.full_name ?? '?',
    getDetail: (request) => request.trip_destination ?? undefined,
  }),
)

/** Approved Business Trip users on the selected date */
const selectedDayBusinessTripUsers = computed(() =>
  selectedDateRequests.value
    .filter((request) => request.type === 'business_trip' && request.status === 'approved')
    .map((request) => ({
      name: request.user?.full_name ?? 'Unknown',
      destination: request.trip_destination ?? '',
    })),
)

const pendingApprovalsCount = computed(() => approvalsStore.pendingCount)

const kycBanner = computed(() => {
  const status = userStore.user?.kyc_status
  if (status === 'approved') return null

  if (status === 'pending') {
    return {
      color: 'info',
      icon: 'mdi-clock-outline',
      title: t('home.kycBanner.pendingTitle'),
      text: t('home.kycBanner.pendingText'),
    }
  }

  if (status === 'rejected') {
    return {
      color: 'error',
      icon: 'mdi-face-recognition',
      title: t('home.kycBanner.rejectedTitle'),
      text: t('home.kycBanner.rejectedText'),
    }
  }

  // status is null — user has never registered
  return {
    color: 'warning',
    icon: 'mdi-face-recognition',
    title: t('home.kycBanner.notRegisteredTitle'),
    text: t('home.kycBanner.notRegisteredText'),
  }
})

const homeQrScanUrl = computed<string>(() => {
  if (!homeQrData.value || typeof window === 'undefined') return ''
  const { token, companyId, date } = homeQrData.value

  return `${window.location.origin}/clock?token=${token}&company=${companyId}&date=${date}`
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const openRequest = (type: EmployeeRequestType) => {
  requestType.value = type
  requestDialog.value = true
}

const onRequestConfirm = async () => {
  requestDialog.value = false
  await loadRequests()
}

const loadTodayStatus = async () => {
  try {
    todayStatus.value = await AttendanceLogsService.getTodayStatus()
  } catch (error) {
    console.error('Failed to load today status:', error)
  }
}

const handleClockIn = async () => {
  if (isClockingIn.value) return
  isClockingIn.value = true

  try {
    await AttendanceLogsService.clockIn()
    await loadTodayStatus()
  } catch (error) {
    console.error('Clock-in failed:', error)
  } finally {
    isClockingIn.value = false
  }
}

const handleClockOut = async () => {
  if (isClockingOut.value) return
  isClockingOut.value = true

  try {
    await AttendanceLogsService.clockOut()
    await loadTodayStatus()
  } catch (error) {
    console.error('Clock-out failed:', error)
  } finally {
    isClockingOut.value = false
  }
}

const loadRequests = async () => {
  try {
    allRequests.value = await EmployeeRequestService.getAllForCalendar()
  } catch (error) {
    console.error('Failed to load requests:', error)
  }
}

const openQrScanner = () => {
  qrScannerOpen.value = true
}

const onFaceCheckinSuccess = async () => {
  faceCheckinOpen.value = false
  await loadTodayStatus()
}

const renderHomeQr = async () => {
  if (!homeQrCanvas.value || !homeQrScanUrl.value) return
  await QRCode.toCanvas(homeQrCanvas.value, homeQrScanUrl.value, {
    width: 180,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  })
}

const loadHomeQr = async () => {
  if (isLoadingQr.value) return
  isLoadingQr.value = true

  try {
    homeQrData.value = await AttendanceLogsService.getTodayQr()
    await nextTick()
    await renderHomeQr()
  } catch (error) {
    console.error('Failed to load QR for home widget:', error)
  } finally {
    isLoadingQr.value = false
  }
}

const onQrScanned = (url: string) => {
  qrScannerOpen.value = false

  try {
    const parsed = new URL(url)

    if (parsed.pathname === '/clock' && parsed.searchParams.has('token')) {
      navigateTo(parsed.pathname + parsed.search)
    }
  } catch {
    console.error('Scanned QR does not contain a valid clock URL:', url)
  }
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  userStore.getUser()
  loadFeatureFlags()
  loadRequests()
  loadTodayStatus()

  if (userStore.isAdmin) {
    loadHomeQr()
  }
})

useSocketEvent<EmployeeRequestModel>('request:updated', () => {
  loadRequests()
})

useSocketEvent<EmployeeRequestModel>('request:created', () => {
  loadRequests()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.quick-action-card {
  cursor: pointer;
  transition: box-shadow 0.15s ease;
  min-height: 96px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.quick-action-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1) !important;
}

/* Calendar entry styles — used inside CalendarGrid slots */
.calendar-names {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
  width: 100%;
}

.calendar-name {
  font-size: clamp(8px, 1.5vw, 9px);
  font-weight: 600;
  line-height: 1.3;
  padding: 1px 3px;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Responsive calendar name labels on mobile */
@media (max-width: 480px) {
  .calendar-name {
    font-size: 8px;
    padding: 1px 2px;
  }

  .calendar-name-overflow {
    font-size: 8px;
  }
}

.calendar-name--wfh {
  background-color: rgba(33, 150, 243, 0.15);
  color: #1565c0;
}

.calendar-name--off {
  background-color: rgba(255, 179, 0, 0.18);
  color: #e65100;
}

.calendar-name--overtime {
  background-color: rgba(244, 67, 54, 0.12);
  color: #c62828;
}

.calendar-name--business-trip {
  background-color: rgba(0, 150, 136, 0.15);
  color: #00695c;
}

.calendar-name--pending {
  opacity: 0.6;
  font-style: italic;
}

.calendar-name-overflow {
  font-size: 9px;
  color: rgba(0, 0, 0, 0.45);
  padding-left: 2px;
}

.calendar-week-entry {
  font-size: 10px;
  font-weight: 500;
  line-height: 1.4;
  padding: 2px 4px;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.calendar-week-entry--pending {
  opacity: 0.65;
  border-left: 2px dashed currentColor;
}

.calendar-week-entry-row {
  display: flex;
  align-items: center;
  gap: 3px;
  overflow: hidden;
}

.calendar-week-entry--wfh {
  background-color: rgba(33, 150, 243, 0.12);
  color: #1565c0;
}

.calendar-week-entry--off {
  background-color: rgba(255, 179, 0, 0.15);
  color: #e65100;
}

.calendar-week-entry--overtime {
  background-color: rgba(244, 67, 54, 0.1);
  color: #c62828;
}

.calendar-week-entry--business-trip {
  background-color: rgba(0, 150, 136, 0.12);
  color: #00695c;
}

.calendar-week-entry-detail {
  color: rgba(0, 0, 0, 0.55);
  font-size: 9px;
  padding-left: 13px;
}

/* Day summary panel */
.day-summary-sections {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.day-summary-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.day-summary-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 4px;
  margin-bottom: 2px;
}

.day-summary-list {
  max-height: 100px;
  overflow-y: auto;
}

.day-summary-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
  line-height: 1.4;
}

.day-summary-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.home-qr-canvas {
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}
</style>
