<template>
  <v-dialog :model-value="dialog" max-width="560" persistent scrollable>
    <v-card rounded="xl">
      <!-- Header -->
      <div class="dialog-header px-6 pt-5 pb-4">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary">mdi-calendar-account-outline</v-icon>
          <span class="text-h6 font-weight-bold">{{ $t('meetings.scheduledRsvp.title') }}</span>
          <v-chip size="x-small" color="primary" variant="tonal" class="ml-1">
            {{ invites.length }}
          </v-chip>
        </div>
        <v-btn icon variant="text" size="small" @click="$emit('close')">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="pt-0 pb-2">
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{ $t('meetings.scheduledRsvp.subtitle') }}
        </p>

        <div class="d-flex flex-column ga-3">
          <v-card v-for="invite in invites" :key="invite.id" rounded="lg" border elevation="0">
            <v-card-text class="pa-4">
              <!-- Title row -->
              <div class="d-flex align-start justify-space-between ga-2 mb-2">
                <div class="text-body-1 font-weight-bold" style="flex: 1 1 0; min-width: 0">
                  {{ invite.meeting?.title }}
                </div>
                <v-chip
                  v-if="invite.meeting?.meeting_type"
                  size="x-small"
                  :color="invite.meeting.meeting_type === 'one_time' ? 'info' : 'secondary'"
                  variant="tonal"
                  class="flex-shrink-0"
                >
                  {{ $t(`meetings.type.${invite.meeting.meeting_type}`) }}
                </v-chip>
              </div>

              <!-- Description -->
              <p
                v-if="invite.meeting?.description"
                class="text-body-2 text-medium-emphasis mb-3"
                style="white-space: pre-line"
              >
                {{ invite.meeting.description }}
              </p>

              <!-- Meta info -->
              <div class="d-flex flex-column ga-1 mb-4">
                <div v-if="invite.meeting?.scheduled_at" class="d-flex align-center ga-2">
                  <v-icon size="16" color="medium-emphasis">mdi-clock-outline</v-icon>
                  <span class="text-body-2">{{ formatDate(invite.meeting.scheduled_at) }}</span>
                </div>
                <div v-if="invite.meeting?.host" class="d-flex align-center ga-2">
                  <v-icon size="16" color="medium-emphasis">mdi-account-outline</v-icon>
                  <span class="text-body-2">
                    {{ $t('meetings.scheduledRsvp.hostedBy') }}
                    <strong
                      >{{ invite.meeting.host.first_name }}
                      {{ invite.meeting.host.last_name }}</strong
                    >
                  </span>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="d-flex ga-2">
                <v-btn
                  color="success"
                  variant="flat"
                  rounded="lg"
                  size="small"
                  class="flex-1-1-0"
                  :loading="responding[invite.id] === 'accepted'"
                  :disabled="!!responding[invite.id]"
                  @click="respond(invite, 'accepted')"
                >
                  <v-icon start size="14">mdi-check</v-icon>
                  {{ $t('meetings.rsvp.accept') }}
                </v-btn>
                <v-btn
                  color="error"
                  variant="tonal"
                  rounded="lg"
                  size="small"
                  class="flex-1-1-0"
                  :loading="responding[invite.id] === 'declined'"
                  :disabled="!!responding[invite.id]"
                  @click="respond(invite, 'declined')"
                >
                  <v-icon start size="14">mdi-close</v-icon>
                  {{ $t('meetings.rsvp.decline') }}
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-4 pt-2">
        <v-spacer />
        <v-btn variant="text" @click="$emit('close')">
          {{ $t('common.later') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import moment from 'moment'
import type { PropType } from 'vue'
import type {
  MeetingScheduledParticipantModel,
  ScheduledParticipantStatus,
} from '@/interfaces/models/MeetingScheduledParticipantModel'
import MeetingScheduledParticipantService from '@/services/MeetingScheduledParticipantService'
import { useAppNotifications } from '@/composables/useAppNotifications'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
defineOptions({ name: 'MeetingDialogScheduledRsvp' })
/* END DEFINE */

/** START DEFINE PROPERTY AND EMITS */
defineProps({
  dialog: {
    type: Boolean,
    required: true,
  },
  invites: {
    type: Array as PropType<MeetingScheduledParticipantModel[]>,
    required: true,
  },
})

const emit = defineEmits<{
  close: []
  responded: [invite: MeetingScheduledParticipantModel]
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { t } = useI18n()
const responding = ref<Record<number, ScheduledParticipantStatus | null>>({})
const { push } = useAppNotifications()
/* END DEFINE STATE */

/** START DEFINE METHOD */
function formatDate(dateString: string): string {
  return moment.utc(dateString).local().format('ddd, DD/MM/YYYY HH:mm')
}

async function respond(
  invite: MeetingScheduledParticipantModel,
  status: ScheduledParticipantStatus,
) {
  if (responding.value[invite.id]) return
  responding.value[invite.id] = status
  try {
    const updated = await MeetingScheduledParticipantService.rsvp(invite.meeting!.uuid, status)
    emit('responded', updated)
  } catch {
    push({
      icon: 'mdi-alert-circle-outline',
      iconColor: 'error',
      title: t('common.error'),
      timeout: 4000,
    })
  } finally {
    responding.value[invite.id] = null
  }
}
/* END DEFINE METHOD */
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
