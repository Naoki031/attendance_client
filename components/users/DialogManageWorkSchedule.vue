<template>
  <v-dialog :model-value="dialog" max-width="640px" persistent @update:model-value="close">
    <v-card rounded="xl">
      <v-card-title class="pa-6 pb-0 text-h6 font-weight-bold">
        {{ $t('users.manageWorkSchedule') }} — {{ user?.full_name }}
      </v-card-title>
      <v-card-subtitle class="px-6 pb-0 text-caption text-medium-emphasis">
        {{ $t('users.workScheduleSubtitle') }}
      </v-card-subtitle>

      <v-card-text class="pa-6">
        <v-alert
          v-if="apiError"
          type="error"
          variant="tonal"
          class="mb-3"
          closable
          @click:close="apiError = ''"
        >
          {{ apiError }}
        </v-alert>

        <!-- Add new schedule form -->
        <v-card variant="tonal" color="primary" rounded="lg" class="mb-4 pa-4">
          <div class="text-body-2 font-weight-medium mb-3">
            {{ editingItem ? $t('users.editSchedule') : $t('users.addCustomSchedule') }}
          </div>
          <v-row dense>
            <v-col cols="6">
              <CommonTimePickerField
                v-model="startTime"
                :minute-intervals="[0, 15, 30, 45]"
                :error-messages="errors.start_time ? [errors.start_time] : undefined"
              />
            </v-col>
            <v-col cols="6">
              <CommonTimePickerField
                v-model="endTime"
                :minute-intervals="[0, 15, 30, 45]"
                :error-messages="errors.end_time ? [errors.end_time] : undefined"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                :model-value="effectiveFrom"
                :label="$t('users.effectiveFrom')"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.effective_from"
                readonly
                autocomplete="off"
              >
                <template #append-inner>
                  <v-menu v-model="menuEffectiveFrom" :close-on-content-click="false">
                    <template #activator="{ props: menuProps }">
                      <v-btn
                        v-bind="menuProps"
                        icon="mdi-calendar"
                        size="small"
                        variant="text"
                        color="default"
                      />
                    </template>
                    <v-date-picker
                      :model-value="toPickerDate(effectiveFrom)"
                      hide-header
                      @update:model-value="
                        (selectedDate: Date) => {
                          effectiveFrom = formatDate(selectedDate)
                          menuEffectiveFrom = false
                        }
                      "
                    />
                  </v-menu>
                </template>
              </v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                :model-value="effectiveTo"
                :label="$t('users.effectiveTo')"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                clearable
                :error-messages="errors.effective_to"
                readonly
                autocomplete="off"
                @click:clear="effectiveTo = null"
              >
                <template #append-inner>
                  <v-menu v-model="menuEffectiveTo" :close-on-content-click="false">
                    <template #activator="{ props: menuProps }">
                      <v-btn
                        v-bind="menuProps"
                        icon="mdi-calendar"
                        size="small"
                        variant="text"
                        color="default"
                      />
                    </template>
                    <v-date-picker
                      :model-value="toPickerDate(effectiveTo)"
                      hide-header
                      @update:model-value="
                        (selectedDate: Date) => {
                          effectiveTo = formatDate(selectedDate)
                          menuEffectiveTo = false
                        }
                      "
                    />
                  </v-menu>
                </template>
              </v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="note"
                :label="$t('users.noteReason')"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.note"
              />
            </v-col>
          </v-row>
          <div class="d-flex ga-2 mt-3">
            <v-btn
              color="primary"
              variant="elevated"
              rounded="lg"
              size="small"
              :loading="isSaving"
              @click="saveSchedule"
            >
              {{ editingItem ? $t('common.update') : $t('common.add') }}
            </v-btn>
            <v-btn v-if="editingItem" variant="text" rounded="lg" size="small" @click="cancelEdit">
              {{ $t('common.cancel') }}
            </v-btn>
          </div>
        </v-card>

        <!-- Schedule list -->
        <div v-if="isLoading" class="d-flex justify-center py-4">
          <v-progress-circular indeterminate color="primary" />
        </div>
        <div
          v-else-if="schedules.length === 0"
          class="text-center text-medium-emphasis text-body-2 py-4"
        >
          {{ $t('users.noCustomSchedules') }}
        </div>
        <v-list v-else density="compact" lines="two">
          <v-list-item v-for="schedule in schedules" :key="schedule.id" rounded="lg" class="mb-1">
            <template #prepend>
              <v-icon color="teal" class="mr-2">mdi-clock-time-eight-outline</v-icon>
            </template>
            <v-list-item-title class="text-body-2 font-weight-medium">
              {{ schedule.start_time }} — {{ schedule.end_time }}
              <v-chip
                :color="
                  !schedule.effective_to || schedule.effective_to >= today ? 'success' : 'default'
                "
                size="x-small"
                variant="tonal"
                class="ml-2"
              >
                {{
                  !schedule.effective_to || schedule.effective_to >= today
                    ? $t('users.scheduleActive')
                    : $t('users.scheduleExpired')
                }}
              </v-chip>
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              {{ schedule.effective_from }} → {{ schedule.effective_to ?? $t('common.ongoing') }}
              <span v-if="schedule.note" class="ml-2 text-medium-emphasis"
                >· {{ schedule.note }}</span
              >
            </v-list-item-subtitle>
            <template #append>
              <v-btn
                icon
                size="x-small"
                variant="text"
                color="primary"
                @click="editSchedule(schedule)"
              >
                <v-icon size="14">mdi-pencil-outline</v-icon>
              </v-btn>
              <v-btn
                icon
                size="x-small"
                variant="text"
                color="error"
                :loading="deletingId === schedule.id"
                @click="deleteSchedule(schedule.id)"
              >
                <v-icon size="14">mdi-delete-outline</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <div class="d-flex justify-end px-6 py-4">
        <v-btn variant="text" rounded="lg" @click="close">{{ $t('common.close') }}</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { UserModel } from '@/interfaces/models/UserModel'
import type { UserWorkScheduleModel } from '@/interfaces/models/UserWorkScheduleModel'
import UserWorkScheduleService from '@/services/UserWorkScheduleService'
import * as Yup from 'yup'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  user: {
    type: Object as PropType<UserModel | null>,
    required: false,
    default: null,
  },
  dialog: {
    type: Boolean,
    required: true,
  },
})
const emit = defineEmits(['close-modal', 'changed'])
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE I18N */
const { t } = useI18n()
/* END DEFINE I18N */

/** START DEFINE VALIDATE */
const schema = computed(() =>
  Yup.object().shape({
    start_time: Yup.string()
      .required(t('validation.startTimeRequired'))
      .test('is-valid-time', t('validation.invalidTime'), (value) => {
        if (!value) return false
        const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

        return regex.test(value)
      }),
    end_time: Yup.string()
      .required(t('validation.endTimeRequired'))
      .test('is-valid-time', t('validation.invalidTime'), (value) => {
        if (!value) return false
        const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

        return regex.test(value)
      })
      .test('is-after-start', t('validation.endTimeAfterStartTime'), function (value) {
        const startTime = this.parent.start_time
        if (!value || !startTime) return true

        return value > startTime
      }),
    effective_from: Yup.string()
      .required(t('validation.effectiveFromRequired'))
      .matches(/^\d{4}-\d{2}-\d{2}$/, t('validation.invalidDateFormat')),
    effective_to: Yup.string()
      .nullable()
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/, t('validation.invalidDateFormat'))
      .test(
        'is-after-effective-from',
        t('validation.effectiveToAfterEffectiveFrom'),
        function (value) {
          const effectiveFrom = this.parent.effective_from
          if (!value || !effectiveFrom) return true

          return value >= effectiveFrom
        },
      ),
    note: Yup.string().optional(),
  }),
)

const { errors, handleSubmit, resetForm } = useForm({
  validationSchema: schema,
  initialValues: {
    start_time: '',
    end_time: '',
    effective_from: '',
    effective_to: null as string | null,
    note: '',
  },
})

const { value: startTime } = useField<string>('start_time')
const { value: endTime } = useField<string>('end_time')
const { value: effectiveFrom } = useField<string>('effective_from')
const { value: effectiveTo } = useField<string | null>('effective_to')
const { value: note } = useField<string>('note')
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const schedules = ref<UserWorkScheduleModel[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const deletingId = ref<number | null>(null)
const editingItem = ref<UserWorkScheduleModel | null>(null)
const apiError = ref('')

const menuEffectiveFrom = ref(false)
const menuEffectiveTo = ref(false)

const { moment } = useMoment()
const today = moment().format('YYYY-MM-DD')
/* END DEFINE STATE */

/** START DEFINE HELPERS */
const toPickerDate = (dateString: string | null | undefined): Date | undefined => {
  if (!dateString) return undefined

  return moment(dateString, 'YYYY-MM-DD').toDate()
}

const formatDate = (date: Date): string => {
  return moment(date).format('YYYY-MM-DD')
}
/* END DEFINE HELPERS */

/** START DEFINE METHOD */
const loadSchedules = async () => {
  if (!props.user?.id) return

  try {
    isLoading.value = true
    const data = await UserWorkScheduleService.getByUser(props.user.id)
    schedules.value = Object.values(data)
  } catch (error) {
    console.error('Failed to load work schedules:', error)
  } finally {
    isLoading.value = false
  }
}

const resetFormData = () => {
  startTime.value = ''
  endTime.value = ''
  effectiveFrom.value = today
  effectiveTo.value = null
  note.value = ''
  editingItem.value = null
  apiError.value = ''
  resetForm()
}

const editSchedule = (item: UserWorkScheduleModel) => {
  editingItem.value = item
  startTime.value = item.start_time
  endTime.value = item.end_time
  effectiveFrom.value = item.effective_from
  effectiveTo.value = (item.effective_to ?? null) as string | null
  note.value = item.note ?? ''
}

const cancelEdit = () => {
  resetFormData()
}

const handleSave = handleSubmit(async (formValues) => {
  if (!props.user?.id) return

  try {
    isSaving.value = true
    apiError.value = ''
    const payload = {
      user_id: props.user.id,
      start_time: formValues.start_time,
      end_time: formValues.end_time,
      effective_from: formValues.effective_from,
      effective_to: formValues.effective_to || null,
      note: formValues.note || null,
    }

    if (editingItem.value) {
      const updated = await UserWorkScheduleService.update(editingItem.value.id, payload)
      const index = schedules.value.findIndex((schedule) => schedule.id === editingItem.value!.id)
      if (index !== -1) schedules.value[index] = updated
    } else {
      const created = await UserWorkScheduleService.create(payload)
      schedules.value.unshift(created)
    }

    resetFormData()
    emit('changed')
  } catch (error: unknown) {
    console.error('Failed to save work schedule:', error)

    // Handle error.data - could be object or string
    let errorData = (error as { data?: unknown })?.data

    if (typeof errorData === 'string') {
      try {
        errorData = JSON.parse(errorData)
      } catch {
        // Failed to parse, keep as is
      }
    }

    const message =
      (errorData as { message?: string; error?: string })?.message ??
      (errorData as { message?: string; error?: string })?.error ??
      ''

    // Map backend error message to i18n key
    if (message) {
      apiError.value = t('common.error') + ': ' + message
    } else {
      apiError.value = t('common.error')
    }
  } finally {
    isSaving.value = false
  }
})

const saveSchedule = () => {
  handleSave()
}

const deleteSchedule = async (id: number) => {
  try {
    deletingId.value = id
    await UserWorkScheduleService.delete(id)
    schedules.value = schedules.value.filter((schedule) => schedule.id !== id)
    emit('changed')
  } catch (error) {
    console.error('Failed to delete work schedule:', error)
  } finally {
    deletingId.value = null
  }
}

const close = () => {
  emit('close-modal')
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (value) => {
    if (value) {
      resetFormData()
      loadSchedules()
    }
  },
  { immediate: false },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  if (props.dialog) {
    resetFormData()
    loadSchedules()
  }
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
