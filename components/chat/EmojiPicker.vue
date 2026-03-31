<template>
  <v-card rounded="lg" width="340" class="emoji-picker">
    <!-- Category tabs -->
    <div class="emoji-tabs d-flex border-b">
      <v-btn
        v-for="category in visibleCategories"
        :key="category.name"
        size="small"
        variant="text"
        density="default"
        :color="activeCategory === category.name ? 'primary' : 'default'"
        class="flex-1-1 tab-btn"
        @click="activeCategory = category.name"
      >
        <img
          v-if="category.tabImage"
          :src="category.tabImage"
          class="tab-image"
          :class="{ 'tab-image--active': activeCategory === category.name }"
          alt=""
        />
        <v-icon v-else :size="18">{{ category.icon }}</v-icon>
      </v-btn>
    </div>

    <!-- Emoji grid -->
    <div class="emoji-grid pa-2 overflow-y-auto" style="max-height: 220px">
      <template v-for="category in visibleCategories" :key="category.name">
        <div
          v-if="activeCategory === category.name"
          class="d-flex flex-wrap"
          :class="category.isCustomPack ? 'ga-1' : 'ga-0'"
        >
          <!-- Recent tab — mixed custom + unicode emojis -->
          <template v-if="category.isMixed">
            <template v-for="emoji in category.emojis" :key="emoji">
              <!-- Custom emoji in recent -->
              <button
                v-if="isCustomEmoji(emoji)"
                class="blob-button"
                :title="getCustomEmojiLabel(emoji)"
                @click="selectEmoji(emoji)"
              >
                <img
                  :src="getCustomEmojiUrl(emoji) ?? ''"
                  :alt="getCustomEmojiLabel(emoji)"
                  class="blob-img"
                  loading="lazy"
                />
                <span class="blob-label">{{ getCustomEmojiLabel(emoji) }}</span>
              </button>
              <!-- Unicode emoji in recent -->
              <button v-else class="emoji-button" :title="emoji" @click="selectEmoji(emoji)">
                {{ emoji }}
              </button>
            </template>
          </template>

          <!-- Custom pack emoji tab (blob / meow / froge / etc.) -->
          <template v-else-if="category.isCustomPack">
            <button
              v-for="item in category.blobs"
              :key="item.key"
              class="blob-button"
              :title="item.label"
              @click="selectEmoji(item.key)"
            >
              <img :src="item.url" :alt="item.label" class="blob-img" loading="lazy" />
              <span class="blob-label">{{ item.label }}</span>
            </button>
          </template>

          <!-- Standard unicode emoji tabs -->
          <template v-else>
            <button
              v-for="emoji in category.emojis"
              :key="emoji"
              class="emoji-button"
              :title="emoji"
              @click="selectEmoji(emoji)"
            >
              {{ emoji }}
            </button>
          </template>
        </div>
      </template>
    </div>
  </v-card>
</template>

<script setup lang="ts">
/** START IMPORT */
import {
  BLOB_EMOJI_MAP,
  MEOW_EMOJI_MAP,
  FROGE_EMOJI_MAP,
  PARROT_EMOJI_MAP,
  SHIBLOB_EMOJI_MAP,
  YOYO_EMOJI_MAP,
  getCustomEmojiUrl,
  getCustomEmojiLabel,
  isCustomEmoji,
} from '@/utils/customEmoji'
import { useUserStore } from '@/stores/user'
import { useRecentEmojis } from '@/composables/useRecentEmojis'
/* END IMPORT */

interface PackItem {
  key: string
  url: string
  label: string
}

interface EmojiCategory {
  name: string
  icon: string
  tabImage?: string
  isCustomPack?: boolean
  isMixed?: boolean
  blobs?: PackItem[]
  emojis?: string[]
}

/** START DEFINE EMITS */
const emit = defineEmits<{
  select: [emoji: string]
}>()
/* END DEFINE EMITS */

/** START DEFINE STATE */
const userStore = useUserStore()
const { recentEmojis, trackEmoji } = useRecentEmojis(userStore.user?.id)
const activeCategory = ref<string>(recentEmojis.value.length > 0 ? 'recent' : 'blob')
/* END DEFINE STATE */

function buildPackItems(emojiMap: Record<string, { file: string; label: string }>): PackItem[] {
  return Object.entries(emojiMap).map(([key, value]) => ({
    key,
    url: getCustomEmojiUrl(key) as string,
    label: value.label,
  }))
}

const BLOB_ITEMS = buildPackItems(BLOB_EMOJI_MAP)
const MEOW_ITEMS = buildPackItems(MEOW_EMOJI_MAP)
const FROGE_ITEMS = buildPackItems(FROGE_EMOJI_MAP)
const PARROT_ITEMS = buildPackItems(PARROT_EMOJI_MAP)
const SHIBLOB_ITEMS = buildPackItems(SHIBLOB_EMOJI_MAP)
const YOYO_ITEMS = buildPackItems(YOYO_EMOJI_MAP)

const BLOB_TAB_URL = getCustomEmojiUrl(':blob-happy:') as string
const MEOW_TAB_URL = getCustomEmojiUrl(':meow-party:') as string
const FROGE_TAB_URL = getCustomEmojiUrl(':froge-happy:') as string
const PARROT_TAB_URL = getCustomEmojiUrl(':parrot:') as string
const SHIBLOB_TAB_URL = getCustomEmojiUrl(':shiblob-happy:') as string
const YOYO_TAB_URL = getCustomEmojiUrl(':yoyo-excited:') as string

const STATIC_CATEGORIES: EmojiCategory[] = [
  {
    name: 'blob',
    icon: 'mdi-star-four-points',
    tabImage: BLOB_TAB_URL,
    isCustomPack: true,
    blobs: BLOB_ITEMS,
  },
  {
    name: 'meow',
    icon: 'mdi-cat',
    tabImage: MEOW_TAB_URL,
    isCustomPack: true,
    blobs: MEOW_ITEMS,
  },
  {
    name: 'froge',
    icon: 'mdi-frog',
    tabImage: FROGE_TAB_URL,
    isCustomPack: true,
    blobs: FROGE_ITEMS,
  },
  {
    name: 'parrot',
    icon: 'mdi-bird',
    tabImage: PARROT_TAB_URL,
    isCustomPack: true,
    blobs: PARROT_ITEMS,
  },
  {
    name: 'shiblob',
    icon: 'mdi-dog',
    tabImage: SHIBLOB_TAB_URL,
    isCustomPack: true,
    blobs: SHIBLOB_ITEMS,
  },
  {
    name: 'yoyo',
    icon: 'mdi-emoticon-excited-outline',
    tabImage: YOYO_TAB_URL,
    isCustomPack: true,
    blobs: YOYO_ITEMS,
  },
  {
    name: 'smileys',
    icon: 'mdi-emoticon-outline',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '🤣',
      '😂',
      '🙂',
      '😊',
      '😇',
      '🥰',
      '😍',
      '🤩',
      '😘',
      '😋',
      '😜',
      '🤪',
      '😎',
      '🤓',
      '😏',
      '😒',
      '🙄',
      '😬',
      '🤔',
      '🤫',
      '🤗',
      '🥺',
      '😭',
      '😤',
    ],
  },
  {
    name: 'gestures',
    icon: 'mdi-hand-wave',
    emojis: [
      '👍',
      '👎',
      '👏',
      '🙌',
      '🤝',
      '✌️',
      '🤞',
      '💪',
      '🙏',
      '👋',
      '🤟',
      '✋',
      '🤙',
      '👊',
      '✊',
      '🤘',
      '👌',
      '🤌',
      '👋',
      '🫡',
    ],
  },
  {
    name: 'hearts',
    icon: 'mdi-heart',
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '💯',
      '✨',
      '💔',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '💟',
    ],
  },
  {
    name: 'objects',
    icon: 'mdi-briefcase-outline',
    emojis: [
      '🎉',
      '🎊',
      '🔥',
      '⭐',
      '💡',
      '📌',
      '🎯',
      '🏆',
      '🚀',
      '✅',
      '❌',
      '⚠️',
      '🔔',
      '📎',
      '🔨',
      '🛠️',
      '💻',
      '📱',
      '📧',
      '📝',
    ],
  },
  {
    name: 'nature',
    icon: 'mdi-leaf',
    emojis: [
      '☀️',
      '🌙',
      '⭐',
      '🌈',
      '🌸',
      '🌺',
      '🍀',
      '🌊',
      '🔥',
      '💧',
      '❄️',
      '🍂',
      '🌻',
      '🌴',
      '🌵',
      '🦋',
      '🐝',
      '🐱',
      '🐶',
      '🦊',
    ],
  },
]

/** START DEFINE COMPUTED */
const visibleCategories = computed<EmojiCategory[]>(() => {
  if (recentEmojis.value.length === 0) return STATIC_CATEGORIES

  const recentCategory: EmojiCategory = {
    name: 'recent',
    icon: 'mdi-clock-outline',
    isMixed: true,
    emojis: recentEmojis.value,
  }

  return [recentCategory, ...STATIC_CATEGORIES]
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
function selectEmoji(emoji: string) {
  trackEmoji(emoji)
  emit('select', emoji)
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => recentEmojis.value.length,
  (newLength, oldLength) => {
    // Auto-select 'recent' tab when the first emoji is tracked
    if (oldLength === 0 && newLength > 0) {
      activeCategory.value = 'recent'
    }
  },
)
/* END DEFINE WATCHER */
</script>

<style scoped>
.emoji-tabs {
  background-color: rgba(var(--v-theme-on-surface), 0.02);
}

.emoji-tabs .v-btn {
  border-radius: 0;
  min-width: 0;
}

.tab-btn {
  padding: 0 4px;
  min-height: 44px;
}

/* Blob image as tab icon */
.tab-image {
  width: 20px;
  height: 20px;
  object-fit: contain;
  filter: grayscale(40%) opacity(0.7);
  transition:
    filter 0.2s,
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tab-image--active {
  filter: grayscale(0%) opacity(1);
  transform: scale(1.3);
}

/* Standard emoji buttons */
.emoji-button {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 6px;
  transition:
    background-color 0.15s,
    transform 0.15s;
  flex-shrink: 0;
}

.emoji-button:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
  transform: scale(1.2);
}

/* Blob emoji buttons */
.blob-button {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 60px;
  height: 64px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  cursor: pointer;
  padding: 6px 4px 4px;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
}

.blob-button:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
  border-color: rgba(var(--v-theme-primary), 0.3);
  transform: scale(1.12) translateY(-2px);
}

.blob-button:active {
  transform: scale(0.94);
  transition-duration: 0.08s;
}

.blob-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  image-rendering: auto;
}

.blob-label {
  font-size: 9px;
  color: rgba(var(--v-theme-on-surface), 0.5);
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 56px;
  font-weight: 500;
}

.emoji-grid {
  scrollbar-width: thin;
}
</style>
