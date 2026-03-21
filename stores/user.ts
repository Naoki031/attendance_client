import { defineStore } from 'pinia'
import { useCookie } from '#app'
import type { AuthState } from '~/stores/types/user/AuthState'
import type { UserModel } from '@/interfaces/models/UserModel'
import AuthService from '@/services/AuthService'

const inBrowser = typeof window !== 'undefined'

/** Key used to persist the user's highest role level in localStorage. */
const ROLE_LEVEL_KEY = 'role_level'

export const useUserStore = defineStore('user', {
  state: (): AuthState => {
    const token = useCookie<string>('token')

    return {
      isAuthenticated: (!!inBrowser && !!localStorage.getItem('token')) || !!token.value,
      user: null,
    }
  },

  getters: {
    /**
     * Returns the user's highest role level.
     * Reads from the loaded profile first; falls back to the localStorage value
     * persisted from the last successful profile load (no JWT decoding).
     */
    highestRole(state): 'super_admin' | 'admin' | 'user' {
      if (state.user?.highest_role) return state.user.highest_role

      if (inBrowser) {
        const stored = localStorage.getItem(ROLE_LEVEL_KEY)
        if (stored === 'super_admin' || stored === 'admin') return stored
      }

      return 'user'
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
     * Persists the highest_role to localStorage so the middleware can use it
     * without decoding the JWT token.
     * @return Promise<UserModel>
     */
    getUser(): Promise<UserModel> {
      return new Promise((resolve, reject) => {
        AuthService.getUser()
          .then((user) => {
            this.user = user
            this.isAuthenticated = true

            // Persist role level from API response — not derived from JWT
            if (inBrowser && user.highest_role) {
              localStorage.setItem(ROLE_LEVEL_KEY, user.highest_role)
            }

            resolve(user)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    /**
     * @description Logout user
     * @return Promise<boolean>
     */
    async logout(): Promise<boolean> {
      await AuthService.logout()
      const token = useCookie('token')
      this.isAuthenticated = false
      this.user = null
      token.value = null

      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem(ROLE_LEVEL_KEY)
      }

      return Promise.resolve(true)
    },
  },
})
