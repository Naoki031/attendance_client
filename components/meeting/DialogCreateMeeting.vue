<template>
  <v-dialog
    :model-value="modelValue"
    max-width="480"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="xl">
      <v-card-title class="pa-5 pb-3">{{ $t('meetings.create') }}</v-card-title>

      <v-card-text class="pt-0">
        <v-text-field
          v-model="form.title"
          :label="$t('meetings.meetingTitle')"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          class="mb-3"
        />
        <v-textarea
          v-model="form.description"
          :label="$t('common.description')"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          rows="2"
          class="mb-3"
        />

        <!-- Schedule type selector -->
        <div class="text-caption text-medium-emphasis mb-2">
          {{ $t('meetings.schedule.title') }}
        </div>
        <div class="d-flex ga-2 mb-3">
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

        <!-- One-time: specific date + time -->
        <v-text-field
          v-if="form.meeting_type === 'one_time'"
          v-model="form.scheduled_at"
          :label="$t('meetings.scheduledAt')"
          type="datetime-local"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          class="mb-3"
        />

        <!-- Daily: time only -->
        <v-text-field
          v-else-if="form.meeting_type === 'daily'"
          v-model="form.schedule_time"
          :label="$t('meetings.schedule.time')"
          type="time"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          class="mb-3"
        />

        <!-- Weekly: interval + day of week + time -->
        <template v-else-if="form.meeting_type === 'weekly'">
          <!-- Interval selector -->
          <div class="d-flex align-center ga-2 flex-wrap mb-3">
            <span class="text-body-2 text-medium-emphasis">{{
              $t('meetings.schedule.everyWeek')
            }}</span>
            <div class="d-flex ga-1">
              <v-btn
                v-for="n in [1, 2, 3, 4]"
                :key="n"
                :color="form.schedule_interval_weeks === n ? 'purple' : undefined"
                :variant="form.schedule_interval_weeks === n ? 'flat' : 'outlined'"
                size="small"
                rounded="lg"
                min-width="36"
                @click="form.schedule_interval_weeks = n"
              >
                {{ n }}
              </v-btn>
            </div>
            <span class="text-body-2 text-medium-emphasis">{{
              $t('meetings.schedule.weekOn')
            }}</span>
          </div>

          <!-- Day of week selector -->
          <v-select
            v-model="form.schedule_day_of_week"
            :items="dayOptions"
            item-title="label"
            item-value="value"
            :label="$t('meetings.schedule.dayOfWeek')"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            class="mb-3"
          />

          <!-- Time -->
          <v-text-field
            v-model="form.schedule_time"
            :label="$t('meetings.schedule.time')"
            type="time"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            class="mb-3"
          />
        </template>

        <v-switch
          v-model="form.is_private"
          :label="form.is_private ? $t('meetings.private') : $t('meetings.public')"
          color="warning"
          density="comfortable"
          :hide-details="!form.is_private"
          class="mb-1"
          @update:model-value="onPrivateToggle"
        />

        <!-- Password field -->
        <div v-if="form.is_private" class="mt-3">
          <div class="text-caption text-medium-emphasis mb-2">
            {{ $t('meetings.passwordGenerated') }}
          </div>
          <div class="password-box d-flex align-center justify-space-between pa-3 rounded-lg">
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
          <p class="text-caption text-medium-emphasis mt-2">
            {{ $t('meetings.passwordGeneratedDesc') }}
          </p>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn variant="text" rounded="lg" @click="$emit('update:modelValue', false)">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          rounded="lg"
          :loading="isCreating"
          @click="submit"
        >
          {{ $t('common.create') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import { useNuxtApp } from '#app'
import type { Meeting } from '@/interfaces/models/MeetingModel'
/** END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [meeting: Meeting]
}>()
/** END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { $apiFetch } = useNuxtApp()
const { t } = useI18n()

const isCreating = ref(false)
const passwordCopied = ref(false)

const form = ref({
  title: '',
  description: '',
  meeting_type: 'one_time' as 'one_time' | 'daily' | 'weekly',
  is_private: false,
  password: '',
  // one_time
  scheduled_at: '',
  // daily + weekly
  schedule_time: '09:00',
  // weekly only
  schedule_day_of_week: 1,
  schedule_interval_weeks: 1,
})
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
  if (value) {
    form.value.password = generateRandomPassword()
  } else {
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

function resetForm() {
  form.value = {
    title: '',
    description: '',
    meeting_type: 'one_time',
    is_private: false,
    password: '',
    scheduled_at: '',
    schedule_time: '09:00',
    schedule_day_of_week: 1,
    schedule_interval_weeks: 1,
  }
  passwordCopied.value = false
}

async function submit() {
  if (!form.value.title.trim()) return
  isCreating.value = true
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
    } else if (form.value.meeting_type === 'daily') {
      payload.schedule_time = form.value.schedule_time
    } else if (form.value.meeting_type === 'weekly') {
      payload.schedule_time = form.value.schedule_time
      payload.schedule_day_of_week = form.value.schedule_day_of_week
      payload.schedule_interval_weeks = form.value.schedule_interval_weeks
    }

    const created = await ($apiFetch as (url: string, options?: object) => Promise<Meeting>)(
      '/meetings',
      { method: 'POST', body: payload },
    )
    emit('created', created)
    emit('update:modelValue', false)
    resetForm()
  } finally {
    isCreating.value = false
  }
}
/** END DEFINE METHOD */
</script>

<style scoped>
.password-box {
  background: rgba(var(--v-theme-surface-variant), 0.4);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}
</style>
