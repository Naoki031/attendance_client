<template>
  <v-dialog :model-value="modelValue" max-width="600" persistent scrollable>
    <v-card rounded="xl" elevation="2">
      <!-- Header -->
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">{{ $t('meetings.editMeeting') }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ meeting?.title }}
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0" style="max-height: 70vh; overflow-y: auto">
        <v-container class="pa-0">
          <v-row>
            <!-- ── MEETING INFO ── -->
            <v-col cols="12">
              <div class="section-label">{{ $t('meetings.sectionMeetingInfo').toUpperCase() }}</div>
            </v-col>

            <!-- Title -->
            <v-col cols="12">
              <div class="field-label">
                {{ $t('meetings.meetingTitle').toUpperCase() }} <span class="text-error">*</span>
              </div>
              <v-text-field
                v-model="form.title"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="formErrors.title"
                required
                autocomplete="off"
              />
            </v-col>

            <!-- Description -->
            <v-col cols="12">
              <div class="field-label">{{ $t('common.description').toUpperCase() }}</div>
              <v-textarea
                v-model="form.description"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                rows="2"
                autocomplete="off"
              />
            </v-col>

            <!-- ── SCHEDULE ── -->
            <v-col cols="12">
              <div class="section-label">{{ $t('meetings.schedule.title').toUpperCase() }}</div>
            </v-col>

            <!-- Schedule type selector -->
            <v-col cols="12">
              <div class="field-label">{{ $t('meetings.schedule.title').toUpperCase() }}</div>
              <div class="d-flex ga-2 flex-wrap">
                <v-btn
                  v-for="typeOption in scheduleTypeOptions"
                  :key="typeOption.value"
                  :color="form.meeting_type === typeOption.value ? typeOption.color : undefined"
                  :variant="form.meeting_type === typeOption.value ? 'flat' : 'outlined'"
                  rounded="lg"
                  size="small"
                  :prepend-icon="typeOption.icon"
                  @click="form.meeting_type = typeOption.value"
                >
                  {{ typeOption.label }}
                </v-btn>
              </div>
            </v-col>

            <!-- One-time: specific date + time -->
            <v-col v-if="form.meeting_type === 'one_time'" cols="12">
              <div class="field-label">{{ $t('meetings.scheduledAt').toUpperCase() }}</div>
              <v-text-field
                v-model="form.scheduled_at"
                type="datetime-local"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                autocomplete="off"
              />
            </v-col>

            <!-- Daily: time only -->
            <v-col v-if="form.meeting_type === 'daily'" cols="12" md="6">
              <div class="field-label">{{ $t('meetings.schedule.time').toUpperCase() }}</div>
              <v-text-field
                v-model="form.schedule_time"
                type="time"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                autocomplete="off"
              />
            </v-col>

            <!-- Weekly: interval + day of week + time -->
            <template v-if="form.meeting_type === 'weekly'">
              <v-col cols="12">
                <div class="field-label">{{ $t('meetings.schedule.everyWeek').toUpperCase() }}</div>
                <div class="d-flex align-center ga-2 flex-wrap">
                  <div class="d-flex ga-1">
                    <v-btn
                      v-for="interval in [1, 2, 3, 4]"
                      :key="interval"
                      :color="form.schedule_interval_weeks === interval ? 'purple' : undefined"
                      :variant="form.schedule_interval_weeks === interval ? 'flat' : 'outlined'"
                      size="small"
                      rounded="lg"
                      min-width="36"
                      @click="form.schedule_interval_weeks = interval"
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
                <div class="field-label">{{ $t('meetings.schedule.dayOfWeek').toUpperCase() }}</div>
                <v-select
                  v-model="form.schedule_day_of_week"
                  :items="dayOptions"
                  item-title="label"
                  item-value="value"
                  variant="filled"
                  rounded="lg"
                  flat
                  density="comfortable"
                  autocomplete="off"
                />
              </v-col>

              <v-col cols="12" md="6">
                <div class="field-label">{{ $t('meetings.schedule.time').toUpperCase() }}</div>
                <v-text-field
                  v-model="form.schedule_time"
                  type="time"
                  variant="filled"
                  rounded="lg"
                  flat
                  density="comfortable"
                  autocomplete="off"
                />
              </v-col>
            </template>

            <!-- ── PRIVACY ── -->
            <v-col cols="12">
              <div class="section-label">{{ $t('meetings.privacySection').toUpperCase() }}</div>
            </v-col>

            <v-col cols="12">
              <v-switch
                v-model="form.is_private"
                :label="form.is_private ? $t('meetings.private') : $t('meetings.public')"
                color="warning"
                density="comfortable"
                hide-details
                @update:model-value="onPrivateToggle"
              />

              <!-- Password field -->
              <div v-if="form.is_private" class="mt-3">
                <div class="field-label">{{ $t('meetings.meetingPassword').toUpperCase() }}</div>
                <div
                  class="password-box d-flex align-center justify-space-between pa-3 rounded-lg mt-2"
                >
                  <span class="text-body-1 font-weight-bold" style="letter-spacing: 0.2em">
                    {{ form.password }}
                  </span>
                  <div class="d-flex ga-1">
                    <v-btn
                      icon="mdi-refresh"
                      variant="text"
                      size="small"
                      :title="$t('meetings.regeneratePassword')"
                      @click="form.password = generateRandomPassword()"
                    />
                    <v-btn
                      :icon="passwordCopied ? 'mdi-check' : 'mdi-content-copy'"
                      :color="passwordCopied ? 'success' : 'default'"
                      variant="text"
                      size="small"
                      @click="copyPassword"
                    />
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <!-- Footer -->
      <div class="d-flex justify-end ga-3 px-6 py-4">
        <v-btn variant="text" color="default" rounded="lg" @click="close">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn color="primary" variant="elevated" rounded="lg" :loading="isSaving" @click="confirm">
          {{ $t('common.save') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import { useNuxtApp } from '#app'
import type { PropType } from 'vue'
import type { Meeting } from '@/interfaces/models/MeetingModel'
/** END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  meeting: {
    type: Object as PropType<Meeting | null>,
    required: false,
    default: null,
  },
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [meeting: Meeting]
}>()
/** END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { $apiFetch } = useNuxtApp()
const { t } = useI18n()

const isSaving = ref(false)
const passwordCopied = ref(false)

const form = ref({
  title: '',
  description: '',
  meeting_type: 'one_time' as 'one_time' | 'daily' | 'weekly',
  is_private: false,
  password: '',
  scheduled_at: '',
  schedule_time: '',
  schedule_day_of_week: 1,
  schedule_interval_weeks: 1,
})

const formErrors = ref<Record<string, string>>({})
/** END DEFINE STATE */

/** START DEFINE COMPUTED */
const scheduleTypeOptions = computed(() => [
  {
    value: 'one_time' as const,
    label: t('meetings.type.one_time'),
    icon: 'mdi-calendar-check',
    color: 'teal',
  },
  {
    value: 'daily' as const,
    label: t('meetings.type.daily'),
    icon: 'mdi-calendar-today',
    color: 'blue',
  },
  {
    value: 'weekly' as const,
    label: t('meetings.type.weekly'),
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
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function onPrivateToggle(value: boolean | null) {
  if (value && !form.value.password) {
    form.value.password = generateRandomPassword()
  } else if (!value) {
    form.value.password = ''
  }
}

async function copyPassword() {
  await navigator.clipboard.writeText(form.value.password)
  passwordCopied.value = true
  setTimeout(() => {
    passwordCopied.value = false
  }, 2000)
}

function populateForm(meeting: Meeting) {
  form.value = {
    title: meeting.title ?? '',
    description: meeting.description ?? '',
    meeting_type: (meeting.meeting_type as 'one_time' | 'daily' | 'weekly') ?? 'one_time',
    is_private: meeting.is_private ?? false,
    password: '',
    scheduled_at: meeting.scheduled_at
      ? new Date(meeting.scheduled_at).toISOString().slice(0, 16)
      : '',
    schedule_time: meeting.schedule_time ?? '09:00',
    schedule_day_of_week: meeting.schedule_day_of_week ?? 1,
    schedule_interval_weeks: meeting.schedule_interval_weeks ?? 1,
  }
  formErrors.value = {}
}

function close() {
  emit('update:modelValue', false)
}

async function confirm() {
  if (!form.value.title.trim()) {
    formErrors.value = {
      title: String(t('validation.required', { field: t('meetings.meetingTitle') })),
    }
    return
  }

  if (!props.meeting) return
  isSaving.value = true
  formErrors.value = {}

  try {
    const payload: Record<string, unknown> = {
      title: form.value.title,
      description: form.value.description || undefined,
      meeting_type: form.value.meeting_type,
      is_private: form.value.is_private,
      password: form.value.is_private ? form.value.password : undefined,
    }

    if (form.value.meeting_type === 'one_time') {
      payload.scheduled_at = form.value.scheduled_at || undefined
      payload.schedule_time = undefined
      payload.schedule_day_of_week = undefined
      payload.schedule_interval_weeks = undefined
    } else if (form.value.meeting_type === 'daily') {
      payload.schedule_time = form.value.schedule_time
      payload.schedule_day_of_week = undefined
      payload.schedule_interval_weeks = undefined
      payload.scheduled_at = undefined
    } else if (form.value.meeting_type === 'weekly') {
      payload.schedule_time = form.value.schedule_time
      payload.schedule_day_of_week = form.value.schedule_day_of_week
      payload.schedule_interval_weeks = form.value.schedule_interval_weeks
      payload.scheduled_at = undefined
    }

    const updated = await ($apiFetch as (url: string, options?: object) => Promise<Meeting>)(
      `/meetings/${props.meeting.uuid}`,
      { method: 'PATCH', body: payload },
    )
    emit('saved', updated)
    close()
  } catch (error) {
    if (error instanceof Error) {
      formErrors.value = { title: error.message }
    }
  } finally {
    isSaving.value = false
  }
}
/** END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.meeting) {
      populateForm(props.meeting)
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

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.12);
}

.field-label {
  font-size: 11px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-bottom: 4px;
}

.password-box {
  background: rgba(var(--v-theme-surface-variant), 0.4);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}
</style>
