<template>
  <v-dialog :model-value="modelValue" max-width="560" persistent scrollable>
    <v-card rounded="xl" elevation="2">
      <!-- Header -->
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">
            {{
              editingSchedule
                ? $t('meetings.hostSchedule.editTitle')
                : $t('meetings.hostSchedule.addTitle')
            }}
          </div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ $t('meetings.hostSchedule.subtitle') }}
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0" style="max-height: 70vh; overflow-y: auto">
        <v-container class="pa-0">
          <v-row>
            <!-- User select -->
            <v-col cols="12">
              <div class="field-label">
                {{ $t('meetings.hostSchedule.hostUser').toUpperCase() }}
                <span class="text-error">*</span>
              </div>
              <v-autocomplete
                v-model="form.user_id"
                :items="users"
                item-title="full_name"
                item-value="id"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :placeholder="$t('meetings.hostSchedule.selectUser')"
                :error-messages="errors.user_id"
                autocomplete="off"
              />
            </v-col>

            <!-- Schedule type -->
            <v-col cols="12">
              <div class="field-label">
                {{ $t('meetings.hostSchedule.scheduleType').toUpperCase() }}
              </div>
              <div class="d-flex ga-2 flex-wrap">
                <v-btn
                  v-for="typeOption in scheduleTypeOptions"
                  :key="typeOption.value"
                  :color="form.schedule_type === typeOption.value ? typeOption.color : undefined"
                  :variant="form.schedule_type === typeOption.value ? 'flat' : 'outlined'"
                  rounded="lg"
                  size="small"
                  :prepend-icon="typeOption.icon"
                  @click="form.schedule_type = typeOption.value"
                >
                  {{ typeOption.label }}
                </v-btn>
              </div>
            </v-col>

            <!-- one_time: single date -->
            <v-col v-if="form.schedule_type === 'one_time'" cols="12">
              <div class="field-label">
                {{ $t('meetings.hostSchedule.date').toUpperCase() }}
                <span class="text-error">*</span>
              </div>
              <v-text-field
                v-model="form.date"
                type="date"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.date"
                autocomplete="off"
              />
            </v-col>

            <!-- date_list: multiple specific dates -->
            <v-col v-if="form.schedule_type === 'date_list'" cols="12">
              <div class="field-label">
                {{ $t('meetings.hostSchedule.dates').toUpperCase() }}
                <span class="text-error">*</span>
              </div>
              <div class="d-flex flex-column ga-2">
                <div
                  v-for="(dateItem, index) in form.dates"
                  :key="index"
                  class="d-flex align-center ga-2"
                >
                  <v-text-field
                    :model-value="dateItem"
                    type="date"
                    variant="filled"
                    rounded="lg"
                    flat
                    density="compact"
                    hide-details
                    autocomplete="off"
                    @update:model-value="(value) => updateDate(index, value)"
                  />
                  <v-btn
                    icon="mdi-minus-circle-outline"
                    variant="text"
                    size="small"
                    color="error"
                    :disabled="form.dates.length <= 1"
                    @click="removeDate(index)"
                  />
                </div>
                <v-btn
                  variant="tonal"
                  color="primary"
                  rounded="lg"
                  size="small"
                  prepend-icon="mdi-plus"
                  class="align-self-start"
                  @click="addDate"
                >
                  {{ $t('meetings.hostSchedule.addDate') }}
                </v-btn>
                <div v-if="errors.dates" class="text-error text-body-2">{{ errors.dates }}</div>
              </div>
            </v-col>

            <!-- date_range: from → to -->
            <template v-if="form.schedule_type === 'date_range'">
              <v-col cols="12" md="6">
                <div class="field-label">
                  {{ $t('meetings.hostSchedule.dateFrom').toUpperCase() }}
                  <span class="text-error">*</span>
                </div>
                <v-text-field
                  v-model="form.date_from"
                  type="date"
                  variant="filled"
                  rounded="lg"
                  flat
                  density="comfortable"
                  :error-messages="errors.date_from"
                  autocomplete="off"
                />
              </v-col>
              <v-col cols="12" md="6">
                <div class="field-label">
                  {{ $t('meetings.hostSchedule.dateTo').toUpperCase() }}
                  <span class="text-error">*</span>
                </div>
                <v-text-field
                  v-model="form.date_to"
                  type="date"
                  variant="filled"
                  rounded="lg"
                  flat
                  density="comfortable"
                  :error-messages="errors.date_to"
                  autocomplete="off"
                />
              </v-col>
            </template>

            <!-- recurring -->
            <template v-if="form.schedule_type === 'recurring'">
              <!-- Interval + day of week -->
              <v-col cols="12">
                <div class="field-label">
                  {{ $t('meetings.hostSchedule.recurPattern').toUpperCase() }}
                </div>
                <div class="d-flex align-center ga-2 flex-wrap">
                  <span class="text-body-2 text-medium-emphasis">{{
                    $t('meetings.schedule.everyWeek')
                  }}</span>
                  <div class="d-flex ga-1">
                    <v-btn
                      v-for="interval in [1, 2, 3, 4]"
                      :key="interval"
                      :color="form.interval_weeks === interval ? 'purple' : undefined"
                      :variant="form.interval_weeks === interval ? 'flat' : 'outlined'"
                      size="small"
                      rounded="lg"
                      min-width="36"
                      @click="form.interval_weeks = interval"
                    >
                      {{ interval }}
                    </v-btn>
                  </div>
                  <span class="text-body-2 text-medium-emphasis">{{
                    $t('meetings.schedule.weekOn')
                  }}</span>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div class="field-label">
                  {{ $t('meetings.schedule.dayOfWeek').toUpperCase() }}
                  <span class="text-error">*</span>
                </div>
                <v-select
                  v-model="form.day_of_week"
                  :items="dayOptions"
                  item-title="label"
                  item-value="value"
                  variant="filled"
                  rounded="lg"
                  flat
                  density="comfortable"
                  :error-messages="errors.day_of_week"
                  autocomplete="off"
                />
              </v-col>

              <!-- Anchor date -->
              <v-col cols="12" md="6">
                <div class="field-label">
                  {{ $t('meetings.hostSchedule.recurStartDate').toUpperCase() }}
                  <span class="text-error">*</span>
                </div>
                <v-text-field
                  v-model="form.recur_start_date"
                  type="date"
                  variant="filled"
                  rounded="lg"
                  flat
                  density="comfortable"
                  :error-messages="errors.recur_start_date"
                  autocomplete="off"
                />
              </v-col>

              <!-- Optional end date -->
              <v-col cols="12">
                <div class="field-label">
                  {{ $t('meetings.hostSchedule.recurEndDate').toUpperCase() }}
                </div>
                <v-text-field
                  v-model="form.recur_end_date"
                  type="date"
                  variant="filled"
                  rounded="lg"
                  flat
                  density="comfortable"
                  clearable
                  :hint="$t('meetings.hostSchedule.recurEndDateHint')"
                  persistent-hint
                  autocomplete="off"
                />
              </v-col>
            </template>
          </v-row>
        </v-container>
      </v-card-text>

      <!-- Footer -->
      <div class="d-flex justify-end ga-3 px-6 py-4">
        <v-btn variant="text" color="default" rounded="lg" @click="close">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn color="primary" variant="elevated" rounded="lg" :loading="isSaving" @click="submit">
          {{ editingSchedule ? $t('common.save') : $t('common.create') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import MeetingHostScheduleService from '@/services/MeetingHostScheduleService'
import UserService from '@/services/UserService'
import type {
  MeetingHostSchedule,
  HostScheduleType,
  CreateHostSchedulePayload,
} from '@/interfaces/models/MeetingHostScheduleModel'
import type { UserModel } from '@/interfaces/models/UserModel'
/** END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps<{
  modelValue: boolean
  meetingUuid: string
  editingSchedule?: MeetingHostSchedule | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [schedule: MeetingHostSchedule]
}>()
/** END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { t } = useI18n()
const isSaving = ref(false)
const users = ref<UserModel[]>([])
const errors = ref<Record<string, string>>({})

const defaultForm = () => ({
  user_id: null as number | null,
  schedule_type: 'one_time' as HostScheduleType,
  date: '',
  dates: [''] as string[],
  date_from: '',
  date_to: '',
  day_of_week: 1,
  interval_weeks: 1,
  recur_start_date: '',
  recur_end_date: '',
})

const form = ref(defaultForm())
/** END DEFINE STATE */

/** START DEFINE COMPUTED */
const scheduleTypeOptions = computed(() => [
  {
    value: 'one_time' as const,
    label: t('meetings.hostSchedule.type.one_time'),
    icon: 'mdi-calendar-check',
    color: 'teal',
  },
  {
    value: 'date_list' as const,
    label: t('meetings.hostSchedule.type.date_list'),
    icon: 'mdi-calendar-multiple',
    color: 'blue',
  },
  {
    value: 'date_range' as const,
    label: t('meetings.hostSchedule.type.date_range'),
    icon: 'mdi-calendar-range',
    color: 'indigo',
  },
  {
    value: 'recurring' as const,
    label: t('meetings.hostSchedule.type.recurring'),
    icon: 'mdi-calendar-sync',
    color: 'purple',
  },
])

const dayOptions = computed(() =>
  [0, 1, 2, 3, 4, 5, 6].map((value) => ({
    value,
    label: t(`meetings.days.${value}`),
  })),
)
/** END DEFINE COMPUTED */

/** START DEFINE METHOD */
function addDate() {
  form.value.dates.push('')
}

function removeDate(index: number) {
  form.value.dates.splice(index, 1)
}

function updateDate(index: number, value: string) {
  form.value.dates[index] = value
}

function resetForm() {
  const schedule = props.editingSchedule
  if (schedule) {
    form.value = {
      user_id: schedule.user_id,
      schedule_type: schedule.schedule_type,
      date: schedule.date ?? '',
      dates: schedule.dates?.length ? [...schedule.dates] : [''],
      date_from: schedule.date_from ?? '',
      date_to: schedule.date_to ?? '',
      day_of_week: schedule.day_of_week ?? 1,
      interval_weeks: schedule.interval_weeks ?? 1,
      recur_start_date: schedule.recur_start_date ?? '',
      recur_end_date: schedule.recur_end_date ?? '',
    }
  } else {
    form.value = defaultForm()
  }
  errors.value = {}
}

function validate(): boolean {
  const newErrors: Record<string, string> = {}

  if (!form.value.user_id) {
    newErrors.user_id = t('validation.required', { field: t('meetings.hostSchedule.hostUser') })
  }

  if (form.value.schedule_type === 'one_time' && !form.value.date) {
    newErrors.date = t('validation.required', { field: t('meetings.hostSchedule.date') })
  }

  if (form.value.schedule_type === 'date_list') {
    const validDates = form.value.dates.filter((dateItem) => !!dateItem)
    if (validDates.length === 0) {
      newErrors.dates = t('validation.required', { field: t('meetings.hostSchedule.dates') })
    }
  }

  if (form.value.schedule_type === 'date_range') {
    if (!form.value.date_from)
      newErrors.date_from = t('validation.required', { field: t('meetings.hostSchedule.dateFrom') })
    if (!form.value.date_to)
      newErrors.date_to = t('validation.required', { field: t('meetings.hostSchedule.dateTo') })
  }

  if (form.value.schedule_type === 'recurring') {
    if (form.value.day_of_week === null || form.value.day_of_week === undefined) {
      newErrors.day_of_week = t('validation.required', { field: t('meetings.schedule.dayOfWeek') })
    }
    if (!form.value.recur_start_date) {
      newErrors.recur_start_date = t('validation.required', {
        field: t('meetings.hostSchedule.recurStartDate'),
      })
    }
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

async function submit() {
  if (!validate()) return

  isSaving.value = true
  try {
    const payload: CreateHostSchedulePayload = {
      user_id: form.value.user_id!,
      schedule_type: form.value.schedule_type,
    }

    if (form.value.schedule_type === 'one_time') {
      payload.date = form.value.date
    } else if (form.value.schedule_type === 'date_list') {
      payload.dates = form.value.dates.filter((dateItem) => !!dateItem)
    } else if (form.value.schedule_type === 'date_range') {
      payload.date_from = form.value.date_from
      payload.date_to = form.value.date_to
    } else if (form.value.schedule_type === 'recurring') {
      payload.day_of_week = form.value.day_of_week
      payload.interval_weeks = form.value.interval_weeks
      payload.recur_start_date = form.value.recur_start_date
      if (form.value.recur_end_date) payload.recur_end_date = form.value.recur_end_date
    }

    let saved: MeetingHostSchedule
    if (props.editingSchedule) {
      saved = await MeetingHostScheduleService.update(
        props.meetingUuid,
        props.editingSchedule.id,
        payload,
      )
    } else {
      saved = await MeetingHostScheduleService.create(props.meetingUuid, payload)
    }

    emit('saved', saved)
    close()
  } catch {
    // Error is surfaced by the API layer
  } finally {
    isSaving.value = false
  }
}

function close() {
  emit('update:modelValue', false)
}

async function loadUsers() {
  try {
    users.value = await UserService.getAll()
  } catch {
    // non-critical
  }
}
/** END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetForm()
      loadUsers()
    }
  },
)
/** END DEFINE WATCHER */
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.field-label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-bottom: 4px;
}
</style>
