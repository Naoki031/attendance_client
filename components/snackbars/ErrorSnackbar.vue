<template>
  <v-snackbar :model-value="show" color="red">
    {{ message }}

    <template #actions>
      <v-btn variant="text"> {{ $t('common.close') }} </v-btn>
    </template>
  </v-snackbar>
</template>

<script lang="ts" setup>
/** START IMPORT */
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const alertStore = useAlertStore()
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const show = computed(() => alertStore.show)
const message = computed(() => alertStore.message)
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>
