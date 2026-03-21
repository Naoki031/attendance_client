<template>
  <v-container class="py-8" max-width="800">
    <!-- Page header -->
    <div class="d-flex align-center gap-3 mb-6">
      <v-btn icon="mdi-arrow-left" variant="text" to="/profile"></v-btn>
      <div>
        <div class="text-h5 font-weight-bold">Edit Profile</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          Update your personal information and security settings
        </div>
      </div>
    </div>

    <v-card rounded="lg">
      <v-tabs v-model="activeTab" color="primary">
        <v-tab value="info">
          <v-icon start icon="mdi-account-outline"></v-icon>
          Personal Info
        </v-tab>
        <v-tab value="security">
          <v-icon start icon="mdi-lock-outline"></v-icon>
          Security
        </v-tab>
      </v-tabs>

      <v-divider></v-divider>

      <v-window v-model="activeTab">
        <!-- Tab: Personal Info -->
        <v-window-item value="info">
          <v-card-text class="pa-6" @keydown.enter.prevent="submitProfile">
            <!-- Success alert -->
            <v-alert
              v-if="profileSuccess"
              type="success"
              variant="tonal"
              border="start"
              class="mb-5"
              closable
              @click:close="profileSuccess = false"
            >
              Profile updated successfully.
            </v-alert>

            <!-- Error alert -->
            <v-alert
              v-if="profileError"
              type="error"
              variant="tonal"
              border="start"
              class="mb-5"
              closable
              @click:close="profileError = null"
            >
              {{ profileError }}
            </v-alert>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="firstName"
                  label="First Name"
                  prepend-inner-icon="mdi-account-outline"
                  variant="outlined"
                  density="compact"
                  :error-messages="profileErrors.first_name"
                  autocomplete="off"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="lastName"
                  label="Last Name"
                  prepend-inner-icon="mdi-account-outline"
                  variant="outlined"
                  density="compact"
                  :error-messages="profileErrors.last_name"
                  autocomplete="off"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="position"
                  label="Position"
                  prepend-inner-icon="mdi-briefcase-outline"
                  variant="outlined"
                  density="compact"
                  :error-messages="profileErrors.position"
                  autocomplete="off"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="phoneNumber"
                  label="Phone Number"
                  prepend-inner-icon="mdi-phone-outline"
                  variant="outlined"
                  density="compact"
                  :error-messages="profileErrors.phone_number"
                  autocomplete="off"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="address"
                  label="Address"
                  prepend-inner-icon="mdi-map-marker-outline"
                  variant="outlined"
                  density="compact"
                  :error-messages="profileErrors.address"
                  autocomplete="off"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dateOfBirth"
                  label="Date of Birth"
                  prepend-inner-icon="mdi-cake-variant-outline"
                  variant="outlined"
                  density="compact"
                  type="date"
                  :error-messages="profileErrors.date_of_birth"
                  autocomplete="off"
                ></v-text-field>
              </v-col>
            </v-row>

            <div class="d-flex justify-end gap-3 mt-4">
              <v-btn variant="text" to="/profile">Cancel</v-btn>
              <v-btn color="primary" :loading="profileLoading" @click="submitProfile">
                Save Changes
              </v-btn>
            </div>
          </v-card-text>
        </v-window-item>

        <!-- Tab: Security (Change Password) -->
        <v-window-item value="security">
          <v-card-text class="pa-6" @keydown.enter.prevent="submitPassword">
            <div class="text-subtitle-1 font-weight-medium mb-4">Change Password</div>

            <!-- Success alert -->
            <v-alert
              v-if="passwordSuccess"
              type="success"
              variant="tonal"
              border="start"
              class="mb-5"
              closable
              @click:close="passwordSuccess = false"
            >
              Password changed successfully.
            </v-alert>

            <!-- Error alert -->
            <v-alert
              v-if="passwordError"
              type="error"
              variant="tonal"
              border="start"
              class="mb-5"
              closable
              @click:close="passwordError = null"
            >
              {{ passwordError }}
            </v-alert>

            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="currentPassword"
                  :type="showCurrent ? 'text' : 'password'"
                  :append-inner-icon="showCurrent ? 'mdi-eye-off' : 'mdi-eye'"
                  label="Current Password"
                  prepend-inner-icon="mdi-lock-outline"
                  variant="outlined"
                  density="compact"
                  autocomplete="current-password"
                  :error-messages="passwordErrors.current_password"
                  @click:append-inner="showCurrent = !showCurrent"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newPassword"
                  :type="showNew ? 'text' : 'password'"
                  :append-inner-icon="showNew ? 'mdi-eye-off' : 'mdi-eye'"
                  label="New Password"
                  prepend-inner-icon="mdi-lock-reset"
                  variant="outlined"
                  density="compact"
                  autocomplete="new-password"
                  :error-messages="passwordErrors.new_password"
                  @click:append-inner="showNew = !showNew"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="confirmPassword"
                  :type="showConfirm ? 'text' : 'password'"
                  :append-inner-icon="showConfirm ? 'mdi-eye-off' : 'mdi-eye'"
                  label="Confirm New Password"
                  prepend-inner-icon="mdi-lock-check-outline"
                  variant="outlined"
                  density="compact"
                  autocomplete="new-password"
                  :error-messages="passwordErrors.confirm_password"
                  @click:append-inner="showConfirm = !showConfirm"
                ></v-text-field>
              </v-col>
            </v-row>

            <div class="d-flex justify-end mt-4">
              <v-btn color="primary" :loading="passwordLoading" @click="submitPassword">
                Change Password
              </v-btn>
            </div>
          </v-card-text>
        </v-window-item>
      </v-window>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import * as Yup from 'yup'
import ProfileService from '@/services/ProfileService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  layout: 'default',
  name: 'profile.edit',
})
/* END DEFINE */

/** START DEFINE PROPERTY AND EMITS */
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
const profileSchema = Yup.object().shape({
  first_name: Yup.string().required('First name is required'),
  last_name: Yup.string().required('Last name is required'),
  position: Yup.string().nullable().optional(),
  phone_number: Yup.string().nullable().optional(),
  address: Yup.string().nullable().optional(),
  date_of_birth: Yup.string().nullable().optional(),
})

const passwordSchema = Yup.object().shape({
  current_password: Yup.string().required('Current password is required'),
  new_password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirm_password: Yup.string()
    .oneOf([Yup.ref('new_password')], 'Passwords must match')
    .required('Please confirm your new password'),
})

const {
  handleSubmit: handleProfileSubmit,
  errors: profileErrors,
  setFieldValue: setProfileField,
} = useForm({ validationSchema: profileSchema })

/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const userStore = useUserStore()
const router = useRouter()
const activeTab = ref<string>('info')

// Profile form fields (managed by VeeValidate)
const { value: firstName } = useField<string>('first_name')
const { value: lastName } = useField<string>('last_name')
const { value: position } = useField<string | null>('position')
const { value: phoneNumber } = useField<string | null>('phone_number')
const { value: address } = useField<string | null>('address')
const { value: dateOfBirth } = useField<string | null>('date_of_birth')

// Profile status
const profileLoading = ref(false)
const profileSuccess = ref(false)
const profileError = ref<string | null>(null)

// Password form fields (plain refs to avoid VeeValidate dual-form context conflict)
const currentPassword = ref<string>('')
const newPassword = ref<string>('')
const confirmPassword = ref<string>('')
const passwordErrors = reactive<Record<string, string>>({})

// Password status
const passwordLoading = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref<string | null>(null)
const showCurrent = ref(false)
const showNew = ref(false)
const showConfirm = ref(false)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
// Strip ISO timestamp so <input type="date"> receives YYYY-MM-DD
const toDateOnly = (value?: string | null): string | null => (value ? value.substring(0, 10) : null)

const submitProfile = handleProfileSubmit(async (values) => {
  profileSuccess.value = false
  profileError.value = null
  profileLoading.value = true

  try {
    const payload: Record<string, unknown> = {}
    if (values.first_name) payload.first_name = values.first_name
    if (values.last_name) payload.last_name = values.last_name
    if (values.position !== undefined) payload.position = values.position
    if (values.phone_number !== undefined) payload.phone_number = values.phone_number
    if (values.address !== undefined) payload.address = values.address
    if (values.date_of_birth !== undefined) payload.date_of_birth = values.date_of_birth

    const updatedUser = await ProfileService.updateProfile(payload)
    userStore.user = updatedUser
    profileSuccess.value = true

    // Navigate back to view page after successful save
    setTimeout(() => router.push({ name: 'profile.index' }), 800)
  } catch (error: unknown) {
    profileError.value =
      (error as { data?: { message?: string } })?.data?.message ??
      'Failed to update profile. Please try again.'
  } finally {
    profileLoading.value = false
  }
})

const submitPassword = async () => {
  passwordSuccess.value = false
  passwordError.value = null
  Object.keys(passwordErrors).forEach((key) => {
    passwordErrors[key] = ''
  })

  // Validate with Yup schema
  try {
    await passwordSchema.validate(
      {
        current_password: currentPassword.value,
        new_password: newPassword.value,
        confirm_password: confirmPassword.value,
      },
      { abortEarly: false },
    )
  } catch (validationError: unknown) {
    if (validationError instanceof Yup.ValidationError) {
      validationError.inner.forEach((fieldError) => {
        if (fieldError.path) passwordErrors[fieldError.path] = fieldError.message
      })
    }
    return
  }

  passwordLoading.value = true
  try {
    await ProfileService.changePassword({
      current_password: currentPassword.value,
      new_password: newPassword.value,
    })
    passwordSuccess.value = true
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (error: unknown) {
    passwordError.value =
      (error as { data?: { message?: string } })?.data?.message ??
      'Failed to change password. Please try again.'
  } finally {
    passwordLoading.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  const user = userStore.user
  if (user) {
    setProfileField('first_name', user.first_name ?? '')
    setProfileField('last_name', user.last_name ?? '')
    setProfileField('position', user.position ?? null)
    setProfileField('phone_number', user.phone_number ?? null)
    setProfileField('address', user.address ?? null)
    // Convert ISO timestamp to YYYY-MM-DD for <input type="date">
    setProfileField('date_of_birth', toDateOnly(user.date_of_birth))
  }
})
/* END DEFINE LIFE CYCLE HOOK */
</script>
