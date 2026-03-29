<template>
  <v-app>
    <AppHeader />
    <LeftSidebar />
    <v-main>
      <NuxtPage />
    </v-main>
    <AppFooter />

    <!-- AI Chatbot widget (always visible, bottom-right) -->
    <ChatbotWidget />

    <!-- Real-time notification for approvers -->
    <v-snackbar
      v-model="notificationVisible"
      location="top right"
      color="primary"
      rounded="lg"
      :timeout="5000"
    >
      <div class="d-flex align-center ga-2">
        <v-icon icon="mdi-bell-ring-outline" size="18"></v-icon>
        <span>{{ notificationMessage }}</span>
      </div>
      <template #actions>
        <v-btn variant="text" size="small" @click="goToApprovals">{{ $t('common.view') }}</v-btn>
        <v-btn
          variant="text"
          size="small"
          icon="mdi-close"
          @click="notificationVisible = false"
        ></v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
/** START IMPORT */
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import LeftSidebar from '@/components/layout/LeftSidebar.vue'
import ChatbotWidget from '@/components/chatbot/ChatbotWidget.vue'
import { useSocketEvent } from '@/composables/useSocket'
import { useApprovalsStore } from '@/stores/approvals'
import type { EmployeeRequestModel } from '@/interfaces/models/EmployeeRequestModel'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const userStore = useUserStore()
const approvalsStore = useApprovalsStore()
const router = useRouter()
const notificationVisible = ref<boolean>(false)
const notificationMessage = ref<string>('')
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const goToApprovals = () => {
  notificationVisible.value = false
  router.push({ name: 'admin.approvals.index' })
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  if (userStore.isAuthenticated) {
    userStore.getUser()
  }
})

// Show toast notification when a new request is submitted
useSocketEvent<{ user?: { full_name?: string }; type?: string }>('request:created', (request) => {
  if (!userStore.isAdmin) return

  approvalsStore.loadPendingCount()

  const { t } = useI18n()
  const name = request?.user?.full_name ?? 'An employee'
  const typeLabels: Record<string, string> = {
    wfh: t('requestType.wfh'),
    off: t('requestType.off'),
    equipment: t('requestType.equipment'),
    clock_forget: t('requestType.clockForget'),
    overtime: t('requestType.overtime'),
  }
  const type = typeLabels[request?.type ?? ''] ?? request?.type ?? 'request'
  notificationMessage.value = t('home.notificationSubmitted', { name, type })
  notificationVisible.value = true
})

// Update pending count badge and notify employee when a request is approved/rejected/edited
useSocketEvent<EmployeeRequestModel>('request:updated', (request) => {
  if (userStore.isAdmin) {
    approvalsStore.loadPendingCount()
  }

  // Notify the employee who submitted the request
  const currentUserId = userStore.user?.id
  if (currentUserId && request.user_id === currentUserId && request.status !== 'pending') {
    const { t } = useI18n()
    const typeLabels: Record<string, string> = {
      wfh: t('requestType.wfh'),
      off: t('requestType.off'),
      equipment: t('requestType.equipment'),
      clock_forget: t('requestType.clockForget'),
      overtime: t('requestType.overtime'),
    }
    const type = typeLabels[request.type ?? ''] ?? request.type ?? 'request'
    const isApproved = request.status === 'approved'
    notificationMessage.value = isApproved
      ? t('home.notificationApproved', { type })
      : t('home.notificationRejected', { type })
    notificationVisible.value = true
  }
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
