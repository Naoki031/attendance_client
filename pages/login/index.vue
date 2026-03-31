<template>
  <v-sheet class="login-bg d-flex align-center justify-center" min-height="100vh">
    <v-card
      class="pa-8 pb-6"
      elevation="12"
      width="440"
      rounded="xl"
      @keydown.enter.prevent="onSubmit"
    >
      <!-- Logo & Title -->
      <div class="text-center mb-6">
        <v-avatar color="primary" size="64" class="mb-4" rounded="lg">
          <v-icon icon="mdi-briefcase-clock-outline" size="36" color="white"></v-icon>
        </v-avatar>
        <div class="text-h5 font-weight-bold">{{ $t('auth.attendanceSystem') }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">{{ $t('auth.signInToAccount') }}</div>
      </div>

      <!-- Error alert -->
      <v-alert
        v-if="alert"
        type="error"
        variant="tonal"
        border="start"
        class="mb-5"
        closable
        @click:close="alert = false"
      >
        {{ errorMessages }}
      </v-alert>

      <!-- Email -->
      <v-text-field
        v-model="email.value.value"
        density="compact"
        :label="$t('auth.email')"
        :placeholder="$t('auth.enterEmail')"
        prepend-inner-icon="mdi-email-outline"
        variant="outlined"
        autocomplete="email"
        :error-messages="email.errorMessage.value"
        :autofocus="true"
        class="mb-1"
      ></v-text-field>

      <!-- Password -->
      <v-text-field
        v-model="password.value.value"
        :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
        :type="visible ? 'text' : 'password'"
        density="compact"
        :label="$t('auth.password')"
        :placeholder="$t('auth.enterPassword')"
        prepend-inner-icon="mdi-lock-outline"
        variant="outlined"
        autocomplete="current-password"
        :error-messages="password.errorMessage.value"
        class="mb-1"
        @click:append-inner="visible = !visible"
      ></v-text-field>

      <!-- Submit -->
      <v-btn
        block
        class="mt-4 mb-2"
        color="primary"
        size="large"
        variant="elevated"
        type="submit"
        :loading="isSubmitting"
        @click.prevent="onSubmit"
      >
        {{ $t('auth.signIn') }}
      </v-btn>
    </v-card>
  </v-sheet>
</template>

<script lang="ts" setup>
/** START IMPORT */
import * as Yup from 'yup'
import { HTTP_UNAUTHORIZED, HTTP_UNPROCESSABLE_ENTITY, HTTP_BAD_REQUEST } from '@/constants/http'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
definePageMeta({
  layout: 'guest',
  name: 'login',
})
const form = {
  email: '',
  password: '',
}
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
const { t } = useI18n()

const schema = computed(() =>
  Yup.object().shape({
    email: Yup.string().required(t('validation.emailRequired')).email(t('validation.invalidEmail')),
    password: Yup.string()
      .required(t('validation.passwordRequired'))
      .min(4, t('validation.passwordMinLength', { min: 4 })),
  }),
)

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: form,
})
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const userStore = useUserStore()
const alertStore = useAlertStore()
const visible = ref(false)
const errorMessages = ref<string | null>(null)
const alert = ref(false)
const email = useField('email')
const password = useField('password')
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const onSubmit = handleSubmit(async (values) => {
  try {
    alert.value = false
    errorMessages.value = null
    await userStore.login(values.email, values.password)
    navigateTo('/home')
  } catch (error: unknown) {
    const errorData = error as Record<string, unknown>
    const nestedData = errorData?.data as Record<string, unknown> | undefined
    const status = (errorData?.status ?? nestedData?.statusCode) as number | undefined
    const message = (nestedData?.message ??
      errorData?.message ??
      'Login failed. Please try again.') as string

    if (
      status === HTTP_UNAUTHORIZED ||
      status === HTTP_UNPROCESSABLE_ENTITY ||
      status === HTTP_BAD_REQUEST
    ) {
      errorMessages.value = message
      alert.value = true
    } else {
      alertStore.showAlert({ navigation: '/login', type: 'error', message })
    }
  }
})
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.login-bg {
  background: linear-gradient(135deg, #e8c9a8 0%, #d4a87a 50%, #c49060 100%);
}
</style>
