<template>
  <div class="chatbot-help pa-3">
    <div class="text-caption font-weight-bold text-uppercase text-medium-emphasis mb-2">
      {{ $t('chatbot.help.title') }}
    </div>
    <div v-for="group in helpGroups" :key="group.label" class="mb-3">
      <div class="d-flex align-center ga-1 mb-1">
        <v-icon v-if="group.adminOnly" icon="mdi-shield-account" size="12" color="warning"></v-icon>
        <span class="text-caption text-medium-emphasis font-weight-medium">{{ group.label }}</span>
      </div>
      <div class="d-flex flex-wrap ga-1">
        <v-chip
          v-for="question in group.questions"
          :key="question"
          size="x-small"
          variant="tonal"
          :color="group.adminOnly ? 'warning' : 'primary'"
          class="chatbot-chip text-caption"
          @click="emit('select', question)"
        >
          {{ question }}
        </v-chip>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { ChatbotHelpGroup } from '@/types'
/** START DEFINE PROPERTY AND EMITS */
const emit = defineEmits<{
  select: [question: string]
}>()
/* END IMPORT */

const { t } = useI18n()
const userStore = useUserStore()

/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE COMPUTED */
const helpGroups = computed<ChatbotHelpGroup[]>(() => {
  const groups: ChatbotHelpGroup[] = [
    {
      label: t('chatbot.help.groups.requests'),
      questions: [
        t('chatbot.help.questions.createLeave'),
        t('chatbot.help.questions.createWfh'),
        t('chatbot.help.questions.createOvertime'),
        t('chatbot.help.questions.borrowEquipment'),
        t('chatbot.help.questions.forgetClock'),
      ],
    },
    {
      label: t('chatbot.help.groups.clockInOut'),
      questions: [
        t('chatbot.help.questions.clockQr'),
        t('chatbot.help.questions.clockBiometric'),
        t('chatbot.help.questions.clockWfh'),
        t('chatbot.help.questions.clockFace'),
        t('chatbot.help.questions.registerKyc'),
      ],
    },
    {
      label: t('chatbot.help.groups.myRequests'),
      questions: [
        t('chatbot.help.questions.editRequest'),
        t('chatbot.help.questions.reuseRequest'),
        t('chatbot.help.questions.trackStatus'),
      ],
    },
    {
      label: t('chatbot.help.groups.meetings'),
      questions: [
        t('chatbot.help.questions.createMeeting'),
        t('chatbot.help.questions.joinMeeting'),
        t('chatbot.help.questions.pinMeeting'),
        t('chatbot.help.questions.createVote'),
        t('chatbot.help.questions.meetingScreenShare'),
        t('chatbot.help.questions.meetingSubtitle'),
        t('chatbot.help.questions.hostSchedule'),
      ],
    },
  ]

  if (userStore.isAdmin) {
    groups.push(
      {
        label: t('chatbot.help.groups.approvals'),
        questions: [
          t('chatbot.help.questions.whereApprove'),
          t('chatbot.help.questions.whoCanApprove'),
          t('chatbot.help.questions.assignApprovers'),
          t('chatbot.help.questions.rejectRequest'),
          t('chatbot.help.questions.pendingBadge'),
          t('chatbot.help.questions.filterApprovals'),
        ],
        adminOnly: true,
      },
      {
        label: t('chatbot.help.groups.attendance'),
        questions: [
          t('chatbot.help.questions.syncDevice'),
          t('chatbot.help.questions.viewLogs'),
          t('chatbot.help.questions.generateQr'),
          t('chatbot.help.questions.reviewKyc'),
          t('chatbot.help.questions.viewCheckinPhoto'),
        ],
        adminOnly: true,
      },
      {
        label: t('chatbot.help.groups.usersOrg'),
        questions: [
          t('chatbot.help.questions.manageUsers'),
          t('chatbot.help.questions.assignDept'),
          t('chatbot.help.questions.setDeviceId'),
          t('chatbot.help.questions.cancelKycAdmin'),
          t('chatbot.help.questions.createTeam'),
          t('chatbot.help.questions.addTeamMembers'),
        ],
        adminOnly: true,
      },
      {
        label: t('chatbot.help.groups.integrations'),
        questions: [
          t('chatbot.help.questions.configSlack'),
          t('chatbot.help.questions.configGoogleSheets'),
        ],
        adminOnly: true,
      },
    )
  }

  return groups
})
/* END DEFINE COMPUTED */
</script>

<style scoped>
.chatbot-help {
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  max-height: 420px;
  overflow-y: auto;
}

.chatbot-chip {
  cursor: pointer;
}
</style>
