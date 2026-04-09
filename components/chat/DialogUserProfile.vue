<template>
  <v-dialog v-model="dialogModel" max-width="360" scrollable>
    <v-card v-if="user" rounded="xl">
      <!-- Avatar + name -->
      <div class="d-flex flex-column align-center pt-6 pb-4 px-6">
        <v-avatar size="96" :color="user.avatar ? undefined : 'primary'" class="mb-3">
          <v-img v-if="user.avatar" :src="user.avatar" cover />
          <span v-else class="text-h4 font-weight-bold profile-initials">
            {{ initials }}
          </span>
        </v-avatar>

        <div class="text-h6 font-weight-bold text-center">{{ user.fullName }}</div>
        <div v-if="user.email" class="text-body-2 text-medium-emphasis mt-1">{{ user.email }}</div>

        <div class="d-flex align-center ga-1 mt-2">
          <span class="status-dot-lg" :class="user.isOnline ? 'status-online' : 'status-offline'" />
          <span
            class="text-body-2"
            :class="user.isOnline ? 'text-success' : 'text-medium-emphasis'"
          >
            {{ user.isOnline ? $t('chat.online') : $t('chat.offline') }}
          </span>
        </div>
      </div>

      <v-divider />

      <!-- Loading skeleton -->
      <div v-if="loading" class="px-4 py-3 d-flex flex-column ga-3">
        <v-skeleton-loader type="list-item-two-line" />
        <v-skeleton-loader type="list-item-two-line" />
        <v-skeleton-loader type="list-item-two-line" />
      </div>

      <!-- Details list -->
      <v-list v-else density="compact" class="py-2">
        <v-list-item v-if="user.role" class="py-2">
          <template #prepend>
            <v-icon size="18" class="mr-3">mdi-shield-account-outline</v-icon>
          </template>
          <div class="d-flex flex-column ga-1">
            <span class="text-caption text-medium-emphasis">{{ $t('chat.role') }}</span>
            <v-chip
              size="x-small"
              :color="user.role === 'admin' ? 'warning' : 'primary'"
              variant="tonal"
              class="align-self-start"
            >
              {{ user.role === 'admin' ? $t('chat.roleAdmin') : $t('chat.roleMember') }}
            </v-chip>
          </div>
        </v-list-item>

        <v-list-item v-if="fullProfile?.position" class="py-2">
          <template #prepend>
            <v-icon size="18" class="mr-3">mdi-briefcase-outline</v-icon>
          </template>
          <div class="d-flex flex-column ga-1">
            <span class="text-caption text-medium-emphasis">{{ $t('chat.position') }}</span>
            <span class="text-body-2">{{ fullProfile.position }}</span>
          </div>
        </v-list-item>

        <v-list-item v-if="companyName" class="py-2">
          <template #prepend>
            <v-icon size="18" class="mr-3">mdi-office-building-outline</v-icon>
          </template>
          <div class="d-flex flex-column ga-1">
            <span class="text-caption text-medium-emphasis">{{ $t('chat.company') }}</span>
            <span class="text-body-2">{{ companyName }}</span>
          </div>
        </v-list-item>

        <v-list-item v-if="fullProfile?.date_of_birth" class="py-2">
          <template #prepend>
            <v-icon size="18" class="mr-3">mdi-cake-variant-outline</v-icon>
          </template>
          <div class="d-flex flex-column ga-1">
            <span class="text-caption text-medium-emphasis">{{ $t('chat.dateOfBirth') }}</span>
            <span class="text-body-2">{{ formatDate(fullProfile.date_of_birth) }}</span>
          </div>
        </v-list-item>

        <v-list-item v-if="user.joinedAt" class="py-2">
          <template #prepend>
            <v-icon size="18" class="mr-3">mdi-calendar-check-outline</v-icon>
          </template>
          <div class="d-flex flex-column ga-1">
            <span class="text-caption text-medium-emphasis">{{ $t('chat.joinedRoom') }}</span>
            <span class="text-body-2">{{ formatDate(user.joinedAt) }}</span>
          </div>
        </v-list-item>

        <v-list-item v-if="!user.isOnline && user.lastSeenAt" class="py-2">
          <template #prepend>
            <v-icon size="18" class="mr-3">mdi-clock-outline</v-icon>
          </template>
          <div class="d-flex flex-column ga-1">
            <span class="text-caption text-medium-emphasis">{{ $t('chat.lastSeenLabel') }}</span>
            <span class="text-body-2 text-medium-emphasis">{{
              formatLastSeen(user.lastSeenAt)
            }}</span>
          </div>
        </v-list-item>
      </v-list>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="dialogModel = false">{{ $t('common.close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
/** START IMPORT */
import type { PropType } from 'vue'
import type { UserProfileData } from '@/types/chat'
import type { UserModel } from '@/interfaces/models/UserModel'
import UserService from '@/services/UserService'
/* END IMPORT */

/** START DEFINE PROPS */
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  user: {
    type: Object as PropType<UserProfileData | null>,
    default: null,
  },
})
/* END DEFINE PROPS */

/** START DEFINE EMITS */
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()
/* END DEFINE EMITS */

/** START DEFINE STATE */
const loading = ref(false)
const fullProfile = ref<UserModel | null>(null)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const initials = computed(() => {
  if (!props.user) return ''
  const parts = props.user.fullName.trim().split(' ')
  if (parts.length > 1 && parts[0] && parts.at(-1)) {
    return `${parts[0][0]}${parts.at(-1)![0]}`.toUpperCase()
  }
  return parts[0]?.[0]?.toUpperCase() ?? ''
})

const companyName = computed(() => {
  return fullProfile.value?.user_departments?.[0]?.company?.name ?? null
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const { t } = useI18n()

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

function formatLastSeen(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return String(t('chat.lastSeenNow'))
  if (diffMinutes < 60) return String(t('chat.lastSeenMinutes', { minutes: diffMinutes }))
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return String(t('chat.lastSeenHours', { hours: diffHours }))
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return String(t('chat.lastSeenDays', { days: diffDays }))

  return date.toLocaleDateString()
}

async function fetchFullProfile() {
  if (!props.user) return
  loading.value = true
  try {
    fullProfile.value = await UserService.getOne(props.user.id)
  } finally {
    loading.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.modelValue,
  (open) => {
    if (open && props.user) {
      fullProfile.value = null
      fetchFullProfile()
    }
  },
)
/* END DEFINE WATCHER */
</script>

<style scoped>
.profile-initials {
  color: rgb(var(--v-theme-on-primary));
}

.status-dot-lg {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-online {
  background-color: rgb(var(--v-theme-success));
}

.status-offline {
  background-color: rgba(var(--v-theme-on-surface), 0.3);
}
</style>
