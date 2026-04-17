import { defineStore } from 'pinia'
import { useCookie } from '#app'
import moment from 'moment-timezone'
import type { AuthState } from '~/stores/types/user/AuthState'
import type { UserModel } from '@/interfaces/models/UserModel'
import AuthService from '@/services/AuthService'

const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh'

const inBrowser = typeof window !== 'undefined'

/** Key used to persist the user's highest role level in localStorage and cookie. */
const ROLE_LEVEL_KEY = 'role_level'

function resolveInitialRoleLevel(): 'super_admin' | 'admin' | 'user' {
  // Client-side: read from localStorage
  if (inBrowser) {
    const stored = localStorage.getItem(ROLE_LEVEL_KEY)
    if (stored === 'super_admin' || stored === 'admin') return stored
  }

  // Server-side SSR (page refresh): read from cookie
  const roleLevelCookie = useCookie<string>(ROLE_LEVEL_KEY)
  const cookieValue = roleLevelCookie.value
  if (cookieValue === 'super_admin' || cookieValue === 'admin') return cookieValue

  return 'user'
}

export const useUserStore = defineStore('user', {
  state: (): AuthState => {
    const token = useCookie<string>('token')

    return {
      isAuthenticated: (!!inBrowser && !!localStorage.getItem('token')) || !!token.value,
      user: null,
      roleLevel: resolveInitialRoleLevel(),
    }
  },

  getters: {
    /**
     * Returns the user's highest role level.
     * Reads from the loaded profile first; falls back to the persisted state value.
     */
    highestRole(state): 'super_admin' | 'admin' | 'user' {
      if (state.user?.highest_role) return state.user.highest_role
      return state.roleLevel
    },

    /** True if the user has the Super Admin role. */
    isSuperAdmin(): boolean {
      return (this.highestRole as string) === 'super_admin'
    },

    /** True if the user has Admin or Super Admin role. */
    isAdmin(): boolean {
      const role = this.highestRole as string

      return role === 'super_admin' || role === 'admin'
    },

    /** True if the user is in an Admin or Manager department but not a super admin. Used to gate contract reminders. */
    isCompanyAdmin(state): boolean {
      const isSuper = state.user?.user_group_permissions?.some(
        (ugp) => ugp.permission_group?.name?.toLowerCase() === 'super',
      )
      if (isSuper) return false
      const adminDepts = ['admin', 'manager']
      return (
        state.user?.user_departments?.some((ud) =>
          adminDepts.includes(ud.department?.name?.toLowerCase() ?? ''),
        ) ?? false
      )
    },

    /** IANA timezone from the user's company country. Falls back to Asia/Ho_Chi_Minh. */
    timezone(state): string {
      return state.user?.user_departments?.[0]?.company?.country?.timezone ?? DEFAULT_TIMEZONE
    },
  },

  actions: {
    /**
     * @description Login user, store token in cookie and update state
     * @return Promise<void>
     */
    async login(email: string, password: string): Promise<void> {
      const response = await AuthService.login(email, password)
      const token = useCookie<string | null>('token')
      token.value = response.access_token

      if (inBrowser) {
        localStorage.setItem('token', response.access_token)
      }

      this.isAuthenticated = true

      // Non-fatal: fetch user profile in background, do not block login flow
      this.getUser().catch((error) => console.error('Failed to fetch user profile:', error))
    },

    /**
     * @description Get authenticated user profile from the API.
     * Persists the highest_role to localStorage and cookie so middleware can use it
     * without decoding the JWT token.
     * @return Promise<UserModel>
     */
    getUser(): Promise<UserModel> {
      return new Promise((resolve, reject) => {
        AuthService.getUser()
          .then((user) => {
            this.user = user
            this.isAuthenticated = true

            // Update moment default timezone to match the user's company country
            const timezone =
              user.user_departments?.[0]?.company?.country?.timezone ?? DEFAULT_TIMEZONE
            moment.tz.setDefault(timezone)

            if (user.highest_role) {
              const level = user.highest_role as 'super_admin' | 'admin' | 'user'
              this.roleLevel = level

              // Persist role level for future page refreshes
              if (inBrowser) {
                localStorage.setItem(ROLE_LEVEL_KEY, level)
              }

              const roleLevelCookie = useCookie<string | null>(ROLE_LEVEL_KEY)
              roleLevelCookie.value = level
            }

            resolve(user)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    /**
     * @description Update the user's preferred UI language and persist it to the API.
     * @param language - One of 'en' | 'vi' | 'ja'
     */
    async updateLanguage(language: string): Promise<void> {
      await AuthService.updateProfile({ preferred_language: language })

      if (this.user) {
        this.user.preferred_language = language
      }
    },

    /**
     * @description Logout user
     * @return Promise<boolean>
     */
    async logout(): Promise<boolean> {
      await AuthService.logout()
      const token = useCookie('token')
      const roleLevelCookie = useCookie<string | null>(ROLE_LEVEL_KEY)

      this.isAuthenticated = false
      this.user = null
      this.roleLevel = 'user'
      token.value = null
      roleLevelCookie.value = null

      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem(ROLE_LEVEL_KEY)
      }

      return Promise.resolve(true)
    },
  },
})
