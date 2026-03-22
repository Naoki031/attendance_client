<template>
  <v-container class="py-8" max-width="960">
    <!-- Welcome banner -->
    <v-card rounded="xl" color="primary" class="mb-6 pa-6" elevation="0">
      <div class="d-flex align-center justify-space-between flex-wrap ga-4">
        <div>
          <div class="text-h5 font-weight-bold text-white">
            Welcome back, {{ userStore.user?.full_name ?? 'User' }}
          </div>
          <div class="text-body-2 mt-1" style="color: rgba(255, 255, 255, 0.75)">
            {{ userStore.user?.position ?? userStore.user?.email ?? '' }}
          </div>
        </div>
        <v-avatar color="white" size="56" rounded="lg">
          <span class="text-h6 font-weight-bold" style="color: #bf6e3a">{{ initials }}</span>
        </v-avatar>
      </div>
    </v-card>

    <!-- Quick links -->
    <v-row>
      <v-col cols="12" sm="6" md="4">
        <v-card rounded="xl" elevation="0" border class="pa-4" :to="{ name: 'profile.index' }">
          <div class="d-flex align-center ga-4">
            <v-avatar color="primary" size="44" rounded="lg" variant="tonal">
              <v-icon>mdi-account-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-semibold">My Profile</div>
              <div class="text-caption text-medium-emphasis">View personal info</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col v-if="userStore.isAdmin" cols="12" sm="6" md="4">
        <v-card rounded="xl" elevation="0" border class="pa-4" :to="{ name: 'admin.users.index' }">
          <div class="d-flex align-center ga-4">
            <v-avatar color="secondary" size="44" rounded="lg" variant="tonal">
              <v-icon>mdi-account-multiple-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-semibold">User Management</div>
              <div class="text-caption text-medium-emphasis">Manage staff accounts</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <v-col v-if="userStore.isAdmin" cols="12" sm="6" md="4">
        <v-card
          rounded="xl"
          elevation="0"
          border
          class="pa-4"
          :to="{ name: 'admin.departments.index' }"
        >
          <div class="d-flex align-center ga-4">
            <v-avatar color="success" size="44" rounded="lg" variant="tonal">
              <v-icon>mdi-office-building-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-semibold">Departments</div>
              <div class="text-caption text-medium-emphasis">View all departments</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  layout: 'default',
  name: 'home',
})
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const userStore = useUserStore()
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
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
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>
