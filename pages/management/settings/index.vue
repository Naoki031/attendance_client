<template>
  <v-container class="pa-4" max-width="900">
    <div class="text-h6 font-weight-bold text-primary mb-6">{{ $t('settings.title') }}</div>

    <!-- Chatbot -->
    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-title class="pa-6 pb-2 text-subtitle-1 font-weight-bold">
        <v-icon icon="mdi-robot-outline" class="mr-2" />
        {{ $t('settings.chatbot.title') }}
      </v-card-title>
      <v-card-text class="px-6 pb-4">
        <v-row align="center" dense>
          <v-col cols="12" sm="8">
            <div class="text-body-2 font-weight-medium">
              {{ $t('settings.chatbot.reloadPrompts') }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ $t('settings.chatbot.reloadPromptsDesc') }}
            </div>
          </v-col>
          <v-col cols="12" sm="4" class="d-flex justify-sm-end">
            <v-btn
              color="primary"
              variant="tonal"
              rounded="lg"
              class="btn-shine"
              prepend-icon="mdi-reload"
              :loading="isReloadingPrompts"
              @click="reloadPrompts"
            >
              {{ $t('settings.chatbot.reloadPromptsAction') }}
            </v-btn>
          </v-col>
        </v-row>
        <v-alert
          v-if="reloadPromptsResult !== null"
          :type="reloadPromptsResult.success ? 'success' : 'error'"
          variant="tonal"
          rounded="lg"
          class="mt-3"
          density="compact"
          closable
          @click:close="reloadPromptsResult = null"
        >
          {{ reloadPromptsResult.message }}
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Translation Cache -->
    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-title class="pa-6 pb-2 text-subtitle-1 font-weight-bold">
        <v-icon icon="mdi-translate" class="mr-2" />
        {{ $t('settings.translation.title') }}
      </v-card-title>
      <v-card-text class="px-6 pb-4">
        <v-row align="center" dense>
          <v-col cols="12" sm="8">
            <div class="text-body-2 font-weight-medium">
              {{ $t('settings.translation.retranslateAll') }}
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ $t('settings.translation.retranslateAllDesc') }}
            </div>
          </v-col>
          <v-col cols="12" sm="4" class="d-flex justify-sm-end">
            <v-btn
              color="primary"
              variant="tonal"
              rounded="lg"
              prepend-icon="mdi-refresh"
              :loading="isRetranslating"
              @click="retranslateAll"
            >
              {{ $t('settings.translation.retranslateAllAction') }}
            </v-btn>
          </v-col>
        </v-row>
        <v-alert
          v-if="retranslateResult !== null"
          :type="retranslateResult.success ? 'success' : 'error'"
          variant="tonal"
          rounded="lg"
          class="mt-3"
          density="compact"
          closable
          @click:close="retranslateResult = null"
        >
          {{ retranslateResult.message }}
        </v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import ChatbotService from '@/services/ChatbotService'
import ChatRoomService from '@/services/ChatRoomService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.settings.index',
})
/* END DEFINE */

const { t } = useI18n()

/** START DEFINE STATE */
const isReloadingPrompts = ref(false)
const reloadPromptsResult = ref<{ success: boolean; message: string } | null>(null)

const isRetranslating = ref(false)
const retranslateResult = ref<{ success: boolean; message: string } | null>(null)
/* END DEFINE STATE */

/** START DEFINE METHOD */
const reloadPrompts = async () => {
  try {
    isReloadingPrompts.value = true
    reloadPromptsResult.value = null
    const result = await ChatbotService.reloadPrompts()
    reloadPromptsResult.value = {
      success: true,
      message: t('settings.chatbot.reloadPromptsSuccess', { count: result.sections }),
    }
  } catch (error) {
    console.error('Failed to reload prompts:', error)
    reloadPromptsResult.value = {
      success: false,
      message: t('settings.chatbot.reloadPromptsError'),
    }
  } finally {
    isReloadingPrompts.value = false
  }
}
const retranslateAll = async () => {
  try {
    isRetranslating.value = true
    retranslateResult.value = null

    const rooms = await ChatRoomService.getMyRooms()
    let totalRetranslated = 0

    for (const room of rooms) {
      const result = await ChatRoomService.retranslateRoom(room.uuid)
      totalRetranslated += result.retranslated
    }

    retranslateResult.value = {
      success: true,
      message: t('settings.translation.retranslateAllSuccess', {
        total: totalRetranslated,
        rooms: rooms.length,
      }),
    }
  } catch (error) {
    console.error('Failed to retranslate rooms:', error)
    retranslateResult.value = {
      success: false,
      message: t('settings.translation.retranslateAllError'),
    }
  } finally {
    isRetranslating.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
