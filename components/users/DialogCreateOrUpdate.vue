<template>
  <v-dialog :model-value="dialog" :max-width="maxWidth" persistent>
    <v-card>
      <v-card-title class="text-h5">{{ title }}</v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <v-container>
          <!-- First Name -->
          <v-text-field
            v-model="first_name"
            prepend-inner-icon="mdi-account"
            label="First Name"
            :error-messages="errors.first_name"
            required
          ></v-text-field>

          <!-- Last Name -->
          <v-text-field
            v-model="last_name"
            prepend-inner-icon="mdi-account"
            label="Last Name"
            :error-messages="errors.last_name"
            required
          ></v-text-field>

          <!-- Email -->
          <v-text-field
            v-model="email"
            prepend-inner-icon="mdi-email"
            label="Email"
            :error-messages="errors.email"
            required
          ></v-text-field>

          <!-- Password -->
          <v-text-field
            v-model="password"
            prepend-inner-icon="mdi-lock"
            label="Password"
            :error-messages="errors.password"
            type="password"
            required
          ></v-text-field>

          <!-- Confirm Password -->
          <v-text-field
            v-model="confirm_password"
            prepend-inner-icon="mdi-lock-check"
            label="Confirm Password"
            :error-messages="errors.confirm_password"
            type="password"
            required
          ></v-text-field>

          <!-- Roles -->
          <v-combobox
            v-model="roles"
            :items="['admin', 'user', 'manager']"
            label="Roles"
            :error-messages="errors.roles"
            multiple
            required
          ></v-combobox>

          <!-- Status -->
          <v-switch
            v-model="is_active"
            label="Active"
            :error-messages="errors.is_active"
          ></v-switch>
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
/** START IMPORT */
import { computed, watch, PropType, watchEffect } from 'vue'
import * as Yup from 'yup'
import { useField, useForm } from 'vee-validate'
import { UserModel } from '@/interfaces/models/UserModel'
import UserService from '@/services/UserService'
import { UserFormType } from '@/types/index'
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
  id: null as number | null,
  first_name: '' as string | null,
  last_name: '' as string | null,
  position: '' as string | null,
  phone_number: '' as string | null,
  email: '' as string | null,
  address: '' as string | null,
  password: '' as string | null,
  confirm_password: '' as string | null,
  is_active: null as boolean | null,
  roles: [] as string[],
  date_of_birth: '' as string | null,
  join_date: '' as string | null,
  contract_signed_date: '' as string | null,
  contract_expired_date: '' as string | null,
  contract_type: '' as string | null,
  contract_count: null as number | null,
}
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
const schema = Yup.object().shape({
  id: Yup.number().nullable(),
  first_name: Yup.string().required('First Name is required'),
  last_name: Yup.string().required('Last Name is required'),
  position: Yup.string().required('Position is required'),
  phone_number: Yup.string().required('Phone Number is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  address: Yup.string().required('Address is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirm_password: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match').required('Confirm Password is required'),
  is_active: Yup.boolean().required('Status is required'),
  roles: Yup.array().of(Yup.string()).required('At least one role is required'),
  date_of_birth: Yup.string().nullable(),
  join_date: Yup.string().nullable(),
  contract_signed_date: Yup.string().nullable(),
  contract_expired_date: Yup.string().nullable(),
  contract_type: Yup.string().nullable(),
  contract_count: Yup.number().nullable(),
})

const { values, errors, handleSubmit, setFieldError, setFieldValue } = useForm({
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
const { value: confirm_password } = useField<string | null>('confirm_password')
const { value: is_active } = useField<boolean>('is_active')
const { value: roles } = useField<string[]>('roles')
const { value: date_of_birth } = useField<string | null>('date_of_birth')
const { value: join_date } = useField<string | null>('join_date')
const { value: contract_signed_date } = useField<string | null>('contract_signed_date')
const { value: contract_expired_date } = useField<string | null>('contract_expired_date')
const { value: contract_type } = useField<string | null>('contract_type')
const { value: contract_count } = useField<number | null>('contract_count')
/* end define validate */
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const title = computed(() => {
  return props.item ? 'Edit User' : 'New User'
})

const maxWidth = computed(() => {
  return '500px'
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const handleCreate = handleSubmit(async (form: UserFormType) => {
  await schema.validate(values, { abortEarly: false })
  UserService.create(form)
    .then((res: UserModel) => {
      emit('confirm', res)
    })
    .catch((error) => {
      console.error('Failed to add user:', error)
    })
})

const handleUpdate = handleSubmit(async (form) => {
  await schema.validate(values, { abortEarly: false })
  UserService.update(props.item?.id as number, form)
    .then((res: UserModel) => {
      emit('confirm', res)
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
watch(
  () => props.dialog,

  (newValue) => {
    if (!newValue) {
      close()
    }
  },

  { immediate: false },
)

watchEffect(() => {
  if (props.item) {
    setFieldValue('id', props.item?.id ?? null)
    setFieldValue('first_name', props.item?.first_name)
    setFieldValue('last_name', props.item?.last_name)
    setFieldValue('position', props.item?.position)
    setFieldValue('phone_number', props.item?.phone_number)
    setFieldValue('email', props.item?.email)
    setFieldValue('address', props.item?.address)
    setFieldValue('password', props.item?.password)
    setFieldValue('confirm_password', props.item?.confirm_password)
    setFieldValue('is_active', props.item?.is_active)
    setFieldValue('roles', props.item?.roles)
    setFieldValue('date_of_birth', props.item?.date_of_birth)
    setFieldValue('join_date', props.item?.join_date)
    setFieldValue('contract_signed_date', props.item?.contract_signed_date)
    setFieldValue('contract_expired_date', props.item?.contract_expired_date)
    setFieldValue('contract_type', props.item?.contract_type)
    setFieldValue('contract_count', props.item?.contract_count)
  }
})
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>
