<template>
  <v-dialog :model-value="dialog" max-width="500px" persistent>
    <v-card @keydown.enter.prevent="confirm">
      <v-card-title class="text-h5">Assign User to Department</v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <v-container>
          <!-- API error alert -->
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

          <!-- User select: search server-side, no full list loaded upfront -->
          <v-autocomplete
            v-model="userId"
            label="User"
            :items="searchedUsers"
            item-title="full_name"
            item-value="id"
            :loading="isSearchingUsers"
            :error-messages="errors.user_id"
            no-filter
            clearable
            placeholder="Type to search..."
            autocomplete="off"
            @update:search="onUserSearch"
          ></v-autocomplete>

          <!-- Company select -->
          <v-autocomplete
            v-model="companyId"
            label="Company"
            :items="companies"
            item-title="name"
            item-value="id"
            :error-messages="errors.company_id"
            clearable
            autocomplete="off"
          ></v-autocomplete>
        </v-container>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue-grey-darken-4" variant="text" @click="close">Cancel</v-btn>
        <v-btn color="blue-darken-1" variant="elevated" @click="confirm">Assign</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
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
