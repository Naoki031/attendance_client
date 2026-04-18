<template>
  <div class="memories-album-list">
    <!-- ── Header row ─────────────────────────────────────────── -->
    <div class="memories-header">
      <div class="memories-header__left">
        <h1 class="memories-header__title">{{ t('memories.title') }}</h1>
      </div>

      <div class="memories-header__right">
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          rounded="lg"
          @click="emit('create-album')"
        >
          {{ t('memories.createAlbum') }}
        </v-btn>
      </div>
    </div>

    <!-- ── Event type filter chips ────────────────────────────── -->
    <div class="memories-filter">
      <v-chip-group
        v-model="selectedEventType"
        selected-class="memories-filter__chip--active"
        column
      >
        <v-chip
          v-for="option in eventTypeOptions"
          :key="option.value"
          :value="option.value"
          size="small"
          variant="tonal"
          rounded="lg"
          class="memories-filter__chip"
        >
          <span class="memories-filter__chip-emoji">{{ option.emoji }}</span>
          {{ option.label }}
        </v-chip>
      </v-chip-group>
    </div>

    <!-- ── Stats bar ──────────────────────────────────────────── -->
    <v-row class="memories-stats mb-4" dense>
      <v-col v-for="stat in stats" :key="stat.key" cols="6" sm="3">
        <v-card class="memories-stats__card" rounded="lg" elevation="0">
          <v-card-text class="memories-stats__body">
            <div class="memories-stats__icon-wrap">
              <v-icon size="18" :color="stat.color">{{ stat.icon }}</v-icon>
            </div>
            <div
              class="memories-stats__value"
              :style="{ color: `rgb(var(--v-theme-${stat.color}))` }"
            >
              {{ stat.value }}
            </div>
            <div class="memories-stats__label">{{ stat.label }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Album grid ─────────────────────────────────────────── -->
    <v-row>
      <!-- Skeleton loaders while fetching -->
      <template v-if="loading">
        <v-col
          v-for="skeletonIndex in 8"
          :key="`skeleton-${skeletonIndex}`"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-skeleton-loader type="card" rounded="lg" />
        </v-col>
      </template>

      <!-- Empty state -->
      <template v-else-if="filteredAlbums.length === 0">
        <v-col cols="12">
          <div class="memories-empty">
            <div class="memories-empty__icon-wrap">
              <v-icon size="64" color="primary" class="memories-empty__icon">
                mdi-image-album
              </v-icon>
            </div>
            <p class="memories-empty__title">{{ t('memories.noAlbums') }}</p>
            <p class="memories-empty__sub">{{ t('memories.noAlbumsSub') }}</p>
            <v-btn
              color="primary"
              variant="flat"
              rounded="lg"
              prepend-icon="mdi-plus"
              @click="emit('create-album')"
            >
              {{ t('memories.createFirst') }}
            </v-btn>
          </div>
        </v-col>
      </template>

      <!-- Album cards -->
      <template v-else>
        <v-col v-for="album in filteredAlbums" :key="album.id" cols="12" sm="6" md="4" lg="3">
          <MemoriesAlbumCard :album="album" @open-album="emit('open-album', $event)" />
        </v-col>
      </template>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { Album, EventType } from '@/types/memories'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  albums: {
    type: Array as PropType<Album[]>,
    required: true,
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits<{
  'open-album': [album: Album]
  'create-album': []
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { t } = useI18n()
const selectedEventType = ref<EventType | null>(null)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
interface EventTypeOption {
  value: EventType
  label: string
  emoji: string
}

const eventTypeOptions = computed<EventTypeOption[]>(() => [
  { value: 'team_building', label: t('memories.eventType.team_building'), emoji: '🏕️' },
  { value: 'birthday', label: t('memories.eventType.birthday'), emoji: '🎂' },
  { value: 'trip', label: t('memories.eventType.trip'), emoji: '✈️' },
  { value: 'award', label: t('memories.eventType.award'), emoji: '🏆' },
  { value: 'launch', label: t('memories.eventType.launch'), emoji: '🚀' },
  { value: 'other', label: t('memories.eventType.other'), emoji: '📸' },
])

const filteredAlbums = computed(() => {
  if (!selectedEventType.value) return props.albums
  return props.albums.filter((album) => album.eventType === selectedEventType.value)
})

const totalPhotos = computed(() => props.albums.reduce((sum, album) => sum + album.photoCount, 0))

const totalMembers = computed(() => {
  const unique = new Set(props.albums.flatMap((album) => album.memberIds))
  return unique.size
})

const privateCount = computed(
  () => props.albums.filter((album) => album.privacy === 'private').length,
)

const stats = computed(() => [
  {
    key: 'albums',
    value: props.albums.length,
    label: t('memories.stats.albums'),
    icon: 'mdi-image-album',
    color: 'primary',
  },
  {
    key: 'photos',
    value: totalPhotos.value,
    label: t('memories.stats.photos'),
    icon: 'mdi-image-multiple-outline',
    color: 'secondary',
  },
  {
    key: 'members',
    value: totalMembers.value,
    label: t('memories.stats.members'),
    icon: 'mdi-account-group-outline',
    color: 'success',
  },
  {
    key: 'private',
    value: privateCount.value,
    label: t('memories.stats.private'),
    icon: 'mdi-lock-outline',
    color: 'warning',
  },
])
/* END DEFINE COMPUTED */
</script>

<style scoped>
.memories-album-list {
  padding: 0;
}

/* ── Header ───────────────────────────────────────────────── */
.memories-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.memories-header__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.2;
}

/* ── Filter chips ─────────────────────────────────────────── */
.memories-filter {
  margin-bottom: 20px;
}

.memories-filter__chip {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  transition: border-color 0.15s ease;
}

.memories-filter__chip--active {
  border-color: rgb(var(--v-theme-primary)) !important;
  font-weight: 600;
}

.memories-filter__chip-emoji {
  margin-right: 4px;
  font-size: 0.9em;
}

/* ── Stats bar ────────────────────────────────────────────── */
.memories-stats__card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background-color: rgba(var(--v-theme-on-surface), 0.03);
  text-align: center;
}

.memories-stats__body {
  padding: 14px 10px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.memories-stats__icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.memories-stats__value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.1;
}

.memories-stats__label {
  font-size: 0.72rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
}

/* ── Empty state ──────────────────────────────────────────── */
.memories-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 72px 24px;
  gap: 10px;
  text-align: center;
}

.memories-empty__icon-wrap {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.memories-empty__title {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.memories-empty__sub {
  font-size: 0.82rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin: 0 0 6px;
}
</style>
