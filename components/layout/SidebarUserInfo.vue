<template>
  <v-list>
    <v-list-item :title="userStore.user?.full_name ?? 'User'">
      <template #prepend>
        <v-avatar :color="userStore.user?.avatar ? undefined : 'primary'" size="36">
          <v-img v-if="userStore.user?.avatar" :src="userStore.user.avatar" cover />
          <span v-else class="text-caption text-white font-weight-bold">{{ initials }}</span>
        </v-avatar>
      </template>
      <template #subtitle>
        <div class="d-flex flex-wrap ga-1 mt-1">
          <v-chip
            v-if="position"
            size="x-small"
            color="action"
            variant="tonal"
            rounded="lg"
            prepend-icon="mdi-briefcase-outline"
            >{{ position }}</v-chip
          >
          <v-chip
            v-if="company"
            size="x-small"
            color="accent"
            variant="tonal"
            rounded="lg"
            prepend-icon="mdi-office-building-outline"
            >{{ company }}</v-chip
          >
          <span v-if="!position && !company" class="text-caption text-medium-emphasis">{{
            userStore.user?.email ?? ''
          }}</span>
        </div>
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
const position = computed<string>(() => userStore.user?.position ?? '')
const company = computed<string>(() => userStore.user?.user_departments?.[0]?.company?.name ?? '')
/* END DEFINE COMPUTED */
</script>
