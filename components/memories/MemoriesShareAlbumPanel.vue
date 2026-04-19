<template>
  <v-dialog
    :model-value="modelValue"
    max-width="480"
    scrollable
    @update:model-value="handleDialogUpdate"
  >
    <v-card rounded="xl" elevation="2">
      <!-- Header -->
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold" style="color: rgb(var(--v-theme-primary))">
            {{ t('memories.shareAlbumPanel.title') }}
          </div>
          <div
            class="text-body-2 mt-1"
            style="color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity))"
          >
            {{ t('memories.shareAlbumPanel.subtitle') }}
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          :aria-label="t('common.close')"
          @click="handleClose"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0 share-body">
        <!-- 1. Album preview -->
        <div class="share-preview">
          <div class="share-preview__thumb">
            <img
              v-if="album.coverPhotoUrl"
              :src="album.coverPhotoUrl"
              :alt="album.title"
              class="share-preview__img"
            />
            <v-icon v-else size="28" color="primary">mdi-image-album</v-icon>
          </div>

          <div class="share-preview__info">
            <span class="share-preview__album">{{ album.title }}</span>
            <span class="share-preview__caption">
              {{ album.photoCount }} {{ t('memories.photos') }}
            </span>
          </div>
        </div>

        <!-- 2. Room list -->
        <div class="share-section-label">{{ t('memories.shareAlbumPanel.selectRoom') }}</div>

        <div v-if="chatRooms.length === 0" class="share-room-empty">
          {{ t('memories.shareAlbumPanel.noRooms') }}
        </div>

        <div v-else class="share-room-list">
          <button
            v-for="room in chatRooms"
            :key="room.uuid"
            class="share-room-item"
            :class="{ 'share-room-item--selected': selectedRoomId === room.uuid }"
            @click="selectedRoomId = room.uuid"
          >
            <v-avatar size="36" color="primary" class="share-room-item__avatar">
              <v-icon size="18" color="white">
                {{ room.type === 'direct' ? 'mdi-account' : 'mdi-account-group' }}
              </v-icon>
            </v-avatar>

            <div class="share-room-item__info">
              <span class="share-room-item__name">{{ room.name }}</span>
              <span class="share-room-item__members">
                {{ t('memories.shareAlbumPanel.memberCount', { count: room.member_count ?? 0 }) }}
              </span>
            </div>

            <v-icon v-if="selectedRoomId === room.uuid" size="18" color="primary" class="ml-auto">
              mdi-check-circle
            </v-icon>
          </button>
        </div>

        <v-alert v-if="roomError" type="error" variant="tonal" density="compact" class="mt-2">
          {{ t('memories.shareAlbumPanel.roomRequired') }}
        </v-alert>

        <!-- 3. Optional message -->
        <div class="share-section-label mt-3">{{ t('memories.shareAlbumPanel.messageLabel') }}</div>

        <v-textarea
          v-model="message"
          :placeholder="t('memories.shareAlbumPanel.messagePlaceholder')"
          density="compact"
          variant="outlined"
          rounded="lg"
          hide-details
          auto-grow
          rows="2"
          max-rows="4"
          class="mb-4"
        />

        <!-- Error alert -->
        <v-alert v-if="submitError" type="error" variant="tonal" density="compact" class="mb-3">
          {{ submitError }}
        </v-alert>

        <!-- Success state -->
        <div v-if="isSuccess" class="share-success">
          <v-icon size="32" color="success">mdi-check-circle-outline</v-icon>
          <span class="share-success__text">{{
            t('memories.shareAlbumPanel.successMessage')
          }}</span>
        </div>
      </v-card-text>

      <!-- Footer -->
      <v-card-actions class="px-6 py-4 ga-3 justify-end">
        <v-btn variant="text" rounded="lg" :disabled="isSubmitting" @click="handleClose">
          {{ t('common.cancel') }}
        </v-btn>

        <v-btn
          v-if="!isSuccess"
          color="primary"
          variant="flat"
          rounded="lg"
          :loading="isSubmitting"
          prepend-icon="mdi-share-variant-outline"
          @click="handleSubmit"
        >
          {{ t('memories.shareAlbumPanel.send') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { Album } from '@/types/memories'
import type { ChatRoomModel } from '@/interfaces/models/ChatRoomModel'
import { apiClient } from '@/utils/apiClient'
import ChatRoomService from '@/services/ChatRoomService'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  album: {
    type: Object as PropType<Album>,
    required: true,
  },
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  shared: []
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { t } = useI18n()

const chatRooms = ref<ChatRoomModel[]>([])
const selectedRoomId = ref<string | null>(null)
const message = ref('')
const isSubmitting = ref(false)
const isSuccess = ref(false)
const submitError = ref<string | null>(null)
const roomError = ref(false)

let autoCloseTimer: ReturnType<typeof setTimeout> | null = null
/* END DEFINE STATE */

/** START DEFINE METHOD */
async function loadRooms(): Promise<void> {
  try {
    chatRooms.value = await ChatRoomService.getMyRooms()
  } catch {
    chatRooms.value = []
  }
}

function resetState(): void {
  selectedRoomId.value = null
  message.value = ''
  isSubmitting.value = false
  isSuccess.value = false
  submitError.value = null
  roomError.value = false

  if (autoCloseTimer !== null) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
}

function handleClose(): void {
  if (isSubmitting.value) return
  emit('update:modelValue', false)
}

function handleDialogUpdate(value: boolean): void {
  if (!value && !isSubmitting.value) {
    emit('update:modelValue', false)
  }
}

async function handleSubmit(): Promise<void> {
  roomError.value = false
  submitError.value = null

  if (!selectedRoomId.value) {
    roomError.value = true
    return
  }

  isSubmitting.value = true

  try {
    await apiClient.post('memories/share-album', {
      albumId: props.album.id,
      chatRoomId: selectedRoomId.value,
      message: message.value.trim() || null,
    })

    isSuccess.value = true
    emit('shared')

    autoCloseTimer = setTimeout(() => {
      emit('update:modelValue', false)
    }, 2000)
  } catch {
    submitError.value = t('memories.errors.shareAlbum')
  } finally {
    isSubmitting.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.modelValue,
  (opened) => {
    if (opened) {
      resetState()
      loadRooms()
    }
  },
)
/* END DEFINE WATCHER */
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.share-body {
  max-height: 420px;
  overflow-y: auto;
}

.share-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  margin-bottom: 16px;
}

.share-preview__thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.share-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.share-preview__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.share-preview__album {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.share-preview__caption {
  font-size: 0.78rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.share-section-label {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-bottom: 8px;
}

.share-room-empty {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  padding: 12px 0;
  margin-bottom: 8px;
}

.share-room-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.share-room-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  border: 1.5px solid transparent;
  background: transparent;
  text-align: left;
  width: 100%;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.share-room-item:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.share-room-item--selected {
  background: rgba(var(--v-theme-primary), 0.08);
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.share-room-item__info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.share-room-item__name {
  font-size: 0.88rem;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.share-room-item__members {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.share-success {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-success), 0.08);
  margin-bottom: 8px;
}

.share-success__text {
  font-size: 0.88rem;
  font-weight: 500;
  color: rgb(var(--v-theme-success));
}
</style>
