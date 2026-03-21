<template>
  <v-dialog :model-value="dialog" :max-width="maxWidth" persistent>
    <v-card @keydown.enter.prevent="confirm">
      <v-card-title class="text-h5">{{ title }}</v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <v-container>
          <!-- Name field -->
          <v-text-field
            v-model="name"
            label="Name"
            :error-messages="errors.name"
            @blur="updateSlug"
          ></v-text-field>

          <!-- Slug field -->
          <v-text-field v-model="slug" label="Slug" :error-messages="errors.slug"></v-text-field>

          <!-- Descriptions field -->
          <v-textarea
            v-model="descriptions"
            label="Descriptions"
            :error-messages="errors.descriptions"
            rows="3"
            auto-grow
          ></v-textarea>
        </v-container>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue-grey-darken-4" variant="text" @click="close">Cancel</v-btn>
        <v-btn color="blue-darken-1" variant="elevated" @click="confirm">OK</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
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
const schema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  slug: Yup.string().required('Slug is required'),
  descriptions: Yup.string().nullable(),
})

const { values, errors, handleSubmit, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: form,
})

const { value: name } = useField<string>('name')
const { value: slug } = useField<string>('slug')
const { value: descriptions } = useField<string | null>('descriptions')
/* end define validate */

/** start defined computed */
const title = computed(() => (props.item ? 'Edit Department' : 'New Department'))

const maxWidth = computed(() => '500px')
/* end defined computed */

/** start defined methods */
const handleCreate = handleSubmit(async (formValues) => {
  await schema.validate(values, { abortEarly: false })
  DepartmentService.create(formValues)
    .then((result: DepartmentModel) => {
      emit('confirm', result)
    })
    .catch((error) => {
      console.error('Failed to add department:', error)
    })
})

const handleUpdate = handleSubmit(async (formValues) => {
  await schema.validate(values, { abortEarly: false })
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

const updateSlug = () => {
  setFieldValue(
    'slug',
    name.value
      .normalize('NFD')
      .replace(/[\u0300-\u036F]/g, '')
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^a-z0-9-]/g, ''),
  )
}
/* end defined methods */

/** start define watcher */
watch(
  () => props.dialog,
  (value) => {
    if (!value) {
      close()
    }
  },
  { immediate: false },
)

watchEffect(() => {
  if (props.item) {
    setFieldValue('id', props.item.id ?? null)
    setFieldValue('name', props.item.name)
    setFieldValue('slug', props.item.slug)
    setFieldValue('descriptions', props.item.descriptions ?? null)
  }
})
/* end define watcher */

/** start define life cycle hook */
/* end define life cycle hook */
</script>
