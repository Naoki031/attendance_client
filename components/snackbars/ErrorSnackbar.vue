<template>
    <v-snackbar
        :model-value="show"
        color="red"
    >
      {{ message }}

      <template v-slot:actions>
        <v-btn
          variant="text"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
</template>

<script lang="ts" setup>
/** 0. start import*/
import { useAlertStore } from '@/stores/alert';
import { computed } from 'vue'
/* end import*/

/** 1. start define property */
/* end define property */

/** 2. start define validate */
/* end define validate */

/** 3. start defined state */
const alertStore = useAlertStore()

/* end defined state */

/** 4. start define watcher */
/* end define life watcher */

/** 5. start defined methods */
/* end defined methods */

/** 6. start defined computed */
const show = computed(() => alertStore.show)
const message = computed(() => alertStore.message)
/* end defined computed */

/** 7. start define life cycle hook */
/* end define life cycle hook */
</script>