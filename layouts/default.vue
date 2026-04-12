<template>
  <v-app>
    <AppHeader />
    <LeftSidebar />
    <v-main>
      <NuxtPage />
    </v-main>
    <AppFooter />

    <!-- AI Chatbot widget (hidden on /chat pages to avoid covering submit button) -->
    <ChatbotWidget v-if="!isChatPage" />

    <!-- Meeting incoming call notification -->
    <MeetingCallNotification />

    <!-- Unified notification stack: missed calls + real-time alerts -->
    <LayoutNotificationStack />

    <!-- Scheduled meeting RSVP dialog (global — shows from any page) -->
    <MeetingDialogScheduledRsvp
      :dialog="scheduledRsvpDialog"
      :invites="scheduledRsvpInvites"
      @close="scheduledRsvpDialog = false"
      @responded="onScheduledRsvpResponded"
    />
  </v-app>
</template>

<script setup lang="ts">
/** START IMPORT */
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import LeftSidebar from '@/components/layout/LeftSidebar.vue'
import ChatbotWidget from '@/components/chatbot/ChatbotWidget.vue'
import { useSocketEvent } from '@/composables/useSocket'
import { useApprovalsStore } from '@/stores/approvals'
import { useMeetingInvitesStore } from '@/stores/meeting-invites'
import { useFirebaseMessaging } from '@/composables/useFirebaseMessaging'
import { useAppNotifications } from '@/composables/useAppNotifications'
import type { EmployeeRequestModel } from '@/interfaces/models/EmployeeRequestModel'
import MeetingScheduledParticipantService from '@/services/MeetingScheduledParticipantService'
import type { MeetingScheduledParticipantModel } from '@/interfaces/models/MeetingScheduledParticipantModel'
import type { MeetingAutoCallConfigModel } from '@/interfaces/models/MeetingAutoCallConfigModel'
import { useScheduledParticipantsStore } from '@/stores/scheduled-participants'
/* END IMPORT */

/** START DEFINE STATE */
const userStore = useUserStore()
const approvalsStore = useApprovalsStore()
const invitesStore = useMeetingInvitesStore()
const scheduledParticipantsStore = useScheduledParticipantsStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { push } = useAppNotifications()
const isChatPage = computed<boolean>(() => route.path.startsWith('/chat'))
const { initMessaging } = useFirebaseMessaging()

let meetingSocket: Socket | null = null

const scheduledRsvpDialog = ref(false)
const scheduledRsvpInvites = ref<MeetingScheduledParticipantModel[]>([])
/* END DEFINE STATE */

/** START DEFINE METHOD */
async function loadScheduledRsvpInvites() {
  try {
    scheduledRsvpInvites.value = await MeetingScheduledParticipantService.getMyPendingInvites()

    if (scheduledRsvpInvites.value.length > 0) {
      scheduledRsvpDialog.value = true
    }
  } catch {
    // Fail silently
  }
}

function onScheduledRsvpResponded(invite: MeetingScheduledParticipantModel) {
  scheduledRsvpInvites.value = scheduledRsvpInvites.value.filter((item) => item.id !== invite.id)

  if (scheduledRsvpInvites.value.length === 0) {
    scheduledRsvpDialog.value = false
  }
}

function getRequestTypeLabel(type: string | undefined): string {
  const labels: Record<string, string> = {
    wfh: t('requestType.wfh'),
    off: t('requestType.off'),
    equipment: t('requestType.equipment'),
    clock_forget: t('requestType.clockForget'),
    overtime: t('requestType.overtime'),
  }

  return labels[type ?? ''] ?? type ?? 'request'
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  if (userStore.isAuthenticated) {
    userStore.getUser()

    // Connect to meeting namespace to receive invite notifications globally
    const config = useRuntimeConfig()
    const wsUrl =
      (config.public.wsUrl as string) ||
      (import.meta.client ? window.location.origin : 'http://localhost:3001')
    const token = localStorage.getItem('token')

    if (token) {
      meetingSocket = io(`${wsUrl}/meeting`, {
        path: '/ws',
        auth: { token },
        transports: ['websocket'],
      })

      meetingSocket.on('connect', () => {
        // Join user_${userId} room to receive personal invite events
        meetingSocket?.emit('subscribe_meetings_list')
      })

      meetingSocket.on(
        'new_invite',
        (data: { meetingId: number; meetingTitle: string; meetingUuid: string }) => {
          invitesStore.push(data)
        },
      )

      meetingSocket.on(
        'missed_call',
        (data: { meetingTitle: string; meetingUuid: string; missedAt: string }) => {
          invitesStore.pushMissedCall(data)
        },
      )

      meetingSocket.on('invite_cancelled', (data: { meetingUuid: string }) => {
        if (invitesStore.current?.meetingUuid === data.meetingUuid) {
          invitesStore.dismiss()
        }
      })

      // Signal pages showing invite status (e.g. DialogInvite) to refresh from API
      meetingSocket.on('invite_result', (data: { meetingUuid: string }) => {
        invitesStore.notifyInviteResult(data.meetingUuid)
      })

      // Show RSVP dialog when a new scheduled invite arrives (visible from any page)
      meetingSocket.on('scheduled_invite', (invite: MeetingScheduledParticipantModel) => {
        const alreadyExists = scheduledRsvpInvites.value.some((item) => item.id === invite.id)
        if (!alreadyExists) {
          scheduledRsvpInvites.value = [invite, ...scheduledRsvpInvites.value]
          scheduledRsvpDialog.value = true
        }
      })

      // Dismiss invite from dialog when host removes the scheduled participant
      meetingSocket.on('scheduled_invite_removed', (data: { meetingUuid: string }) => {
        scheduledRsvpInvites.value = scheduledRsvpInvites.value.filter(
          (item) => item.meeting?.uuid !== data.meetingUuid,
        )
        if (scheduledRsvpInvites.value.length === 0) {
          scheduledRsvpDialog.value = false
        }
      })

      // Notify host's manage-participants dialog of real-time RSVP status change
      meetingSocket.on(
        'scheduled_rsvp_updated',
        (data: { meetingUuid: string; userId: number; status: string }) => {
          scheduledParticipantsStore.notifyRsvpUpdate(data)
        },
      )

      // Sync auto-call config changes to all open manage-participants dialogs
      meetingSocket.on(
        'auto_call_config_updated',
        (data: { meetingUuid: string; config: MeetingAutoCallConfigModel }) => {
          scheduledParticipantsStore.notifyAutoCallConfigUpdate(data)
        },
      )
    }

    loadScheduledRsvpInvites()

    // Register FCM token and handle foreground messages
    initMessaging((payload) => {
      const roomUuid = payload.data?.roomUuid ?? null
      const title = payload.title ? `${payload.title}: ${payload.body ?? ''}` : (payload.body ?? '')

      push({
        icon: 'mdi-bell-ring-outline',
        iconColor: 'primary',
        title,
        timeout: 5000,
        actions: roomUuid
          ? [{ label: t('common.view'), handler: () => router.push(`/chat/${roomUuid}`) }]
          : [
              {
                label: t('common.view'),
                handler: () => router.push({ name: 'admin.approvals.index' }),
              },
            ],
      })
    })
  }
})

// Show toast notification when a new request is submitted
useSocketEvent<{ user?: { full_name?: string }; type?: string }>('request:created', (request) => {
  if (!userStore.isAdmin) return

  approvalsStore.loadPendingCount()

  const name = request?.user?.full_name ?? 'An employee'
  const type = getRequestTypeLabel(request?.type)

  push({
    icon: 'mdi-bell-ring-outline',
    iconColor: 'primary',
    title: t('home.notificationSubmitted', { name, type }),
    timeout: 5000,
    actions: [
      { label: t('common.view'), handler: () => router.push({ name: 'admin.approvals.index' }) },
    ],
  })
})

// Update pending count badge and notify employee when a request is approved/rejected/edited
useSocketEvent<EmployeeRequestModel>('request:updated', (request) => {
  if (userStore.isAdmin) {
    approvalsStore.loadPendingCount()
  }

  // Notify the employee who submitted the request
  const currentUserId = userStore.user?.id
  if (currentUserId && request.user_id === currentUserId && request.status !== 'pending') {
    const type = getRequestTypeLabel(request.type)
    const isApproved = request.status === 'approved'

    push({
      icon: isApproved ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline',
      iconColor: isApproved ? 'success' : 'error',
      title: isApproved
        ? t('home.notificationApproved', { type })
        : t('home.notificationRejected', { type }),
      timeout: 5000,
    })
  }
})

onUnmounted(() => {
  meetingSocket?.emit('unsubscribe_meetings_list')
  meetingSocket?.disconnect()
  meetingSocket = null
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
