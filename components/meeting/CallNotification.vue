<template>
  <Teleport to="body">
    <Transition name="call-popup">
      <div v-if="invitesStore.hasNotification" class="call-overlay">
        <div class="call-card">
          <!-- Pulsing ring animation -->
          <div class="call-ring">
            <div class="call-ring__pulse" />
            <div class="call-ring__icon">
              <v-icon size="36" color="white">mdi-video</v-icon>
            </div>
          </div>

          <div class="call-info">
            <p class="call-info__label">{{ $t('meetings.invite.incomingCall') }}</p>
            <p class="call-info__title">{{ invitesStore.current?.meetingTitle }}</p>
            <p class="call-info__countdown">{{ countdown }}s</p>
          </div>

          <div class="call-actions">
            <div class="call-actions__btn-wrap">
              <button
                class="call-btn call-btn--decline"
                :disabled="isResponding"
                @click="handleDecline"
              >
                <v-icon size="28">mdi-phone-hangup</v-icon>
              </button>
              <span class="call-btn__label call-btn__label--decline">
                {{ $t('meetings.invite.decline') }}
              </span>
            </div>

            <div class="call-actions__btn-wrap">
              <button class="call-btn call-btn--join" :disabled="isResponding" @click="handleJoin">
                <v-icon size="28">mdi-phone</v-icon>
              </button>
              <span class="call-btn__label call-btn__label--join">
                {{ $t('meetings.invite.join') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
/** START IMPORT */
import { useMeetingInvitesStore } from '@/stores/meeting-invites'
import { useMeetingRingtone } from '@/composables/useMeetingRingtone'
/* END IMPORT */

/** START DEFINE STATE */
const invitesStore = useMeetingInvitesStore()
const { startRing, stopRing } = useMeetingRingtone()

const CALL_TIMEOUT = 30
const countdown = ref(CALL_TIMEOUT)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const isResponding = computed(
  () => !!invitesStore.current && !!invitesStore.responding[invitesStore.current.meetingUuid],
)
/* END DEFINE STATE */

/** START DEFINE METHOD */
function playRingTone() {
  startRing()
}

function stopRingTone() {
  stopRing()
}

function startCountdown() {
  stopCountdown()
  countdown.value = CALL_TIMEOUT
  countdownTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      stopCountdown()
      // Backend will mark as missed and fire missed_call event; just dismiss the UI
      invitesStore.dismiss()
    }
  }, 1000)
}

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

async function handleJoin() {
  if (!invitesStore.current) return
  stopRingTone()
  await invitesStore.accept(invitesStore.current.meetingUuid)
}

async function handleDecline() {
  if (!invitesStore.current) return
  stopRingTone()
  stopCountdown()
  await invitesStore.decline(invitesStore.current.meetingUuid)
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => invitesStore.hasNotification,
  (hasNotification) => {
    if (hasNotification) {
      playRingTone()
      startCountdown()
    } else {
      stopRingTone()
      stopCountdown()
    }
  },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onUnmounted(() => {
  stopRingTone()
  stopCountdown()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.call-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
}

.call-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  background: #1a1a2e;
  border-radius: 24px;
  padding: 40px 48px 32px;
  min-width: 280px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

/* ── Pulsing ring ── */
.call-ring {
  position: relative;
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.call-ring__pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.25);
  animation: ring-pulse 1.5s ease-out infinite;
}

.call-ring__icon {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.3);
}

@keyframes ring-pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

/* ── Info ── */
.call-info {
  text-align: center;
}

.call-info__label {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 0 0 6px;
}

.call-info__title {
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 4px;
}

.call-info__countdown {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
}

/* ── Action buttons ── */
.call-actions {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.call-actions__btn-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.call-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.15s,
    opacity 0.15s;
  color: white;
}

.call-btn:active {
  transform: scale(0.92);
}

.call-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.call-btn--decline {
  background: rgb(var(--v-theme-error));
}

.call-btn--join {
  background: rgb(var(--v-theme-success));
  animation: join-pulse 1s ease-in-out infinite alternate;
}

@keyframes join-pulse {
  from {
    box-shadow: 0 0 0 0 rgba(67, 160, 71, 0.5);
  }
  to {
    box-shadow: 0 0 0 12px rgba(67, 160, 71, 0);
  }
}

.call-btn__label {
  font-size: 12px;
  font-weight: 500;
}

.call-btn__label--decline {
  color: #e57373;
}

.call-btn__label--join {
  color: #81c784;
}

/* ── Transition ── */
.call-popup-enter-active,
.call-popup-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.call-popup-enter-from,
.call-popup-leave-to {
  opacity: 0;
  transform: scale(0.88);
}
</style>
