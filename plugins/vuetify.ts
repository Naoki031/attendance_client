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
            // ─── Core — Sandstone Studio Variant B ───────────────────────
            primary: '#AD6D49',
            'primary-lighten': '#EDD5C0',
            'primary-darken': '#6B3E25',
            secondary: '#957A63',
            'secondary-lighten': '#E2D8CE',
            'secondary-darken': '#574636',
            background: '#F7F1E8',
            'background-lighten': '#FDFAF6',
            'background-darken': '#EDE5D5',
            surface: '#FDFAF6',
            // ─── Semantic ────────────────────────────────────────────────
            success: '#578066',
            'success-lighten': '#CCDFD2',
            'success-darken': '#2D5938',
            warning: '#B88C30',
            'warning-lighten': '#F2E4AD',
            'warning-darken': '#6E500E',
            error: '#AA3B3B',
            'error-lighten': '#EDCACA',
            'error-darken': '#722020',
            info: '#527898',
            'info-lighten': '#C4D8E8',
            'info-darken': '#274A68',
            // ─── UI Accent ───────────────────────────────────────────────
            // "action" – secondary action buttons (attendance-logs, groups…)
            action: '#3A9197',
            // "accent" – misc highlight chips (KYC, private room…)
            accent: '#6E55A8',
            // ─── Request Type Colors ─────────────────────────────────────
            // Each maps 1:1 to EmployeeRequestType; change here = changes everywhere
            'request-wfh': '#4A85B8', // slate blue  — calm / home
            'request-off': '#C4922A', // warm amber  — sunshine / rest
            'request-overtime': '#B84A4A', // muted crimson — urgency
            'request-equipment': '#3A9197', // ocean teal  — tools / precision
            'request-clock-forget': '#C06830', // burnt orange — attention
            'request-business-trip': '#6E55A8', // dusty violet — journey
          },
        },
        'sandstone-dark': {
          dark: true,
          colors: {
            // ─── Core — Sandstone Studio Variant B ───────────────────────
            primary: '#C88B68',
            'primary-lighten': '#EDD5C0',
            'primary-darken': '#AD6D49',
            secondary: '#B09480',
            'secondary-lighten': '#E2D8CE',
            'secondary-darken': '#957A63',
            background: '#1A1208',
            'background-lighten': '#251A0F',
            'background-darken': '#120C04',
            surface: '#251A0F',
            'surface-variant': '#33241A',
            // ─── Semantic ────────────────────────────────────────────────
            success: '#7AAD8C',
            'success-lighten': '#CCDFD2',
            'success-darken': '#578066',
            warning: '#D4A84A',
            'warning-lighten': '#F2E4AD',
            'warning-darken': '#B88C30',
            error: '#CF6E6E',
            'error-lighten': '#EDCACA',
            'error-darken': '#AA3B3B',
            info: '#7AAEC8',
            'info-lighten': '#C4D8E8',
            'info-darken': '#527898',
            // ─── UI Accent ───────────────────────────────────────────────
            action: '#70B8BC',
            accent: '#A88ED4',
            // ─── Request Type Colors (lighter for dark backgrounds) ───────
            'request-wfh': '#82B4D8',
            'request-off': '#DDB86A',
            'request-overtime': '#D88080',
            'request-equipment': '#70B8BC',
            'request-clock-forget': '#D4945A',
            'request-business-trip': '#A88ED4',
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
