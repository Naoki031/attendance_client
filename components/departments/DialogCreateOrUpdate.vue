<template>
  <v-dialog :model-value="dialog" :max-width="maxWidth" persistent>
    <v-card rounded="xl" elevation="2" @keydown.enter.prevent="confirm">
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">{{ title }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">{{ $t('departments.subtitle') }}</div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0">
        <v-container class="pa-0">
          <div class="field-label">{{ $t('common.name').toUpperCase() }}</div>
          <v-text-field
            v-model="name"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            :error-messages="errors.name"
            autocomplete="off"
          ></v-text-field>

          <div class="field-label">{{ $t('common.slug').toUpperCase() }}</div>
          <v-text-field
            v-model="slug"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            :error-messages="errors.slug"
            autocomplete="off"
            @input="onSlugInput"
          ></v-text-field>

          <div class="field-label">{{ $t('common.description').toUpperCase() }}</div>
          <v-textarea
            v-model="descriptions"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            :error-messages="errors.descriptions"
            rows="3"
            auto-grow
            autocomplete="off"
          ></v-textarea>
        </v-container>
      </v-card-text>

      <div class="d-flex justify-end ga-3 px-6 py-4">
        <v-btn variant="text" color="default" rounded="lg" @click="close">{{
          $t('common.cancel')
        }}</v-btn>
        <v-btn color="primary" variant="elevated" rounded="lg" @click="confirm">{{
          $t('common.save')
        }}</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** start import */
import type { PropType } from 'vue'
import * as Yup from 'yup'
import type { DepartmentModel } from '@/interfaces/models/DepartmentModel'
import DepartmentService from '@/services/DepartmentService'
/* end import */

/** start define property and emits */
const props = defineProps({
  item: {
    type: Object as PropType<DepartmentModel | null>,
    required: false,
    default: null,
  },
  dialog: {
    type: Boolean,
    required: true,
  },
})
const emit = defineEmits(['confirm', 'close-modal'])

const form = {
  id: null as number | null,
  name: '' as string | null,
  slug: '' as string | null,
  descriptions: '' as string | null,
}
/* end define property and emits */

/** start define validate */
const { t } = useI18n()

const schema = computed(() =>
  Yup.object().shape({
    name: Yup.string().required(t('validation.nameRequired')),
    slug: Yup.string().required(t('validation.slugRequired')),
    descriptions: Yup.string().nullable(),
  }),
)

const { values, errors, handleSubmit, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: form,
})

const { value: name } = useField<string>('name')
const { value: slug } = useField<string>('slug')
const { value: descriptions } = useField<string | null>('descriptions')
/* end define validate */

/** start defined state */
const slugManuallyEdited = ref(false)
/* end defined state */

/** start defined computed */
const title = computed(() =>
  props.item ? t('departments.editDepartment') : t('departments.newDepartment'),
)

const maxWidth = computed(() => '500px')
/* end defined computed */

/** start defined methods */
const handleCreate = handleSubmit(async (formValues) => {
  await schema.value.validate(values, { abortEarly: false })
  DepartmentService.create(formValues)
    .then((result: DepartmentModel) => {
      emit('confirm', result)
    })
    .catch((error) => {
      console.error('Failed to add department:', error)
    })
})

const handleUpdate = handleSubmit(async (formValues) => {
  await schema.value.validate(values, { abortEarly: false })
  DepartmentService.update(props.item?.id as number, formValues)
    .then((result: DepartmentModel) => {
      emit('confirm', result)
    })
    .catch((error) => {
      console.error('Failed to update department:', error)
    })
})

const confirm = () => {
  if (!props.item) {
    handleCreate()
  } else {
    handleUpdate()
  }
}

const close = () => {
  emit('close-modal', null)
}

const onSlugInput = () => {
  slugManuallyEdited.value = true
}
/* end defined methods */

/** start define watcher */
watch(
  () => props.dialog,
  (isOpen) => {
    if (isOpen) {
      if (props.item) {
        slugManuallyEdited.value = true
        setFieldValue('id', props.item.id ?? null)
        setFieldValue('name', props.item.name)
        setFieldValue('slug', props.item.slug)
        setFieldValue('descriptions', props.item.descriptions ?? null)
      } else {
        slugManuallyEdited.value = false
        setFieldValue('id', null)
        setFieldValue('name', '')
        setFieldValue('slug', '')
        setFieldValue('descriptions', null)
      }
    } else {
      close()
    }
  },
  { immediate: false },
)

watch(name, (newName) => {
  if (!slugManuallyEdited.value) {
    setFieldValue(
      'slug',
      (newName ?? '')
        .replace(/[đĐ]/g, 'd')
        .normalize('NFD')
        .replace(/[\u0300-\u036F]/g, '')
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^a-z0-9-]/g, ''),
    )
  }
})
/* end define watcher */

/** start define life cycle hook */
/* end define life cycle hook */
</script>
