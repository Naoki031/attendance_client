<template>
  <v-dialog :model-value="dialog" max-width="500px" persistent>
    <v-card rounded="xl" elevation="2" @keydown.enter.prevent="confirm">
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">
            {{ $t('departments.assignUserTitle') }}
          </div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ $t('departments.assignUserSubtitle') }}
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

          <div class="field-label">{{ $t('common.user').toUpperCase() }}</div>
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
            :placeholder="$t('common.typeToSearch')"
            autocomplete="off"
            @update:search="onUserSearch"
          ></v-autocomplete>

          <div class="field-label">{{ $t('common.company').toUpperCase() }}</div>
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
        <v-btn variant="text" color="default" rounded="lg" @click="close">{{
          $t('common.cancel')
        }}</v-btn>
        <v-btn color="primary" variant="elevated" rounded="lg" @click="confirm">{{
          $t('departments.assignUser')
        }}</v-btn>
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
const { t } = useI18n()

const schema = computed(() =>
  Yup.object().shape({
    user_id: Yup.number()
      .required(t('validation.required', { field: t('common.user') }))
      .typeError(t('validation.required', { field: t('common.user') })),
    company_id: Yup.number()
      .required(t('validation.companyRequired'))
      .typeError(t('validation.companyRequired')),
  }),
)

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
      // Handle error.data - could be object or string
      let errorData = error?.data

      if (typeof errorData === 'string') {
        try {
          errorData = JSON.parse(errorData)
        } catch {
          // not valid JSON, use as-is
        }
      }

      console.log('Processed errorData:', errorData)

      // Extract message from processed data
      const message = errorData?.message ?? errorData?.error ?? error?.message ?? ''

      console.log('Extracted message:', message)
      console.log('Message type:', typeof message)

      const lowerMessage = message.toLowerCase()
      console.log('Lowercase message:', lowerMessage)
      console.log('Includes "already assigned":', lowerMessage.includes('already assigned'))

      // Map backend error message to i18n key
      if (
        lowerMessage.includes('already assigned') ||
        lowerMessage.includes('already assigned to this department') ||
        lowerMessage.includes('this user is already assigned')
      ) {
        console.log('✓ Matched! Setting i18n error')
        apiError.value = t('departments.userAlreadyAssignedToDepartment')
      } else if (message) {
        console.log('✗ Not matched, using fallback')
        apiError.value = t('common.error') + ': ' + message
      } else {
        console.log('✗ Empty message, using common error')
        apiError.value = t('common.error')
      }
      console.log('Final apiError:', apiError.value)
      console.log('=== End Debug ===')
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
