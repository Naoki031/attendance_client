<template>
  <v-app-bar app elevation="1">
    <!-- Hamburger button: visible on mobile only -->
    <v-app-bar-nav-icon class="d-flex d-md-none" @click="drawer.toggle()"></v-app-bar-nav-icon>

    <v-app-bar-title>
      <div class="d-flex align-center gap-2">
        <v-icon icon="mdi-briefcase-clock-outline" color="primary" size="24"></v-icon>
        <span class="font-weight-bold">Attendance</span>
      </div>
    </v-app-bar-title>

    <template #append>
      <v-menu min-width="200">
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" class="mr-2">
            <v-avatar size="32" color="primary" class="mr-2">
              <span class="text-caption text-white font-weight-bold">{{ initials }}</span>
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
            title="Sign Out"
            base-color="error"
            @click="logout"
          ></v-list-item>
        </v-list>
      </v-menu>
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
/** START IMPORT */
import { useDrawer } from '@/composables/useDrawer'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const userStore = useUserStore()
const drawer = useDrawer()
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const displayName = computed(() => userStore.user?.full_name ?? userStore.user?.email ?? 'User')

const initials = computed(() => {
  const name = userStore.user?.full_name ?? ''
  const parts = name.trim().split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  if (parts.length >= 2) return (first + last).toUpperCase()
  if (parts.length === 1) return first.toUpperCase() || 'U'
  return 'U'
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const logout = () => {
  userStore.logout().then(() => {
    navigateTo('/login')
  })
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>
