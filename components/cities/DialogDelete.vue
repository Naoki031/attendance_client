<template>
  <v-dialog :model-value="dialog" max-width="420px">
    <v-card rounded="xl" elevation="2" class="text-center pa-6">
      <div class="d-flex justify-center mb-4">
        <div class="warning-icon-wrap">
          <v-icon color="error" size="28">mdi-alert</v-icon>
        </div>
      </div>
      <div class="text-h6 font-weight-bold mb-2">Delete City?</div>
      <div class="text-body-2 text-medium-emphasis mb-6 px-4">
        Are you sure you want to delete <strong>{{ item.name }}</strong
        >? This action cannot be undone.
      </div>
      <div class="d-flex justify-center gp-3">
        <v-btn variant="text" color="default" rounded="lg" min-width="100" @click="close">
          Cancel
        </v-btn>
        <v-btn color="primary" variant="elevated" rounded="lg" min-width="100" @click="confirm">
          Delete
        </v-btn>
      </div>
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
