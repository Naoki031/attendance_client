<template>
  <div
    v-if="typingUsers.length > 0"
    class="typing-indicator text-caption text-medium-emphasis pa-3 pl-4"
  >
    <span class="typing-dots">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </span>
    <span class="ml-1">{{ displayText }}</span>
  </div>
</template>

<script setup lang="ts">
/** START IMPORT */
import type { PropType } from 'vue'
/* END IMPORT */

/** START DEFINE PROPS */
const props = defineProps({
  typingUsers: {
    type: Array as PropType<string[]>,
    required: true,
  },
})
/* END DEFINE PROPS */

/** START DEFINE COMPUTED */
const displayText = computed(() => {
  if (props.typingUsers.length === 1) {
    return `${props.typingUsers[0]} is typing...`
  }

  if (props.typingUsers.length === 2) {
    return `${props.typingUsers[0]}, ${props.typingUsers[1]} are typing...`
  }

  return `${props.typingUsers[0]}, ${props.typingUsers[1]} and ${props.typingUsers.length - 2} others are typing...`
})
/* END DEFINE COMPUTED */
</script>

<style scoped>
.typing-indicator {
  display: flex;
  align-items: center;
  min-height: 28px;
}

.typing-dots {
  display: inline-flex;
  gap: 3px;
  align-items: center;
}

.typing-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: rgb(var(--v-theme-medium-emphasis, rgba(0, 0, 0, 0.6)));
  animation: typing-bounce 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}
</style>
