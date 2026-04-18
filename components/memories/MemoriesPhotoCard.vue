<template>
  <div
    class="photo-card"
    :class="{ 'photo-card--hovered': isHovered }"
    role="button"
    tabindex="0"
    :aria-label="photo.caption || t('memories.photoAlt')"
    @click="emit('open-photo', photo)"
    @keydown.enter.prevent="emit('open-photo', photo)"
    @keydown.space.prevent="emit('open-photo', photo)"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @focus="isHovered = true"
    @blur="isHovered = false"
  >
    <!-- Thumbnail -->
    <div class="photo-card__inner">
      <img
        v-if="photo.thumbnailUrl"
        :src="photo.thumbnailUrl"
        :alt="photo.caption || t('memories.photoAlt')"
        class="photo-card__img"
        loading="lazy"
      />
      <div v-else class="photo-card__placeholder">
        <span class="photo-card__placeholder-icon">🖼️</span>
      </div>

      <!-- Hover overlay -->
      <div class="photo-card__overlay">
        <div class="photo-card__overlay-pills">
          <span v-for="pill in reactionPills" :key="pill.type" class="photo-card__pill">
            {{ pill.emoji }} {{ pill.count }}
          </span>

          <span v-if="commentCount > 0" class="photo-card__pill"> 💬 {{ commentCount }} </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { Photo, Comment, ReactionType } from '@/types/memories'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  photo: {
    type: Object as PropType<Photo>,
    required: true,
  },
  reactions: {
    type: Object as PropType<Partial<Record<ReactionType, number>>>,
    required: false,
    default: () => ({}),
  },
  comments: {
    type: Array as PropType<Comment[]>,
    required: false,
    default: () => [],
  },
})

const emit = defineEmits<{
  'open-photo': [photo: Photo]
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { t } = useI18n()
const isHovered = ref(false)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const REACTION_EMOJIS: Record<ReactionType, string> = {
  heart: '❤️',
  clap: '👏',
  wow: '😮',
  laugh: '😄',
}

interface ReactionPill {
  type: ReactionType
  emoji: string
  count: number
}

const reactionPills = computed<ReactionPill[]>(() =>
  (Object.entries(props.reactions) as [ReactionType, number][])
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({ type, emoji: REACTION_EMOJIS[type], count })),
)

const commentCount = computed(() => props.comments.length)
/* END DEFINE COMPUTED */
</script>

<style scoped>
.photo-card {
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  outline: none;
}

.photo-card:focus-visible {
  box-shadow: 0 0 0 3px rgb(var(--v-theme-primary));
}

.photo-card__inner {
  width: 100%;
  height: 100%;
  position: relative;
}

.photo-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.22s ease;
}

.photo-card--hovered .photo-card__img {
  transform: scale(1.04);
}

/* ── Placeholder ────────────────────────────────────────── */
.photo-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-section-bg);
}

.photo-card__placeholder-icon {
  font-size: 2rem;
  opacity: 0.5;
  user-select: none;
}

/* ── Hover overlay ──────────────────────────────────────── */
.photo-card__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  display: flex;
  align-items: flex-end;
  padding: 8px;
  transition: background 0.18s ease;
  pointer-events: none;
}

.photo-card--hovered .photo-card__overlay {
  background: rgba(0, 0, 0, 0.45);
}

.photo-card__overlay-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.photo-card--hovered .photo-card__overlay-pills {
  opacity: 1;
  transform: translateY(0);
}

.photo-card__pill {
  font-size: 0.7rem;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(4px);
  border-radius: 20px;
  padding: 2px 7px;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.6;
  border: 1px solid rgba(255, 255, 255, 0.25);
}
</style>
