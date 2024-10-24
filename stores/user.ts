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
    logout(): Promise<boolean> {
      AuthService.logout()
      const token = useCookie('token')
      this.isAuthenticated = false
      token.value = null

      return Promise.resolve(true)
    },
  },
})
