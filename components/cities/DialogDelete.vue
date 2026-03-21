<template>
  <v-dialog :model-value="dialog" max-width="500px">
    <v-card>
      <v-card-title class="text-h5">Are you sure you want to delete {{ item.name }}?</v-card-title>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue-darken-1" variant="text" @click="close">Cancel</v-btn>
        <v-btn color="red-darken-1" variant="text" @click="confirm">Delete</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { CityModel } from '@/interfaces/models/CityModel'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  item: {
    type: Object as PropType<CityModel>,
    required: true,
  },
  dialog: {
    type: Boolean,
    required: true,
  },
})
const emit = defineEmits(['confirm-delete', 'close-delete'])
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE METHOD */
const confirm = () => {
  emit('confirm-delete', props.item)
}

const close = () => {
  emit('close-delete', null)
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (value) => {
    if (!value) close()
  },
  { immediate: false },
)
/* END DEFINE WATCHER */
</script>

<style scoped></style>
