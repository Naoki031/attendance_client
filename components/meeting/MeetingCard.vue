<template>
  <v-card rounded="xl" elevation="0" border class="meeting-card d-flex flex-column w-100">
    <!-- Status bar -->
    <div class="meeting-card__status-bar" :class="`status-${meeting.status}`"></div>

    <!-- Header -->
    <v-card-item class="pt-4 pb-2">
      <template #prepend>
        <v-avatar :color="statusColor(meeting.status)" size="40" rounded="lg">
          <v-icon size="20" color="white">{{ statusIcon(meeting.status) }}</v-icon>
        </v-avatar>
      </template>

      <v-card-title class="text-body-1 font-weight-bold d-flex align-center ga-1 min-width-0">
        <v-icon v-if="meeting.is_private" size="14" color="warning">mdi-lock</v-icon>
        <v-tooltip :text="meeting.title" location="top">
          <template #activator="{ props: tooltipProps }">
            <span v-bind="tooltipProps" class="text-truncate">{{ meeting.title }}</span>
          </template>
        </v-tooltip>
      </v-card-title>

      <v-card-subtitle class="text-caption">
        <div class="d-flex align-center ga-1 flex-wrap">
          <v-chip
            :color="meeting.meeting_type === 'recurring' ? 'purple' : 'teal'"
            size="x-small"
            variant="tonal"
          >
            {{ $t(`meetings.type.${meeting.meeting_type ?? 'one_time'}`) }}
          </v-chip>
          <v-chip :color="statusColor(meeting.status)" size="x-small" variant="tonal">
            {{ $t(`meetings.status.${meeting.status}`) }}
          </v-chip>
        </div>
      </v-card-subtitle>

      <template #append>
        <!-- Pin -->
        <v-btn
          :icon="meeting.is_pinned ? 'mdi-pin' : 'mdi-pin-outline'"
          :color="meeting.is_pinned ? 'primary' : undefined"
          variant="text"
          size="small"
          class="btn-shine"
          @click.stop="$emit('toggle-pin', meeting.uuid)"
        />

        <!-- Menu -->
        <v-menu v-if="canManage">
          <template #activator="{ props: menuProps }">
            <v-btn
              icon="mdi-dots-vertical"
              variant="text"
              size="small"
              class="btn-shine"
              v-bind="menuProps"
            />
          </template>
          <v-list density="compact">
            <v-list-item
              prepend-icon="mdi-email-plus-outline"
              :title="$t('meetings.invite.title')"
              @click="$emit('invite', meeting.uuid)"
            />
            <v-list-item
              prepend-icon="mdi-pencil-outline"
              :title="$t('meetings.editMeeting')"
              @click="$emit('edit', meeting.uuid)"
            />
            <v-list-item
              prepend-icon="mdi-account-multiple-plus-outline"
              :title="$t('meetings.scheduledParticipants.manageTitle')"
              @click="$emit('manage-scheduled-participants', meeting.uuid)"
            />
            <v-list-item
              prepend-icon="mdi-calendar-account-outline"
              :title="$t('meetings.hostSchedule.manageTitle')"
              @click="$emit('manage-host-schedule', meeting.uuid)"
            />
            <v-list-item
              v-if="meeting.is_private"
              prepend-icon="mdi-lock-reset"
              :title="$t('meetings.regeneratePassword')"
              @click="$emit('regenerate-password', meeting.uuid)"
            />
            <v-list-item
              prepend-icon="mdi-delete-outline"
              :title="$t('meetings.deleteMeeting')"
              :disabled="meeting.status === 'active'"
              @click="$emit('delete', meeting.uuid)"
            />
          </v-list>
        </v-menu>
      </template>
    </v-card-item>

    <v-card-text class="pt-1 pb-3 flex-grow-1 d-flex flex-column ga-3">
      <!-- Live participants — most prominent when meeting is active -->
      <div
        v-if="liveParticipants.length > 0"
        class="live-banner d-flex align-center ga-2 pa-2 rounded-lg"
      >
        <div class="participant-avatars">
          <div
            v-for="participant in liveParticipants.slice(0, 5)"
            :key="participant.id"
            class="participant-avatar-wrapper"
          >
            <v-tooltip :text="participant.user?.full_name ?? $t('common.unknown')" location="top">
              <template #activator="{ props: tooltipProps }">
                <v-avatar
                  v-bind="tooltipProps"
                  size="24"
                  class="participant-avatar-item"
                  :color="participant.user?.avatar ? undefined : 'primary'"
                >
                  <v-img v-if="participant.user?.avatar" :src="participant.user.avatar" cover />
                  <span
                    v-else
                    class="text-caption font-weight-bold text-white"
                    style="font-size: 9px"
                  >
                    {{ (participant.user?.full_name ?? '?').charAt(0).toUpperCase() }}
                  </span>
                </v-avatar>
              </template>
            </v-tooltip>
            <span class="live-dot" />
          </div>
          <v-avatar
            v-if="liveParticipants.length > 5"
            size="24"
            color="surface-variant"
            class="participant-avatar-item"
          >
            <span class="text-caption" style="font-size: 9px"
              >+{{ liveParticipants.length - 5 }}</span
            >
          </v-avatar>
        </div>
        <span class="text-caption font-weight-medium" style="color: rgb(var(--v-theme-success))">
          {{ liveParticipants.length }} {{ $t('meetings.participants') }}
        </span>
      </div>

      <!-- Schedule — prominent -->
      <div v-if="scheduleLabel" class="info-row pa-2 rounded-lg">
        <div class="text-caption text-disabled mb-1">
          {{ $t('meetings.schedule.title').toUpperCase() }}
        </div>
        <div class="d-flex align-center ga-2">
          <v-icon size="15" color="primary">mdi-calendar-clock-outline</v-icon>
          <span class="text-body-2 font-weight-bold">{{ scheduleLabel }}</span>
        </div>
      </div>

      <!-- Host info widget -->
      <MeetingHostScheduleSummary
        :meeting-uuid="meeting.uuid"
        :meeting-host-id="meeting.host_id"
        :permanent-host-name="meeting.host?.full_name"
      />
    </v-card-text>

    <v-divider />

    <v-card-actions class="pa-3">
      <v-btn
        color="primary"
        variant="tonal"
        rounded="lg"
        size="small"
        class="btn-shine"
        prepend-icon="mdi-video-outline"
        :to="`/meetings/${meeting.uuid}`"
      >
        {{ $t('meetings.join') }}
      </v-btn>
      <v-spacer />
      <!-- Creator icon -->
      <v-tooltip location="top">
        <template #activator="{ props: tooltipProps }">
          <v-icon
            v-bind="tooltipProps"
            size="14"
            :color="meeting.host_id === currentUserId ? 'primary' : 'disabled'"
            style="cursor: default"
          >
            mdi-account-edit-outline
          </v-icon>
        </template>
        {{ $t('meetings.createdBy') }}: {{ meeting.host?.full_name ?? $t('common.unknown') }}
      </v-tooltip>
      <!-- Description -->
      <v-btn
        v-if="meeting.description"
        size="small"
        variant="text"
        color="medium-emphasis"
        icon
        class="btn-shine"
        @click.stop="descriptionDialog = true"
      >
        <v-icon size="16">mdi-information-outline</v-icon>
        <v-tooltip activator="parent" location="top">
          {{ $t('meetings.viewDescription') }}
        </v-tooltip>
      </v-btn>
      <v-btn
        v-if="canManage"
        size="small"
        variant="text"
        color="medium-emphasis"
        icon
        class="btn-shine"
        @click="$emit('manage-scheduled-participants', meeting.uuid)"
      >
        <v-icon size="16">mdi-account-multiple-plus-outline</v-icon>
        <v-tooltip activator="parent" location="top">
          {{ $t('meetings.scheduledParticipants.manageTitle') }}
        </v-tooltip>
      </v-btn>
      <v-btn
        v-if="canManage"
        size="small"
        variant="text"
        color="medium-emphasis"
        icon
        class="btn-shine"
        @click="$emit('manage-host-schedule', meeting.uuid)"
      >
        <v-icon size="16">mdi-calendar-account-outline</v-icon>
        <v-tooltip activator="parent" location="top">
          {{ $t('meetings.hostSchedule.manageTitle') }}
        </v-tooltip>
      </v-btn>
      <v-btn
        v-if="canManage"
        size="small"
        variant="text"
        color="medium-emphasis"
        icon
        class="btn-shine"
        @click="$emit('edit', meeting.uuid)"
      >
        <v-icon size="16">mdi-pencil-outline</v-icon>
        <v-tooltip activator="parent" location="top">
          {{ $t('meetings.editMeeting') }}
        </v-tooltip>
      </v-btn>
    </v-card-actions>
  </v-card>

  <!-- Description dialog -->
  <v-dialog v-model="descriptionDialog" max-width="480" @click:outside="descriptionDialog = false">
    <v-card rounded="xl">
      <v-card-title class="pa-4 pb-2 d-flex align-center ga-2">
        <v-icon size="18" color="medium-emphasis">mdi-information-outline</v-icon>
        {{ meeting.title }}
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">
        <div class="text-body-2" style="white-space: pre-wrap; line-height: 1.7">
          {{ meeting.description }}
        </div>
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-3">
        <v-spacer />
        <v-btn variant="text" @click="descriptionDialog = false">
          {{ $t('common.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import moment from 'moment'
import type { PropType } from 'vue'
import type { Meeting, MeetingParticipant } from '@/interfaces/models/MeetingModel'
/** END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  meeting: {
    type: Object as PropType<Meeting>,
    required: true,
  },
  liveParticipants: {
    type: Array as PropType<MeetingParticipant[]>,
    required: false,
    default: () => [],
  },
  currentUserId: {
    type: Number,
    required: false,
    default: 0,
  },
  canManage: {
    type: Boolean,
    required: false,
    default: false,
  },
})

defineEmits<{
  'regenerate-password': [uuid: string]
  'manage-host-schedule': [uuid: string]
  'manage-scheduled-participants': [uuid: string]
  'toggle-pin': [uuid: string]
  invite: [uuid: string]
  edit: [uuid: string]
  delete: [uuid: string]
}>()
/** END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { t } = useI18n()
const descriptionDialog = ref(false)
/** END DEFINE STATE */

/** START DEFINE COMPUTED */
const scheduleLabel = computed(() => {
  const meeting = props.meeting
  if (meeting.meeting_type === 'one_time') {
    return meeting.scheduled_at ? formatDate(meeting.scheduled_at) : t('meetings.schedule.instant')
  }
  if (meeting.meeting_type === 'daily') {
    return meeting.schedule_time
      ? `${t('meetings.schedule.everyDay')} ${formatTime(meeting.schedule_time)}`
      : t('meetings.schedule.instant')
  }
  if (meeting.meeting_type === 'weekly') {
    const dayName =
      meeting.schedule_day_of_week !== undefined
        ? t(`meetings.days.${meeting.schedule_day_of_week}`)
        : ''
    const interval = meeting.schedule_interval_weeks ?? 1
    const time = meeting.schedule_time ? formatTime(meeting.schedule_time) : ''
    return `${t('meetings.schedule.everyWeek')} ${interval} ${t('meetings.schedule.weekOn')} ${dayName} ${time ? `${t('meetings.schedule.at')} ${time}` : ''}`.trim()
  }
  // recurring or fallback
  return meeting.scheduled_at ? formatDate(meeting.scheduled_at) : ''
})
/** END DEFINE COMPUTED */

/** START DEFINE METHOD */
function statusColor(status: string): string {
  const colorMap: Record<string, string> = {
    scheduled: 'blue',
    active: 'green',
  }
  return colorMap[status] ?? 'grey'
}

function statusIcon(status: string): string {
  const iconMap: Record<string, string> = {
    scheduled: 'mdi-calendar-clock',
    active: 'mdi-video',
  }
  return iconMap[status] ?? 'mdi-video'
}

function formatDate(dateString: string): string {
  return moment.utc(dateString).local().format('YYYY/MM/DD HH:mm (ddd)')
}

function formatTime(timeString: string): string {
  return moment(timeString, 'HH:mm:ss').format('HH:mm')
}
/** END DEFINE METHOD */

/** START DEFINE WATCHER */
// Reset expand state when the meeting changes (e.g., list re-renders with different data)
watch(
  () => props.meeting.id,
  () => {
    descriptionDialog.value = false
  },
)
/** END DEFINE WATCHER */
</script>

<style scoped>
.meeting-card {
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.meeting-card :deep(.v-card-text.flex-grow-1) {
  flex: 1 1 auto;
}

.meeting-card:hover {
  box-shadow: 0 4px 20px rgba(var(--v-theme-on-surface), 0.08) !important;
}

.meeting-card__status-bar {
  height: 3px;
  width: 100%;
}

.status-scheduled {
  background: rgb(var(--v-theme-info));
}

.status-active {
  background: rgb(var(--v-theme-success));
}

.participant-avatars {
  display: flex;
  align-items: center;
}

.participant-avatar-item {
  border: 2px solid rgb(var(--v-theme-surface));
  flex-shrink: 0;
}

.participant-avatar-wrapper {
  position: relative;
  display: inline-flex;
  margin-left: -5px;
}

.participant-avatar-wrapper:first-child {
  margin-left: 0;
}

.live-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: rgb(var(--v-theme-success));
  border: 1.5px solid rgb(var(--v-theme-surface));
  border-radius: 50%;
}

.min-width-0 {
  min-width: 0;
}

.live-banner {
  background: rgba(var(--v-theme-success), 0.08);
  border: 1px solid rgba(var(--v-theme-success), 0.2);
}

.info-row {
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.14);
}
</style>
