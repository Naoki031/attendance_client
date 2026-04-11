<template>
  <v-container class="py-8" max-width="1100">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <div class="text-h5 font-weight-bold">{{ $t('meetings.title') }}</div>
        <div class="text-body-2 text-medium-emphasis">{{ $t('meetings.description') }}</div>
      </div>
      <v-btn
        variant="elevated"
        color="primary"
        rounded="lg"
        prepend-icon="mdi-plus"
        @click="createDialog = true"
      >
        {{ $t('meetings.create') }}
      </v-btn>
    </div>

    <!-- RSVP banners for pending invites -->
    <template v-if="pendingInvites.length > 0">
      <v-alert
        v-for="invite in pendingInvites"
        :key="invite.id"
        type="info"
        variant="tonal"
        rounded="lg"
        class="mb-3"
        :icon="false"
      >
        <div class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div>
            <div class="text-body-2 font-weight-medium">
              {{ $t('meetings.invite.rsvpTitle') }} —
              {{ invite.meeting?.title ?? getMeetingTitle(invite.meeting_id) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ $t('meetings.invite.rsvpDesc') }}
            </div>
          </div>
          <div class="d-flex ga-2">
            <v-btn
              color="primary"
              variant="flat"
              size="small"
              rounded="lg"
              prepend-icon="mdi-video"
              @click="joinMeeting(invite)"
            >
              {{ $t('meetings.invite.join') }}
            </v-btn>
            <v-btn
              color="error"
              variant="tonal"
              size="small"
              rounded="lg"
              @click="respondInvite(invite, 'declined')"
            >
              {{ $t('meetings.invite.decline') }}
            </v-btn>
          </div>
        </div>
      </v-alert>
    </template>

    <!-- Filter chips -->
    <div class="d-flex ga-2 mb-5 flex-wrap">
      <v-chip
        v-for="filter in statusFilters"
        :key="filter.value"
        :color="activeFilter === filter.value ? 'primary' : undefined"
        :variant="activeFilter === filter.value ? 'flat' : 'tonal'"
        rounded="lg"
        size="small"
        class="cursor-pointer"
        @click="activeFilter = filter.value"
      >
        {{ filter.label }}
      </v-chip>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="36" />
    </div>

    <!-- Meeting List -->
    <template v-else>
      <v-row v-if="filteredMeetings.length > 0" align="stretch">
        <v-col
          v-for="meeting in filteredMeetings"
          :key="meeting.id"
          cols="12"
          md="6"
          lg="4"
          class="d-flex"
        >
          <MeetingCard
            :meeting="meeting"
            :live-participants="getLiveParticipants(meeting)"
            :current-user-id="currentUserId"
            :can-manage="canManageMeeting(meeting)"
            @regenerate-password="openRegenDialog"
            @invite="openInviteDialog"
            @edit="openEditDialog"
            @delete="openDeleteDialog"
            @manage-host-schedule="openHostScheduleDialog"
            @toggle-pin="togglePin"
          />
        </v-col>
      </v-row>

      <!-- Empty state -->
      <v-card v-else rounded="xl" elevation="0" border class="pa-12 text-center">
        <v-icon size="48" color="medium-emphasis" class="mb-3">mdi-video-off-outline</v-icon>
        <div class="text-body-1 font-weight-semibold mb-1">{{ $t('meetings.noMeetings') }}</div>
        <div class="text-body-2 text-medium-emphasis">{{ $t('meetings.noMeetingsDesc') }}</div>
        <v-btn
          color="primary"
          variant="tonal"
          rounded="lg"
          class="mt-4"
          prepend-icon="mdi-plus"
          @click="createDialog = true"
        >
          {{ $t('meetings.create') }}
        </v-btn>
      </v-card>
    </template>

    <!-- Create Meeting Dialog -->
    <MeetingDialogCreateMeeting v-model="createDialog" @created="onMeetingCreated" />

    <!-- Invite Dialog -->
    <MeetingDialogInvite
      ref="inviteDialogReference"
      :dialog="inviteDialog"
      :meeting-uuid="inviteTargetUuid"
      @close-modal="onCloseInviteDialog"
    />

    <!-- Regenerate Password Dialog -->
    <MeetingDialogRegenPassword v-model="regenDialog" :meeting-uuid="regenTargetUuid" />

    <!-- Host Schedule Dialog -->
    <MeetingDialogManageHostSchedules
      v-model="hostScheduleDialog"
      :meeting-uuid="hostScheduleTargetUuid"
      :meeting="hostScheduleTargetMeeting"
    />

    <!-- Edit Meeting Dialog -->
    <MeetingDialogEditMeeting
      v-model="editDialog"
      :meeting="editTargetMeeting"
      @saved="onMeetingUpdated"
    />

    <!-- Delete Meeting Dialog -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card rounded="xl" elevation="2" class="text-center pa-6">
        <div class="d-flex justify-center mb-4">
          <div class="warning-icon-wrap">
            <v-icon color="error" size="28">mdi-alert</v-icon>
          </div>
        </div>
        <div class="text-h6 font-weight-bold mb-2">{{ $t('meetings.deleteMeeting') }}</div>
        <div class="text-body-2 text-medium-emphasis mb-6 px-4">
          {{ $t('meetings.deleteConfirm') }}
        </div>
        <div class="d-flex justify-center ga-3">
          <v-btn
            variant="text"
            color="default"
            rounded="lg"
            min-width="100"
            @click="deleteDialog = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            rounded="lg"
            min-width="100"
            :loading="isDeleting"
            @click="confirmDelete"
          >
            {{ $t('common.delete') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import type { Meeting, MeetingParticipant } from '@/interfaces/models/MeetingModel'
import type { MeetingInviteModel } from '@/interfaces/models/MeetingInviteModel'
import MeetingService from '@/services/MeetingService'
import MeetingInviteService from '@/services/MeetingInviteService'
import { apiClient } from '@/utils/apiClient'
import { useMeetingInvitesStore } from '@/stores/meeting-invites'
/** END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({ name: 'meetings.index' })
/** END DEFINE NAME COMPONENT */

/** START DEFINE STATE */
const { t } = useI18n()
const invitesStore = useMeetingInvitesStore()

const isLoading = ref(false)
const createDialog = ref(false)
const currentUserId = ref(0)
const activeFilter = ref<string>('all')

const regenDialog = ref(false)
const regenTargetUuid = ref('')

const editDialog = ref(false)
const editTargetMeeting = ref<Meeting | null>(null)

const deleteDialog = ref(false)
const deleteTargetUuid = ref('')
const isDeleting = ref(false)

const hostScheduleDialog = ref(false)
const hostScheduleTargetUuid = ref('')
const hostScheduleTargetMeeting = ref<Meeting | null>(null)

const inviteDialog = ref(false)
const inviteTargetUuid = ref('')
const inviteDialogReference = ref<{ refresh: () => void } | null>(null)

const pendingInvites = ref<MeetingInviteModel[]>([])

const currentUserRoles = ref<string[]>([])

let listSocket: Socket | null = null

const liveUsersByMeeting = ref<Record<number, number[]>>({})
const meetings = ref<Meeting[]>([])
/** END DEFINE STATE */

/** START DEFINE COMPUTED */
const statusFilters = computed(() => [
  { value: 'all', label: t('common.all') },
  { value: 'scheduled', label: t('meetings.status.scheduled') },
  { value: 'active', label: t('meetings.status.active') },
])

const filteredMeetings = computed(() => {
  if (activeFilter.value === 'all') return meetings.value

  return meetings.value.filter((meeting) => meeting.status === activeFilter.value)
})
/** END DEFINE COMPUTED */

/** START DEFINE METHOD */
function getLiveParticipants(meeting: Meeting): MeetingParticipant[] {
  const liveIds = liveUsersByMeeting.value[meeting.id] ?? []
  if (liveIds.length === 0) return []

  return (meeting.participants ?? []).filter((participant) => liveIds.includes(participant.user_id))
}

function openRegenDialog(uuid: string) {
  regenTargetUuid.value = uuid
  regenDialog.value = true
}

function onMeetingCreated(meeting: Meeting) {
  meetings.value.unshift(meeting)
}

function openEditDialog(uuid: string) {
  editTargetMeeting.value = meetings.value.find((item) => item.uuid === uuid) ?? null
  editDialog.value = true
}

function onMeetingUpdated(updated: Meeting) {
  const index = meetings.value.findIndex((item) => item.id === updated.id)

  if (index !== -1) {
    meetings.value[index] = updated
  }
}

async function loadMeetings() {
  isLoading.value = true

  try {
    meetings.value = await MeetingService.getAll()
  } finally {
    isLoading.value = false
  }
}

function isPrivilegedRole(roles: string[]): boolean {
  return roles.some((role) => {
    const normalized = role.toLowerCase().replace(/[\s_]+/g, '')
    return normalized === 'admin' || normalized === 'superadmin' || normalized === 'super'
  })
}

function canManageMeeting(meeting: Meeting): boolean {
  if (meeting.host_id === currentUserId.value) return true
  return isPrivilegedRole(currentUserRoles.value)
}

function openDeleteDialog(uuid: string) {
  deleteTargetUuid.value = uuid
  deleteDialog.value = true
}

async function togglePin(uuid: string) {
  const meeting = meetings.value.find((item) => item.uuid === uuid)
  if (!meeting) return
  if (meeting.is_pinned) {
    await MeetingService.unpin(uuid)
    meeting.is_pinned = false
  } else {
    await MeetingService.pin(uuid)
    meeting.is_pinned = true
  }
  meetings.value.sort((meetingA, meetingB) => {
    if (meetingA.is_pinned === meetingB.is_pinned) return 0
    return meetingA.is_pinned ? -1 : 1
  })
}

function openInviteDialog(uuid: string) {
  inviteTargetUuid.value = uuid
  inviteDialog.value = true
}

function onCloseInviteDialog() {
  inviteDialog.value = false
}

function getMeetingTitle(meetingId: number): string {
  return meetings.value.find((meeting) => meeting.id === meetingId)?.title ?? ''
}

async function joinMeeting(invite: MeetingInviteModel) {
  const meeting = meetings.value.find((item) => item.id === invite.meeting_id)
  if (!meeting) return
  try {
    await MeetingInviteService.rsvp(meeting.uuid, 'accepted')
    pendingInvites.value = pendingInvites.value.filter((item) => item.id !== invite.id)
    await navigateTo(`/meetings/${meeting.uuid}`)
  } catch (error) {
    console.error('Failed to join meeting:', error)
  }
}

async function respondInvite(invite: MeetingInviteModel, status: 'declined') {
  const meeting = meetings.value.find((item) => item.id === invite.meeting_id)
  if (!meeting) return
  try {
    await MeetingInviteService.rsvp(meeting.uuid, status)
    pendingInvites.value = pendingInvites.value.filter((item) => item.id !== invite.id)
  } catch (error) {
    console.error('Failed to respond to invite:', error)
  }
}

async function loadPendingInvites() {
  try {
    pendingInvites.value = await MeetingInviteService.getMyPendingInvites()
  } catch (error) {
    console.error('Failed to load pending invites:', error)
  }
}

function openHostScheduleDialog(uuid: string) {
  hostScheduleTargetUuid.value = uuid
  hostScheduleTargetMeeting.value = meetings.value.find((item) => item.uuid === uuid) ?? null
  hostScheduleDialog.value = true
}

async function confirmDelete() {
  isDeleting.value = true

  try {
    await MeetingService.deleteMeeting(deleteTargetUuid.value)
    meetings.value = meetings.value.filter((meeting) => meeting.uuid !== deleteTargetUuid.value)
    deleteDialog.value = false
  } catch {
    // Error handled by API interceptor
  } finally {
    isDeleting.value = false
  }
}
/** END DEFINE METHOD */

/** START DEFINE WATCHER */
// Refresh invite dialog when invite_result arrives for the meeting currently open in the dialog
watch(
  () => invitesStore.inviteResultVersion,
  () => {
    if (invitesStore.inviteResultMeetingUuid === inviteTargetUuid.value) {
      inviteDialogReference.value?.refresh()
    }
  },
)
/** END DEFINE WATCHER */

/** START LIFECYCLE */
onMounted(async () => {
  await loadMeetings()
  loadPendingInvites()

  try {
    const user = await apiClient.get<{ id: number; roles: string[] }>('/auth/user')
    currentUserId.value = user.id
    currentUserRoles.value = user.roles ?? []
  } catch {
    // Fail silently
  }

  // Connect to meeting namespace to receive real-time status updates
  const config = useRuntimeConfig()
  const wsUrl =
    (config.public.wsUrl as string) ||
    (import.meta.client ? window.location.origin : 'http://localhost:3001')
  const token = localStorage.getItem('token')

  if (token) {
    listSocket = io(`${wsUrl}/meeting`, {
      path: '/ws',
      auth: { token },
      transports: ['websocket'],
    })

    listSocket.on('connect', () => {
      listSocket?.emit('subscribe_meetings_list')
    })

    listSocket.on(
      'meeting_status_changed',
      (data: { meetingId: number; status: string; activeUserIds: number[] }) => {
        const meeting = meetings.value.find((item) => item.id === data.meetingId)
        if (meeting) {
          meeting.status = data.status as Meeting['status']
        }
        liveUsersByMeeting.value = {
          ...liveUsersByMeeting.value,
          [data.meetingId]: data.activeUserIds,
        }
      },
    )

    listSocket.on('meetings_live_state', (liveState: Record<number, number[]>) => {
      liveUsersByMeeting.value = liveState
      // Sync active status for meetings that currently have live participants
      for (const meetingId of Object.keys(liveState)) {
        const meeting = meetings.value.find((item) => item.id === Number(meetingId))
        if (meeting && (liveState[Number(meetingId)] ?? []).length > 0) {
          meeting.status = 'active'
        }
      }
    })

    listSocket.on(
      'meeting_participants_updated',
      (data: { meetingId: number; activeUserIds: number[] }) => {
        liveUsersByMeeting.value = {
          ...liveUsersByMeeting.value,
          [data.meetingId]: data.activeUserIds,
        }
      },
    )

    // Receive invite status updates (accepted / declined / missed) from the gateway
    // so the host sees real-time RSVP results in the invite dialog without being inside the meeting room
    // Refresh invite dialog immediately when invite result arrives for the open meeting
    listSocket.on(
      'invite_result',
      (data: { meetingUuid: string; userId: number; userName: string; result: string }) => {
        if (data.meetingUuid === inviteTargetUuid.value) {
          inviteDialogReference.value?.refresh()
        }
      },
    )
  }
})

onUnmounted(() => {
  listSocket?.emit('unsubscribe_meetings_list')
  listSocket?.disconnect()
  listSocket = null
})
/** END LIFECYCLE */
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
