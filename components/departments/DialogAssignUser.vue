<template>
  <v-dialog :model-value="dialog" max-width="500px" persistent>
    <v-card rounded="xl" elevation="2" @keydown.enter.prevent="confirm">
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">Assign User to Department</div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            Select a user and their company to assign.
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0">
        <v-container class="pa-0">
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

          <div class="field-label">USER</div>
          <v-autocomplete
            v-model="userId"
            :items="searchedUsers"
            item-title="full_name"
            item-value="id"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            :loading="isSearchingUsers"
            :error-messages="errors.user_id"
            no-filter
            clearable
            placeholder="Type to search..."
            autocomplete="off"
            @update:search="onUserSearch"
          ></v-autocomplete>

          <div class="field-label">COMPANY</div>
          <v-autocomplete
            v-model="companyId"
            :items="companies"
            item-title="name"
            item-value="id"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            :error-messages="errors.company_id"
            clearable
            autocomplete="off"
          ></v-autocomplete>
        </v-container>
      </v-card-text>

      <div class="d-flex justify-end ga-3 px-6 py-4">
        <v-btn variant="text" color="default" rounded="lg" @click="close">Cancel</v-btn>
        <v-btn color="primary" variant="elevated" rounded="lg" @click="confirm">Assign</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** start import */
import type { PropType } from 'vue'
import * as Yup from 'yup'
import type { UserModel } from '@/interfaces/models/UserModel'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import UserDepartmentService from '@/services/UserDepartmentService'
import UserService from '@/services/UserService'
/* end import */

/** start define property and emits */
const props = defineProps({
  departmentId: {
    type: Number as PropType<number>,
    required: true,
  },
  companies: {
    type: Array as PropType<CompanyModel[]>,
    required: true,
  },
  dialog: {
    type: Boolean,
    required: true,
  },
})
const emit = defineEmits(['confirm', 'close-modal'])
/* end define property and emits */

/** start define validate */
const schema = Yup.object().shape({
  user_id: Yup.number().required('User is required').typeError('User is required'),
  company_id: Yup.number().required('Company is required').typeError('Company is required'),
})

const { errors, handleSubmit, resetForm } = useForm({
  validationSchema: schema,
  initialValues: { user_id: null as number | null, company_id: null as number | null },
})

const { value: userId } = useField<number | null>('user_id')
const { value: companyId } = useField<number | null>('company_id')
/* end define validate */

/** start defined state */
const searchedUsers = ref<Array<UserModel>>([])
const isSearchingUsers = ref(false)
const apiError = ref('')
/* end defined state */

/** start defined methods */
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

const onUserSearch = (query: string) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  if (!query || query.length < 2) {
    searchedUsers.value = []

    return
  }
  searchDebounceTimer = setTimeout(async () => {
    isSearchingUsers.value = true

    try {
      searchedUsers.value = await UserService.search(query)
    } catch (error) {
      console.error('User search failed:', error)
    } finally {
      isSearchingUsers.value = false
    }
  }, 300)
}

const handleCreate = handleSubmit(async (formValues) => {
  UserDepartmentService.create({
    user_id: formValues.user_id as number,
    company_id: formValues.company_id as number,
    department_id: props.departmentId,
  })
    .then(() => {
      apiError.value = ''
      emit('confirm')
      resetForm()
    })
    .catch((error) => {
      apiError.value = error?.data?.message ?? 'Failed to assign user'
    })
})

const confirm = () => {
  handleCreate()
}

const close = () => {
  apiError.value = ''
  resetForm()
  emit('close-modal')
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
/* end define watcher */
</script>
