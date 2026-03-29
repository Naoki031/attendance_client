import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,
    components,
    directives,
    defaults: {
      VTextField: { autocomplete: 'off' },
      VTextarea: { autocomplete: 'off' },
      VAutocomplete: { autocomplete: 'off' },
      VCombobox: { autocomplete: 'off' },
    },
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          colors: {
            primary: '#BF6E3A',
            secondary: '#E8A870',
            background: '#FAF5F0',
            surface: '#FFFFFF',
            error: '#D32F2F',
            success: '#388E3C',
            warning: '#F57C00',
            info: '#0288D1',
          },
        },
      },
    },
    icons: {
      defaultSet: 'mdi',
    },
  })
  nuxtApp.vueApp.use(vuetify)
})
