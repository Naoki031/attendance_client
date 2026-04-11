<template>
  <v-sheet class="rsvp-bg d-flex align-center justify-center" min-height="100vh">
    <v-card class="pa-8 pb-6 text-center" elevation="12" width="440" rounded="xl">
      <!-- Logo -->
      <div class="mb-6">
        <v-avatar color="primary" size="64" class="mb-4" rounded="lg">
          <v-icon icon="mdi-calendar-account-outline" size="36" color="white" />
        </v-avatar>
        <div class="text-h5 font-weight-bold">{{ $t('meetings.rsvp.title') }}</div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="py-6">
        <v-progress-circular indeterminate color="primary" size="40" />
      </div>

      <!-- Error -->
      <v-alert v-else-if="errorMessage" type="error" variant="tonal" rounded="lg" class="text-left">
        {{ errorMessage }}
      </v-alert>

      <!-- Success -->
      <div v-else-if="isDone">
        <v-icon :color="doneColor" size="56" class="mb-4">{{ doneIcon }}</v-icon>
        <div class="text-h6 font-weight-bold mb-2">{{ doneTitle }}</div>
        <div class="text-body-2 text-medium-emphasis">{{ doneSubtitle }}</div>
      </div>

      <!-- Choose response (token provided but no status in query) -->
      <div v-else>
        <p class="text-body-2 text-medium-emphasis mb-6">
          {{ $t('meetings.rsvp.chooseResponse') }}
        </p>
        <div class="d-flex justify-center ga-3">
          <v-btn
            color="success"
            variant="flat"
            rounded="lg"
            :loading="responding === 'accepted'"
            @click="respond('accepted')"
          >
            <v-icon start>mdi-check</v-icon>
            {{ $t('meetings.rsvp.accept') }}
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            rounded="lg"
            :loading="responding === 'declined'"
            @click="respond('declined')"
          >
            <v-icon start>mdi-close</v-icon>
            {{ $t('meetings.rsvp.decline') }}
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-sheet>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { ScheduledParticipantStatus } from '@/interfaces/models/MeetingScheduledParticipantModel'
import MeetingScheduledParticipantService from '@/services/MeetingScheduledParticipantService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'meetings-rsvp',
  layout: 'guest',
})
/* END DEFINE */

/** START DEFINE STATE */
const route = useRoute()
const { t } = useI18n()

const token = computed(() => route.query.token as string | undefined)
const statusFromQuery = computed(() => route.query.status as ScheduledParticipantStatus | undefined)

const isLoading = ref(false)
const isDone = ref(false)
const errorMessage = ref('')
const responding = ref<ScheduledParticipantStatus | null>(null)
const respondedStatus = ref<ScheduledParticipantStatus | null>(null)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const doneIcon = computed(() =>
  respondedStatus.value === 'accepted' ? 'mdi-check-circle-outline' : 'mdi-close-circle-outline',
)

const doneColor = computed(() => (respondedStatus.value === 'accepted' ? 'success' : 'error'))

const doneTitle = computed(() =>
  t(`meetings.rsvp.done.${respondedStatus.value ?? 'accepted'}.title`),
)
const doneSubtitle = computed(() =>
  t(`meetings.rsvp.done.${respondedStatus.value ?? 'accepted'}.subtitle`),
)
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
async function respond(status: ScheduledParticipantStatus) {
  if (!token.value) {
    errorMessage.value = t('meetings.rsvp.invalidToken')
    return
  }

  responding.value = status
  try {
    await MeetingScheduledParticipantService.rsvpByToken(token.value, status)
    respondedStatus.value = status
    isDone.value = true
  } catch {
    errorMessage.value = t('meetings.rsvp.invalidToken')
  } finally {
    responding.value = null
  }
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(async () => {
  if (!token.value) {
    errorMessage.value = t('meetings.rsvp.invalidToken')
    return
  }

  // If status was already passed in the URL (e.g. direct email link), respond immediately
  if (statusFromQuery.value) {
    isLoading.value = true
    await respond(statusFromQuery.value)
    isLoading.value = false
  }
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.rsvp-bg {
  background: rgb(var(--v-theme-surface));
}
</style>
