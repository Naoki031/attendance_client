<template>
  <v-dialog :model-value="dialog" max-width="600px" persistent>
    <v-card rounded="xl" elevation="2" @keydown.enter.prevent="confirm">
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">{{ $t('bugReports.reportBug') }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">{{ $t('bugReports.subtitle') }}</div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0">
        <v-container class="pa-0">
          <v-row>
            <v-col cols="12">
              <div class="field-label">{{ $t('common.title').toUpperCase() }}</div>
              <v-text-field
                v-model="title"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.title"
                autocomplete="off"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <div class="field-label">{{ $t('common.description').toUpperCase() }}</div>
              <v-textarea
                v-model="description"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                rows="3"
                no-resize
                :error-messages="errors.description"
                autocomplete="off"
              ></v-textarea>
            </v-col>

            <v-col cols="12">
              <div class="field-label">{{ $t('bugReports.reportedAt').toUpperCase() }}</div>
              <div class="reported-at-display text-body-2">
                <v-icon size="14" class="mr-1" color="medium-emphasis">mdi-clock-outline</v-icon>
                {{ formattedReportedAt }}
              </div>
            </v-col>

            <v-col cols="12">
              <div class="field-label">{{ $t('bugReports.screenshot').toUpperCase() }}</div>
              <div class="d-flex flex-column ga-2">
                <div class="d-flex ga-2">
                  <v-btn
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-upload"
                    rounded="lg"
                    @click="triggerFileInput"
                  >
                    {{ $t('bugReports.uploadScreenshot') }}
                  </v-btn>
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="handleFileChange"
                />

                <v-img
                  v-if="screenshotPreview"
                  :src="screenshotPreview"
                  max-height="200px"
                  rounded="lg"
                  class="border"
                ></v-img>

                <v-btn
                  v-if="screenshotPreview"
                  color="error"
                  variant="text"
                  size="small"
                  @click="clearScreenshot"
                >
                  {{ $t('common.remove') }}
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <div class="d-flex justify-end ga-3 px-6 py-4">
        <v-btn variant="text" color="default" rounded="lg" @click="close">{{
          $t('common.cancel')
        }}</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          rounded="lg"
          :loading="isSubmitting"
          @click="confirm"
          >{{ $t('bugReports.submit') }}</v-btn
        >
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import * as Yup from 'yup'
import BugReportService from '@/services/BugReportService'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  dialog: {
    type: Boolean,
    required: true,
  },
  initialScreenshot: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['confirm', 'close-modal'])
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const description = ref<string>('')
const screenshot = ref<string>('')
const screenshotPreview = ref<string>('')
const isSubmitting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const reportedAt = ref<Date>(new Date())
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const formattedReportedAt = computed(() => {
  return reportedAt.value.toLocaleString()
})
/* END DEFINE COMPUTED */

/** START DEFINE VALIDATE */
const { t } = useI18n()

const schema = Yup.object().shape({
  title: Yup.string().required(t('validation.titleRequired')),
})

const { errors, handleSubmit } = useForm({
  validationSchema: schema,
  initialValues: { title: '', description: '' },
})

const { value: title } = useField<string>('title')
/* END DEFINE VALIDATE */

/** START DEFINE METHOD */
const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const base64 = reader.result as string
    screenshot.value = base64
    screenshotPreview.value = base64
  }
  reader.readAsDataURL(file)
}

const clearScreenshot = () => {
  screenshot.value = ''
  screenshotPreview.value = ''

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const confirm = handleSubmit(async () => {
  isSubmitting.value = true

  try {
    const timestampSuffix = `\n\n---\n🕐 ${t('bugReports.reportedAt')}: ${formattedReportedAt.value}`
    const fullDescription = (description.value || '') + timestampSuffix

    const result = await BugReportService.create({
      title: title.value,
      description: fullDescription.trim(),
      screenshot: screenshot.value || undefined,
    })
    emit('confirm', result)
    close()
  } catch (error) {
    console.error('Failed to submit bug report:', error)
  } finally {
    isSubmitting.value = false
  }
})

const close = () => {
  emit('close-modal')
  title.value = ''
  description.value = ''
  clearScreenshot()
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (value) => {
    if (value) {
      reportedAt.value = new Date()
      if (props.initialScreenshot) {
        screenshot.value = props.initialScreenshot
        screenshotPreview.value = props.initialScreenshot
      }
    }

    if (!value) close()
  },
  { immediate: false },
)
/* END DEFINE WATCHER */
</script>

<style scoped>
.field-label {
  font-size: 12px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-bottom: 4px;
}

.border {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.reported-at-display {
  padding: 8px 12px;
  border-radius: 8px;
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
</style>
