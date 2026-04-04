<template>
  <v-container fluid class="py-6 px-6">
    <!-- Page header -->
    <div class="d-flex align-center ga-3 mb-6">
      <v-btn icon variant="text" size="small" to="/management/users">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>

      <v-skeleton-loader
        v-if="isLoading"
        type="list-item-avatar"
        class="flex-grow-1"
      ></v-skeleton-loader>

      <div v-else-if="user" class="d-flex align-center ga-4 flex-grow-1" style="min-width: 0">
        <v-avatar size="52" color="primary" class="flex-shrink-0">
          <span class="text-subtitle-1 text-white font-weight-bold">{{ getInitials(user) }}</span>
        </v-avatar>
        <div class="flex-grow-1" style="min-width: 0">
          <div class="text-h5 font-weight-bold text-truncate">{{ user.full_name }}</div>
          <div class="text-body-2 text-medium-emphasis text-truncate">
            {{ [user.position, user.email].filter(Boolean).join(' · ') }}
          </div>
        </div>
        <v-chip
          :color="user.is_activated ? 'success' : 'default'"
          size="small"
          variant="tonal"
          class="flex-shrink-0"
        >
          {{ user.is_activated ? $t('common.active') : $t('common.inactive') }}
        </v-chip>
      </div>
    </div>

    <!-- Loading skeleton cards -->
    <v-row v-if="isLoading">
      <v-col cols="12" md="7">
        <v-skeleton-loader type="card" rounded="xl"></v-skeleton-loader>
      </v-col>
      <v-col cols="12" md="5">
        <v-skeleton-loader type="card" rounded="xl"></v-skeleton-loader>
      </v-col>
    </v-row>

    <template v-else-if="user">
      <v-row>
        <!-- Basic information -->
        <v-col cols="12" md="7">
          <v-card rounded="xl" elevation="0" border class="mb-4">
            <div class="px-5 pt-5 pb-2">
              <div class="text-subtitle-2 font-weight-bold text-primary mb-4">
                {{ $t('profile.basicInfo').toUpperCase() }}
              </div>
              <v-row dense>
                <v-col cols="6">
                  <div class="info-label">{{ $t('common.id').toUpperCase() }}</div>
                  <div class="info-value">{{ user.id }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('profile.position').toUpperCase() }}</div>
                  <div class="info-value">{{ user.position ?? '—' }}</div>
                </v-col>
                <v-col cols="12">
                  <div class="info-label">{{ $t('profile.email').toUpperCase() }}</div>
                  <div class="info-value">{{ user.email }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('common.phone').toUpperCase() }}</div>
                  <div class="info-value">{{ user.phone_number ?? '—' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('profile.dateOfBirth').toUpperCase() }}</div>
                  <div class="info-value">{{ user.date_of_birth ?? '—' }}</div>
                </v-col>
                <v-col cols="12">
                  <div class="info-label">{{ $t('profile.address').toUpperCase() }}</div>
                  <div class="info-value">{{ user.address ?? '—' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('profile.slackId').toUpperCase() }}</div>
                  <div class="info-value">{{ user.slack_id ?? '—' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('profile.joinDate').toUpperCase() }}</div>
                  <div class="info-value">{{ user.join_date ?? '—' }}</div>
                </v-col>
              </v-row>
            </div>
          </v-card>
        </v-col>

        <!-- Right column -->
        <v-col cols="12" md="5">
          <!-- Contract -->
          <v-card rounded="xl" elevation="0" border class="mb-4">
            <div class="px-5 pt-5 pb-2">
              <div class="text-subtitle-2 font-weight-bold text-primary mb-4">
                {{ $t('profile.contract').toUpperCase() }}
              </div>
              <v-row dense>
                <v-col cols="6">
                  <div class="info-label">{{ $t('common.type').toUpperCase() }}</div>
                  <div class="info-value">{{ user.contract_type ?? '—' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('profile.count').toUpperCase() }}</div>
                  <div class="info-value">
                    {{ user.contract_count != null ? String(user.contract_count) : '—' }}
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('profile.signedDate').toUpperCase() }}</div>
                  <div class="info-value">{{ user.contract_signed_date ?? '—' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('profile.expiredDate').toUpperCase() }}</div>
                  <div class="info-value">{{ user.contract_expired_date ?? '—' }}</div>
                </v-col>
              </v-row>
            </div>
          </v-card>

          <!-- Roles -->
          <v-card rounded="xl" elevation="0" border class="mb-4">
            <div class="px-5 pt-5 pb-4">
              <div class="text-subtitle-2 font-weight-bold text-primary mb-3">
                {{ $t('profile.roles').toUpperCase() }}
              </div>
              <div class="d-flex flex-wrap ga-2">
                <v-chip
                  v-for="role in user.roles"
                  :key="role"
                  color="primary"
                  variant="tonal"
                  size="small"
                >
                  {{ role }}
                </v-chip>
                <span v-if="!user.roles?.length" class="text-medium-emphasis text-body-2">—</span>
              </div>
            </div>
          </v-card>

          <!-- Departments -->
          <v-card rounded="xl" elevation="0" border>
            <div class="px-5 pt-5 pb-4">
              <div class="text-subtitle-2 font-weight-bold text-primary mb-3">
                {{ $t('departments.title').toUpperCase() }}
              </div>
              <div class="d-flex flex-wrap ga-2">
                <v-chip
                  v-for="assignment in user.user_departments"
                  :key="assignment.id"
                  color="primary"
                  variant="outlined"
                  size="small"
                  link
                  :to="`/management/departments/${assignment.department_id}/users`"
                >
                  {{ assignment.department?.name }}
                  <span v-if="assignment.company" class="ml-1 text-medium-emphasis">
                    ({{ assignment.company.name }})
                  </span>
                </v-chip>
                <span v-if="!user.user_departments?.length" class="text-medium-emphasis text-body-2"
                  >—</span
                >
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { UserModel } from '@/interfaces/models/UserModel'
import UserService from '@/services/UserService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.users.detail',
})
/* END DEFINE */

/** START DEFINE STATE */
const route = useRoute()
const userId = computed(() => Number(route.params.id))
const user = ref<UserModel | null>(null)
const isLoading = ref(false)
/* END DEFINE STATE */

/** START DEFINE METHOD */
const loadUser = async () => {
  try {
    isLoading.value = true
    user.value = await UserService.getOne(userId.value)
  } catch (error) {
    console.error('Failed to load user:', error)
  } finally {
    isLoading.value = false
  }
}

const getInitials = (item: UserModel): string => {
  const name = item.full_name ?? ''
  const parts = name.trim().split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  if (parts.length >= 2) return (first + last).toUpperCase()

  return first.toUpperCase() || '?'
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  loadUser()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.info-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.07em;
  color: rgb(var(--v-theme-secondary));
  margin-bottom: 2px;
}

.info-value {
  font-size: 14px;
  color: rgb(var(--v-theme-primary-darken));
  margin-bottom: 16px;
}
</style>
