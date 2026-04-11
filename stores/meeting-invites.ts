import moment from 'moment'
import MeetingInviteService from '@/services/MeetingInviteService'

export interface InviteNotification {
  meetingId: number
  meetingTitle: string
  meetingUuid: string
}

export interface MissedCallNotification {
  meetingTitle: string
  meetingUuid: string
  missedAt: string // ISO string from server
}

export const useMeetingInvitesStore = defineStore('meetingInvites', {
  state: () => ({
    /** Queue of incoming invite notifications (shown one at a time as a call modal) */
    queue: [] as InviteNotification[],
    /** Responding state per meetingUuid to prevent double-submit */
    responding: {} as Record<string, boolean>,
    /** Missed call notifications shown as persistent banners */
    missedCalls: [] as MissedCallNotification[],
    /**
     * Incremented each time an invite_result arrives (accepted / declined / missed).
     * Pages that show invite status (e.g. DialogInvite on /meetings) watch this value
     * to know when to refresh the invite list from the API.
     */
    inviteResultVersion: 0,
    /** UUID of the meeting whose invite just changed — used to filter refreshes. */
    inviteResultMeetingUuid: '' as string,
  }),

  getters: {
    /** The oldest pending notification, shown one at a time */
    current: (state): InviteNotification | null => state.queue[0] ?? null,
    hasNotification: (state): boolean => state.queue.length > 0,
    hasMissedCall: (state): boolean => state.missedCalls.length > 0,
    latestMissedCall: (state): MissedCallNotification | null => state.missedCalls[0] ?? null,
  },

  actions: {
    push(notification: InviteNotification) {
      const alreadyQueued = this.queue.some((item) => item.meetingId === notification.meetingId)
      if (!alreadyQueued) {
        this.queue.push(notification)
      }
    },

    dismiss() {
      this.queue.shift()
    },

    pushMissedCall(data: { meetingTitle: string; meetingUuid: string; missedAt?: string }) {
      // Remove any previous missed call for the same meeting to avoid duplicates
      this.missedCalls = this.missedCalls.filter((item) => item.meetingUuid !== data.meetingUuid)
      this.missedCalls.push({
        meetingTitle: data.meetingTitle,
        meetingUuid: data.meetingUuid,
        missedAt: data.missedAt ?? moment().toISOString(),
      })
    },

    dismissMissedCall(meetingUuid: string) {
      this.missedCalls = this.missedCalls.filter((item) => item.meetingUuid !== meetingUuid)
    },

    /** Signal that an invite_result event arrived — watchers can react by refreshing the list. */
    notifyInviteResult(meetingUuid: string) {
      this.inviteResultMeetingUuid = meetingUuid
      this.inviteResultVersion += 1
    },

    /**
     * Accept the invite: marks RSVP as accepted, navigates into the meeting room.
     * RSVP recording is best-effort — navigation always proceeds even if the API call fails.
     */
    async accept(meetingUuid: string) {
      if (this.responding[meetingUuid]) return
      this.responding[meetingUuid] = true

      try {
        await MeetingInviteService.rsvp(meetingUuid, 'accepted')
      } catch (error) {
        console.error('Failed to record RSVP:', error)
      }

      this.dismiss()
      this.responding[meetingUuid] = false
      const router = useRouter()
      await router.push(`/meetings/${meetingUuid}`)
    },

    /**
     * Decline the invite: dismisses the modal immediately, then marks RSVP as declined in background.
     */
    async decline(meetingUuid: string) {
      if (this.responding[meetingUuid]) return
      this.responding[meetingUuid] = true
      this.dismiss()
      try {
        await MeetingInviteService.rsvp(meetingUuid, 'declined')
      } catch (error) {
        console.error('Failed to decline invite:', error)
      } finally {
        this.responding[meetingUuid] = false
      }
    },
  },
})
