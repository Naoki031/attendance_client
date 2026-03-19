<template>
  <v-app-bar app>
    <v-toolbar-title>
      <v-btn color="" variant="plain" to="/" :ripple="false" :active="false">Attendance</v-btn>
    </v-toolbar-title>
    <template #append>
      <v-btn icon="mdi-logout" color="red" @click.prevent="logout"></v-btn>
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
/** START IMPORT */
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
