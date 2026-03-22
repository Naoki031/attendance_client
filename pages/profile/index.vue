<template>
  <v-container class="py-8" max-width="860">
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <div class="text-h5 font-weight-bold">My Profile</div>
        <div class="text-body-2 text-medium-emphasis mt-1">View your personal information</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-pencil-outline" :to="{ name: 'profile.edit' }">
        Edit Profile
      </v-btn>
    </div>

    <!-- Avatar & identity card -->
    <v-card rounded="lg" class="mb-4">
      <v-card-text class="pa-6">
        <div class="d-flex align-center ga-8">
          <v-avatar color="primary" size="88">
            <span class="text-h4 text-white font-weight-bold">{{ initials }}</span>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-bold">{{ user?.full_name }}</div>
            <div class="text-body-1 text-medium-emphasis">{{ user?.position ?? '—' }}</div>
            <div class="text-body-2 text-medium-emphasis mt-1">
              <v-icon size="14" class="mr-1">mdi-email-outline</v-icon>{{ user?.email }}
            </div>
            <div class="text-caption text-medium-emphasis">
              <v-icon size="12" class="mr-1">mdi-account-circle-outline</v-icon>@{{
                user?.username
              }}
            </div>
            <div class="d-flex flex-wrap ga-1 mt-2">
              <v-chip
                v-for="role in user?.roles"
                :key="role"
                size="x-small"
                color="primary"
                variant="tonal"
              >
                {{ role }}
              </v-chip>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-row>
      <!-- Personal information -->
      <v-col cols="12" md="6">
        <v-card rounded="lg" height="100%">
          <v-card-title class="pa-5 pb-3 text-body-1 font-weight-bold">
            <v-icon size="18" color="primary" class="mr-2">mdi-account-outline</v-icon>Personal
            Information
          </v-card-title>
          <v-divider></v-divider>
          <v-list density="compact" class="pa-2">
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-card-account-details-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>First Name</v-list-item-subtitle>
              <v-list-item-title>{{ user?.first_name ?? '—' }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-card-account-details-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>Last Name</v-list-item-subtitle>
              <v-list-item-title>{{ user?.last_name ?? '—' }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3">mdi-phone-outline</v-icon>
              </template>
              <v-list-item-subtitle>Phone Number</v-list-item-subtitle>
              <v-list-item-title>{{ user?.phone_number ?? '—' }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-map-marker-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>Address</v-list-item-subtitle>
              <v-list-item-title>{{ user?.address ?? '—' }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-cake-variant-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>Date of Birth</v-list-item-subtitle>
              <v-list-item-title>{{ formatDate(user?.date_of_birth) }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Employment information -->
      <v-col cols="12" md="6">
        <v-card rounded="lg" height="100%">
          <v-card-title class="pa-5 pb-3 text-body-1 font-weight-bold">
            <v-icon size="18" color="primary" class="mr-2">mdi-briefcase-outline</v-icon>Employment
            Information
          </v-card-title>
          <v-divider></v-divider>
          <v-list density="compact" class="pa-2">
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-briefcase-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>Position</v-list-item-subtitle>
              <v-list-item-title>{{ user?.position ?? '—' }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-calendar-account-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>Join Date</v-list-item-subtitle>
              <v-list-item-title>{{ formatDate(user?.join_date) }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3">mdi-file-sign</v-icon>
              </template>
              <v-list-item-subtitle>Contract Type</v-list-item-subtitle>
              <v-list-item-title>{{ user?.contract_type ?? '—' }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-calendar-check-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>Contract Signed Date</v-list-item-subtitle>
              <v-list-item-title>{{ formatDate(user?.contract_signed_date) }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-calendar-remove-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>Contract Expired Date</v-list-item-subtitle>
              <v-list-item-title>{{ formatDate(user?.contract_expired_date) }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3">mdi-counter</v-icon>
              </template>
              <v-list-item-subtitle>Contract Count</v-list-item-subtitle>
              <v-list-item-title>{{ user?.contract_count ?? '—' }}</v-list-item-title>
            </v-list-item>
          </v-list>
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
  name: 'profile.index',
})
/* END DEFINE */

/** START DEFINE PROPERTY AND EMITS */
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const userStore = useUserStore()
const user = computed(() => userStore.user)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const initials = computed(() => {
  const name = user.value?.full_name ?? ''
  const parts = name.trim().split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  if (parts.length >= 2) return (first + last).toUpperCase()
  if (parts.length === 1) return first.toUpperCase() || 'U'
  return 'U'
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
// Format ISO date string to YYYY-MM-DD, return '—' if empty
const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  return value.substring(0, 10)
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>
