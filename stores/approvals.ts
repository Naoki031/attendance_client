import { defineStore } from 'pinia'
import EmployeeRequestService from '@/services/EmployeeRequestService'

export const useApprovalsStore = defineStore('approvals', {
  state: () => ({
    pendingCount: 0,
  }),

  actions: {
    /**
     * Loads the count of pending approval requests from the API.
     * Should only be called for admin users.
     */
    async loadPendingCount(): Promise<void> {
      try {
        this.pendingCount = await EmployeeRequestService.getPendingCount()
      } catch (error) {
        console.error('Failed to load pending approvals count:', error)
      }
    },
  },
})
