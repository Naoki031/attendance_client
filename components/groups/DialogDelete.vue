<template>
  <v-dialog :model-value="dialog" max-width="400px" persistent @update:model-value="close">
    <v-card rounded="xl">
      <v-card-title class="pa-6 pb-2 text-h6 font-weight-bold text-error">
        {{ $t('groups.deleteTitle') }}
      </v-card-title>
      <v-card-text class="px-6 pb-2 text-body-2">
        {{ $t('groups.deleteConfirm', { name: item?.name ?? '' }) }}
      </v-card-text>
      <div class="d-flex justify-end ga-2 px-6 py-4">
        <v-btn variant="text" rounded="lg" @click="close">{{ $t('common.cancel') }}</v-btn>
        <v-btn color="error" variant="elevated" rounded="lg" :loading="isDeleting" @click="confirm">
          {{ $t('common.delete') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { GroupModel } from '@/interfaces/models/GroupModel'
import GroupService from '@/services/GroupService'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  item: {
    type: Object as PropType<GroupModel | null>,
    required: false,
    default: null,
  },
  dialog: {
    type: Boolean,
    required: true,
  },
})
const emit = defineEmits(['confirm', 'close-modal'])
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const isDeleting = ref(false)
/* END DEFINE STATE */

/** START DEFINE METHOD */
const close = () => {
  emit('close-modal')
}

const confirm = async () => {
  if (!props.item) return

  try {
    isDeleting.value = true
    await GroupService.delete(props.item.id)
    emit('confirm', props.item.id)
  } catch (error) {
    console.error('Failed to delete group:', error)
  } finally {
    isDeleting.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>
