import moment from 'moment-timezone'
import { defineNuxtPlugin } from '#app'

/** Set fallback default timezone. Overridden after user profile loads via userStore.getUser(). */
moment.tz.setDefault('Asia/Ho_Chi_Minh')

export default defineNuxtPlugin(() => {
  return {
    provide: {
      moment,
    },
  }
})
