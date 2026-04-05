<template>
  <div class="control-bar">
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
        :icon="isScreenSharing ? 'mdi-monitor-share' : 'mdi-monitor'"
        :color="isScreenSharing ? 'primary' : 'white'"
        variant="flat"
        rounded="xl"
        size="48"
        @click="isScreenSharing ? emit('stop-screen-share') : emit('start-screen-share')"
      ></v-btn>
      <span class="control-bar__label" :class="isScreenSharing ? 'control-bar__label--on' : ''">
        {{ isScreenSharing ? $t('meetings.controls.shareOn') : $t('meetings.controls.shareOff') }}
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
          isSpeakerEnabled ? $t('meetings.controls.speakerOn') : $t('meetings.controls.speakerOff')
        }}
      </span>
    </div>

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

    <div class="control-bar__item">
      <v-btn
        :icon="showSubtitles ? 'mdi-subtitles' : 'mdi-subtitles-outline'"
        :color="showSubtitles ? 'primary' : 'white'"
        variant="flat"
        rounded="xl"
        size="48"
        @click="emit('toggle-subtitles')"
      ></v-btn>
      <span class="control-bar__label" :class="showSubtitles ? 'control-bar__label--on' : ''">
        {{ $t('meetings.subtitles') }}
      </span>
    </div>

    <!-- Fullscreen button — only shown when screen share is active -->
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
          isFullscreen ? $t('meetings.controls.exitFullscreen') : $t('meetings.controls.fullscreen')
        }}
      </span>
    </div>

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
</template>

<script lang="ts" setup>
// START DEFINE PROPERTY AND EMITS
defineProps<{
  isMicEnabled: boolean
  isCameraEnabled: boolean
  isScreenSharing: boolean
  isSpeakerEnabled: boolean
  showSubtitles: boolean
  ttsEnabled: boolean
  hasAnyScreenShare: boolean
  isFullscreen: boolean
}>()

const emit = defineEmits<{
  'toggle-mic': []
  'toggle-camera': []
  'start-screen-share': []
  'stop-screen-share': []
  'toggle-speaker': []
  'toggle-subtitles': []
  'toggle-tts': []
  'toggle-fullscreen': []
  'open-settings': []
  leave: []
}>()
// END DEFINE PROPERTY AND EMITS
</script>

<style scoped>
/* ── Design tokens (always-dark component) ── */
.control-bar {
  --cb-bg: rgba(0, 0, 0, 0.9);
  --cb-label: rgba(255, 255, 255, 0.5);
  --cb-label-on: #81c784;
  --cb-label-off: #e57373;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 12px 24px;
  background: var(--cb-bg);
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .control-bar {
    flex-wrap: wrap;
    gap: 8px 4px;
    padding: 8px 12px;
  }

  .control-bar__item {
    /* 5 items per row on mobile: (100% - 4 gaps) / 5 */
    flex: 0 0 calc(20% - 3.2px);
  }

  .control-bar :deep(.v-btn) {
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
</style>
