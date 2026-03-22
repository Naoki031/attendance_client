<template>
  <v-dialog :model-value="dialog" :max-width="maxWidth" persistent scrollable>
    <v-card rounded="xl" elevation="2" @keydown.enter.prevent="confirm">
      <!-- Header -->
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">{{ title }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{
              props.item
                ? 'Update profile information and system permissions.'
                : 'Fill in details to create a new user account.'
            }}
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0">
        <v-container class="pa-0">
          <v-row>
            <!-- First Name -->
            <v-col cols="12" md="6">
              <div class="field-label">FIRST NAME</div>
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
              <div class="field-label">LAST NAME</div>
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

            <!-- Email -->
            <v-col cols="12" md="6">
              <div class="field-label">EMAIL ADDRESS</div>
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

            <!-- Position -->
            <v-col cols="12" md="6">
              <div class="field-label">POSITION</div>
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

            <!-- Phone Number -->
            <v-col cols="12" md="6">
              <div class="field-label">PHONE NUMBER</div>
              <v-text-field
                v-model="phone_number"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :error-messages="errors.phone_number"
                required
                autocomplete="off"
              ></v-text-field>
            </v-col>

            <!-- Address -->
            <v-col cols="12" md="6">
              <div class="field-label">ADDRESS</div>
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

            <!-- Date of Birth -->
            <v-col cols="12" md="6">
              <div class="field-label">DATE OF BIRTH</div>
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

            <!-- Join Date -->
            <v-col cols="12" md="6">
              <div class="field-label">JOIN DATE</div>
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

            <!-- Roles -->
            <v-col cols="12" md="6">
              <div class="field-label">ASSIGNED ROLE</div>
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
                <template #chip="{ item, props: chipProps }">
                  <v-chip v-bind="chipProps" :closable="item.id !== defaultRoleId">
                    {{ item.name }}
                  </v-chip>
                </template>
              </v-select>
            </v-col>

            <!-- Status -->
            <v-col cols="12" md="6">
              <div class="field-label">ACCESS STATUS</div>
              <div class="d-flex align-center mt-2">
                <v-switch
                  v-model="is_active"
                  color="primary"
                  hide-details
                  :error-messages="errors.is_active"
                ></v-switch>
                <span class="ml-2 text-body-2">{{ is_active ? 'Active' : 'Inactive' }}</span>
              </div>
            </v-col>

            <!-- Contract section -->
            <v-col cols="12">
              <div class="section-label">CONTRACT</div>
            </v-col>

            <!-- Contract Type -->
            <v-col cols="12" md="6">
              <div class="field-label">CONTRACT TYPE</div>
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
              <div class="field-label">CONTRACT COUNT</div>
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

            <!-- Contract Signed Date -->
            <v-col cols="12" md="6">
              <div class="field-label">CONTRACT SIGNED DATE</div>
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
              <div class="field-label">CONTRACT EXPIRED DATE</div>
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
              <div class="section-label">PASSWORD</div>
            </v-col>

            <!-- Password -->
            <v-col cols="12" md="6">
              <div class="field-label">PASSWORD</div>
              <v-text-field
                v-model="password"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :placeholder="props.item ? 'Leave blank to keep current' : ''"
                :error-messages="errors.password"
                type="password"
                autocomplete="new-password"
                :required="!props.item"
              ></v-text-field>
            </v-col>

            <!-- Confirm Password -->
            <v-col cols="12" md="6">
              <div class="field-label">CONFIRM PASSWORD</div>
              <v-text-field
                v-model="confirm_password"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                :placeholder="props.item ? 'Leave blank to keep current' : ''"
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
        <v-btn variant="text" color="default" rounded="lg" @click="close">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          rounded="lg"
          :loading="isSubmitting"
          @click="confirm"
        >
          Save Changes
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
import type { PermissionGroupModel } from '@/interfaces/models/PermissionGroupModel'
import UserService from '@/services/UserService'
import PermissionGroupService from '@/services/PermissionGroupService'
import type { UserFormType } from '@/types/index'
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
}
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
const schema = computed(() =>
  Yup.object().shape({
    first_name: Yup.string().required('First Name is required'),
    last_name: Yup.string().required('Last Name is required'),
    position: Yup.string().required('Position is required'),
    phone_number: Yup.string().required('Phone Number is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    address: Yup.string().required('Address is required'),
    // Password is required only when creating; optional (but min 6 if provided) when editing
    password: props.item
      ? Yup.string()
          .transform((value: string | null | undefined) => (value === '' ? null : value))
          .min(6, 'Password must be at least 6 characters')
          .nullable()
          .optional()
      : Yup.string()
          .min(6, 'Password must be at least 6 characters')
          .required('Password is required'),
    confirm_password: Yup.string().when('password', {
      is: (value: string | null) => !!value && value.length > 0,
      then: (yupSchema) =>
        yupSchema
          .oneOf([Yup.ref('password')], 'Passwords must match')
          .required('Confirm Password is required'),
      otherwise: (yupSchema) => yupSchema.nullable().optional(),
    }),
    is_active: Yup.boolean().required('Status is required'),
    permission_group_ids: Yup.array()
      .of(Yup.number())
      .min(1, 'At least one role is required')
      .required(),
    date_of_birth: Yup.string().nullable(),
    join_date: Yup.string().nullable(),
    contract_signed_date: Yup.string().nullable(),
    contract_expired_date: Yup.string().nullable(),
    contract_type: Yup.string().nullable(),
    contract_count: Yup.number().nullable(),
  }),
)

const { errors, handleSubmit, setFieldValue, resetForm, isSubmitting, validateField } = useForm({
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
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const availableRoles = ref<PermissionGroupModel[]>([])
const isLoadingRoles = ref(false)
const menuDateOfBirth = ref(false)
const menuJoinDate = ref(false)
const menuContractSignedDate = ref(false)
const menuContractExpiredDate = ref(false)
/* END DEFINE STATE */

/** START DEFINE HELPERS */
const toPickerDate = (dateString: string | null | undefined): Date | undefined => {
  if (!dateString) return undefined
  const parts = dateString.split('-').map(Number)
  return new Date(parts[0]!, parts[1]! - 1, parts[2]!)
}

const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
/* END DEFINE HELPERS */

/** START DEFINE COMPUTED */
const title = computed(() => (props.item ? 'Edit User' : 'New User'))
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
    // Auto-select the default "user" role if not already in the selection
    const userRole = availableRoles.value.find((group) => group.name.toLowerCase() === 'user')
    if (userRole?.id != null) {
      const current = permission_group_ids.value ?? []
      if (!current.includes(userRole.id)) {
        setFieldValue('permission_group_ids', [...current, userRole.id])
      }
    }
  } catch (error) {
    console.error('Failed to load roles:', error)
  } finally {
    isLoadingRoles.value = false
  }
}

const handleCreate = handleSubmit(async (form: UserFormType) => {
  await UserService.create(form)
    .then((result: UserModel) => {
      emit('confirm', result)
    })
    .catch((error) => {
      console.error('Failed to add user:', error)
    })
})

const handleUpdate = handleSubmit(async (form) => {
  await UserService.update(props.item?.id as number, form)
    .then((result: UserModel) => {
      emit('confirm', result)
    })
    .catch((error) => {
      console.error('Failed to update user:', error)
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
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
// Re-validate confirm_password when password changes, but only if the user has already touched it
watch(password, () => {
  if (confirmPasswordMeta.touched) {
    validateField('confirm_password')
  }
})

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
  { immediate: false },
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
          permission_group_ids:
            item.user_group_permissions?.map((ugp) => ugp.permission_group_id) ?? [],
          date_of_birth: item.date_of_birth ?? null,
          join_date: item.join_date ?? null,
          contract_signed_date: item.contract_signed_date ?? null,
          contract_expired_date: item.contract_expired_date ?? null,
          contract_type: item.contract_type ?? null,
          contract_count: item.contract_count ?? null,
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
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
