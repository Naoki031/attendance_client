<template>
  <v-menu min-width="200">
    <template #activator="{ props }">
      <v-btn v-bind="props" variant="text" class="mr-2">
        <v-avatar size="32" :color="userStore.user?.avatar ? undefined : 'primary'" class="mr-2">
          <v-img v-if="userStore.user?.avatar" :src="userStore.user.avatar" cover />
          <span v-else class="text-caption text-white font-weight-bold">{{ initials }}</span>
        </v-avatar>
        <span class="text-body-2 d-none d-sm-inline">{{ displayName }}</span>
        <v-icon icon="mdi-chevron-down" size="18" class="ml-1"></v-icon>
      </v-btn>
    </template>
    <v-list density="compact">
      <v-list-item :subtitle="userStore.user?.email ?? ''">
        <template #title>
          <span class="font-weight-medium">{{ displayName }}</span>
        </template>
      </v-list-item>
      <v-divider class="my-1"></v-divider>
      <v-list-item
        prepend-icon="mdi-logout"
        :title="$t('auth.signOut')"
        base-color="error"
        @click="handleLogout"
      ></v-list-item>
    </v-list>
  </v-menu>
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
const displayName = computed<string>(
  () => userStore.user?.full_name ?? userStore.user?.email ?? 'User',
)
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const handleLogout = () => {
  userStore.logout().then(() => {
    navigateTo('/login')
  })
}
/* END DEFINE METHOD */
</script>
