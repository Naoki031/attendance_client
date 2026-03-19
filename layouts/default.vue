<template>
  <v-app>
    <AppHeader />
    <LeftSidebar />
    <v-main>
      <NuxtPage />
    </v-main>
    <RightSidebar />
    <AppFooter />
  </v-app>
</template>

<script setup lang="ts">
/** START IMPORT */
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import RightSidebar from '@/components/layout/RightSidebar.vue'
import LeftSidebar from '@/components/layout/LeftSidebar.vue'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const userStore = useUserStore()
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  if (userStore.isAuthenticated) {
    userStore.getUser()
  }
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
