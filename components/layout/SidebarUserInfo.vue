<template>
  <v-list>
    <v-list-item :title="userStore.user?.full_name ?? 'User'" :subtitle="subtitle">
      <template #prepend>
        <v-avatar :color="userStore.user?.avatar ? undefined : 'primary'" size="36">
          <v-img v-if="userStore.user?.avatar" :src="userStore.user.avatar" cover />
          <span v-else class="text-caption text-white font-weight-bold">{{ initials }}</span>
        </v-avatar>
      </template>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
/** START IMPORT */
import { useUserInitials } from '@/composables/useUserInitials'
/* END IMPORT */

/** START DEFINE STATE */
const userStore = useUserStore()
const { initials } = useUserInitials()
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const subtitle = computed<string>(() => {
  const user = userStore.user
  const company = user?.user_departments?.[0]?.company?.name
  const position = user?.position
  if (position && company) return `${position} · ${company}`
  return position ?? company ?? user?.email ?? ''
})
/* END DEFINE COMPUTED */
</script>
