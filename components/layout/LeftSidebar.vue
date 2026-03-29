<template>
  <v-navigation-drawer
    v-model="drawerModel"
    :rail="mdAndUp ? true : undefined"
    :expand-on-hover="mdAndUp"
    :temporary="!mdAndUp"
    color="#FFFAF6"
    border="e"
    @update:rail="onChange"
  >
    <!-- User information -->
    <SidebarUserInfo />
    <v-divider></v-divider>

    <!-- User routes -->
    <v-list v-model="openedComputed" :lines="false" density="compact" nav>
      <SidebarRouteList :routes="userRoutes" />

      <!-- Admin routes -->
      <template v-if="userStore.isAdmin">
        <v-list-subheader v-show="!isRail">{{
          $t('nav.management').toUpperCase()
        }}</v-list-subheader>
        <SidebarRouteList
          :routes="adminRoutes"
          :badge-names="['admin.approvals.index']"
          :badge-count="pendingApprovalsCount"
        />
      </template>
    </v-list>

    <template #append>
      <v-list-item active @click="handleReportBug">
        <template #prepend>
          <v-icon icon="mdi-bug-outline"></v-icon>
        </template>
        <v-list-item-title>{{ $t('bugReports.reportBug') }}</v-list-item-title>
      </v-list-item>
    </template>
  </v-navigation-drawer>

  <DialogReportBug
    :dialog="bugDialogOpen"
    :initial-screenshot="capturedImage"
    @confirm="bugDialogOpen = false"
    @close-modal="bugDialogOpen = false"
  />
</template>

<script lang="ts" setup>
/** START IMPORT */
import SidebarRouteList from '@/components/layout/SidebarRouteList.vue'
import SidebarUserInfo from '@/components/layout/SidebarUserInfo.vue'
import DialogReportBug from '@/components/common/DialogReportBug.vue'
import type { RouteType, DividerType } from '@/types'
import { useDrawer } from '@/composables/useDrawer'
import { useScreenCapture } from '@/composables/useScreenCapture'
import { useDisplay } from 'vuetify'
import { useApprovalsStore } from '@/stores/approvals'
import { getUserRoutes, getAdminRoutes } from '@/config/sidebarRoutes'
/* END IMPORT */

/** START DEFINE STATE */
const userStore = useUserStore()
const approvalsStore = useApprovalsStore()
const opened = ref<string[]>([])
const { mdAndUp } = useDisplay()
const isRail = ref<boolean>(mdAndUp.value)
const drawerState = useDrawer()
const { t } = useI18n()
const bugDialogOpen = ref(false)
const { capturedImage, capture } = useScreenCapture()
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const drawerModel = computed({
  get: () => (mdAndUp.value ? true : drawerState.isOpen.value),
  set: (value: boolean) => {
    if (!mdAndUp.value) drawerState.isOpen.value = value
  },
})

// When in rail mode, keep all groups collapsed regardless of click
const openedComputed = computed({
  get: (): string[] => (isRail.value ? [] : opened.value),
  set: (value: string[]) => {
    if (!isRail.value) opened.value = value
  },
})

const userRoutes = computed<Array<RouteType | DividerType>>(() => getUserRoutes(t))

const adminRoutes = computed<Array<RouteType | DividerType>>(() => getAdminRoutes(t))

const pendingApprovalsCount = computed(() => approvalsStore.pendingCount)
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const onChange = (value: boolean) => {
  isRail.value = value
}

const handleReportBug = async () => {
  await capture()
  bugDialogOpen.value = true
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
// Sync isRail when switching between mobile and desktop
watch(mdAndUp, (value) => {
  isRail.value = value
})
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  if (userStore.isAdmin) {
    approvalsStore.loadPendingCount()
  }
})
/* END DEFINE LIFE CYCLE HOOK */
</script>
