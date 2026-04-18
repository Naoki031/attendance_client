<template>
  <div
    class="album-card"
    role="button"
    tabindex="0"
    @click="emit('open-album', album)"
    @keydown.enter.prevent="emit('open-album', album)"
  >
    <!-- Cover -->
    <div class="album-card__cover">
      <img
        v-if="album.coverPhotoUrl"
        :src="album.coverPhotoUrl"
        :alt="album.title"
        class="album-card__cover-img"
      />
      <div v-else class="album-card__cover-placeholder" :style="{ background: coverGradient }">
        <span class="album-card__cover-emoji">{{ eventEmoji }}</span>
      </div>

      <!-- Dark gradient overlay for text readability -->
      <div class="album-card__overlay" />

      <!-- Top badges -->
      <div class="album-card__top-row">
        <span class="album-card__event-badge">{{ eventEmoji }} {{ eventTypeLabel }}</span>
        <v-icon v-if="album.privacy === 'private'" size="14" color="white" class="album-card__lock">
          mdi-lock-outline
        </v-icon>
      </div>

      <!-- Bottom info over image -->
      <div class="album-card__bottom-row">
        <div class="album-card__title">{{ album.title }}</div>
        <div class="album-card__meta">
          <span>{{ formattedDate }}</span>
          <span class="album-card__dot">·</span>
          <span>{{ album.photoCount }} {{ t('memories.photos') }}</span>
        </div>
      </div>
    </div>

    <!-- Footer: member avatars -->
    <div class="album-card__footer">
      <div class="avatar-stack">
        <v-tooltip
          v-for="(member, memberIndex) in visibleMembers"
          :key="member.id"
          :text="member.name"
          location="top"
        >
          <template #activator="{ props: tooltipProps }">
            <v-avatar
              v-bind="tooltipProps"
              class="avatar-stack__item"
              :style="{
                zIndex: visibleMembers.length - memberIndex,
                marginLeft: memberIndex === 0 ? '0' : '-6px',
              }"
              size="22"
              color="primary"
            >
              <v-img v-if="member.avatar" :src="member.avatar" cover />
              <span v-else class="avatar-stack__initials">{{ getInitials(member.name) }}</span>
            </v-avatar>
          </template>
        </v-tooltip>
        <v-avatar
          v-if="extraMemberCount > 0"
          class="avatar-stack__item"
          :style="{ zIndex: 0, marginLeft: '-6px' }"
          size="22"
          color="secondary"
        >
          <span class="avatar-stack__initials">+{{ extraMemberCount }}</span>
        </v-avatar>
      </div>

      <span class="album-card__photo-count">
        <v-icon size="12" class="mr-1">mdi-image-multiple-outline</v-icon>
        {{ album.photoCount }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { Album, EventType } from '@/types/memories'
import { useMoment } from '@/composables/useMoment'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  album: {
    type: Object as PropType<Album>,
    required: true,
  },
})

const emit = defineEmits<{
  'open-album': [album: Album]
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { t } = useI18n()
const { moment } = useMoment()
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const MAX_VISIBLE_MEMBERS = 4

const COVER_GRADIENTS: Record<EventType, string> = {
  team_building: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  birthday: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  trip: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  award: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  launch: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  other: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
}

const EVENT_EMOJIS: Record<EventType, string> = {
  team_building: '🏕️',
  birthday: '🎂',
  trip: '✈️',
  award: '🏆',
  launch: '🚀',
  other: '📸',
}

const coverGradient = computed(() => COVER_GRADIENTS[props.album.eventType])
const eventEmoji = computed(() => EVENT_EMOJIS[props.album.eventType])
const eventTypeLabel = computed(() => t(`memories.eventType.${props.album.eventType}`))

const visibleMembers = computed(() => (props.album.members ?? []).slice(0, MAX_VISIBLE_MEMBERS))
const extraMemberCount = computed(() =>
  Math.max(0, props.album.memberIds.length - MAX_VISIBLE_MEMBERS),
)

const formattedDate = computed(() =>
  props.album.date ? moment(props.album.date).format(t('memories.dateFormat')) : '',
)
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
/* END DEFINE METHOD */
</script>

<style scoped>
.album-card {
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  outline: none;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.album-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.album-card:focus-visible {
  box-shadow: 0 0 0 3px rgb(var(--v-theme-primary));
}

/* ── Cover ──────────────────────────────────────────────── */
.album-card__cover {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.album-card__cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.album-card:hover .album-card__cover-img {
  transform: scale(1.05);
}

.album-card__cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.album-card__cover-emoji {
  font-size: 56px;
  line-height: 1;
  user-select: none;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
}

.album-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.05) 0%,
    rgba(0, 0, 0, 0) 40%,
    rgba(0, 0, 0, 0.55) 100%
  );
}

/* ── Top row ────────────────────────────────────────────── */
.album-card__top-row {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.album-card__event-badge {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: white;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  padding: 3px 8px;
  border-radius: 20px;
}

.album-card__lock {
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  border-radius: 50%;
  padding: 4px;
}

/* ── Bottom row ─────────────────────────────────────────── */
.album-card__bottom-row {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 12px;
}

.album-card__title {
  font-size: 0.92rem;
  font-weight: 700;
  color: white;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
}

.album-card__meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.82);
  margin-top: 2px;
}

.album-card__dot {
  opacity: 0.6;
}

/* ── Footer ─────────────────────────────────────────────── */
.album-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
}

.album-card__photo-count {
  display: flex;
  align-items: center;
  font-size: 0.72rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-weight: 500;
}

/* ── Avatar stack ───────────────────────────────────────── */
.avatar-stack {
  display: flex;
  align-items: center;
}

.avatar-stack__item {
  border: 2px solid rgb(var(--v-theme-surface));
}

.avatar-stack__initials {
  font-size: 0.5rem;
  font-weight: 700;
  color: white;
  line-height: 1;
}
</style>
