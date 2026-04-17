<template>
  <v-dialog :model-value="visible" max-width="440px" persistent>
    <v-card rounded="xl" elevation="6" class="notification-modal overflow-hidden">
      <!-- Colored top banner -->
      <div class="modal-banner" :class="`modal-banner--${current?.iconColor ?? 'primary'}`">
        <div class="d-flex align-center ga-3">
          <div class="modal-icon-wrap">
            <v-icon :icon="current?.icon" color="white" size="22" />
          </div>
          <div style="flex: 1 1 0; min-width: 0">
            <div class="text-subtitle-2 font-weight-bold text-white text-truncate">
              {{ current?.title }}
            </div>
            <div v-if="queue.length > 1" class="text-caption" style="opacity: 0.75; color: white">
              {{
                $t('notifications.queueProgress', {
                  current: currentIndex + 1,
                  total: queue.length,
                })
              }}
            </div>
          </div>
          <v-btn icon variant="text" size="x-small" color="white" @click="dismiss">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Content rows -->
      <v-card-text class="pa-5">
        <div v-if="current?.rows?.length" class="detail-grid">
          <template v-for="row in current.rows" :key="row.label">
            <div class="detail-label">{{ row.label }}</div>
            <div class="detail-value">
              <v-chip
                v-if="row.chip"
                size="x-small"
                :color="row.chip.color"
                variant="tonal"
                class="font-weight-medium"
              >
                {{ row.value }}
              </v-chip>
              <span v-else class="text-body-2 font-weight-medium">{{ row.value }}</span>
            </div>
          </template>
        </div>

        <div v-else-if="current?.body" class="text-body-2 text-medium-emphasis">
          {{ current.body }}
        </div>
      </v-card-text>

      <!-- Footer -->
      <div class="modal-footer">
        <!-- Left: dots + mark-all-read -->
        <div class="d-flex flex-column ga-1">
          <div class="d-flex ga-1 align-center">
            <div
              v-for="(_, index) in queue"
              :key="index"
              class="dot"
              :class="index === currentIndex ? 'dot--active' : ''"
            />
          </div>
          <v-btn
            v-if="queue.length > 1"
            variant="plain"
            size="x-small"
            class="mark-all-btn px-0"
            @click="dismissAll"
          >
            {{ $t('notifications.markAllRead') }}
          </v-btn>
        </div>

        <div class="d-flex ga-2 align-center">
          <v-btn
            v-for="action in current?.actions"
            :key="action.label"
            :color="action.primary ? (current?.iconColor ?? 'primary') : 'default'"
            :variant="action.primary ? 'elevated' : 'text'"
            rounded="lg"
            size="small"
            @click="handleAction(action)"
          >
            {{ action.label }}
          </v-btn>

          <v-btn
            v-if="hasMore"
            variant="tonal"
            :color="current?.iconColor ?? 'primary'"
            rounded="lg"
            size="small"
            append-icon="mdi-chevron-right"
            @click="next"
          >
            {{ $t('notifications.next') }}
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { GlobalNotificationItem, NotificationAction } from '@/types/notifications'
/* END IMPORT */

/** START DEFINE STATE */
const emit = defineEmits<{ dismissed: [id: string]; dismissedAll: [ids: string[]] }>()

const queue = ref<GlobalNotificationItem[]>([])
const currentIndex = ref(0)
/* END DEFINE STATE */

/** START COMPUTED */
const visible = computed(() => queue.value.length > 0)
const current = computed(() => queue.value[currentIndex.value] ?? null)
const hasMore = computed(() => currentIndex.value < queue.value.length - 1)
/* END COMPUTED */

/** START DEFINE METHOD */
function push(item: Omit<GlobalNotificationItem, 'id'>): string {
  const id = Math.random().toString(36).slice(2, 9)
  queue.value.push({ ...item, id })
  return id
}

function next(): void {
  if (hasMore.value) currentIndex.value++
}

function dismiss(): void {
  const dismissedId = current.value?.id
  if (dismissedId) emit('dismissed', dismissedId)

  queue.value.splice(currentIndex.value, 1)
  if (currentIndex.value >= queue.value.length) {
    currentIndex.value = Math.max(0, queue.value.length - 1)
  }
}

function handleAction(action: NotificationAction): void {
  action.handler()
  dismiss()
}

function dismissAll(): void {
  const ids = queue.value.map((item) => item.id)
  emit('dismissedAll', ids)
  queue.value = []
  currentIndex.value = 0
}
/* END DEFINE METHOD */

defineExpose({ push })
</script>

<style scoped>
.notification-modal {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

/* Banner */
.modal-banner {
  padding: 16px 16px 16px 20px;
}

.modal-banner--warning {
  background: rgb(var(--v-theme-warning));
}

.modal-banner--error {
  background: rgb(var(--v-theme-error));
}

.modal-banner--primary {
  background: rgb(var(--v-theme-primary));
}

.modal-banner--success {
  background: rgb(var(--v-theme-success));
}

.modal-icon-wrap {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Detail grid */
.detail-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px 16px;
  align-items: center;
}

.detail-label {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface));
  opacity: var(--v-medium-emphasis-opacity);
  white-space: nowrap;
}

.detail-value {
  font-size: 13px;
}

/* Footer */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 16px;
}

/* Mark all read */
.mark-all-btn {
  font-size: 11px;
  height: auto;
  min-height: unset;
  opacity: var(--v-medium-emphasis-opacity);
  letter-spacing: 0;
  text-transform: none;
  justify-content: flex-start;
}

/* Dots */
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(var(--v-theme-on-surface), 0.2);
  transition: all 0.2s ease;
}

.dot--active {
  width: 18px;
  border-radius: 3px;
  background: rgb(var(--v-theme-primary));
}
</style>
