<template>
  <div class="scrollable-root" :style="{ maxHeight }">
    <div ref="containerReference" class="scrollable-inner" @scroll="onScroll">
      <slot />
    </div>
    <transition name="scroll-fade">
      <div v-if="hasMoreBelow" class="scroll-hint" aria-hidden="true">
        <v-icon size="16" class="scroll-hint-icon">mdi-chevron-down</v-icon>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
/** START DEFINE PROPERTY AND EMITS */
withDefaults(
  defineProps<{
    maxHeight?: string
  }>(),
  {
    maxHeight: '70vh',
  },
)
/** END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const containerReference = ref<HTMLElement | null>(null)
const hasMoreBelow = ref(false)
/** END DEFINE STATE */

/** START DEFINE METHOD */
function checkScroll() {
  const element = containerReference.value
  if (!element) return
  hasMoreBelow.value = element.scrollTop + element.clientHeight < element.scrollHeight - 4
}

function onScroll() {
  checkScroll()
}
/** END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  checkScroll()

  // Re-check when content changes height (e.g. conditional sections toggle)
  const observer = new ResizeObserver(() => checkScroll())
  if (containerReference.value) observer.observe(containerReference.value)

  onUnmounted(() => observer.disconnect())
})
/** END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.scrollable-root {
  position: relative;
  display: flex;
  flex-direction: column;
}

.scrollable-inner {
  overflow-y: auto;
  flex: 1 1 auto;
}

.scroll-hint {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent, rgba(var(--v-theme-surface), 0.92) 60%);
  border-radius: 0 0 12px 12px;
}

.scroll-hint-icon {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  animation: bounce 1.4s ease-in-out infinite;
}

.scroll-fade-enter-active,
.scroll-fade-leave-active {
  transition: opacity 0.2s ease;
}

.scroll-fade-enter-from,
.scroll-fade-leave-to {
  opacity: 0;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(4px);
  }
}
</style>
