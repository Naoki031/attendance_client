<template>
  <v-container class="py-8" max-width="800">
    <!-- Page header -->
    <div class="d-flex align-center ga-3 mb-6">
      <v-btn icon="mdi-arrow-left" variant="text" to="/profile"></v-btn>
      <div>
        <div class="text-h5 font-weight-bold">{{ $t('profile.editProfile') }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ $t('profile.editProfileSubtitle') }}
        </div>
      </div>
    </div>

    <v-card rounded="lg" class="mb-4">
      <v-card-text class="pa-6">
        <div class="d-flex align-center ga-6">
          <AvatarUpload
            :current-avatar="userStore.user?.avatar ?? ''"
            :full-name="userStore.user?.full_name ?? ''"
            :size="88"
            @saved="onAvatarSaved"
          />
          <div>
            <div class="text-h6 font-weight-bold">{{ userStore.user?.full_name }}</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ $t('profile.avatarHint') }}
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Change Password -->
    <v-card rounded="lg">
      <v-card-text class="pa-6" @keydown.enter.prevent="submitPassword">
        <div class="text-subtitle-1 font-weight-medium mb-4">
          {{ $t('profile.changePassword') }}
        </div>

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
          {{ $t('profile.passwordChanged') }}
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
              :label="$t('profile.currentPassword')"
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
              :label="$t('profile.newPassword')"
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
              :label="$t('profile.confirmNewPassword')"
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
            {{ $t('profile.changePassword') }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import * as Yup from 'yup'
import ProfileService from '@/services/ProfileService'
import AvatarUpload from '@/components/profile/AvatarUpload.vue'
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
const { t } = useI18n()

const passwordSchema = computed(() =>
  Yup.object().shape({
    current_password: Yup.string().required(
      t('validation.required', { field: t('profile.currentPassword') }),
    ),
    new_password: Yup.string()
      .min(6, t('validation.passwordMinLength', { min: 6 }))
      .required(
        t('validation.newPasswordRequired') ||
          t('validation.required', { field: t('profile.newPassword') }),
      ),
    confirm_password: Yup.string()
      .oneOf([Yup.ref('new_password')], t('validation.oneOf'))
      .required(
        t('validation.confirmPasswordRequired') ||
          t('validation.required', { field: t('profile.confirmNewPassword') }),
      ),
  }),
)

/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const userStore = useUserStore()

// Password form fields
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
const onAvatarSaved = (_updatedUser: unknown) => {
  // User store already updated inside AvatarUpload — no additional handling needed
}

const submitPassword = async () => {
  passwordSuccess.value = false
  passwordError.value = null
  Object.keys(passwordErrors).forEach((key) => {
    passwordErrors[key] = ''
  })

  // Validate with Yup schema
  try {
    await passwordSchema.value.validate(
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
/* END DEFINE LIFE CYCLE HOOK */
</script>
