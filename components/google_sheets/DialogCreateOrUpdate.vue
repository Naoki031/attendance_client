<template>
  <v-dialog :model-value="dialog" max-width="780px" persistent scrollable>
    <v-card rounded="xl" elevation="2">
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">{{ title }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ $t('googleSheets.subtitle') }}
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0">
        <v-container class="pa-0">
          <!-- Basic fields row -->
          <v-row dense>
            <v-col cols="12" sm="6">
              <div class="field-label">{{ $t('common.company').toUpperCase() }}</div>
              <v-autocomplete
                v-model="companyIdValue"
                :items="companies"
                item-title="name"
                item-value="id"
                :error-messages="errors.company_id"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                clearable
                autocomplete="off"
                :disabled="!!props.item"
              ></v-autocomplete>
            </v-col>

            <v-col cols="12" sm="6">
              <div class="field-label">{{ $t('googleSheets.requestType').toUpperCase() }}</div>
              <v-select
                v-model="requestType"
                :items="requestTypeOptions"
                item-title="label"
                item-value="value"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
              ></v-select>
            </v-col>
          </v-row>

          <v-row dense>
            <v-col cols="12" sm="8">
              <div class="field-label">{{ $t('googleSheets.spreadsheetId').toUpperCase() }}</div>
              <v-text-field
                v-model="spreadsheetId"
                :error-messages="errors.spreadsheet_id"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                autocomplete="off"
                placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                hint="Found in the Google Sheets URL between /d/ and /edit"
                persistent-hint
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="4">
              <div class="field-label">{{ $t('googleSheets.sheetName').toUpperCase() }}</div>
              <v-text-field
                v-model="sheetName"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                autocomplete="off"
                placeholder="Leave Requests"
              ></v-text-field>
            </v-col>
          </v-row>

          <div class="field-label mb-1">{{ $t('googleSheets.status').toUpperCase() }}</div>
          <v-switch
            v-model="isActive"
            color="primary"
            :label="$t('common.active')"
            density="comfortable"
            hide-details
            class="mb-5"
          ></v-switch>

          <!-- Column Config Section -->
          <v-divider class="mb-4"></v-divider>
          <div class="d-flex align-center justify-space-between mb-3">
            <div>
              <span class="text-subtitle-2 font-weight-bold">{{
                $t('googleSheets.columnMapping')
              }}</span>
              <span class="text-caption text-medium-emphasis ml-2"
                >{{ columnConfig.length }} columns configured</span
              >
            </div>
            <div class="d-flex ga-2">
              <v-btn
                size="small"
                variant="tonal"
                color="secondary"
                prepend-icon="mdi-restore"
                @click="loadDefaultColumns"
              >
                {{ $t('googleSheets.loadDefaults') }}
              </v-btn>
              <v-btn
                size="small"
                variant="tonal"
                color="primary"
                prepend-icon="mdi-table-eye"
                @click="togglePreview"
              >
                {{ showPreview ? $t('googleSheets.hidePreview') : $t('googleSheets.preview') }}
              </v-btn>
            </div>
          </div>

          <!-- Column config rows -->
          <div class="column-config-list mb-2">
            <div
              v-for="(configItem, index) in columnConfig"
              :key="index"
              class="column-config-row d-flex align-center ga-2 mb-2"
            >
              <!-- Move up/down buttons -->
              <div class="d-flex flex-column" style="width: 24px; flex-shrink: 0; gap: 0">
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  :disabled="index === 0"
                  @click="moveRowUp(index)"
                >
                  <v-icon size="14">mdi-chevron-up</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  :disabled="index === columnConfig.length - 1"
                  @click="moveRowDown(index)"
                >
                  <v-icon size="14">mdi-chevron-down</v-icon>
                </v-btn>
              </div>

              <v-text-field
                v-model="configItem.column"
                :label="$t('googleSheets.columnLabel')"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 72px"
                placeholder="A"
              ></v-text-field>

              <v-select
                v-model="configItem.field"
                :items="filteredFieldOptions"
                item-title="label"
                item-value="value"
                :label="$t('googleSheets.fieldLabel')"
                variant="outlined"
                density="compact"
                hide-details
                style="flex: 1"
              ></v-select>

              <v-text-field
                v-model="configItem.header"
                :label="$t('googleSheets.headerLabel')"
                variant="outlined"
                density="compact"
                hide-details
                style="flex: 1"
                placeholder="e.g. Email"
              ></v-text-field>

              <v-btn
                icon
                size="x-small"
                variant="text"
                color="error"
                @click="removeColumnRow(index)"
              >
                <v-icon size="16">mdi-delete-outline</v-icon>
              </v-btn>
            </div>
          </div>

          <v-btn
            size="small"
            variant="text"
            color="primary"
            prepend-icon="mdi-plus"
            class="mb-4"
            @click="addColumnRow"
          >
            {{ $t('googleSheets.addColumn') }}
          </v-btn>

          <!-- Preview table -->
          <v-expand-transition>
            <div v-if="showPreview && sortedColumnConfig.length > 0" class="preview-section mb-4">
              <div class="field-label mb-2">
                {{ $t('googleSheets.sampleRowPreview').toUpperCase() }}
              </div>
              <v-table density="compact" class="preview-table rounded-lg">
                <thead>
                  <tr>
                    <th
                      v-for="configItem in sortedColumnConfig"
                      :key="configItem.column"
                      class="text-caption"
                    >
                      {{ configItem.column }}: {{ configItem.header }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      v-for="configItem in sortedColumnConfig"
                      :key="configItem.column"
                      class="text-caption text-medium-emphasis"
                    >
                      [{{ configItem.field }}]
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
          </v-expand-transition>
        </v-container>
      </v-card-text>

      <v-alert
        v-if="serverError"
        type="error"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="mx-6 mb-2"
        >{{ serverError }}</v-alert
      >

      <div class="d-flex justify-end ga-3 px-6 py-4">
        <v-btn color="default" variant="text" rounded="lg" @click="close">{{
          $t('common.cancel')
        }}</v-btn>
        <v-btn color="primary" variant="elevated" rounded="lg" :loading="isSaving" @click="confirm">
          {{ $t('common.save') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** start import */
import { computed, ref, watch, watchEffect } from 'vue'
import type { PropType } from 'vue'
import * as Yup from 'yup'
import type {
  CompanyGoogleSheetModel,
  ColumnConfigItem,
} from '@/interfaces/models/CompanyGoogleSheetModel'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import CompanyGoogleSheetService from '@/services/CompanyGoogleSheetService'

/** start define property and emits */
const props = defineProps({
  item: {
    type: Object as PropType<CompanyGoogleSheetModel | null>,
    required: false,
    default: null,
  },
  dialog: {
    type: Boolean,
    required: true,
  },
  companies: {
    type: Array as PropType<CompanyModel[]>,
    required: false,
    default: () => [],
  },
})

const emit = defineEmits(['confirm', 'close-modal'])

/* end import */

const DEFAULT_COLUMN_CONFIG: ColumnConfigItem[] = [
  { column: 'A', field: 'id', header: 'ID' },
  { column: 'B', field: 'created_at', header: 'Submit Time' },
  { column: 'C', field: 'user.email', header: 'Email' },
  { column: 'D', field: 'user.position', header: 'Position' },
  { column: 'E', field: 'user.full_name', header: 'Full Name' },
  { column: 'F', field: 'leave_type', header: 'Leave Type' },
  { column: 'G', field: 'from_datetime', header: 'From' },
  { column: 'H', field: 'to_datetime', header: 'To' },
  { column: 'I', field: 'unit_hours', header: 'Hours' },
  { column: 'J', field: 'reason', header: 'Reason' },
  { column: 'K', field: 'note', header: 'Note' },
  { column: 'L', field: 'status', header: 'Status' },
  { column: 'M', field: 'approver.full_name', header: 'Approver Name' },
  { column: 'N', field: 'approver_note', header: 'Approver Note' },
]

const REQUEST_TYPE_OPTIONS = [
  { value: 'all', label: 'All (default fallback)' },
  { value: 'wfh', label: 'Work From Home (wfh)' },
  { value: 'off', label: 'Leave / Day Off (off)' },
  { value: 'equipment', label: 'Equipment Request (equipment)' },
  { value: 'clock_forget', label: 'Forgot Clock In/Out (clock_forget)' },
  { value: 'overtime', label: 'Overtime (overtime)' },
  { value: 'business_trip', label: 'Business Trip (business_trip)' },
  { value: 'attendance_log', label: 'Attendance Log (attendance_log)' },
]

// Common fields shared across all request types (except attendance_log)
const COMMON_FIELDS = [
  { value: 'id', label: 'id — Request ID' },
  { value: 'created_at', label: 'created_at — Submit Time' },
  { value: 'user.email', label: 'user.email — Email' },
  { value: 'user.position', label: 'user.position — Position' },
  { value: 'user.full_name', label: 'user.full_name — Full Name' },
  { value: 'type', label: 'type — Request Type' },
  { value: 'from_datetime', label: 'from_datetime — From Date' },
  { value: 'to_datetime', label: 'to_datetime — To Date' },
  { value: 'reason', label: 'reason — Reason' },
  { value: 'note', label: 'note — Note' },
  { value: 'status', label: 'status — Status' },
  { value: 'approver.full_name', label: 'approver.full_name — Approver Name' },
  { value: 'approver_note', label: 'approver_note — Approver Note' },
]

const FIELD_OPTIONS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  all: [
    ...COMMON_FIELDS,
    { value: 'leave_type', label: 'leave_type — Leave Type' },
    { value: 'unit_hours', label: 'unit_hours — Hours' },
    { value: 'equipment_name', label: 'equipment_name — Equipment Name' },
    { value: 'location', label: 'location — Location' },
    { value: 'quantity', label: 'quantity — Quantity' },
    { value: 'clock_type', label: 'clock_type — Clock Type' },
    { value: 'forget_date', label: 'forget_date — Forget Date' },
    { value: 'overtime_type', label: 'overtime_type — Overtime Type' },
    { value: 'trip_destination', label: 'trip_destination — Destination' },
  ],
  wfh: COMMON_FIELDS,
  off: [
    ...COMMON_FIELDS,
    { value: 'leave_type', label: 'leave_type — Leave Type' },
    { value: 'unit_hours', label: 'unit_hours — Hours' },
  ],
  equipment: [
    ...COMMON_FIELDS,
    { value: 'equipment_name', label: 'equipment_name — Equipment Name' },
    { value: 'location', label: 'location — Location' },
    { value: 'quantity', label: 'quantity — Quantity' },
  ],
  clock_forget: [
    ...COMMON_FIELDS,
    { value: 'clock_type', label: 'clock_type — Clock Type' },
    { value: 'forget_date', label: 'forget_date — Forget Date' },
  ],
  overtime: [
    ...COMMON_FIELDS,
    { value: 'overtime_type', label: 'overtime_type — Overtime Type' },
    { value: 'unit_hours', label: 'unit_hours — Hours' },
  ],
  business_trip: [
    ...COMMON_FIELDS,
    { value: 'trip_destination', label: 'trip_destination — Destination' },
  ],
  attendance_log: [
    { value: 'date', label: 'date — Work Date' },
    { value: 'user.email', label: 'user.email — Email' },
    { value: 'user.full_name', label: 'user.full_name — Full Name' },
    { value: 'user.position', label: 'user.position — Position' },
    { value: 'clock_in', label: 'clock_in — Clock In' },
    { value: 'clock_out', label: 'clock_out — Clock Out' },
    { value: 'scheduled_start', label: 'scheduled_start — Scheduled Start' },
    { value: 'scheduled_end', label: 'scheduled_end — Scheduled End' },
    { value: 'schedule_type', label: 'schedule_type — Schedule Type' },
    { value: 'attendance_count', label: 'attendance_count — Attendance Count' },
    { value: 'user.device_user_id', label: 'user.device_user_id — Device User ID' },
  ],
}

/* end define property and emits */

/** start define validate */
const { t } = useI18n()

const schema = computed(() =>
  Yup.object().shape({
    company_id: Yup.number().required(t('validation.companyRequired')),
    spreadsheet_id: Yup.string().required(
      t('validation.required', { field: t('googleSheets.spreadsheetId') }),
    ),
  }),
)

const { handleSubmit, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: {
    company_id: null as number | null,
    spreadsheet_id: '' as string,
  },
})

const { value: companyIdValue, errorMessage: companyIdError } = useField<number | null>(
  'company_id',
)
const { value: spreadsheetId, errorMessage: spreadsheetIdError } =
  useField<string>('spreadsheet_id')
/* end define validate */

/** start defined state */
const sheetName = ref<string>('Leave Requests')
const requestType = ref<string>('all')
const isActive = ref<boolean>(true)
const isSaving = ref<boolean>(false)
const serverError = ref<string>('')
const showPreview = ref<boolean>(false)
const columnConfig = ref<ColumnConfigItem[]>(
  DEFAULT_COLUMN_CONFIG.map((configItem) => ({ ...configItem })),
)

const requestTypeOptions = ref(REQUEST_TYPE_OPTIONS)

const errors = computed(() => ({
  company_id: companyIdError.value ? [companyIdError.value] : [],
  spreadsheet_id: spreadsheetIdError.value ? [spreadsheetIdError.value] : [],
}))
/* end defined state */

/** start defined computed */
const title = computed(() =>
  props.item ? t('googleSheets.editConfig') : t('googleSheets.newConfig'),
)

const filteredFieldOptions = computed(() => {
  return FIELD_OPTIONS_BY_TYPE[requestType.value] ?? FIELD_OPTIONS_BY_TYPE['all']
})

const sortedColumnConfig = computed(() => {
  return [...columnConfig.value].sort((itemA, itemB) => {
    const toIndex = (col: string): number => {
      let index = 0

      for (let position = 0; position < col.length; position++) {
        index = index * 26 + (col.toUpperCase().charCodeAt(position) - 64)
      }

      return index - 1
    }

    return toIndex(itemA.column || 'A') - toIndex(itemB.column || 'A')
  })
})
/* end defined computed */

/** start defined methods */
const loadDefaultColumns = () => {
  columnConfig.value = DEFAULT_COLUMN_CONFIG.map((configItem) => ({ ...configItem }))
}

/** Converts a 0-based index to a spreadsheet column letter (0→A, 25→Z, 26→AA, ...) */
const indexToColumn = (index: number): string => {
  let result = ''
  let remaining = index + 1

  while (remaining > 0) {
    const module_ = (remaining - 1) % 26
    result = String.fromCharCode(65 + module_) + result
    remaining = Math.floor((remaining - 1) / 26)
  }

  return result
}

/** Returns the next column letter after the last one in the current config. */
const nextColumnLetter = (): string => {
  if (columnConfig.value.length === 0) return 'A'

  const columnToIndex = (col: string): number => {
    let index = 0

    for (let position = 0; position < col.length; position++) {
      index = index * 26 + (col.toUpperCase().charCodeAt(position) - 64)
    }

    return index - 1
  }

  const maxIndex = Math.max(...columnConfig.value.map((item) => columnToIndex(item.column || 'A')))

  return indexToColumn(maxIndex + 1)
}

const addColumnRow = () => {
  columnConfig.value.push({ column: nextColumnLetter(), field: 'id', header: '' })
}

const removeColumnRow = (index: number) => {
  columnConfig.value.splice(index, 1)
}

const moveRowUp = (index: number) => {
  if (index === 0) return
  const rows = columnConfig.value
  const temporary = rows[index]!
  rows[index] = rows[index - 1]!
  rows[index - 1] = temporary
}

const moveRowDown = (index: number) => {
  if (index === columnConfig.value.length - 1) return
  const rows = columnConfig.value
  const temporary = rows[index]!
  rows[index] = rows[index + 1]!
  rows[index + 1] = temporary
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

const buildPayload = (form: { company_id: number | null; spreadsheet_id: string }) => {
  const configToSend =
    columnConfig.value.length > 0
      ? columnConfig.value.filter((configItem) => configItem.column && configItem.field)
      : null

  return {
    company_id: form.company_id,
    request_type: requestType.value,
    spreadsheet_id: form.spreadsheet_id,
    sheet_name: sheetName.value || 'Leave Requests',
    is_active: isActive.value,
    column_config: configToSend,
  }
}

const handleCreate = handleSubmit(async (form) => {
  isSaving.value = true
  serverError.value = ''

  try {
    await CompanyGoogleSheetService.create(buildPayload(form) as Record<string, unknown>)
    emit('confirm')
  } catch (error: unknown) {
    const message = (error as { data?: { message?: string } })?.data?.message
    serverError.value = message ?? 'Failed to save. Please try again.'
    console.error('Failed to create google sheet config:', error)
  } finally {
    isSaving.value = false
  }
})

const handleUpdate = handleSubmit(async (form) => {
  isSaving.value = true
  serverError.value = ''

  try {
    const { company_id: _, ...updatePayload } = buildPayload(form)
    await CompanyGoogleSheetService.update(
      props.item?.id as number,
      updatePayload as Record<string, unknown>,
    )
    emit('confirm')
  } catch (error: unknown) {
    const message = (error as { data?: { message?: string } })?.data?.message
    serverError.value = message ?? 'Failed to save. Please try again.'
    console.error('Failed to update google sheet config:', error)
  } finally {
    isSaving.value = false
  }
})

const confirm = () => {
  if (!props.item) handleCreate()
  else handleUpdate()
}

const close = () => {
  serverError.value = ''
  showPreview.value = false
  emit('close-modal')
}
/* end defined methods */

/** start define watcher */
watch(
  () => props.dialog,
  (value) => {
    if (!value) close()
  },
  { immediate: true },
)

watchEffect(() => {
  if (props.item) {
    setFieldValue('company_id', props.item.company_id)
    setFieldValue('spreadsheet_id', props.item.spreadsheet_id)
    sheetName.value = props.item.sheet_name
    requestType.value = props.item.request_type ?? 'all'
    isActive.value = props.item.is_active
    columnConfig.value =
      props.item.column_config && props.item.column_config.length > 0
        ? props.item.column_config.map((configItem) => ({ ...configItem }))
        : DEFAULT_COLUMN_CONFIG.map((configItem) => ({ ...configItem }))
  } else {
    columnConfig.value = DEFAULT_COLUMN_CONFIG.map((configItem) => ({ ...configItem }))
    requestType.value = 'all'
  }
})
/* end define watcher */

/** start define life cycle hook */
/* end define life cycle hook */
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 4px;
}

.column-config-list {
  max-height: 280px;
  overflow-y: auto;
}

.preview-table {
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.preview-section {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  padding: 12px;
}
</style>
