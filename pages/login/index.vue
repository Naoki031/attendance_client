<template>
  <v-sheet class="pa-12" rounded>
    <v-img
      class="mx-auto my-6"
      max-width="228"
      src="https://cdn.vuetifyjs.com/docs/images/logos/vuetify-logo-v3-slim-text-light.svg"
    ></v-img>

    <v-card class="mx-auto pa-12 pb-8" elevation="8" max-width="448" rounded="lg">
      <v-alert v-model="alert" border="start" variant="tonal" type="error" class="mb-8">
        {{ errorMessages }}
      </v-alert>
      <!-- Email -->
      <v-text-field
        v-model="email.value.value"
        density="compact"
        label="Email"
        placeholder="Email address"
        prepend-inner-icon="mdi-email-outline"
        variant="outlined"
        :error-messages="email.errorMessage.value"
        :autofocus="true"
      ></v-text-field>

      <div class="text-subtitle-1 text-medium-emphasis text-right">
        <a
          class="text-caption text-decoration-none text-blue"
          href="#"
          rel="noopener noreferrer"
          target="_blank"
        >
          Forgot login password?
        </a>
      </div>

      <!-- Password -->
      <v-text-field
        v-model="password.value.value"
        :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
        :type="visible ? 'text' : 'password'"
        density="compact"
        label="Password"
        placeholder="Enter your password"
        prepend-inner-icon="mdi-lock-outline"
        variant="outlined"
        :error-messages="password.errorMessage.value"
        @click:append-inner="visible = !visible"
      ></v-text-field>

      <v-btn
        block
        class="mb-8"
        color="blue"
        size="large"
        variant="tonal"
        type="submit"
        :loading="isSubmitting"
        @click.prevent="onSubmit"
      >
        Log In
      </v-btn>

      <v-card-text class="text-center">
        <a
          class="text-blue text-decoration-none"
          href="/register"
          rel="noopener noreferrer"
          target="_blank"
        >
          Sign up now
          <v-icon icon="mdi-chevron-right"></v-icon>
        </a>
      </v-card-text>
    </v-card>
  </v-sheet>
</template>
<script lang="ts" setup>
/** START IMPORT */
import { ref } from 'vue'
import * as Yup from 'yup'
import { useField, useForm } from 'vee-validate'
import { useRouter } from 'vue-router'
import AuthService from '@/services/AuthService'
import { useUserStore } from '@/stores/user'
import { useAlertStore } from '@/stores/alert'
import { HTTP_UNPROCESSABLE_ENTITY } from '@/constants/http'
import { useCookie, navigateTo } from '#app'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
definePageMeta({
  layout: 'guest',
  name: 'login',
})
const form = {
  email: 'trucnguyen.dofuu@gmail.com',
  password: 'admin123',
}
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
const schema = Yup.object().shape({
  email: Yup.string().required().email(),
  password: Yup.string().required().min(4),
})

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: form,
})
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const userStore = useUserStore()
const alertStore = useAlertStore()
const router = useRouter()
const email = useField('email')
const password = useField('password')
const visible = ref(false)
const errorMessages = ref(null)
const alert = ref(false)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const onSubmit = handleSubmit(async (values) => {
  // Simulates a 2 second delay
  try {
    const response = await AuthService.login(values.email, values.password)

    if (response) {
      const tokenCookie = await useCookie('token')
      tokenCookie.value = await response.access_token
      setTimeout(() => {
        userStore.getUser().then(() => {
          navigateTo('/')
        })
      }, 500)
    }
  } catch (error) {
    if ((error as any).status === HTTP_UNPROCESSABLE_ENTITY) {
      errorMessages.value = (error as any)._data.message
      alert.value = true
    } else {
      const message = (error as any)._data.message
      const navigation = router.currentRoute.value.path
      alertStore.showAlert({ navigation, type: 'error', message })
    }
  }
})
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>
