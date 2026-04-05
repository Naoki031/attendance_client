<template>
  <v-card rounded="xl" elevation="0" border class="meeting-card d-flex flex-column w-100">
    <!-- Status bar -->
    <div class="meeting-card__status-bar" :class="`status-${meeting.status}`"></div>

    <v-card-item class="pt-4 pb-2">
      <template #prepend>
        <v-avatar :color="statusColor(meeting.status)" size="40" rounded="lg">
          <v-icon size="20" color="white">{{ statusIcon(meeting.status) }}</v-icon>
        </v-avatar>
      </template>
      <v-card-title class="text-body-1 font-weight-bold d-flex align-center ga-1">
        <v-icon v-if="meeting.is_private" size="14" color="warning">mdi-lock</v-icon>
        <span class="text-truncate">{{ meeting.title }}</span>
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
        <v-menu v-if="meeting.host_id === currentUserId">
          <template #activator="{ props: menuProps }">
            <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="menuProps" />
          </template>
          <v-list density="compact">
            <v-list-item
              prepend-icon="mdi-pencil-outline"
              :title="$t('meetings.editMeeting')"
              @click="$emit('edit', meeting.uuid)"
            />
            <v-list-item
              v-if="meeting.is_private"
              prepend-icon="mdi-lock-reset"
              :title="$t('meetings.regeneratePassword')"
              @click="$emit('regenerate-password', meeting.uuid)"
            />
          </v-list>
        </v-menu>
      </template>
    </v-card-item>

    <v-card-text class="pt-0 pb-3 flex-grow-1">
      <!-- Description -->
      <div v-if="meeting.description" class="text-caption text-medium-emphasis mb-3">
        <span v-if="!isExpanded">
          {{
            meeting.description.length > 80
              ? meeting.description.slice(0, 80) + '…'
              : meeting.description
          }}
          <button
            v-if="meeting.description.length > 80"
            class="expand-btn"
            @click.stop="isExpanded = true"
          >
            {{ $t('common.viewAll') }}
          </button>
        </span>
        <span v-else>
          {{ meeting.description }}
          <button class="expand-btn" @click.stop="isExpanded = false">
            {{ $t('common.showLess') }}
          </button>
        </span>
      </div>

      <!-- Meta info -->
      <div class="d-flex flex-column ga-2">
        <!-- Host -->
        <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
          <v-icon size="14">mdi-account-outline</v-icon>
          <span>{{ meeting.host?.full_name ?? $t('common.unknown') }}</span>
          <v-chip
            v-if="meeting.host_id === currentUserId"
            size="x-small"
            color="primary"
            variant="tonal"
            class="ml-1"
          >
            {{ $t('meetings.host') }}
          </v-chip>
        </div>

        <!-- Schedule -->
        <div
          v-if="scheduleLabel"
          class="d-flex align-center ga-2 text-caption text-medium-emphasis"
        >
          <v-icon size="14">mdi-calendar-clock-outline</v-icon>
          <span>{{ scheduleLabel }}</span>
        </div>
      </div>

      <!-- Live participants -->
      <div v-if="liveParticipants.length > 0" class="d-flex align-center mt-3 ga-2">
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
                  size="26"
                  class="participant-avatar-item"
                  :color="participant.user?.avatar ? undefined : 'primary'"
                >
                  <v-img v-if="participant.user?.avatar" :src="participant.user.avatar" cover />
                  <span
                    v-else
                    class="text-caption font-weight-bold text-white"
                    style="font-size: 10px"
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
            size="26"
            color="surface-variant"
            class="participant-avatar-item"
          >
            <span class="text-caption" style="font-size: 10px">
              +{{ liveParticipants.length - 5 }}
            </span>
          </v-avatar>
        </div>
        <span class="text-caption text-medium-emphasis">
          {{ liveParticipants.length }} {{ $t('meetings.participants') }}
        </span>
      </div>
    </v-card-text>

    <v-divider class="mt-auto" />

    <v-card-actions class="pa-3">
      <v-btn
        color="primary"
        variant="tonal"
        rounded="lg"
        size="small"
        prepend-icon="mdi-video-outline"
        :to="`/meetings/${meeting.uuid}`"
      >
        {{ $t('meetings.join') }}
      </v-btn>
      <v-spacer />
      <v-btn
        v-if="meeting.host_id === currentUserId"
        icon="mdi-pencil-outline"
        variant="text"
        size="small"
        density="comfortable"
        :title="$t('meetings.editMeeting')"
        @click="$emit('edit', meeting.uuid)"
      />
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
/** START IMPORT */
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
})

defineEmits<{
  'regenerate-password': [uuid: string]
  edit: [uuid: string]
}>()
/** END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { t } = useI18n()
const isExpanded = ref(false)
/** END DEFINE STATE */

/** START DEFINE COMPUTED */
const scheduleLabel = computed(() => {
  const meeting = props.meeting
  if (meeting.meeting_type === 'one_time') {
    return meeting.scheduled_at ? formatDate(meeting.scheduled_at) : t('meetings.schedule.instant')
  }
  if (meeting.meeting_type === 'daily') {
    return meeting.schedule_time
      ? `${t('meetings.schedule.everyDay')} ${meeting.schedule_time}`
      : t('meetings.schedule.instant')
  }
  if (meeting.meeting_type === 'weekly') {
    const dayName =
      meeting.schedule_day_of_week !== undefined
        ? t(`meetings.days.${meeting.schedule_day_of_week}`)
        : ''
    const interval = meeting.schedule_interval_weeks ?? 1
    const time = meeting.schedule_time ?? ''
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
  return new Date(dateString).toLocaleString()
}
/** END DEFINE METHOD */

/** START DEFINE WATCHER */
// Reset expand state when the meeting changes (e.g., list re-renders with different data)
watch(
  () => props.meeting.id,
  () => {
    isExpanded.value = false
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

.expand-btn {
  background: none;
  border: none;
  padding: 0;
  color: rgb(var(--v-theme-primary));
  font-size: inherit;
  cursor: pointer;
  font-weight: 500;
}

.expand-btn:hover {
  text-decoration: underline;
}
</style>
