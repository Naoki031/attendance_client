import { defineStore } from 'pinia'
import UserService from '@/services/UserService'

export const useKycStore = defineStore('kyc', {
  state: () => ({
    pendingCount: 0,
  }),

  actions: {
    /**
     * Loads the count of pending KYC submissions from the API.
     * Should only be called for admin users.
     */
    async loadPendingCount(): Promise<void> {
      try {
        const pendingUsers = await UserService.filter({ kycStatus: 'pending' })
        this.pendingCount = pendingUsers.length
      } catch (error) {
        console.error('Failed to load pending KYC count:', error)
      }
    },
  },
})
