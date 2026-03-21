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

          <!-- Capital field -->
          <v-text-field
            v-model="capital"
            label="Capital"
            :error-messages="errors.capital"
          ></v-text-field>
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
import type { CountryModel } from '@/interfaces/models/CountryModel'
import CountryService from '@/services/CountryService'
/* end import */

/** start import name component */
/* end import */

/** start define property and emits */
const props = defineProps({
  item: {
    type: Object as PropType<CountryModel | null>,
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
  capital: '' as string | null,
}
/* end define property and emits */

/** 3. start define validate */
const schema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  slug: Yup.string().required('Slug is required'),
  capital: Yup.string().nullable(),
})

const {
  values,
  errors,
  handleSubmit,
  setFieldError: _setFieldError,
  setFieldValue,
} = useForm({
  validationSchema: schema,
  initialValues: form,
})

const { value: name } = useField<string>('name')
const { value: slug } = useField<string>('slug')
const { value: capital } = useField<string | null>('capital')
/* end define validate */

/** 4. start defined state */
/* end defined state */

/** 5. start defined computed */
const title = computed(() => {
  return props.item ? 'Edit Country' : 'New Country'
})

const maxWidth = computed(() => {
  return '500px'
})
/* end defined computed */

/** 6. start defined methods */
const handleCreate = handleSubmit(async (form) => {
  await schema.validate(values, { abortEarly: false })
  CountryService.create(form)
    .then((result: CountryModel) => {
      emit('confirm', result)
    })
    .catch((error) => {
      console.error('Failed to add country:', error)
    })
})

const handleUpdate = handleSubmit(async (form) => {
  await schema.validate(values, { abortEarly: false })
  CountryService.update(props.item?.id as number, form)
    .then((result: CountryModel) => {
      emit('confirm', result)
    })
    .catch((error) => {
      console.error('Failed to update country:', error)
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
      .replace(/[\u0300-\u036F]/g, '') // Remove accents
      .toLowerCase() // Convert to lowercase
      .replace(/ /g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, ''), // Remove all non-alphanumeric characters except hyphens
  )
}
/* end defined methods */

/** 7. start define watcher */
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
    setFieldValue('id', props.item?.id ?? null)
    setFieldValue('name', props.item?.name)
    setFieldValue('slug', props.item?.slug)
    setFieldValue('capital', String(props.item?.capital))
  }
})
/* end define life watcher */

/** 8. start define life cycle hook */
/* end define life cycle hook */
</script>
