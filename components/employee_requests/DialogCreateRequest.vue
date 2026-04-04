<template>
  <v-dialog :model-value="dialog" max-width="580px" persistent scrollable>
    <v-card rounded="xl" elevation="2">
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">{{ title }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ editItemId ? $t('requests.editSubtitle') : $t('requests.submitSubtitle') }}
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0">
        <v-container class="pa-0">
          <!-- Request type hint — shown only when creating a new request -->
          <v-alert
            v-if="!editItemId"
            variant="tonal"
            color="primary"
            density="compact"
            rounded="lg"
            class="mb-4 text-body-2"
            icon="mdi-information-outline"
          >
            {{ $t(`requests.hint.${type}`) }}
          </v-alert>

          <!-- ======================== OFF FORM ======================== -->
          <template v-if="type === 'off'">
            <div class="field-label">{{ $t('requests.leaveType').toUpperCase() }}</div>
            <v-select
              v-model="leaveType"
              :items="leaveTypeOptions"
              item-title="label"
              item-value="value"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              :error-messages="formErrors.leaveType ?? []"
            ></v-select>

            <v-row>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.startDate').toUpperCase() }}</div>
                <CommonDatePickerField
                  v-model="fromDate"
                  :error-messages="formErrors.fromDate ?? []"
                  disable-weekends
                />
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.startTime').toUpperCase() }}</div>
                <CommonTimePickerField
                  v-model="fromTime"
                  :error-messages="formErrors.fromTime ?? []"
                />
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.endDate').toUpperCase() }}</div>
                <CommonDatePickerField
                  v-model="toDate"
                  :error-messages="formErrors.toDate ?? []"
                  disable-weekends
                />
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.endTime').toUpperCase() }}</div>
                <CommonTimePickerField v-model="toTime" :error-messages="formErrors.toTime ?? []" />
              </v-col>
            </v-row>

            <div class="field-label">{{ $t('requests.unit').toUpperCase() }}</div>
            <v-text-field
              v-model="unitHours"
              type="number"
              min="0"
              step="0.5"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              :error-messages="formErrors.unitHours ?? []"
              :hint="$t('requests.unitHoursHint')"
              persistent-hint
            ></v-text-field>

            <div class="field-label mt-3">{{ $t('requests.reasonForLeave').toUpperCase() }}</div>
            <v-textarea
              v-model="reason"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              rows="3"
              no-resize
              :error-messages="formErrors.reason ?? []"
            ></v-textarea>

            <div class="field-label">{{ $t('common.note').toUpperCase() }}</div>
            <v-textarea
              v-model="note"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              rows="2"
              no-resize
            ></v-textarea>
          </template>

          <!-- ======================== EQUIPMENT FORM ======================== -->
          <template v-else-if="type === 'equipment'">
            <div class="field-label">{{ $t('requests.purpose').toUpperCase() }}</div>
            <v-textarea
              v-model="reason"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              rows="3"
              no-resize
              :error-messages="formErrors.reason ?? []"
            ></v-textarea>

            <v-row>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.borrowStart').toUpperCase() }}</div>
                <CommonDatePickerField
                  v-model="fromDate"
                  :error-messages="formErrors.fromDate ?? []"
                />
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.borrowEnd').toUpperCase() }}</div>
                <CommonDatePickerField v-model="toDate" :error-messages="formErrors.toDate ?? []" />
              </v-col>
            </v-row>

            <div class="field-label mt-3">{{ $t('requests.locationEquipment').toUpperCase() }}</div>
            <v-text-field
              v-model="location"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              placeholder="e.g. my home, office"
              autocomplete="off"
              :error-messages="formErrors.location ?? []"
            ></v-text-field>

            <v-row>
              <v-col cols="12" md="8">
                <div class="field-label">{{ $t('requests.equipmentName').toUpperCase() }}</div>
                <v-text-field
                  v-model="equipmentName"
                  variant="filled"
                  rounded="lg"
                  flat
                  density="comfortable"
                  :error-messages="formErrors.equipmentName ?? []"
                  autocomplete="off"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <div class="field-label">{{ $t('requests.quantity').toUpperCase() }}</div>
                <v-text-field
                  v-model="quantity"
                  type="number"
                  min="1"
                  variant="filled"
                  rounded="lg"
                  flat
                  density="comfortable"
                  :error-messages="formErrors.quantity ?? []"
                ></v-text-field>
              </v-col>
            </v-row>
          </template>

          <!-- ======================== CLOCK FORGET FORM ======================== -->
          <template v-else-if="type === 'clock_forget'">
            <div class="field-label">{{ $t('requests.clockType').toUpperCase() }}</div>
            <v-btn-toggle
              v-model="clockType"
              rounded="lg"
              density="compact"
              mandatory
              color="primary"
              class="mb-4"
            >
              <v-btn value="clock_in" size="small">
                <v-icon start size="16">mdi-login</v-icon>
                {{ $t('requests.clockIn') }}
              </v-btn>
              <v-btn value="clock_out" size="small">
                <v-icon start size="16">mdi-logout</v-icon>
                {{ $t('requests.clockOut') }}
              </v-btn>
            </v-btn-toggle>

            <div class="field-label">{{ $t('requests.dateForgotten').toUpperCase() }}</div>
            <CommonDatePickerField
              v-model="forgetDate"
              :error-messages="formErrors.forgetDate ?? []"
            />
          </template>

          <!-- ======================== OVERTIME FORM ======================== -->
          <template v-else-if="type === 'overtime'">
            <div class="field-label">{{ $t('requests.overtimeType').toUpperCase() }}</div>
            <v-select
              v-model="overtimeType"
              :items="overtimeTypeOptions"
              item-title="label"
              item-value="value"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              :error-messages="formErrors.overtimeType ?? []"
            ></v-select>

            <v-row>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.startDate').toUpperCase() }}</div>
                <CommonDatePickerField
                  v-model="fromDate"
                  :error-messages="formErrors.fromDate ?? []"
                />
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.startTime').toUpperCase() }}</div>
                <CommonTimePickerField
                  v-model="fromTime"
                  :error-messages="formErrors.fromTime ?? []"
                />
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.endDate').toUpperCase() }}</div>
                <CommonDatePickerField v-model="toDate" :error-messages="formErrors.toDate ?? []" />
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.endTime').toUpperCase() }}</div>
                <CommonTimePickerField v-model="toTime" :error-messages="formErrors.toTime ?? []" />
              </v-col>
            </v-row>

            <div class="field-label">{{ $t('requests.totalHoursOt').toUpperCase() }}</div>
            <v-text-field
              v-model="unitHours"
              type="number"
              min="0.25"
              step="0.25"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              :error-messages="formErrors.unitHours ?? []"
              :hint="$t('requests.totalHoursOtHint')"
              persistent-hint
            ></v-text-field>

            <div class="field-label mt-3">{{ $t('requests.reasonForOvertime').toUpperCase() }}</div>
            <v-textarea
              v-model="reason"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              rows="3"
              no-resize
              :error-messages="formErrors.reason ?? []"
            ></v-textarea>

            <div class="field-label">{{ $t('common.note').toUpperCase() }}</div>
            <v-textarea
              v-model="note"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              rows="2"
              no-resize
            ></v-textarea>
          </template>

          <!-- ======================== BUSINESS TRIP FORM ======================== -->
          <template v-else-if="type === 'business_trip'">
            <v-row>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.startDate').toUpperCase() }}</div>
                <CommonDatePickerField
                  v-model="fromDate"
                  :error-messages="formErrors.fromDate ?? []"
                />
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.startTime').toUpperCase() }}</div>
                <CommonTimePickerField
                  v-model="fromTime"
                  :error-messages="formErrors.fromTime ?? []"
                />
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.endDate').toUpperCase() }}</div>
                <CommonDatePickerField v-model="toDate" :error-messages="formErrors.toDate ?? []" />
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.endTime').toUpperCase() }}</div>
                <CommonTimePickerField v-model="toTime" :error-messages="formErrors.toTime ?? []" />
              </v-col>
            </v-row>

            <div class="field-label">{{ $t('requests.tripDestination').toUpperCase() }}</div>
            <v-text-field
              v-model="tripDestination"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              :error-messages="formErrors.tripDestination ?? []"
            ></v-text-field>

            <div class="field-label">{{ $t('requests.tripPurpose').toUpperCase() }}</div>
            <v-textarea
              v-model="reason"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              rows="3"
              no-resize
              :error-messages="formErrors.reason ?? []"
            ></v-textarea>

            <div class="field-label">{{ $t('common.note').toUpperCase() }}</div>
            <v-textarea
              v-model="note"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              rows="2"
              no-resize
            ></v-textarea>
          </template>

          <!-- ======================== WFH FORM ======================== -->
          <template v-else-if="type === 'wfh'">
            <v-row>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.startDate').toUpperCase() }}</div>
                <CommonDatePickerField
                  v-model="fromDate"
                  :error-messages="formErrors.fromDate ?? []"
                  disable-weekends
                />
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.startTime').toUpperCase() }}</div>
                <CommonTimePickerField
                  v-model="fromTime"
                  :error-messages="formErrors.fromTime ?? []"
                />
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.endDate').toUpperCase() }}</div>
                <CommonDatePickerField
                  v-model="toDate"
                  :error-messages="formErrors.toDate ?? []"
                  disable-weekends
                />
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('requests.endTime').toUpperCase() }}</div>
                <CommonTimePickerField v-model="toTime" :error-messages="formErrors.toTime ?? []" />
              </v-col>
            </v-row>

            <div class="field-label">{{ $t('requests.reason').toUpperCase() }}</div>
            <v-textarea
              v-model="reason"
              variant="filled"
              rounded="lg"
              flat
              density="comfortable"
              rows="3"
              no-resize
              :error-messages="formErrors.reason ?? []"
            ></v-textarea>
          </template>

          <!-- ======================== CC (all types) ======================== -->
          <div class="field-label mt-2">{{ $t('requests.ccIndividuals').toUpperCase() }}</div>
          <v-autocomplete
            v-model="ccUserIds"
            :items="nonApproverUsers"
            :item-title="
              (user: UserModel) => user.full_name || `${user.first_name} ${user.last_name}`
            "
            item-value="id"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            multiple
            closable-chips
            chips
            :loading="isLoadingUsers"
            :hint="$t('requests.ccHint')"
            persistent-hint
          ></v-autocomplete>

          <div class="field-label mt-3">{{ $t('requests.ccGroups').toUpperCase() }}</div>
          <v-autocomplete
            v-model="ccGroupIds"
            :items="availableGroups"
            item-title="name"
            item-value="id"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            multiple
            closable-chips
            chips
            :loading="isLoadingGroups"
            :hint="$t('requests.ccGroupsHint')"
            persistent-hint
          ></v-autocomplete>
        </v-container>
      </v-card-text>

      <div class="d-flex justify-end ga-3 px-6 py-4">
        <v-btn color="default" variant="text" rounded="lg" @click="close">{{
          $t('common.cancel')
        }}</v-btn>
        <v-btn color="primary" variant="elevated" rounded="lg" :loading="isSaving" @click="confirm">
          {{ editItemId ? $t('common.save') : $t('requests.submitRequest') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** start import */
import type { PropType } from 'vue'
import type {
  EmployeeRequestModel,
  EmployeeRequestType,
  LeaveType,
  ClockType,
  OvertimeType,
} from '@/interfaces/models/EmployeeRequestModel'
import type { UserModel } from '@/interfaces/models/UserModel'
import type { GroupModel } from '@/interfaces/models/GroupModel'
import EmployeeRequestService from '@/services/EmployeeRequestService'
import UserService from '@/services/UserService'
import GroupService from '@/services/GroupService'
import CompanyService from '@/services/CompanyService'
/* end import */

/** start define property and emits */
const props = defineProps({
  type: {
    type: String as PropType<EmployeeRequestType>,
    required: true,
  },
  dialog: {
    type: Boolean,
    required: true,
  },
  /** Pre-fills the form. When combined with editItemId, enables edit mode. For reuse, leave editItemId null. */
  initialData: {
    type: Object as PropType<EmployeeRequestModel | null>,
    required: false,
    default: null,
  },
  /** When set, the dialog operates in edit mode and calls PATCH instead of POST. */
  editItemId: {
    type: Number as PropType<number | null>,
    required: false,
    default: null,
  },
})
const emit = defineEmits(['confirm', 'close-modal'])
/* end define property and emits */

const { moment, TIMEZONE } = useMoment()

/** start defined state */
const fromDate = ref<string>('')
const fromTime = ref<string>('08:00')
const toDate = ref<string>('')
const toTime = ref<string>('17:00')
const reason = ref<string>('')
const note = ref<string>('')
const leaveType = ref<LeaveType | ''>('')
const unitHours = ref<number | null>(null)
const location = ref<string>('')
const equipmentName = ref<string>('')
const quantity = ref<number | null>(null)
const clockType = ref<ClockType>('clock_in')
const forgetDate = ref<string>('')
const overtimeType = ref<OvertimeType | ''>('')
const tripDestination = ref<string>('')
const ccUserIds = ref<number[]>([])
const ccGroupIds = ref<number[]>([])
const isSaving = ref(false)
const submitted = ref(false)
const availableUsers = ref<UserModel[]>([])
const isLoadingUsers = ref(false)
const approverIds = ref<Set<number>>(new Set())
const availableGroups = ref<GroupModel[]>([])
const isLoadingGroups = ref(false)

const { t } = useI18n()

const leaveTypeOptions = computed(() => [
  { label: t('requests.leaveTypes.paidLeave'), value: 'paid_leave' },
  { label: t('requests.leaveTypes.unpaidLeave'), value: 'unpaid_leave' },
  { label: t('requests.leaveTypes.womanLeave'), value: 'woman_leave' },
  { label: t('requests.leaveTypes.marriageLeave'), value: 'marriage_leave' },
  { label: t('requests.leaveTypes.maternityLeave'), value: 'maternity_leave' },
  { label: t('requests.leaveTypes.paternityLeave'), value: 'paternity_leave' },
  { label: t('requests.leaveTypes.compassionateLeave'), value: 'compassionate_leave' },
])

const overtimeTypeOptions = computed(() => [
  { label: t('requests.overtimeTypes.weekday'), value: 'weekday' },
  { label: t('requests.overtimeTypes.weekend'), value: 'weekend' },
  { label: t('requests.overtimeTypes.publicHoliday'), value: 'public_holiday' },
])
/* end defined state */

/** start defined computed */

/** Exclude company approvers — they approve requests, not CC recipients */
const nonApproverUsers = computed(() =>
  availableUsers.value.filter((user) => !approverIds.value.has(user.id)),
)

const formErrors = computed<Record<string, string[]>>(() => {
  if (!submitted.value) return {}
  const errors: Record<string, string[]> = {}
  const required = (value: unknown, key: string, messageKey: string) => {
    if (!value || String(value).trim() === '') errors[key] = [t(messageKey)]
  }

  const dateOrderInvalid = (
    from: string,
    to: string,
    fromTimeValue: string,
    toTimeValue: string,
  ) => {
    if (!from || !to) return false
    if (to < from) return true
    if (to === from && fromTimeValue && toTimeValue && toTimeValue <= fromTimeValue) return true
    return false
  }

  if (props.type === 'off') {
    required(leaveType.value, 'leaveType', 'validation.leaveTypeRequired')
    required(fromDate.value, 'fromDate', 'validation.startDateRequired')
    required(fromTime.value, 'fromTime', 'validation.startTimeRequired')
    required(toDate.value, 'toDate', 'validation.endDateRequired')
    required(toTime.value, 'toTime', 'validation.endTimeRequired')
    if (dateOrderInvalid(fromDate.value, toDate.value, fromTime.value, toTime.value))
      errors.toDate = [t('validation.endDateTimeAfterStart')]
    required(unitHours.value, 'unitHours', 'validation.unitHoursRequired')
    required(reason.value, 'reason', 'validation.reasonRequired')
  } else if (props.type === 'wfh') {
    required(fromDate.value, 'fromDate', 'validation.startDateRequired')
    required(fromTime.value, 'fromTime', 'validation.startTimeRequired')
    required(toDate.value, 'toDate', 'validation.endDateRequired')
    required(toTime.value, 'toTime', 'validation.endTimeRequired')
    if (dateOrderInvalid(fromDate.value, toDate.value, fromTime.value, toTime.value))
      errors.toDate = [t('validation.endDateTimeAfterStart')]
    required(reason.value, 'reason', 'validation.reasonRequired')
  } else if (props.type === 'equipment') {
    required(reason.value, 'reason', 'validation.reasonRequired')
    required(fromDate.value, 'fromDate', 'validation.startDateRequired')
    required(toDate.value, 'toDate', 'validation.endDateRequired')
    if (dateOrderInvalid(fromDate.value, toDate.value, '', ''))
      errors.toDate = [t('validation.endDateNotBeforeStart')]
    required(equipmentName.value, 'equipmentName', 'validation.equipmentNameRequired')
    required(quantity.value, 'quantity', 'validation.quantityRequired')
    required(location.value, 'location', 'validation.locationRequired')
  } else if (props.type === 'clock_forget') {
    required(forgetDate.value, 'forgetDate', 'validation.dateForgottenRequired')
  } else if (props.type === 'overtime') {
    required(overtimeType.value, 'overtimeType', 'validation.overtimeTypeRequired')
    required(fromDate.value, 'fromDate', 'validation.startDateRequired')
    required(fromTime.value, 'fromTime', 'validation.startTimeRequired')
    required(toDate.value, 'toDate', 'validation.endDateRequired')
    required(toTime.value, 'toTime', 'validation.endTimeRequired')
    if (dateOrderInvalid(fromDate.value, toDate.value, fromTime.value, toTime.value))
      errors.toDate = [t('validation.endDateTimeAfterStart')]
    required(unitHours.value, 'unitHours', 'validation.totalHoursRequired')
    required(reason.value, 'reason', 'validation.reasonRequired')
  } else if (props.type === 'business_trip') {
    required(fromDate.value, 'fromDate', 'validation.startDateRequired')
    required(fromTime.value, 'fromTime', 'validation.startTimeRequired')
    required(toDate.value, 'toDate', 'validation.endDateRequired')
    required(toTime.value, 'toTime', 'validation.endTimeRequired')
    if (dateOrderInvalid(fromDate.value, toDate.value, fromTime.value, toTime.value))
      errors.toDate = [t('validation.endDateTimeAfterStart')]
    required(tripDestination.value, 'tripDestination', 'validation.tripDestinationRequired')
    required(reason.value, 'reason', 'validation.reasonRequired')
  }

  return errors
})

const isFormValid = computed(() => Object.keys(formErrors.value).length === 0)

const title = computed(() => {
  const createLabels: Record<EmployeeRequestType, string> = {
    wfh: t('requests.workFromHomeRequest'),
    off: t('requests.leaveRequest'),
    equipment: t('requests.equipmentRequest'),
    clock_forget: t('requests.clockForgetRequest'),
    overtime: t('requests.overtimeRequest'),
    business_trip: t('requests.businessTripRequest'),
  }
  const editLabels: Record<EmployeeRequestType, string> = {
    wfh: t('requests.editWfhRequest'),
    off: t('requests.editLeaveRequest'),
    equipment: t('requests.editEquipmentRequest'),
    clock_forget: t('requests.editClockForgetRequest'),
    overtime: t('requests.editOvertimeRequest'),
    business_trip: t('requests.editBusinessTripRequest'),
  }
  return props.editItemId
    ? (editLabels[props.type] ?? t('requests.editRequest'))
    : (createLabels[props.type] ?? t('requests.submitRequest'))
})

const combinedFromDatetime = computed(() => {
  if (!fromDate.value) return undefined
  return `${fromDate.value}T${fromTime.value || '00:00'}:00`
})

const combinedToDatetime = computed(() => {
  if (!toDate.value) return undefined
  return `${toDate.value}T${toTime.value || '00:00'}:00`
})
/* end defined computed */

/** start defined methods */
/**
 * Calculates working hours between two datetime strings in Vietnam timezone.
 * Working hours: 08:00–17:00, Mon–Fri, excluding lunch break 12:00–13:00.
 * Returns hours rounded to the nearest 0.25.
 */
const calculateWorkingHours = (
  fromDateString: string,
  fromTimeString: string,
  toDateString: string,
  toTimeString: string,
): number => {
  if (!fromDateString || !toDateString) return 0

  const from = moment.tz(
    `${fromDateString} ${fromTimeString || '08:00'}`,
    'YYYY-MM-DD HH:mm',
    TIMEZONE,
  )
  const to = moment.tz(`${toDateString} ${toTimeString || '17:00'}`, 'YYYY-MM-DD HH:mm', TIMEZONE)

  if (!from.isValid() || !to.isValid() || !from.isBefore(to)) return 0

  const WORK_START = 8 * 60
  const LUNCH_START = 12 * 60
  const LUNCH_END = 13 * 60
  const WORK_END = 17 * 60

  let totalMinutes = 0
  const cursor = from.clone().startOf('day').add(8, 'hours')

  // Start cursor at the actual from time if it's after 08:00 on the first day
  if (from.isAfter(cursor)) cursor.add(from.diff(cursor, 'minutes'), 'minutes')

  while (cursor.isBefore(to)) {
    const dayOfWeek = cursor.day() // 0=Sun, 6=Sat

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      cursor.add(1, 'day').startOf('day').add(8, 'hours')

      continue
    }

    const dayEnd = cursor.clone().startOf('day').add(17, 'hours')
    const periodEnd = to.isBefore(dayEnd) ? to.clone() : dayEnd.clone()

    const startMin = cursor.hours() * 60 + cursor.minutes()
    const endMin = periodEnd.hours() * 60 + periodEnd.minutes()
    const clampedStart = Math.max(startMin, WORK_START)
    const clampedEnd = Math.min(endMin, WORK_END)

    if (clampedEnd > clampedStart) {
      let worked = clampedEnd - clampedStart
      const lunchOverlapStart = Math.max(clampedStart, LUNCH_START)
      const lunchOverlapEnd = Math.min(clampedEnd, LUNCH_END)

      if (lunchOverlapEnd > lunchOverlapStart) {
        worked -= lunchOverlapEnd - lunchOverlapStart
      }

      totalMinutes += Math.max(0, worked)
    }

    cursor.add(1, 'day').startOf('day').add(8, 'hours')
  }

  return Math.round((totalMinutes / 60) * 4) / 4
}

const populateFromItem = (item: EmployeeRequestModel) => {
  if (item.from_datetime) {
    fromDate.value = item.from_datetime.substring(0, 10)
    fromTime.value = item.from_datetime.substring(11, 16) || '08:00'
  }

  if (item.to_datetime) {
    toDate.value = item.to_datetime.substring(0, 10)
    toTime.value = item.to_datetime.substring(11, 16) || '17:00'
  }

  reason.value = item.reason ?? ''
  note.value = item.note ?? ''
  leaveType.value = item.leave_type ?? ''
  unitHours.value = item.unit_hours ?? null
  location.value = item.location ?? ''
  equipmentName.value = item.equipment_name ?? ''
  quantity.value = item.quantity ?? null
  if (item.clock_type) clockType.value = item.clock_type
  forgetDate.value = item.forget_date ?? ''
  overtimeType.value = item.overtime_type ?? ''
  tripDestination.value = item.trip_destination ?? ''
  ccUserIds.value = item.cc_user_ids ?? []
}

const loadUsers = async () => {
  try {
    isLoadingUsers.value = true
    const userStore = useUserStore()
    const companyId = userStore.user?.user_departments?.[0]?.company_id

    const [users, approvers] = await Promise.all([
      UserService.getAll(),
      companyId ? CompanyService.getApprovers(companyId) : Promise.resolve([]),
    ])

    availableUsers.value = users
    approverIds.value = new Set(approvers.map((approver) => approver.id))
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    isLoadingUsers.value = false
  }
}

const loadGroups = async () => {
  try {
    isLoadingGroups.value = true
    availableGroups.value = await GroupService.getAll()
  } catch (error) {
    console.error('Failed to load groups:', error)
  } finally {
    isLoadingGroups.value = false
  }
}

const resetForm = () => {
  fromDate.value = ''
  fromTime.value = '08:00'
  toDate.value = ''
  toTime.value = '17:00'
  reason.value = ''
  note.value = ''
  leaveType.value = ''
  unitHours.value = null
  location.value = ''
  equipmentName.value = ''
  quantity.value = null
  clockType.value = 'clock_in'
  forgetDate.value = ''
  overtimeType.value = ''
  tripDestination.value = ''
  ccUserIds.value = []
  ccGroupIds.value = []
  submitted.value = false
}

const confirm = async () => {
  submitted.value = true
  if (!isFormValid.value) return
  isSaving.value = true

  try {
    const payload: Record<string, unknown> = { type: props.type }

    if (props.type === 'off') {
      if (leaveType.value) payload.leave_type = leaveType.value
      if (combinedFromDatetime.value) payload.from_datetime = combinedFromDatetime.value
      if (combinedToDatetime.value) payload.to_datetime = combinedToDatetime.value
      if (unitHours.value !== null && String(unitHours.value) !== '')
        payload.unit_hours = parseFloat(String(unitHours.value))
      if (reason.value) payload.reason = reason.value
      if (note.value) payload.note = note.value
    } else if (props.type === 'equipment') {
      if (reason.value) payload.reason = reason.value
      if (fromDate.value) payload.from_datetime = `${fromDate.value}T00:00:00`
      if (toDate.value) payload.to_datetime = `${toDate.value}T00:00:00`
      if (location.value) payload.location = location.value
      if (equipmentName.value) payload.equipment_name = equipmentName.value
      if (quantity.value) payload.quantity = quantity.value
    } else if (props.type === 'clock_forget') {
      payload.clock_type = clockType.value
      if (forgetDate.value) payload.forget_date = forgetDate.value
    } else if (props.type === 'wfh') {
      if (combinedFromDatetime.value) payload.from_datetime = combinedFromDatetime.value
      if (combinedToDatetime.value) payload.to_datetime = combinedToDatetime.value
      if (reason.value) payload.reason = reason.value
    } else if (props.type === 'overtime') {
      if (overtimeType.value) payload.overtime_type = overtimeType.value
      if (combinedFromDatetime.value) payload.from_datetime = combinedFromDatetime.value
      if (combinedToDatetime.value) payload.to_datetime = combinedToDatetime.value
      if (unitHours.value !== null && String(unitHours.value) !== '')
        payload.unit_hours = parseFloat(String(unitHours.value))
      if (reason.value) payload.reason = reason.value
      if (note.value) payload.note = note.value
    } else if (props.type === 'business_trip') {
      if (combinedFromDatetime.value) payload.from_datetime = combinedFromDatetime.value
      if (combinedToDatetime.value) payload.to_datetime = combinedToDatetime.value
      if (tripDestination.value) payload.trip_destination = tripDestination.value
      if (reason.value) payload.reason = reason.value
      if (note.value) payload.note = note.value
    }

    // Resolve group members and merge with individually selected users
    let groupMemberIds: number[] = []
    if (ccGroupIds.value.length > 0) {
      const memberArrays = await Promise.all(
        ccGroupIds.value.map((groupId) => GroupService.getMembers(groupId)),
      )
      groupMemberIds = memberArrays.flat().map((member) => member.user_id)
    }
    const allCcUserIds = [...new Set([...ccUserIds.value, ...groupMemberIds])]

    // Always include cc_user_ids for update (empty array to remove all CCs)
    if (props.editItemId || allCcUserIds.length > 0) {
      payload.cc_user_ids = allCcUserIds
    }

    if (props.editItemId) {
      await EmployeeRequestService.update(props.editItemId, payload)
    } else {
      await EmployeeRequestService.create(payload)
    }

    emit('confirm')
    resetForm()
  } catch (error) {
    console.error('Failed to submit request:', error)
  } finally {
    isSaving.value = false
  }
}

const close = () => {
  resetForm()
  emit('close-modal')
}
/* end defined methods */

/** start define life cycle hook */
onMounted(() => {
  loadUsers()
  loadGroups()
})
/* end define life cycle hook */

/** start define watcher */
watch(
  () => props.dialog,
  (value) => {
    if (value && props.initialData) {
      populateFromItem(props.initialData)
    }
    if (!value) resetForm()
  },
  { immediate: false },
)

// Auto-calculate unit_hours for OFF requests based on working hours schedule
watch([fromDate, fromTime, toDate, toTime], () => {
  if (props.type !== 'off') return
  const calculated = calculateWorkingHours(
    fromDate.value,
    fromTime.value,
    toDate.value,
    toTime.value,
  )
  if (calculated > 0) unitHours.value = calculated
})

// Auto-calculate unit_hours for OVERTIME requests: total elapsed time minus working hours
watch([fromDate, fromTime, toDate, toTime], () => {
  if (props.type !== 'overtime') return
  if (!fromDate.value || !toDate.value) return

  const from = moment(`${fromDate.value} ${fromTime.value || '00:00'}`, 'YYYY-MM-DD HH:mm')
  const to = moment(`${toDate.value} ${toTime.value || '00:00'}`, 'YYYY-MM-DD HH:mm')
  if (!from.isValid() || !to.isValid() || !from.isBefore(to)) return

  const totalHours = to.diff(from, 'hours', true)
  const workingHours = calculateWorkingHours(
    fromDate.value,
    fromTime.value,
    toDate.value,
    toTime.value,
  )
  const overtimeHours = Math.round(Math.max(0, totalHours - workingHours) * 4) / 4
  if (overtimeHours > 0) unitHours.value = overtimeHours
})
/* end define watcher */
</script>
