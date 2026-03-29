<template>
  <v-app-bar app elevation="0" color="primary">
    <!-- Hamburger button: visible on mobile only -->
    <v-app-bar-nav-icon class="d-flex d-md-none" @click="drawer.toggle()"></v-app-bar-nav-icon>

    <v-app-bar-title>
      <div class="d-flex align-center ga-2">
        <v-icon icon="mdi-briefcase-clock-outline" color="white" size="22"></v-icon>
        <span class="font-weight-bold text-white text-body-1 ml-1">Attendance</span>
      </div>
    </v-app-bar-title>

    <template #append>
      <!-- Admin shortcuts -->
      <template v-if="userStore.isAdmin">
        <v-tooltip :text="$t('nav.approvals')" location="bottom">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              icon
              variant="text"
              class="text-white"
              :to="{ name: 'admin.approvals.index' }"
            >
              <v-badge
                v-if="approvalsStore.pendingCount > 0"
                :content="approvalsStore.pendingCount"
                color="error"
              >
                <v-icon icon="mdi-check-circle-outline"></v-icon>
              </v-badge>
              <v-icon v-else icon="mdi-check-circle-outline"></v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </template>

      <!-- Language switcher -->
      <HeaderLanguageSwitcher />

      <!-- User menu -->
      <HeaderUserMenu />
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
/** START IMPORT */
import HeaderLanguageSwitcher from '@/components/layout/HeaderLanguageSwitcher.vue'
import HeaderUserMenu from '@/components/layout/HeaderUserMenu.vue'
import { useDrawer } from '@/composables/useDrawer'
import { useApprovalsStore } from '@/stores/approvals'
/* END IMPORT */

/** START DEFINE STATE */
const userStore = useUserStore()
const approvalsStore = useApprovalsStore()
const drawer = useDrawer()
/* END DEFINE STATE */
</script>
