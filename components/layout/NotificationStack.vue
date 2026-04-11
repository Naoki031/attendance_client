<template>
  <div class="notification-stack">
    <TransitionGroup name="notification" tag="div" class="notification-list">
      <!-- Missed call notifications (persistent) -->
      <div
        v-for="call in invitesStore.missedCalls"
        :key="`missed-${call.meetingUuid}`"
        class="notif-item"
      >
        <div class="notif-icon notif-icon--error">
          <v-icon icon="mdi-phone-missed" color="white" size="18" />
        </div>

        <div class="notif-body">
          <div class="notif-title">{{ $t('meetings.invite.missedCall') }}</div>
          <div class="notif-sub">{{ call.meetingTitle }}</div>
          <div class="notif-time">{{ formatMissedAt(call.missedAt) }}</div>
        </div>

        <div class="notif-actions">
          <button class="notif-btn notif-btn--primary" @click="joinMissedCall(call)">
            {{ $t('meetings.invite.join') }}
          </button>
          <button
            class="notif-btn notif-btn--icon"
            @click="invitesStore.dismissMissedCall(call.meetingUuid)"
          >
            <v-icon icon="mdi-close" size="16" />
          </button>
        </div>
      </div>

      <!-- Transient notifications (auto-dismiss) -->
      <div v-for="notification in notifications" :key="notification.id" class="notif-item">
        <div class="notif-icon" :class="`notif-icon--${notification.iconColor}`">
          <v-icon :icon="notification.icon" color="white" size="18" />
        </div>

        <div class="notif-body">
          <div class="notif-title">{{ notification.title }}</div>
        </div>

        <div class="notif-actions">
          <button
            v-for="action in notification.actions"
            :key="action.label"
            class="notif-btn notif-btn--primary"
            @click="handleAction(action, notification.id)"
          >
            {{ action.label }}
          </button>
          <button class="notif-btn notif-btn--icon" @click="dismiss(notification.id)">
            <v-icon icon="mdi-close" size="16" />
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import { useMeetingInvitesStore } from '@/stores/meeting-invites'
import { useAppNotifications } from '@/composables/useAppNotifications'
import { useMoment } from '@/composables/useMoment'
import type { AppNotificationAction } from '@/composables/useAppNotifications'
import type { MissedCallNotification } from '@/stores/meeting-invites'
/* END IMPORT */

/** START DEFINE STATE */
const invitesStore = useMeetingInvitesStore()
const { notifications, dismiss } = useAppNotifications()
const router = useRouter()
const { moment } = useMoment()
const { locale } = useI18n()
/* END DEFINE STATE */

/** START DEFINE METHOD */
function formatMissedAt(iso: string): string {
  const diffSeconds = moment().diff(moment.utc(iso).local(), 'seconds')
  const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })

  if (diffSeconds < 60) return rtf.format(-diffSeconds, 'second')
  const diffMinutes = moment().diff(moment.utc(iso).local(), 'minutes')
  if (diffMinutes < 60) return rtf.format(-diffMinutes, 'minute')
  const diffHours = moment().diff(moment.utc(iso).local(), 'hours')
  if (diffHours < 24) return rtf.format(-diffHours, 'hour')
  return rtf.format(-moment().diff(moment.utc(iso).local(), 'days'), 'day')
}

function joinMissedCall(call: MissedCallNotification): void {
  invitesStore.dismissMissedCall(call.meetingUuid)
  router.push(`/meetings/${call.meetingUuid}`)
}

function handleAction(action: AppNotificationAction, notificationId: string): void {
  action.handler()
  if (action.dismissOnClick !== false) {
    dismiss(notificationId)
  }
}
/* END DEFINE METHOD */
</script>

<style scoped>
.notification-stack {
  position: fixed;
  top: 72px;
  right: 16px;
  z-index: 2000;
  pointer-events: none;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

/* ── Notification item ── */
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 300px;
  max-width: 380px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface), 0.96);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(12px);
  pointer-events: auto;
}

/* ── Icon badge ── */
.notif-icon {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notif-icon--error {
  background: rgb(var(--v-theme-error));
}

.notif-icon--primary {
  background: rgb(var(--v-theme-primary));
}

.notif-icon--success {
  background: rgb(var(--v-theme-success));
}

.notif-icon--warning {
  background: rgb(var(--v-theme-warning));
}

/* ── Text content ── */
.notif-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notif-title {
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.4;
}

.notif-sub {
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  opacity: var(--v-high-emphasis-opacity);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-time {
  font-size: 11px;
  color: rgb(var(--v-theme-on-surface));
  opacity: var(--v-medium-emphasis-opacity);
  margin-top: 2px;
}

/* ── Action buttons ── */
.notif-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.notif-btn {
  border: none;
  cursor: pointer;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: opacity 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notif-btn:hover {
  opacity: 0.8;
}

.notif-btn--primary {
  padding: 5px 10px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.notif-btn--icon {
  width: 28px;
  height: 28px;
  padding: 0;
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgb(var(--v-theme-on-surface));
}

/* ── Transition ── */
.notification-enter-active,
.notification-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(110%);
}

.notification-move {
  transition: transform 0.25s ease;
}
</style>
