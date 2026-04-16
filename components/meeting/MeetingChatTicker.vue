<template>
  <Transition name="ticker-fade">
    <div v-if="currentItem" :key="currentItem.id" class="chat-ticker">
      <div
        class="chat-ticker__track"
        :style="{ animationDuration: animationDuration }"
        @animationend="onAnimationEnd"
      >
        <span class="chat-ticker__icon">💬</span>
        <span class="chat-ticker__sender">{{ currentItem.senderName }}:</span>
        <span class="chat-ticker__content">&nbsp;{{ strippedContent }}</span>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { TickerItem } from '@/types/meeting/ChatTicker'
/** END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps<{
  items: TickerItem[]
}>()

const emit = defineEmits<{
  'item-done': [id: number]
}>()
/** END DEFINE PROPERTY AND EMITS */

/** START DEFINE COMPUTED */
const currentItem = computed(() => props.items[0] ?? null)

const strippedContent = computed(() => {
  if (!currentItem.value) return ''
  return stripMarkdown(currentItem.value.content)
})

const animationDuration = computed(() => {
  // Calibrated so text scrolls at a comfortable reading speed (~250px/s)
  // Short messages: 8s minimum, long messages: 18s maximum
  const charCount = strippedContent.value.length + (currentItem.value?.senderName.length ?? 0)
  const seconds = Math.max(8, Math.min(18, charCount * 0.1))
  return `${seconds.toFixed(1)}s`
})
/** END DEFINE COMPUTED */

/** START DEFINE METHOD */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/@\[([^\]]+)\]\(\d+\)/g, '@$1')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .trim()
}

function onAnimationEnd() {
  if (currentItem.value) {
    emit('item-done', currentItem.value.id)
  }
}
/** END DEFINE METHOD */
</script>

<style scoped>
.chat-ticker {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 36px;
  background: rgba(0, 0, 0, 0.6);
  overflow: hidden;
  display: flex;
  align-items: center;
  pointer-events: none;
  z-index: 5;
}

.chat-ticker__track {
  display: flex;
  align-items: center;
  white-space: nowrap;
  padding: 0 8px;
  animation: ticker-scroll linear forwards;
}

.chat-ticker__icon {
  font-size: 14px;
  margin-right: 6px;
  flex-shrink: 0;
}

.chat-ticker__sender {
  font-size: 13px;
  font-weight: 600;
  color: rgba(144, 202, 249, 0.9);
  flex-shrink: 0;
}

.chat-ticker__content {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
}

/* Ticker bar fade in/out when items queue changes */
.ticker-fade-enter-active,
.ticker-fade-leave-active {
  transition: opacity 0.2s ease;
}
.ticker-fade-enter-from,
.ticker-fade-leave-to {
  opacity: 0;
}

@keyframes ticker-scroll {
  0% {
    transform: translateX(100vw);
  }
  100% {
    transform: translateX(-100%);
  }
}
</style>
