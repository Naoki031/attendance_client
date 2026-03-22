<template>
  <v-dialog :model-value="dialog" :max-width="maxWidth" persistent>
    <v-card rounded="xl" elevation="2" @keydown.enter.prevent="confirm">
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">{{ title }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">Create or update company details.</div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0">
        <v-container class="pa-0">
          <v-row>
            <v-col cols="12" md="6">
              <div class="field-label">NAME</div>
              <v-text-field
                v-model="name"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.name"
                autocomplete="off"
                @blur="updateSlug"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <div class="field-label">SLUG</div>
              <v-text-field
                v-model="slug"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.slug"
                autocomplete="off"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <div class="field-label">COUNTRY</div>
              <v-select
                v-model="countryId"
                :items="countries"
                item-title="name"
                item-value="id"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                clearable
                :error-messages="errors.country_id"
                @update:model-value="onCountryChange"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <div class="field-label">CITY</div>
              <v-select
                v-model="cityId"
                :items="filteredCities"
                item-title="name"
                item-value="id"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                clearable
                :disabled="!countryId"
                :error-messages="errors.city_id"
              ></v-select>
            </v-col>
            <v-col cols="12">
              <div class="field-label">ADDRESS</div>
              <v-text-field
                v-model="address"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.address"
                autocomplete="off"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <div class="field-label">PHONE</div>
              <v-text-field
                v-model="phone"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.phone"
                autocomplete="off"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <div class="field-label">EMAIL</div>
              <v-text-field
                v-model="email"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.email"
                autocomplete="off"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <div class="field-label">WEBSITE</div>
              <v-text-field
                v-model="website"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.website"
                autocomplete="off"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <div class="d-flex justify-end ga-3 px-6 py-4">
        <v-btn variant="text" color="default" rounded="lg" @click="close">Cancel</v-btn>
        <v-btn color="primary" variant="elevated" rounded="lg" @click="confirm">Save</v-btn>
      </div>
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
