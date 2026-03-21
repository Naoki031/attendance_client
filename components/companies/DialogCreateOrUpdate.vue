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
            autocomplete="off"
            @blur="updateSlug"
          ></v-text-field>

          <!-- Slug field -->
          <v-text-field
            v-model="slug"
            label="Slug"
            :error-messages="errors.slug"
            autocomplete="off"
          ></v-text-field>

          <!-- Country select -->
          <v-select
            v-model="countryId"
            :items="countries"
            item-title="name"
            item-value="id"
            label="Country"
            clearable
            :error-messages="errors.country_id"
            @update:model-value="onCountryChange"
          ></v-select>

          <!-- City select -->
          <v-select
            v-model="cityId"
            :items="filteredCities"
            item-title="name"
            item-value="id"
            label="City"
            clearable
            :disabled="!countryId"
            :error-messages="errors.city_id"
          ></v-select>

          <!-- Address field -->
          <v-text-field
            v-model="address"
            label="Address"
            :error-messages="errors.address"
            autocomplete="off"
          ></v-text-field>

          <!-- Phone field -->
          <v-text-field
            v-model="phone"
            label="Phone"
            :error-messages="errors.phone"
            autocomplete="off"
          ></v-text-field>

          <!-- Email field -->
          <v-text-field
            v-model="email"
            label="Email"
            :error-messages="errors.email"
            autocomplete="off"
          ></v-text-field>

          <!-- Website field -->
          <v-text-field
            v-model="website"
            label="Website"
            :error-messages="errors.website"
            autocomplete="off"
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
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import type { CountryModel } from '@/interfaces/models/CountryModel'
import type { CityModel } from '@/interfaces/models/CityModel'
import CompanyService from '@/services/CompanyService'
import CountryService from '@/services/CountryService'
import CityService from '@/services/CityService'
/* end import */

/** start define property and emits */
const props = defineProps({
  item: {
    type: Object as PropType<CompanyModel | null>,
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
  country_id: null as number | null,
  city_id: null as number | null,
  address: '' as string | null,
  phone: '' as string | null,
  email: '' as string | null,
  website: '' as string | null,
}
/* end define property and emits */

/** start define state */
const countries = ref<Array<CountryModel>>([])
const cities = ref<Array<CityModel>>([])
/* end define state */

/** start define computed */
const filteredCities = computed(() =>
  countryId.value ? cities.value.filter((cityItem) => cityItem.country_id === countryId.value) : [],
)
/* end define computed */

/** start define validate */
const schema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  slug: Yup.string().required('Slug is required'),
  country_id: Yup.number().nullable(),
  city_id: Yup.number().nullable(),
  address: Yup.string().nullable(),
  phone: Yup.string().nullable(),
  email: Yup.string().nullable(),
  website: Yup.string().nullable(),
})

const { errors, handleSubmit, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: form,
})

const { value: name } = useField<string>('name')
const { value: slug } = useField<string>('slug')
const { value: countryId } = useField<number | null>('country_id')
const { value: cityId } = useField<number | null>('city_id')
const { value: address } = useField<string | null>('address')
const { value: phone } = useField<string | null>('phone')
const { value: email } = useField<string | null>('email')
const { value: website } = useField<string | null>('website')
/* end define validate */

/** start defined computed */
const title = computed(() => (props.item ? 'Edit Company' : 'New Company'))
const maxWidth = computed(() => '600px')
/* end defined computed */

/** start defined methods */
const loadDropdowns = async () => {
  try {
    const [countryData, cityData] = await Promise.all([
      CountryService.getAll(),
      CityService.getAll(),
    ])
    countries.value = Object.values(countryData)
    cities.value = Object.values(cityData)
  } catch (error) {
    console.error('Failed to load dropdown data:', error)
  }
}

const onCountryChange = () => {
  setFieldValue('city_id', null)
}

const handleCreate = handleSubmit(async (formValues) => {
  CompanyService.create(formValues)
    .then((result: CompanyModel) => {
      emit('confirm', result)
    })
    .catch((error) => {
      console.error('Failed to create company:', error)
    })
})

const handleUpdate = handleSubmit(async (formValues) => {
  CompanyService.update(props.item?.id as number, formValues)
    .then((result: CompanyModel) => {
      emit('confirm', result)
    })
    .catch((error) => {
      console.error('Failed to update company:', error)
    })
})

const confirm = () => {
  if (!props.item) handleCreate()
  else handleUpdate()
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
    if (!value) close()
  },
  { immediate: false },
)

watchEffect(() => {
  if (props.item) {
    setFieldValue('id', props.item.id ?? null)
    setFieldValue('name', props.item.name)
    setFieldValue('slug', props.item.slug)
    setFieldValue('country_id', props.item.country_id ?? null)
    setFieldValue('city_id', props.item.city_id ?? null)
    setFieldValue('address', props.item.address ?? null)
    setFieldValue('phone', props.item.phone ?? null)
    setFieldValue('email', props.item.email ?? null)
    setFieldValue('website', props.item.website ?? null)
  }
})
/* end define watcher */

/** start define life cycle hook */
onMounted(() => {
  loadDropdowns()
})
/* end define life cycle hook */
</script>
