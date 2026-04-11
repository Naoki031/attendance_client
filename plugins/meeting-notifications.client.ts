import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { useMeetingInvitesStore } from '@/stores/meeting-invites'
import { useUserStore } from '@/stores/user'
import MeetingInviteService from '@/services/MeetingInviteService'

let meetingSocket: Socket | null = null

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const wsUrl =
    (config.public.wsUrl as string) || (import.meta.client ? window.location.origin : '')

  function connect() {
    if (meetingSocket?.connected) return

    const token = localStorage.getItem('token')
    if (!token) return

    const userStore = useUserStore()
    const userId = userStore.user?.id
    if (!userId) return

    meetingSocket = io(`${wsUrl}/meeting`, {
      path: '/ws',
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 3000,
    })

    meetingSocket.on('connect', () => {
      meetingSocket?.emit('subscribe_meetings_list')

      // Restore any missed calls from the last 24h — covers the case where the user was offline
      MeetingInviteService.getMyMissedInvites()
        .then((missed) => {
          const invitesStore = useMeetingInvitesStore()
          for (const item of missed) {
            invitesStore.pushMissedCall(item)
          }
        })
        .catch(() => {})
    })

    meetingSocket.on(
      'new_invite',
      (data: { meetingId: number; meetingTitle: string; meetingUuid: string }) => {
        const invitesStore = useMeetingInvitesStore()
        invitesStore.push(data)
      },
    )

    meetingSocket.on('invite_cancelled', (data: { meetingUuid: string }) => {
      const invitesStore = useMeetingInvitesStore()
      if (invitesStore.current?.meetingUuid === data.meetingUuid) {
        invitesStore.dismiss()
      }
    })

    meetingSocket.on(
      'missed_call',
      (data: {
        meetingId: number
        meetingTitle: string
        meetingUuid: string
        missedAt?: string
      }) => {
        const invitesStore = useMeetingInvitesStore()
        if (invitesStore.current?.meetingUuid === data.meetingUuid) {
          invitesStore.dismiss()
        }
        invitesStore.pushMissedCall({
          meetingTitle: data.meetingTitle,
          meetingUuid: data.meetingUuid,
          missedAt: data.missedAt,
        })
      },
    )
  }

  function disconnect() {
    meetingSocket?.disconnect()
    meetingSocket = null
  }

  if (import.meta.client) {
    // Connect after user is loaded (watch for authentication state)
    const userStore = useUserStore()

    watch(
      () => userStore.isAuthenticated,
      (authenticated) => {
        if (authenticated) {
          // Small delay to ensure user.id is populated after login
          setTimeout(connect, 500)
        } else {
          disconnect()
        }
      },
      { immediate: true },
    )
  }

  return {
    provide: { connectMeetingNotifications: connect, disconnectMeetingNotifications: disconnect },
  }
})
