import moment from 'moment-timezone'
import { useUserStore } from '@/stores/user'

/**
 * Returns the pre-configured moment instance and the current user's IANA timezone.
 * Timezone is resolved from user → user_departments[0] → company → country → timezone,
 * falling back to Asia/Ho_Chi_Minh.
 */
export const useMoment = () => {
  const userStore = useUserStore()
  return { moment, TIMEZONE: userStore.timezone }
}
