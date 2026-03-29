<template>
  <v-dialog :model-value="dialog" max-width="520px" persistent>
    <v-card rounded="xl" elevation="2">
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">
            {{ $t('companies.manageApprovers') }}
          </div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ item?.name }} — {{ $t('companies.manageApproversDesc') }}
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0">
        <div class="field-label">{{ $t('companies.approversLabel').toUpperCase() }}</div>
        <v-autocomplete
          v-model="selectedUserIds"
          :items="allUsers"
          :item-title="(user) => user.full_name + ' (' + user.email + ')'"
          item-value="id"
          variant="filled"
          rounded="lg"
          flat
          density="comfortable"
          multiple
          chips
          closable-chips
          clearable
          :placeholder="$t('common.search') + '...'"
          :loading="isLoadingUsers"
        ></v-autocomplete>
      </v-card-text>

      <div class="d-flex justify-end ga-3 px-6 py-4">
        <v-btn color="default" variant="text" rounded="lg" @click="close">{{
          $t('common.cancel')
        }}</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          rounded="lg"
          :loading="isSaving"
          :disabled="selectedUserIds.length === 0"
          @click="confirm"
        >
          {{ $t('common.save') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** start import */
import type { PropType } from 'vue'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import type { UserModel } from '@/interfaces/models/UserModel'
import CompanyService from '@/services/CompanyService'
import UserService from '@/services/UserService'
/* end import */

/** start define property and emits */
const props = defineProps({
  item: {
    type: Object as PropType<CompanyModel | null>,
    required: false,
    default: null,
  },
  dialog: {
    type: Boolean,
    required: true,
  },
})
const emit = defineEmits(['confirm', 'close-modal'])
/* end define property and emits */

/** start defined state */
const allUsers = ref<UserModel[]>([])
const selectedUserIds = ref<number[]>([])
const isLoadingUsers = ref(false)
const isSaving = ref(false)
/* end defined state */

/** start defined methods */
const loadData = async () => {
  if (!props.item?.id) return
  isLoadingUsers.value = true
  try {
    const [users, approvers] = await Promise.all([
      UserService.getAll(),
      CompanyService.getApprovers(props.item.id),
    ])
    allUsers.value = Object.values(users)
    selectedUserIds.value = approvers.map((approver) => approver.id)
  } catch (error) {
    console.error('Failed to load approver data:', error)
  } finally {
    isLoadingUsers.value = false
  }
}

const confirm = async () => {
  if (!props.item?.id) return
  isSaving.value = true
  try {
    await CompanyService.setApprovers(props.item.id, selectedUserIds.value)
    emit('confirm')
  } catch (error) {
    console.error('Failed to save approvers:', error)
  } finally {
    isSaving.value = false
  }
}

const close = () => {
  emit('close-modal')
}
/* end defined methods */

/** start define watcher */
watch(
  () => props.dialog,
  (value) => {
    if (value) loadData()
  },
  { immediate: true },
)
/* end define watcher */
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.field-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 4px;
}
</style>
