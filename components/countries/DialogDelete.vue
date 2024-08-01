<template>
  <v-dialog :model-value="dialog" max-width="500px">
    <v-card>
      <v-card-title class="text-h5">Are you sure you want to delete {{ item.name }}?</v-card-title>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue-darken-1" variant="text" @click="close">Cancel</v-btn>
        <v-btn color="blue-darken-1" variant="text" @click="confirm">OK</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** 0. start import*/
import { computed, ref, watch, PropType } from 'vue'
import { CountryModel } from '@/interfaces/models/CountryModel'
/* end import*/

/** 1. start import name component*/
/* end import*/

/** 2. start define property and emits */
const props = defineProps({
  item: {
    type: Object as PropType<CountryModel>,
    required: true,
  },
  dialog: {
    type: Boolean,
    required: true,
  },
})
const emit = defineEmits(['confirm-delete', 'close-delete'])
/* end define property and emits*/

/** 3. start define validate */
/* end define validate */

/** 4. start defined state */
/* end defined state */

/** 5. start defined computed */
/* end defined computed */

/** 6. start defined methods */
const confirm = () => {
  emit('confirm-delete', props.item)
}

const close = () => {
  emit('close-delete', null)
}
/* end defined methods */

/** 7. start define watcher */
watch(
  () => props.dialog,
  (val) => {
    if (!val) {
      close()
    }
  },
  { immediate: false },
)
/* end define life watcher */

/** 8. start define life cycle hook */
/* end define life cycle hook */
</script>

<style scoped></style>
