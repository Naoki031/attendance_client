<template>
  <v-container class="pa-4" max-width="860">
    <div class="text-h6 font-weight-bold text-primary mb-5">{{ $t('userSettings.title') }}</div>

    <v-card rounded="xl" elevation="0" border>
      <!-- Tab navigation -->
      <v-tabs v-model="activeTab" color="primary" density="comfortable" class="border-b">
        <v-tab v-for="section in sections" :key="section.key" :value="section.key">
          <v-icon :icon="section.icon" size="18" class="mr-2" />
          {{ section.label }}
        </v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <!-- Meeting notifications -->
        <v-window-item value="meeting">
          <div class="pa-6">
            <div class="text-body-2 font-weight-medium mb-1">
              {{ $t('settings.meeting.ringtone.label') }}
            </div>
            <div class="text-caption text-medium-emphasis mb-5">
              {{ $t('settings.meeting.ringtone.desc') }}
            </div>
            <v-row dense>
              <v-col v-for="option in ringtoneOptions" :key="option.id" cols="6" sm="3">
                <v-card
                  :variant="selectedRingtone === option.id ? 'tonal' : 'outlined'"
                  :color="selectedRingtone === option.id ? 'primary' : undefined"
                  rounded="lg"
                  class="ringtone-tile pa-3 d-flex flex-column align-center ga-2"
                  @click="saveRingtone(option.id)"
                >
                  <v-icon :icon="option.icon" size="28" />
                  <div class="text-caption font-weight-medium text-center">{{ option.label }}</div>
                  <v-btn
                    size="x-small"
                    variant="tonal"
                    rounded="lg"
                    :color="selectedRingtone === option.id ? 'primary' : undefined"
                    @click.stop="preview(option.id)"
                  >
                    {{ $t('settings.meeting.ringtone.preview') }}
                  </v-btn>
                  <v-icon
                    v-if="selectedRingtone === option.id"
                    icon="mdi-check-circle"
                    color="primary"
                    size="16"
                    class="ringtone-check"
                  />
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-window-item>

        <!--
          To add a new section:
          1. Add an entry to the `sections` array in <script>
          2. Add a <v-window-item :value="key"> block here
        -->
      </v-window>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import { useMeetingRingtone } from '@/composables/useMeetingRingtone'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'settings.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const { t } = useI18n()
const { selectedRingtone, ringtoneOptions, saveRingtone, preview } = useMeetingRingtone()

const sections = computed(() => [
  { key: 'meeting', icon: 'mdi-bell-ring-outline', label: t('settings.meeting.title') },
])

const activeTab = ref('meeting')
/* END DEFINE STATE */
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.ringtone-tile {
  position: relative;
  cursor: pointer;
  transition: transform 0.1s;
  user-select: none;
}

.ringtone-tile:active {
  transform: scale(0.97);
}

.ringtone-check {
  position: absolute;
  top: 6px;
  right: 6px;
}
</style>
