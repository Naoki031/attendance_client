import { defineStore } from 'pinia'
import type { AlertState } from '~/stores/types/alert/AlertState'

export const useAlertStore = defineStore('alert', {
  state: (): AlertState => {
    return {
      navigation: '/',
      type: 'error',
      message: '',
      show: false,
    }
  },

  getters: {},

  actions: {
    async showAlert({ navigation, type, message }: AlertState) {
      this.navigation = navigation
      this.type = type
      this.message = message
      this.show = true
    },
    async hideAlert() {
      this.message = ''
      this.show = false
    },
  },
})
