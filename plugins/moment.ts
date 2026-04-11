import moment from 'moment-timezone'
import 'moment/locale/vi'
import 'moment/locale/ja'
import { defineNuxtPlugin } from '#app'
import type { Ref } from 'vue'

/** Set fallback default timezone. Overridden after user profile loads via userStore.getUser(). */
moment.tz.setDefault('Asia/Ho_Chi_Minh')

export default defineNuxtPlugin((nuxtApp) => {
  // @nuxtjs/i18n exposes $i18n on the nuxtApp instance
  const locale = (nuxtApp.$i18n as { locale: Ref<string> }).locale

  // Set initial locale
  moment.locale(locale.value)

  // Keep moment locale in sync when user switches language
  watch(locale, (newLocale) => {
    moment.locale(newLocale)
  })

  return {
    provide: {
      moment,
    },
  }
})
