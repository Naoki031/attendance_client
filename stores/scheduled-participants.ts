import { defineStore } from 'pinia'

interface RsvpUpdate {
  meetingUuid: string
  userId: number
  status: string
}

export const useScheduledParticipantsStore = defineStore('scheduled-participants', () => {
  const lastRsvpUpdate = ref<RsvpUpdate | null>(null)

  function notifyRsvpUpdate(data: RsvpUpdate) {
    lastRsvpUpdate.value = data
  }

  return { lastRsvpUpdate, notifyRsvpUpdate }
})
