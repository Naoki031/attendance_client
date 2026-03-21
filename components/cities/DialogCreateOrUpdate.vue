<template>
  <v-dialog :model-value="dialog" max-width="560px" persistent>
    <v-card @keydown.enter.prevent="confirm">
      <v-card-title class="text-h5">{{ title }}</v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <v-container>
          <!-- API error alert -->
          <v-alert
            v-if="serverError"
            type="error"
            variant="tonal"
            class="mb-3"
            closable
            @click:close="serverError = ''"
          >
            {{ serverError }}
          </v-alert>

          <!-- Country select -->
          <v-select
            v-model="countryId"
            :items="countries"
            item-title="name"
            item-value="id"
            label="Country"
            :error-messages="errors.country_id"
          ></v-select>

          <!-- Name field -->
          <v-text-field
            v-model="name"
            label="Name"
            :error-messages="errors.name"
            @blur="updateSlug"
          ></v-text-field>

          <!-- Slug field -->
          <v-text-field v-model="slug" label="Slug" :error-messages="errors.slug"></v-text-field>
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
import type { CityModel } from '@/interfaces/models/CityModel'
import type { CountryModel } from '@/interfaces/models/CountryModel'
import CityService from '@/services/CityService'
import CountryService from '@/services/CountryService'
/* end import */

/** start define property and emits */
const props = defineProps({
  item: {
    type: Object as PropType<CityModel | null>,
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
  country_id: null as number | null,
  name: '' as string | null,
  slug: '' as string | null,
}
/* end define property and emits */

/** start define state */
const countries = ref<Array<CountryModel>>([])
const serverError = ref<string>('')
/* end define state */

/** start define validate */
const schema = Yup.object().shape({
  country_id: Yup.number().required('Country is required'),
  name: Yup.string().required('Name is required'),
  slug: Yup.string().required('Slug is required'),
})

const { errors, handleSubmit, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: form,
})

const { value: countryId } = useField<number | null>('country_id')
const { value: name } = useField<string>('name')
const { value: slug } = useField<string>('slug')
/* end define validate */

/** start defined computed */
const title = computed(() => (props.item ? 'Edit City' : 'New City'))
/* end defined computed */

/** start defined methods */
const loadCountries = async () => {
  try {
    const data = await CountryService.getAll()
    countries.value = Object.values(data)
  } catch (error) {
    console.error('Failed to load countries:', error)
  }
}

const handleCreate = handleSubmit(async (formValues) => {
  serverError.value = ''
  CityService.create(formValues)
    .then((result: CityModel) => {
      emit('confirm', result)
    })
    .catch((error: { data?: { message?: string }; message?: string }) => {
      serverError.value = error?.data?.message ?? error?.message ?? 'Failed to create city'
    })
})

const handleUpdate = handleSubmit(async (formValues) => {
  serverError.value = ''
  CityService.update(props.item?.id as number, formValues)
    .then((result: CityModel) => {
      emit('confirm', result)
    })
    .catch((error: { data?: { message?: string }; message?: string }) => {
      serverError.value = error?.data?.message ?? error?.message ?? 'Failed to update city'
    })
})

const confirm = () => {
  if (!props.item) handleCreate()
  else handleUpdate()
}

const close = () => {
  serverError.value = ''
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
    if (!value) close()
  },
  { immediate: false },
)

watchEffect(() => {
  if (props.item) {
    setFieldValue('id', props.item.id ?? null)
    setFieldValue('country_id', props.item.country_id)
    setFieldValue('name', props.item.name)
    setFieldValue('slug', props.item.slug)
  }
})
/* end define watcher */

/** start define life cycle hook */
onMounted(() => {
  loadCountries()
})
/* end define life cycle hook */
</script>
