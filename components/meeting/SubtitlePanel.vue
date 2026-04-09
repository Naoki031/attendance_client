<template>
  <div class="subtitle-panel">
    <div class="subtitle-panel__header">
      <div class="d-flex align-center gap-1 flex-shrink-0">
        <v-icon icon="mdi-subtitles-outline" size="16"></v-icon>
      </div>
      <div class="d-flex gap-2 align-center">
        <!-- Speaking language selector -->
        <v-tooltip :text="$t('meetings.speakingLangHint')" location="bottom">
          <template #activator="{ props: activatorProps }">
            <div v-bind="activatorProps" class="subtitle-select-wrap">
              <v-icon size="12" class="subtitle-select-icon">mdi-microphone</v-icon>
              <v-select
                :model-value="speakingLanguage"
                :items="speakingOptions"
                item-title="label"
                item-value="value"
                density="compact"
                variant="outlined"
                hide-details
                class="subtitle-panel__lang-select"
                @update:model-value="emit('update:speakingLanguage', $event)"
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

        <!-- Pending state -->
        <div
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
        </div>

        <!-- All translations displayed -->
        <template v-else>
          <div
            v-for="lang in displayTranslations(entry)"
            :key="lang.code"
            class="subtitle-entry__translation"
          >
            <span class="translation-lang-badge">{{ lang.label }}</span>
            {{ lang.text }}
          </div>
        </template>
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
  speakingLanguage: string
}>()

const emit = defineEmits<{
  'update:speakingLanguage': [lang: string]
}>()
// END DEFINE PROPERTY AND EMITS

// START DEFINE STATE
const scrollContainer = ref<HTMLElement | null>(null)

const LANG_MAP: Record<string, string> = {
  vi: 'VI',
  en: 'EN',
  ja: '日本語',
}

const speakingOptions = [
  { value: 'vi', label: 'VI' },
  { value: 'ja', label: 'JA' },
  { value: 'en', label: 'EN' },
]
// END DEFINE STATE

// START DEFINE METHOD
function displayTranslations(
  entry: SubtitleEntry,
): Array<{ code: string; label: string; text: string }> {
  const result: Array<{ code: string; label: string; text: string }> = []

  for (const [code, text] of Object.entries(entry.translations)) {
    if (text && code !== entry.language) {
      result.push({ code, label: LANG_MAP[code] ?? code.toUpperCase(), text })
    }
  }

  return result
}
// END DEFINE METHOD

// START DEFINE WATCHER
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
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.subtitle-entry__translation--pending {
  display: flex;
  align-items: center;
  font-style: normal;
  color: var(--sp-fg-disabled);
  font-size: 12px;
}

.translation-lang-badge {
  font-size: 10px;
  font-weight: 700;
  color: var(--sp-fg-muted);
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 5px;
  border-radius: 3px;
  font-style: normal;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}
</style>
