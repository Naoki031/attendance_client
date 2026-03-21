<template>
  <div>
    <!-- Back button + title -->
    <v-row class="mb-4 align-center" no-gutters>
      <v-btn icon variant="text" class="mr-2" to="/management/users">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <span class="text-h6 font-weight-bold">{{ user?.full_name ?? 'User Detail' }}</span>
      <v-spacer></v-spacer>
      <v-chip v-if="user" :color="user.is_activated ? 'success' : 'error'" size="small">
        {{ user.is_activated ? 'Active' : 'Inactive' }}
      </v-chip>
    </v-row>

    <!-- Loading -->
    <v-row v-if="isLoading">
      <v-col cols="12">
        <v-skeleton-loader type="article"></v-skeleton-loader>
      </v-col>
    </v-row>

    <template v-else-if="user">
      <v-row>
        <!-- Basic information -->
        <v-col cols="12" md="6">
          <v-card class="mb-4" height="100%">
            <v-card-title>Basic Information</v-card-title>
            <v-divider></v-divider>
            <v-list density="compact">
              <v-list-item title="ID" :subtitle="String(user.id)"></v-list-item>
              <v-list-item title="Email" :subtitle="user.email"></v-list-item>
              <v-list-item title="Position" :subtitle="user.position ?? '—'"></v-list-item>
              <v-list-item title="Phone" :subtitle="user.phone_number ?? '—'"></v-list-item>
              <v-list-item title="Address" :subtitle="user.address ?? '—'"></v-list-item>
              <v-list-item
                title="Date of Birth"
                :subtitle="user.date_of_birth ?? '—'"
              ></v-list-item>
              <v-list-item title="Join Date" :subtitle="user.join_date ?? '—'"></v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- Contract -->
        <v-col cols="12" md="6">
          <v-card class="mb-4" height="100%">
            <v-card-title>Contract</v-card-title>
            <v-divider></v-divider>
            <v-list density="compact">
              <v-list-item title="Type" :subtitle="user.contract_type ?? '—'"></v-list-item>
              <v-list-item
                title="Count"
                :subtitle="user.contract_count != null ? String(user.contract_count) : '—'"
              ></v-list-item>
              <v-list-item
                title="Signed Date"
                :subtitle="user.contract_signed_date ?? '—'"
              ></v-list-item>
              <v-list-item
                title="Expired Date"
                :subtitle="user.contract_expired_date ?? '—'"
              ></v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- Departments -->
        <v-col cols="12" md="6">
          <v-card class="mb-4">
            <v-card-title>Departments</v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <div class="d-flex flex-wrap gap-2">
                <v-chip
                  v-for="assignment in user.user_departments"
                  :key="assignment.id"
                  color="teal"
                  variant="tonal"
                  link
                  :to="`/management/departments/${assignment.department_id}/users`"
                >
                  {{ assignment.department?.name }}
                  <span v-if="assignment.company" class="text-medium-emphasis ml-1">
                    ({{ assignment.company.name }})
                  </span>
                </v-chip>
                <span v-if="!user.user_departments?.length" class="text-medium-emphasis text-body-2"
                  >—</span
                >
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Roles -->
        <v-col cols="12" md="6">
          <v-card class="mb-4">
            <v-card-title>Roles</v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <div class="d-flex flex-wrap gap-2">
                <v-chip v-for="role in user.roles" :key="role" color="primary" variant="tonal">{{
                  role
                }}</v-chip>
                <span v-if="!user.roles?.length" class="text-medium-emphasis text-body-2">—</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
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
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  loadUser()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
