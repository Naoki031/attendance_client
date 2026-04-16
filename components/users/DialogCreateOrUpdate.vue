<template>
  <v-dialog :model-value="dialog" :max-width="maxWidth" persistent scrollable>
    <v-card rounded="xl" elevation="2" @keydown.enter.prevent="confirm">
      <!-- Header -->
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">{{ title }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ props.item ? $t('users.updateSubtitle') : $t('users.createSubtitle') }}
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text ref="formContainer" class="px-6 py-0" style="max-height: 70vh; overflow-y: auto">
        <v-container class="pa-0">
          <v-row>
            <!-- ── PERSONAL INFO ── -->
            <v-col cols="12">
              <div class="section-label">{{ $t('users.sectionPersonalInfo').toUpperCase() }}</div>
            </v-col>

            <!-- First Name -->
            <v-col cols="12" md="6">
              <div class="field-label">
                {{ $t('profile.firstName').toUpperCase() }} <span class="text-error">*</span>
              </div>
              <v-text-field
                v-model="first_name"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.first_name"
                required
                autocomplete="off"
              ></v-text-field>
            </v-col>

            <!-- Last Name -->
            <v-col cols="12" md="6">
              <div class="field-label">
                {{ $t('profile.lastName').toUpperCase() }} <span class="text-error">*</span>
              </div>
              <v-text-field
                v-model="last_name"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.last_name"
                required
                autocomplete="off"
              ></v-text-field>
            </v-col>

            <!-- Date of Birth -->
            <v-col cols="12" md="6">
              <div class="field-label">{{ $t('profile.dateOfBirth').toUpperCase() }}</div>
              <v-menu v-model="menuDateOfBirth" :close-on-content-click="false">
                <template #activator="{ props: menuProps }">
                  <v-text-field
                    v-bind="menuProps"
                    :model-value="date_of_birth"
                    variant="filled"
                    rounded="lg"
                    flat
                    density="comfortable"
                    prepend-inner-icon="mdi-calendar"
                    :error-messages="errors.date_of_birth"
                    readonly
                    autocomplete="off"
                  />
                </template>
                <v-date-picker
                  :model-value="toPickerDate(date_of_birth)"
                  hide-header
                  @update:model-value="
                    (selectedDate: Date) => {
                      date_of_birth = formatDate(selectedDate)
                      menuDateOfBirth = false
                    }
                  "
                />
              </v-menu>
            </v-col>

            <!-- Phone Number -->
            <v-col cols="12" md="6">
              <div class="field-label">
                {{ $t('profile.phoneNumber').toUpperCase() }} <span class="text-error">*</span>
              </div>
              <v-text-field
                v-model="phone_number"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                type="tel"
                :error-messages="errors.phone_number"
                required
                autocomplete="off"
              ></v-text-field>
            </v-col>

            <!-- Address -->
            <v-col cols="12" md="12">
              <div class="field-label">
                {{ $t('profile.address').toUpperCase() }} <span class="text-error">*</span>
              </div>
              <v-text-field
                v-model="address"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.address"
                required
                autocomplete="off"
              ></v-text-field>
            </v-col>

            <!-- ── WORK INFO ── -->
            <v-col cols="12">
              <div class="section-label">{{ $t('users.sectionWorkInfo').toUpperCase() }}</div>
            </v-col>

            <!-- Position -->
            <v-col cols="12" md="6">
              <div class="field-label">
                {{ $t('profile.position').toUpperCase() }} <span class="text-error">*</span>
              </div>
              <v-text-field
                v-model="position"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.position"
                required
                autocomplete="off"
              ></v-text-field>
            </v-col>

            <!-- Join Date -->
            <v-col cols="12" md="6">
              <div class="field-label">{{ $t('profile.joinDate').toUpperCase() }}</div>
              <v-menu v-model="menuJoinDate" :close-on-content-click="false">
                <template #activator="{ props: menuProps }">
                  <v-text-field
                    v-bind="menuProps"
                    :model-value="join_date"
                    variant="filled"
                    rounded="lg"
                    flat
                    density="comfortable"
                    prepend-inner-icon="mdi-calendar-check"
                    :error-messages="errors.join_date"
                    readonly
                    autocomplete="off"
                  />
                </template>
                <v-date-picker
                  :model-value="toPickerDate(join_date)"
                  hide-header
                  @update:model-value="
                    (selectedDate: Date) => {
                      join_date = formatDate(selectedDate)
                      menuJoinDate = false
                    }
                  "
                />
              </v-menu>
            </v-col>

            <!-- Email -->
            <v-col cols="12" md="6">
              <div class="field-label">
                {{ $t('users.emailAddress').toUpperCase() }} <span class="text-error">*</span>
              </div>
              <v-text-field
                v-model="email"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.email"
                required
                autocomplete="off"
              ></v-text-field>
            </v-col>

            <!-- Slack ID -->
            <v-col cols="12" md="6">
              <div class="field-label">{{ $t('users.slackMemberId').toUpperCase() }}</div>
              <v-text-field
                v-model="slack_id"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                placeholder="U0123456789"
                autocomplete="off"
              ></v-text-field>
            </v-col>

            <!-- Company (create only) -->
            <v-col v-if="!props.item" cols="12" md="6">
              <div class="field-label">
                {{ $t('common.company').toUpperCase() }} <span class="text-error">*</span>
              </div>
              <v-autocomplete
                v-model="selectedCompanyId"
                :items="availableCompanies"
                item-title="name"
                item-value="id"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="companyError"
                :loading="isLoadingCompanies"
                autocomplete="off"
                @update:model-value="companyError = ''"
              ></v-autocomplete>
            </v-col>

            <!-- Department (create only) -->
            <v-col v-if="!props.item" cols="12" md="6">
              <div class="field-label">
                {{ $t('profile.department').toUpperCase() }} <span class="text-error">*</span>
              </div>
              <v-autocomplete
                v-model="selectedDepartmentId"
                :items="availableDepartments"
                item-title="name"
                item-value="id"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="departmentError"
                :loading="isLoadingDepartments"
                autocomplete="off"
                @update:model-value="departmentError = ''"
              ></v-autocomplete>
            </v-col>

            <!-- ── ACCOUNT & ACCESS ── -->
            <v-col cols="12">
              <div class="section-label">{{ $t('users.sectionAccountAccess').toUpperCase() }}</div>
            </v-col>

            <!-- Roles -->
            <v-col cols="12" md="8">
              <div class="field-label">{{ $t('users.assignedRoles').toUpperCase() }}</div>
              <v-select
                v-model="permission_group_ids"
                :items="availableRoles"
                item-title="name"
                item-value="id"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.permission_group_ids"
                :loading="isLoadingRoles"
                multiple
                closable-chips
                required
              >
                <template #chip="{ item: chipItem, props: chipProps }">
                  <v-chip v-bind="chipProps" :closable="chipItem.id !== defaultRoleId">
                    {{ chipItem.name }}
                  </v-chip>
                </template>
              </v-select>
            </v-col>

            <!-- Status -->
            <v-col cols="12" md="4">
              <div class="field-label">{{ $t('users.accessStatus').toUpperCase() }}</div>
              <div class="d-flex align-center mt-2">
                <v-switch
                  v-model="is_active"
                  color="primary"
                  hide-details
                  :error-messages="errors.is_active"
                ></v-switch>
                <span class="ml-2 text-body-2">{{
                  is_active ? $t('common.active') : $t('common.inactive')
                }}</span>
              </div>
            </v-col>

            <!-- ── ATTENDANCE DEVICE ── -->
            <v-col cols="12">
              <div class="section-label">
                {{ $t('users.sectionAttendanceDevice').toUpperCase() }}
              </div>
            </v-col>

            <!-- Device User ID -->
            <v-col cols="12" md="6">
              <div class="field-label">{{ $t('users.devicePin').toUpperCase() }}</div>
              <v-text-field
                v-model="device_user_id"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                type="number"
                placeholder="e.g. 1"
                :hint="$t('users.devicePinHint')"
                persistent-hint
                autocomplete="off"
              ></v-text-field>
            </v-col>

            <!-- Skip Attendance -->
            <v-col cols="12" md="6">
              <div class="field-label">{{ $t('users.skipAttendance').toUpperCase() }}</div>
              <div class="d-flex align-center mt-2">
                <v-switch v-model="skip_attendance" color="warning" hide-details></v-switch>
                <span class="ml-2 text-body-2">{{
                  skip_attendance ? $t('common.yes') : $t('common.no')
                }}</span>
              </div>
            </v-col>

            <!-- Permanent Remote -->
            <v-col cols="12" md="6">
              <div class="field-label">{{ $t('users.permanentRemote').toUpperCase() }}</div>
              <div class="d-flex align-center mt-2">
                <v-switch v-model="permanent_remote" color="success" hide-details></v-switch>
                <span class="ml-2 text-body-2">{{
                  permanent_remote ? $t('common.yes') : $t('common.no')
                }}</span>
              </div>
            </v-col>

            <!-- Permanent Remote Reason -->
            <v-col v-if="permanent_remote" cols="12">
              <div class="field-label">{{ $t('users.permanentRemoteReason').toUpperCase() }}</div>
              <v-textarea
                v-model="permanent_remote_reason"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                rows="2"
                :placeholder="$t('users.permanentRemoteReasonPlaceholder')"
                no-resize
                autocomplete="off"
              ></v-textarea>
            </v-col>

            <!-- Contract section -->
            <v-col cols="12">
              <div class="section-label">{{ $t('users.sectionContract').toUpperCase() }}</div>
            </v-col>

            <!-- Contract Type -->
            <v-col cols="12" md="6">
              <div class="field-label">{{ $t('profile.contractType').toUpperCase() }}</div>
              <v-text-field
                v-model="contract_type"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.contract_type"
                autocomplete="off"
              ></v-text-field>
            </v-col>

            <!-- Contract Count -->
            <v-col cols="12" md="6">
              <div class="field-label">{{ $t('profile.contractCount').toUpperCase() }}</div>
              <v-text-field
                v-model="contract_count"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                type="number"
                :error-messages="errors.contract_count"
                autocomplete="off"
              ></v-text-field>
            </v-col>

            <!-- Annual Leave Hours -->
            <v-col cols="12" md="6">
              <div class="field-label">{{ $t('profile.annualLeaveHours').toUpperCase() }}</div>
              <v-text-field
                v-model="annual_leave_hours"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                type="number"
                :error-messages="errors.annual_leave_hours"
                autocomplete="off"
              ></v-text-field>
            </v-col>

            <!-- Remaining Leave Hours -->
            <v-col cols="12" md="6">
              <div class="field-label">{{ $t('profile.remainingLeaveHours').toUpperCase() }}</div>
              <v-text-field
                v-model="remaining_leave_hours"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                type="number"
                :error-messages="errors.remaining_leave_hours"
                autocomplete="off"
              ></v-text-field>
            </v-col>

            <!-- Contract Signed Date -->
            <v-col cols="12" md="6">
              <div class="field-label">{{ $t('profile.contractSignedDate').toUpperCase() }}</div>
              <v-menu v-model="menuContractSignedDate" :close-on-content-click="false">
                <template #activator="{ props: menuProps }">
                  <v-text-field
                    v-bind="menuProps"
                    :model-value="contract_signed_date"
                    variant="filled"
                    rounded="lg"
                    flat
                    density="comfortable"
                    prepend-inner-icon="mdi-calendar-edit"
                    :error-messages="errors.contract_signed_date"
                    readonly
                    autocomplete="off"
                  />
                </template>
                <v-date-picker
                  :model-value="toPickerDate(contract_signed_date)"
                  hide-header
                  @update:model-value="
                    (selectedDate: Date) => {
                      contract_signed_date = formatDate(selectedDate)
                      menuContractSignedDate = false
                    }
                  "
                />
              </v-menu>
            </v-col>

            <!-- Contract Expired Date -->
            <v-col cols="12" md="6">
              <div class="field-label">{{ $t('profile.contractExpiredDate').toUpperCase() }}</div>
              <v-menu v-model="menuContractExpiredDate" :close-on-content-click="false">
                <template #activator="{ props: menuProps }">
                  <v-text-field
                    v-bind="menuProps"
                    :model-value="contract_expired_date"
                    variant="filled"
                    rounded="lg"
                    flat
                    density="comfortable"
                    prepend-inner-icon="mdi-calendar-remove"
                    :error-messages="errors.contract_expired_date"
                    readonly
                    autocomplete="off"
                  />
                </template>
                <v-date-picker
                  :model-value="toPickerDate(contract_expired_date)"
                  hide-header
                  @update:model-value="
                    (selectedDate: Date) => {
                      contract_expired_date = formatDate(selectedDate)
                      menuContractExpiredDate = false
                    }
                  "
                />
              </v-menu>
            </v-col>

            <!-- Password section -->
            <v-col cols="12">
              <div class="section-label">{{ $t('users.sectionPassword').toUpperCase() }}</div>
            </v-col>

            <!-- Password -->
            <v-col cols="12" md="6">
              <div class="field-label">
                {{ $t('auth.password').toUpperCase() }}
                <span v-if="!props.item" class="text-error">*</span>
              </div>
              <v-text-field
                v-model="password"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :placeholder="props.item ? $t('users.passwordLeaveBlank') : ''"
                :error-messages="errors.password"
                type="password"
                autocomplete="new-password"
                :required="!props.item"
              ></v-text-field>
            </v-col>

            <!-- Confirm Password -->
            <v-col cols="12" md="6">
              <div class="field-label">
                {{ $t('auth.confirmPassword').toUpperCase() }}
                <span v-if="!props.item" class="text-error">*</span>
              </div>
              <v-text-field
                v-model="confirm_password"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :placeholder="props.item ? $t('users.passwordLeaveBlank') : ''"
                :error-messages="errors.confirm_password"
                type="password"
                autocomplete="new-password"
                :required="!props.item"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <!-- Footer -->
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
        >
          {{ $t('common.save') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import { computed, watch } from 'vue'
import type { PropType } from 'vue'
import * as Yup from 'yup'
import type { UserModel } from '@/interfaces/models/UserModel'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import type { DepartmentModel } from '@/interfaces/models/DepartmentModel'
import type { PermissionGroupModel } from '@/interfaces/models/PermissionGroupModel'
import UserService from '@/services/UserService'
import CompanyService from '@/services/CompanyService'
import DepartmentService from '@/services/DepartmentService'
import UserDepartmentService from '@/services/UserDepartmentService'
import PermissionGroupService from '@/services/PermissionGroupService'
import type { UserFormType } from '@/types/index'
import { useAppNotifications } from '@/composables/useAppNotifications'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  item: {
    type: Object as PropType<UserModel | null>,
    required: false,
    default: null,
  },

  dialog: {
    type: Boolean,
    required: true,
  },
})
const emit = defineEmits(['confirm', 'close-modal'])

const form: UserFormType = {
  id: null,
  first_name: null,
  last_name: null,
  position: null,
  phone_number: null,
  email: null,
  address: null,
  password: null,
  confirm_password: null,
  is_active: true,
  permission_group_ids: [],
  date_of_birth: null,
  join_date: null,
  contract_signed_date: null,
  contract_expired_date: null,
  contract_type: null,
  contract_count: null,
  annual_leave_hours: null,
  remaining_leave_hours: null,
  slack_id: null,
  device_user_id: null,
  skip_attendance: false,
  permanent_remote: false,
  permanent_remote_reason: null,
}
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
const { t } = useI18n()
const { notifyError } = useAppNotifications()

const schema = computed(() =>
  Yup.object().shape({
    first_name: Yup.string().required(t('validation.firstNameRequired')),
    last_name: Yup.string().required(t('validation.lastNameRequired')),
    position: Yup.string().required(t('validation.positionRequired')),
    phone_number: Yup.string()
      .matches(/^\+?[\d\s\-().]{7,20}$/, t('validation.phoneNumberInvalid'))
      .required(t('validation.phoneNumberRequired')),
    email: Yup.string().email(t('validation.invalidEmail')).required(t('validation.emailRequired')),
    address: Yup.string().required(t('validation.addressRequired')),

    // Password is required only when creating; optional (but min 6 if provided) when editing
    password: props.item
      ? Yup.string()
          .transform((value: string | null | undefined) => (value === '' ? null : value))
          .min(6, t('validation.passwordMinLength', { min: 6 }))
          .nullable()
          .optional()
      : Yup.string()
          .min(6, t('validation.passwordMinLength', { min: 6 }))
          .required(t('validation.passwordRequired')),
    confirm_password: Yup.string().when('password', {
      is: (value: string | null) => !!value && value.length > 0,
      then: (yupSchema) =>
        yupSchema
          .oneOf([Yup.ref('password')], t('validation.oneOf'))
          .required(t('validation.confirmPasswordRequired')),
      otherwise: (yupSchema) => yupSchema.nullable().optional(),
    }),
    is_active: Yup.boolean().required(t('validation.required', { field: t('users.accessStatus') })),
    permission_group_ids: Yup.array()
      .of(Yup.number())
      .min(1, t('validation.atLeastOne'))
      .required(),
    date_of_birth: Yup.string().nullable(),
    join_date: Yup.string().nullable(),
    contract_signed_date: Yup.string().nullable(),
    contract_expired_date: Yup.string().nullable(),
    contract_type: Yup.string().nullable(),
    contract_count: Yup.number().nullable(),
    annual_leave_hours: Yup.number().nullable(),
    remaining_leave_hours: Yup.number().nullable(),
    slack_id: Yup.string().nullable(),
    device_user_id: Yup.number().nullable(),
    skip_attendance: Yup.boolean().default(false),
    permanent_remote: Yup.boolean().default(false),
    permanent_remote_reason: Yup.string().nullable(),
  }),
)

const {
  errors,
  handleSubmit,
  setFieldValue,
  resetForm,
  isSubmitting,
  validateField,
  setFieldError,
} = useForm({
  validationSchema: schema,
  initialValues: form,
})

const { value: first_name } = useField<string>('first_name')
const { value: last_name } = useField<string>('last_name')
const { value: position } = useField<string>('position')
const { value: phone_number } = useField<string>('phone_number')
const { value: email } = useField<string>('email')
const { value: address } = useField<string>('address')
const { value: password } = useField<string | null>('password')
const { value: confirm_password, meta: confirmPasswordMeta } = useField<string | null>(
  'confirm_password',
)
const { value: is_active } = useField<boolean>('is_active')
const { value: permission_group_ids } = useField<number[]>('permission_group_ids')
const { value: date_of_birth } = useField<string | null>('date_of_birth')
const { value: join_date } = useField<string | null>('join_date')
const { value: contract_signed_date } = useField<string | null>('contract_signed_date')
const { value: contract_expired_date } = useField<string | null>('contract_expired_date')
const { value: contract_type } = useField<string | null>('contract_type')
const { value: contract_count } = useField<number | null>('contract_count')
const { value: annual_leave_hours } = useField<number | null>('annual_leave_hours')
const { value: remaining_leave_hours } = useField<number | null>('remaining_leave_hours')
const { value: slack_id } = useField<string | null>('slack_id')
const { value: device_user_id } = useField<number | null>('device_user_id')
const { value: skip_attendance } = useField<boolean>('skip_attendance')
const { value: permanent_remote } = useField<boolean>('permanent_remote')
const { value: permanent_remote_reason } = useField<string | null>('permanent_remote_reason')
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const availableRoles = ref<PermissionGroupModel[]>([])
const availableCompanies = ref<CompanyModel[]>([])
const availableDepartments = ref<DepartmentModel[]>([])
const isLoadingRoles = ref(false)
const isLoadingCompanies = ref(false)
const isLoadingDepartments = ref(false)
const selectedCompanyId = ref<number | null>(null)
const selectedDepartmentId = ref<number | null>(null)
const companyError = ref('')
const departmentError = ref('')
const menuDateOfBirth = ref(false)
const menuJoinDate = ref(false)
const menuContractSignedDate = ref(false)
const menuContractExpiredDate = ref(false)
/* END DEFINE STATE */

/** START DEFINE HELPERS */
const { moment } = useMoment()

// Normalize a date or datetime value from the API (e.g. '1998-02-06T00:00:00.000Z') to 'YYYY-MM-DD'
const toDateOnly = (value: string | null | undefined): string | null => {
  if (!value) return null
  return moment.utc(value).format('YYYY-MM-DD')
}

const toPickerDate = (dateString: string | null | undefined): Date | undefined => {
  if (!dateString) return undefined
  return moment(dateString, 'YYYY-MM-DD').toDate()
}

const formatDate = (date: Date | null | undefined): string | null => {
  if (!date) return null
  return moment(date).format('YYYY-MM-DD')
}
/* END DEFINE HELPERS */

/** START DEFINE COMPUTED */

const title = computed(() => (props.item ? t('users.editEmployee') : t('users.newEmployee')))
const maxWidth = computed(() => '800px')
const defaultRoleId = computed<number | null>(() => {
  const role = availableRoles.value.find((group) => group.name.toLowerCase() === 'user')
  return role?.id ?? null
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const loadRoles = async () => {
  try {
    isLoadingRoles.value = true
    availableRoles.value = await PermissionGroupService.getAll()

    // Read the user's permission_group_ids directly from the API response field
    const currentIds = props.item?.permission_group_ids ?? []
    const userRole = availableRoles.value.find((group) => group.name.toLowerCase() === 'user')

    if (userRole?.id != null && !currentIds.includes(userRole.id)) {
      setFieldValue('permission_group_ids', [...currentIds, userRole.id])
    } else {
      setFieldValue('permission_group_ids', currentIds)
    }
  } catch {
    notifyError(t('users.loadRolesFailed'))
  } finally {
    isLoadingRoles.value = false
  }
}

const loadCompanies = async () => {
  try {
    isLoadingCompanies.value = true
    availableCompanies.value = await CompanyService.getAll()
  } catch {
    notifyError(t('users.loadCompaniesFailed'))
  } finally {
    isLoadingCompanies.value = false
  }
}

const loadDepartments = async () => {
  try {
    isLoadingDepartments.value = true
    availableDepartments.value = await DepartmentService.getAll()
  } catch {
    notifyError(t('users.loadDepartmentsFailed'))
  } finally {
    isLoadingDepartments.value = false
  }
}

const handleCreate = handleSubmit(async (form: UserFormType) => {
  // Validate company and department (required for create)
  let valid = true
  if (!selectedCompanyId.value) {
    companyError.value = t('validation.companyRequired')
    valid = false
  } else {
    companyError.value = ''
  }
  if (!selectedDepartmentId.value) {
    departmentError.value = t('validation.departmentRequired')
    valid = false
  } else {
    departmentError.value = ''
  }
  if (!valid) return

  const createPayload = {
    ...form,
    permission_group_ids:
      form.permission_group_ids?.filter((id): id is number => id != null) ?? null,
  }
  await UserService.create(createPayload)
    .then(async (result: UserModel) => {
      await UserDepartmentService.create({
        user_id: result.id,
        company_id: selectedCompanyId.value as number,
        department_id: selectedDepartmentId.value as number,
      })
      emit('confirm', result)
    })
    .catch((error) => {
      if (error?.response?.status === 409) {
        setFieldError('email', t('validation.emailAlreadyTaken'))
      } else {
        notifyError(t('users.saveFailed'))
      }
    })
})

const handleUpdate = handleSubmit(async (form) => {
  const updatePayload = {
    ...form,
    permission_group_ids:
      form.permission_group_ids?.filter((id): id is number => id != null) ?? null,
  }
  await UserService.update(props.item?.id as number, updatePayload)
    .then((result: UserModel) => {
      emit('confirm', result)
    })
    .catch((error) => {
      if (error?.response?.status === 409) {
        setFieldError('email', t('validation.emailAlreadyTaken'))
      } else {
        notifyError(t('users.saveFailed'))
      }
    })
})

const confirm = () => {
  if (!props.item) {
    handleCreate()
  } else {
    handleUpdate()
  }
}

const scrollToFirstError = async () => {
  await nextTick()
  await nextTick()
  const errorElement = document.querySelector('.v-input--error')
  if (errorElement) {
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

const close = () => {
  selectedCompanyId.value = null
  selectedDepartmentId.value = null
  companyError.value = ''
  departmentError.value = ''
  emit('close-modal', null)
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
// Re-validate confirm_password when password changes, but only if the user has already touched it
watch(password, () => {
  if (confirmPasswordMeta.touched) {
    validateField('confirm_password')
  }
})

// Scroll to first error field when validation errors change (after submit attempt)
watch(
  errors,
  (newErrors) => {
    const hasError = Object.values(newErrors).some((value) => value !== undefined)
    if (hasError) {
      scrollToFirstError()
    }
  },
  { deep: true },
)

// Ensure the default "user" role cannot be removed
watch(permission_group_ids, (ids) => {
  if (!defaultRoleId.value) return
  const list = ids ?? []
  if (!list.includes(defaultRoleId.value)) {
    setFieldValue('permission_group_ids', [...list, defaultRoleId.value])
  }
})

watch(
  () => props.dialog,
  (value) => {
    if (!value) close()
  },
  { immediate: true },
)

// Use resetForm (not setFieldValue) to populate values without triggering validation
watch(
  () => props.item,
  (item) => {
    if (item) {
      resetForm({
        values: {
          id: item.id ?? null,
          first_name: item.first_name,
          last_name: item.last_name,
          position: item.position ?? null,
          phone_number: item.phone_number ?? null,
          email: item.email,
          address: item.address ?? null,
          is_active: item.is_activated ?? item.is_active ?? false,
          permission_group_ids: item.permission_group_ids ?? [],
          date_of_birth: toDateOnly(item.date_of_birth),
          join_date: toDateOnly(item.join_date),
          contract_signed_date: toDateOnly(item.contract_signed_date),
          contract_expired_date: toDateOnly(item.contract_expired_date),
          contract_type: item.contract_type ?? null,
          contract_count: item.contract_count ?? null,
          annual_leave_hours: item.annual_leave_hours ?? null,
          remaining_leave_hours: item.remaining_leave_hours ?? null,
          slack_id: item.slack_id ?? null,
          device_user_id: item.device_user_id ?? null,
          skip_attendance: item.skip_attendance ?? false,
          permanent_remote: item.permanent_remote ?? false,
          permanent_remote_reason: item.permanent_remote_reason ?? null,
          password: null,
          confirm_password: null,
        },
      })
    } else {
      resetForm({ values: form })
    }
  },
  { immediate: true },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  loadRoles()
  if (!props.item) {
    loadCompanies()
    loadDepartments()
  }
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
