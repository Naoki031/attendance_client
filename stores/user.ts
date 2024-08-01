import { defineStore } from 'pinia'
import type { AuthState } from '~/stores/types/user/AuthState'
import type { UserModel } from '@/interfaces/models/UserModel'
import { AuthService } from '@/services/AuthService'
import { useCookie } from '#app'

const inBrowser = typeof window !== 'undefined'
const token = useCookie<string>('token')

export const useUserStore = defineStore('user', {
  state: (): AuthState => {
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
    async getAuthUser(): Promise<UserModel> {
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
      AuthService.logout()
      this.user = null
      this.isAuthenticated = await false
      return true
    },
  },
})
