<template>
  <v-dialog
    :model-value="dialog"
    max-width="560"
    persistent
    @update:model-value="
      (value) => {
        if (!value) emit('close-modal')
      }
    "
  >
    <v-card rounded="xl">
      <v-card-title class="pt-6 px-6 text-h6 font-weight-bold">
        {{ t('memories.editAlbum') }}
      </v-card-title>

      <v-card-text class="px-6 pb-2">
        <v-form ref="formReference" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.title"
            :label="t('memories.form.title')"
            :rules="titleRules"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            class="mb-3"
          />

          <v-select
            v-model="form.eventType"
            :label="t('memories.form.eventType')"
            :items="eventTypeOptions"
            :rules="requiredRule"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            class="mb-3"
          />

          <v-menu
            v-model="dateMenuOpen"
            :close-on-content-click="false"
            :attach="false"
            :eager="true"
          >
            <template #activator="{ props: menuProps }">
              <v-text-field
                v-bind="menuProps"
                :model-value="form.date"
                :label="t('memories.form.date')"
                :rules="requiredRule"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                prepend-inner-icon="mdi-calendar"
                readonly
                class="mb-3"
              />
            </template>
            <v-date-picker
              :model-value="toPickerDate(form.date)"
              hide-header
              @update:model-value="onDateSelected"
            />
          </v-menu>

          <v-textarea
            v-model="form.description"
            :label="t('memories.form.description')"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            rows="2"
            auto-grow
            class="mb-3"
          />

          <div class="mb-3">
            <div class="text-body-2 text-medium-emphasis mb-2">
              {{ t('memories.form.privacy') }}
            </div>
            <v-radio-group v-model="form.privacy" :rules="requiredRule" inline hide-details>
              <v-radio value="public" :label="t('memories.public')" class="mr-6" />
              <v-radio value="private" :label="t('memories.private')" />
            </v-radio-group>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-5 ga-3 justify-end">
        <v-btn variant="text" rounded="lg" :disabled="submitting" @click="emit('close-modal')">
          {{ t('common.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          :loading="submitting"
          prepend-icon="mdi-content-save-outline"
          @click="handleSubmit"
        >
          {{ t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { VForm } from 'vuetify/components'
import type { Album, EventType } from '@/types/memories'
import { useMemories } from '@/composables/useMemories'
import { useMoment } from '@/composables/useMoment'
import { useAppNotifications } from '@/composables/useAppNotifications'
/* END IMPORT */

/** START DEFINE PROPS AND EMITS */
const props = defineProps({
  album: {
    type: Object as PropType<Album>,
    required: true,
  },
  dialog: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['updated', 'close-modal'])
/* END DEFINE PROPS AND EMITS */

/** START DEFINE STATE */
const { t } = useI18n()
const { moment } = useMoment()
const { updateAlbum } = useMemories()
const { notifyError, notifySuccess } = useAppNotifications()

const formReference = ref<VForm | null>(null)
const submitting = ref(false)
const dateMenuOpen = ref(false)

const form = ref({
  title: '',
  eventType: null as EventType | null,
  date: '',
  description: '',
  privacy: 'public' as 'public' | 'private',
})
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const eventTypeOptions = computed(() => [
  { title: t('memories.eventType.team_building'), value: 'team_building' },
  { title: t('memories.eventType.birthday'), value: 'birthday' },
  { title: t('memories.eventType.trip'), value: 'trip' },
  { title: t('memories.eventType.award'), value: 'award' },
  { title: t('memories.eventType.launch'), value: 'launch' },
  { title: t('memories.eventType.other'), value: 'other' },
])
/* END DEFINE COMPUTED */

/** START DEFINE VALIDATE */
const titleRules = [
  (value: string) => !!value?.trim() || t('memories.form.titleRequired'),
  (value: string) => value.length <= 100 || t('memories.form.titleMaxLength'),
]

const requiredRule = [(value: unknown) => !!value || t('common.required')]
/* END DEFINE VALIDATE */

/** START DEFINE METHOD */
function toPickerDate(dateString: string): Date | undefined {
  if (!dateString) return undefined
  return moment(dateString, 'YYYY-MM-DD').toDate()
}

function onDateSelected(selectedDate: Date): void {
  form.value.date = moment(selectedDate).format('YYYY-MM-DD')
  dateMenuOpen.value = false
}

function populateForm(): void {
  form.value = {
    title: props.album.title,
    eventType: props.album.eventType as EventType,
    date: props.album.date ?? '',
    description: props.album.description ?? '',
    privacy: props.album.privacy,
  }
  formReference.value?.resetValidation()
}

async function handleSubmit(): Promise<void> {
  const validation = await formReference.value?.validate()
  if (!validation?.valid) return

  submitting.value = true

  try {
    const result = await updateAlbum(props.album.id, {
      title: form.value.title,
      eventType: form.value.eventType as EventType,
      date: form.value.date,
      description: form.value.description || undefined,
      privacy: form.value.privacy,
    })

    if (!result) {
      notifyError(t('memories.errors.updateAlbum'))
      return
    }

    notifySuccess(t('memories.editAlbumSuccess'))
    emit('updated')
    emit('close-modal')
  } finally {
    submitting.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (value) => {
    if (value) populateForm()
  },
)
/* END DEFINE WATCHER */
</script>
