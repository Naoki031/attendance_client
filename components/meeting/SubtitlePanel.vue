<template>
  <div class="subtitle-panel">
    <div class="subtitle-panel__header">
      <div class="d-flex align-center gap-1 flex-shrink-0">
        <v-icon icon="mdi-subtitles-outline" size="16"></v-icon>
        <v-chip
          v-if="screenAudioActive"
          size="x-small"
          color="primary"
          variant="tonal"
          class="px-1"
        >
          <v-icon start size="10">mdi-monitor-share</v-icon>
          Screen
        </v-chip>
      </div>
      <div class="d-flex gap-2 align-center">
        <!-- Speaking language: what language the speaker is using -->
        <v-tooltip :text="$t('meetings.speakingLangHint')" location="bottom">
          <template #activator="{ props }">
            <div v-bind="props" class="subtitle-select-wrap">
              <v-icon size="12" class="subtitle-select-icon">mdi-microphone</v-icon>
              <v-select
                :model-value="speakingLanguage"
                :items="speakingOptions"
                item-title="label"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
                :placeholder="$t('meetings.langAuto')"
                clearable
                class="subtitle-panel__lang-select"
                @update:model-value="emit('update:speakingLanguage', $event ?? null)"
              />
            </div>
          </template>
        </v-tooltip>
        <!-- Display language: what language subtitles are shown in -->
        <v-tooltip :text="$t('meetings.viewLangHint')" location="bottom">
          <template #activator="{ props }">
            <div v-bind="props" class="subtitle-select-wrap">
              <v-icon size="12" class="subtitle-select-icon">mdi-subtitles-outline</v-icon>
              <v-select
                v-model="selectedViewLanguage"
                :items="languageOptions"
                item-title="label"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
                class="subtitle-panel__lang-select"
              />
            </div>
          </template>
        </v-tooltip>
      </div>
    </div>

    <div ref="scrollContainer" class="subtitle-panel__body">
      <div v-for="(entry, index) in subtitles" :key="index" class="subtitle-entry">
        <span class="subtitle-entry__speaker">{{ entry.speakerName }}</span>
        <p class="subtitle-entry__original">{{ entry.original }}</p>
        <p
          v-if="entry.pending"
          class="subtitle-entry__translation subtitle-entry__translation--pending"
        >
          <v-progress-circular
            indeterminate
            size="10"
            width="1"
            color="primary"
            class="mr-1"
          ></v-progress-circular>
          {{ $t('meetings.translating') }}
        </p>
        <p v-else-if="translatedText(entry)" class="subtitle-entry__translation">
          → {{ translatedText(entry) }}
        </p>
      </div>

      <div v-if="subtitles.length === 0" class="subtitle-panel__empty">
        {{ $t('meetings.subtitlesEmpty') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// START IMPORT
import type { SubtitleEntry } from '@/composables/useMeeting'
// END IMPORT

// START DEFINE PROPERTY AND EMITS
const props = defineProps<{
  subtitles: SubtitleEntry[]
  userLanguage: string
  speakingLanguage: string | null
  screenAudioActive: boolean
}>()

const emit = defineEmits<{
  'update:userLanguage': [lang: string]
  'update:speakingLanguage': [lang: string | null]
}>()
// END DEFINE PROPERTY AND EMITS

// START DEFINE STATE
const scrollContainer = ref<HTMLElement | null>(null)

const languageOptions = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
]

const speakingOptions = [
  { value: 'vi', label: 'Nói: Việt' },
  { value: 'en', label: 'Nói: EN' },
  { value: 'ja', label: 'Nói: JA' },
]

const selectedViewLanguage = ref(props.userLanguage)
// END DEFINE STATE

// START DEFINE METHOD
function translatedText(entry: SubtitleEntry): string {
  if (entry.language === selectedViewLanguage.value) return ''

  return entry.translations[selectedViewLanguage.value] ?? ''
}
// END DEFINE METHOD

// START DEFINE WATCHER
watch(selectedViewLanguage, (lang) => {
  emit('update:userLanguage', lang)
  useCookie('language').value = lang
})

watch(
  () => props.subtitles.length,
  async () => {
    await nextTick()

    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
    }
  },
)
// END DEFINE WATCHER
</script>

<style scoped>
/* ── Design tokens (always-dark component) ── */
.subtitle-panel {
  --sp-bg: rgba(0, 0, 0, 0.7);
  --sp-fg: rgba(255, 255, 255, 0.87);
  --sp-fg-medium: rgba(255, 255, 255, 0.6);
  --sp-fg-muted: rgba(255, 255, 255, 0.5);
  --sp-fg-disabled: rgba(255, 255, 255, 0.38);
  --sp-border: rgba(255, 255, 255, 0.1);
  --sp-field-border: rgba(255, 255, 255, 0.2);

  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--sp-bg);
  color: var(--sp-fg);
  border-radius: 8px;
}

.subtitle-panel__header {
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--sp-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.subtitle-select-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.subtitle-select-icon {
  color: var(--sp-fg-muted);
  flex-shrink: 0;
}

.subtitle-panel__lang-select {
  max-width: 100px;
  font-size: 12px;
}

:deep(.subtitle-panel__lang-select .v-field__input) {
  font-size: 12px;
  color: var(--sp-fg);
  padding-top: 2px;
  padding-bottom: 2px;
  min-height: 28px;
}

:deep(.subtitle-panel__lang-select .v-field) {
  border-color: var(--sp-field-border);
}

.subtitle-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}

.subtitle-panel__empty {
  font-size: 13px;
  color: var(--sp-fg-disabled);
  text-align: center;
  margin-top: 16px;
}

.subtitle-entry {
  margin-bottom: 12px;
}

.subtitle-entry__speaker {
  font-size: 11px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  display: block;
  margin-bottom: 2px;
}

.subtitle-entry__original {
  font-size: 14px;
  margin: 0;
}

.subtitle-entry__translation {
  font-size: 13px;
  color: var(--sp-fg-medium);
  margin: 2px 0 0;
  font-style: italic;
}

.subtitle-entry__translation--pending {
  display: flex;
  align-items: center;
  font-style: normal;
  color: var(--sp-fg-disabled);
  font-size: 12px;
}
</style>
