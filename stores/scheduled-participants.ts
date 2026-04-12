import { defineStore } from 'pinia'
import type { MeetingAutoCallConfigModel } from '@/interfaces/models/MeetingAutoCallConfigModel'

interface RsvpUpdate {
  meetingUuid: string
  userId: number
  status: string
}

interface AutoCallConfigUpdate {
  meetingUuid: string
  config: MeetingAutoCallConfigModel
}

export const useScheduledParticipantsStore = defineStore('scheduled-participants', () => {
  const lastRsvpUpdate = ref<RsvpUpdate | null>(null)
  const lastAutoCallConfigUpdate = ref<AutoCallConfigUpdate | null>(null)

  function notifyRsvpUpdate(data: RsvpUpdate) {
    lastRsvpUpdate.value = data
  }

  function notifyAutoCallConfigUpdate(data: AutoCallConfigUpdate) {
    lastAutoCallConfigUpdate.value = data
  }

  return { lastRsvpUpdate, notifyRsvpUpdate, lastAutoCallConfigUpdate, notifyAutoCallConfigUpdate }
})
