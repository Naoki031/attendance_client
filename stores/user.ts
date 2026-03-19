import { defineStore } from 'pinia'
import { useCookie } from '#app'
import type { AuthState } from '~/stores/types/user/AuthState'
import type { UserModel } from '@/interfaces/models/UserModel'
import AuthService from '@/services/AuthService'

const inBrowser = typeof window !== 'undefined'

export const useUserStore = defineStore('user', {
  state: (): AuthState => {
    const token = useCookie<string>('token')

    return {
      isAuthenticated: (!!inBrowser && !!localStorage.getItem('token')) || !!token.value,
      user: null,
    }
  },

  getters: {},

  actions: {
    /**
     * @description Login user, store token in cookie and update state
     * @return Promise<void>
     */
    async login(email: string, password: string): Promise<void> {
      const response = await AuthService.login(email, password)
      const token = useCookie<string>('token')
      token.value = response.access_token
      this.isAuthenticated = true
      await this.getUser()
    },

    /**
     * @description Get authenticated user
     * @return Promise<UserModel>
     */
    getUser(): Promise<UserModel> {
      return new Promise((resolve, reject) => {
        AuthService.getUser()
          .then((user) => {
            this.user = user
            this.isAuthenticated = true
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
      }

      return Promise.resolve(true)
    },
  },
})
