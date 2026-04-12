<template>
  <div class="control-bar">
    <!-- Group 1: Core media controls -->
    <div class="control-bar__group">
      <div class="control-bar__item">
        <v-btn
          :icon="isMicEnabled ? 'mdi-microphone' : 'mdi-microphone-off'"
          :color="isMicEnabled ? 'success' : 'error'"
          variant="flat"
          rounded="xl"
          size="48"
          @click="emit('toggle-mic')"
        ></v-btn>
        <span
          class="control-bar__label"
          :class="isMicEnabled ? 'control-bar__label--on' : 'control-bar__label--off'"
        >
          {{ isMicEnabled ? $t('meetings.controls.micOn') : $t('meetings.controls.micOff') }}
        </span>
      </div>

      <div class="control-bar__item">
        <v-btn
          :icon="isCameraEnabled ? 'mdi-camera' : 'mdi-camera-off'"
          :color="isCameraEnabled ? 'success' : 'error'"
          variant="flat"
          rounded="xl"
          size="48"
          @click="emit('toggle-camera')"
        ></v-btn>
        <span
          class="control-bar__label"
          :class="isCameraEnabled ? 'control-bar__label--on' : 'control-bar__label--off'"
        >
          {{ isCameraEnabled ? $t('meetings.controls.camOn') : $t('meetings.controls.camOff') }}
        </span>
      </div>

      <div class="control-bar__item">
        <v-btn
          :icon="isSpeakerEnabled ? 'mdi-volume-high' : 'mdi-volume-mute'"
          :color="isSpeakerEnabled ? 'success' : 'error'"
          variant="flat"
          rounded="xl"
          size="48"
          @click="emit('toggle-speaker')"
        ></v-btn>
        <span
          class="control-bar__label"
          :class="isSpeakerEnabled ? 'control-bar__label--on' : 'control-bar__label--off'"
        >
          {{
            isSpeakerEnabled
              ? $t('meetings.controls.speakerOn')
              : $t('meetings.controls.speakerOff')
          }}
        </span>
      </div>
    </div>

    <div class="control-bar__divider"></div>

    <!-- Group 2: Features -->
    <div class="control-bar__group">
      <div class="control-bar__item control-bar__item--share">
        <div class="share-btn-group">
          <v-btn
            :icon="isScreenSharing ? 'mdi-monitor-share' : 'mdi-monitor'"
            :color="isScreenSharing ? 'primary' : 'white'"
            variant="flat"
            rounded="xl"
            size="48"
            class="share-main-btn"
            @click="
              isScreenSharing
                ? emit('stop-screen-share')
                : emit('start-screen-share', selectedQuality)
            "
          ></v-btn>
          <!-- Quality selector — only shown when not sharing -->
          <v-menu v-if="!isScreenSharing" location="top" offset="4">
            <template #activator="{ props: menuProps }">
              <v-btn
                icon="mdi-chevron-up"
                size="x-small"
                variant="tonal"
                color="white"
                class="share-quality-btn"
                v-bind="menuProps"
              ></v-btn>
            </template>
            <v-list density="compact" rounded="lg" min-width="160" bg-color="#1e1e1e">
              <v-list-item
                v-for="option in qualityOptions"
                :key="option.value"
                :active="selectedQuality === option.value"
                active-color="primary"
                @click="selectedQuality = option.value"
              >
                <template #prepend>
                  <v-icon size="16" class="mr-2">{{ option.icon }}</v-icon>
                </template>
                <v-list-item-title class="text-body-2" style="color: rgba(255, 255, 255, 0.87)">
                  {{ option.label }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption" style="color: rgba(255, 255, 255, 0.5)">
                  {{ option.description }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
        <span class="control-bar__label" :class="isScreenSharing ? 'control-bar__label--on' : ''">
          {{ isScreenSharing ? $t('meetings.controls.shareOn') : $t('meetings.controls.shareOff') }}
        </span>
      </div>

      <!-- Fullscreen — only when screen share is active -->
      <div v-if="hasAnyScreenShare" class="control-bar__item">
        <v-btn
          :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
          :color="isFullscreen ? 'primary' : 'white'"
          variant="flat"
          rounded="xl"
          size="48"
          @click="emit('toggle-fullscreen')"
        ></v-btn>
        <span class="control-bar__label" :class="isFullscreen ? 'control-bar__label--on' : ''">
          {{
            isFullscreen
              ? $t('meetings.controls.exitFullscreen')
              : $t('meetings.controls.fullscreen')
          }}
        </span>
      </div>

      <!-- TTS (Read Aloud) — paused, kept for future re-enable
      <div class="control-bar__item">
        <v-btn
          :icon="ttsEnabled ? 'mdi-account-voice' : 'mdi-account-voice-off'"
          :color="ttsEnabled ? 'success' : 'on-surface'"
          variant="flat"
          rounded="xl"
          size="48"
          @click="emit('toggle-tts')"
        ></v-btn>
        <span
          class="control-bar__label"
          :class="ttsEnabled ? 'control-bar__label--on' : 'control-bar__label--off'"
        >
          {{ ttsEnabled ? $t('meetings.controls.ttsOn') : $t('meetings.controls.ttsOff') }}
        </span>
      </div>
      -->

      <div v-if="isHost" class="control-bar__item">
        <v-btn
          icon="mdi-email-plus-outline"
          color="white"
          variant="flat"
          rounded="xl"
          size="48"
          @click="emit('open-invite')"
        ></v-btn>
        <span class="control-bar__label">{{ $t('meetings.invite.label') }}</span>
      </div>

      <div class="control-bar__item">
        <v-btn
          icon="mdi-poll"
          :color="showVotePanel ? 'primary' : 'white'"
          variant="flat"
          rounded="xl"
          size="48"
          @click="emit('toggle-vote-panel')"
        ></v-btn>
        <span class="control-bar__label" :class="showVotePanel ? 'control-bar__label--on' : ''">
          {{ $t('meetings.vote.title') }}
        </span>
      </div>

      <div class="control-bar__item">
        <div class="chat-btn-wrapper">
          <v-btn
            icon="mdi-chat-outline"
            :color="showChatPanel ? 'primary' : 'white'"
            variant="flat"
            rounded="xl"
            size="48"
            @click="emit('toggle-chat-panel')"
          ></v-btn>
          <span v-if="chatUnreadCount > 0" class="chat-unread-badge">
            {{ chatUnreadCount > 99 ? '99+' : chatUnreadCount }}
          </span>
        </div>
        <span class="control-bar__label" :class="showChatPanel ? 'control-bar__label--on' : ''">
          {{ $t('meetings.chat.label') }}
        </span>
      </div>
    </div>

    <div class="control-bar__divider"></div>

    <!-- Group 3: Settings & exit -->
    <div class="control-bar__group">
      <div class="control-bar__item">
        <v-btn
          icon="mdi-cog-outline"
          color="white"
          variant="tonal"
          rounded="xl"
          size="48"
          @click="emit('open-settings')"
        ></v-btn>
        <span class="control-bar__label">{{ $t('meetings.controls.settings') }}</span>
      </div>

      <!-- Transfer Host — only shown to the current runtime host -->
      <div v-if="isHost" class="control-bar__item">
        <v-btn
          icon="mdi-crown-outline"
          color="amber"
          variant="flat"
          rounded="xl"
          size="48"
          @click="emit('transfer-host')"
        ></v-btn>
        <span class="control-bar__label control-bar__label--host">{{
          $t('meetings.hostSchedule.transferHost')
        }}</span>
      </div>

      <!-- End Meeting — only shown to the host -->
      <div v-if="isHost" class="control-bar__item">
        <v-btn
          icon="mdi-phone-remove"
          color="error"
          variant="flat"
          rounded="xl"
          size="48"
          @click="emit('end-meeting')"
        ></v-btn>
        <span class="control-bar__label control-bar__label--off">{{
          $t('meetings.controls.endMeeting')
        }}</span>
      </div>

      <div class="control-bar__item">
        <v-btn
          icon="mdi-phone-hangup"
          color="error"
          variant="flat"
          rounded="xl"
          size="48"
          @click="emit('leave')"
        ></v-btn>
        <span class="control-bar__label control-bar__label--off">{{
          $t('meetings.controls.leave')
        }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// START IMPORT
import type { ScreenShareQuality } from '@/types/meeting/ScreenShareQuality'
// END IMPORT

// START DEFINE PROPERTY AND EMITS
defineProps<{
  isMicEnabled: boolean
  isCameraEnabled: boolean
  isScreenSharing: boolean
  isSpeakerEnabled: boolean
  showVotePanel: boolean
  showChatPanel: boolean
  chatUnreadCount: number
  ttsEnabled: boolean
  hasAnyScreenShare: boolean
  isFullscreen: boolean
  isHost: boolean
}>()

const emit = defineEmits<{
  'toggle-mic': []
  'toggle-camera': []
  'start-screen-share': [quality: ScreenShareQuality]
  'stop-screen-share': []
  'toggle-speaker': []
  'toggle-vote-panel': []
  'toggle-chat-panel': []
  'toggle-tts': []
  'toggle-fullscreen': []
  'open-settings': []
  'open-invite': []
  'transfer-host': []
  'end-meeting': []
  leave: []
}>()
// END DEFINE PROPERTY AND EMITS

// START DEFINE STATE
const { t } = useI18n()

const selectedQuality = ref<ScreenShareQuality>('video')

const qualityOptions = computed(() => [
  {
    value: 'video' as ScreenShareQuality,
    label: t('meetings.controls.shareQuality.video'),
    description: t('meetings.controls.shareQuality.videoDesc'),
    icon: 'mdi-play-circle-outline',
  },
  {
    value: 'balanced' as ScreenShareQuality,
    label: t('meetings.controls.shareQuality.balanced'),
    description: t('meetings.controls.shareQuality.balancedDesc'),
    icon: 'mdi-tune',
  },
  {
    value: 'document' as ScreenShareQuality,
    label: t('meetings.controls.shareQuality.document'),
    description: t('meetings.controls.shareQuality.documentDesc'),
    icon: 'mdi-file-document-outline',
  },
])
// END DEFINE STATE
</script>

<style scoped>
/* ── Design tokens (always-dark component) ── */
.control-bar {
  --cb-bg: rgba(0, 0, 0, 0.9);
  --cb-label: rgba(255, 255, 255, 0.5);
  --cb-label-on: #81c784;
  --cb-label-off: #e57373;
  --cb-label-host: #ffd54f;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px 24px;
  background: var(--cb-bg);
  flex-shrink: 0;
}

.control-bar__group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.control-bar__divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .control-bar {
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 8px 12px;
  }

  .control-bar__group {
    gap: 8px;
  }

  .control-bar__divider {
    display: none;
  }

  .control-bar :deep(.v-btn:not(.share-quality-btn)) {
    width: 40px !important;
    height: 40px !important;
  }

  .control-bar__label {
    font-size: 10px;
  }
}

@media (max-width: 360px) {
  .control-bar__label {
    display: none;
  }
}

.control-bar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.control-bar__label {
  font-size: 11px;
  line-height: 1.2;
  min-height: 2.4em;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--cb-label);
  user-select: none;
}

.control-bar__label--on {
  color: var(--cb-label-on);
}

.control-bar__label--off {
  color: var(--cb-label-off);
}

.control-bar__label--host {
  color: var(--cb-label-host);
}

.chat-btn-wrapper {
  position: relative;
  display: inline-flex;
}

.chat-unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: rgb(var(--v-theme-error));
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
  pointer-events: none;
}

.control-bar__item--share {
  position: relative;
}

.share-btn-group {
  position: relative;
  display: inline-flex;
}

.share-quality-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px !important;
  height: 18px !important;
  min-width: unset !important;
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  z-index: 1;
}
</style>
