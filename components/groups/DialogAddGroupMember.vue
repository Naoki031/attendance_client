<template>
  <v-dialog :model-value="dialog" max-width="480px" persistent @update:model-value="close">
    <v-card rounded="xl" elevation="2">
      <div class="px-6 pt-6 pb-2">
        <div class="text-h6 font-weight-bold text-primary">{{ $t('groups.addMember') }}</div>
      </div>

      <v-card-text class="px-6 py-4">
        <v-alert
          v-if="apiError"
          type="error"
          variant="tonal"
          rounded="lg"
          density="compact"
          class="mb-3"
          closable
          @click:close="apiError = ''"
        >
          {{ apiError }}
        </v-alert>

        <v-autocomplete
          v-model="selectedCompanyId"
          :items="companies"
          item-title="name"
          item-value="id"
          :label="$t('common.company')"
          variant="filled"
          rounded="lg"
          flat
          density="comfortable"
          clearable
          autocomplete="off"
          @update:model-value="onCompanyChange"
        />

        <v-autocomplete
          v-model="selectedUserIds"
          :items="searchedUsers"
          item-title="full_name"
          item-value="id"
          :label="$t('common.user')"
          :error-messages="userIdsError"
          variant="filled"
          rounded="lg"
          flat
          density="comfortable"
          :loading="isSearchingUsers"
          :disabled="!selectedCompanyId"
          multiple
          chips
          closable-chips
          no-filter
          clearable
          :placeholder="
            selectedCompanyId ? $t('common.typeToSearch') : $t('groups.selectCompanyFirst')
          "
          autocomplete="off"
          @update:search="onUserSearch"
        />
      </v-card-text>

      <div class="d-flex justify-end ga-2 px-6 py-4">
        <v-btn variant="text" rounded="lg" @click="close">{{ $t('common.cancel') }}</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          rounded="lg"
          :loading="isSaving"
          :disabled="selectedUserIds.length === 0"
          @click="confirm"
        >
          {{ $t('common.add') }}
          <span v-if="selectedUserIds.length > 0" class="ml-1">({{ selectedUserIds.length }})</span>
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { UserModel } from '@/interfaces/models/UserModel'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import GroupService from '@/services/GroupService'
import UserService from '@/services/UserService'
import CompanyService from '@/services/CompanyService'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  groupId: {
    type: Number as PropType<number>,
    required: true,
  },
  defaultCompanyId: {
    type: Number as PropType<number | null>,
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
const { t } = useI18n()
const companies = ref<CompanyModel[]>([])
const selectedCompanyId = ref<number | null>(null)
const selectedUserIds = ref<number[]>([])
const searchedUsers = ref<UserModel[]>([])
const isSearchingUsers = ref(false)
const isSaving = ref(false)
const apiError = ref('')
const userIdsError = ref('')
/* END DEFINE STATE */

/** START DEFINE METHOD */
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

const loadUsersForCompany = async (companyId: number, nameQuery?: string) => {
  isSearchingUsers.value = true

  try {
    searchedUsers.value = await UserService.filter({
      companyId,
      name: nameQuery || undefined,
    })
  } catch (error) {
    console.error('User search failed:', error)
  } finally {
    isSearchingUsers.value = false
  }
}

const onCompanyChange = (companyId: number | null) => {
  selectedUserIds.value = []
  searchedUsers.value = []

  if (companyId) {
    loadUsersForCompany(companyId)
  }
}

const onUserSearch = (query: string) => {
  if (!selectedCompanyId.value) return
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(async () => {
    await loadUsersForCompany(selectedCompanyId.value as number, query || undefined)
  }, 300)
}

const fetchCompanies = async () => {
  try {
    const data = await CompanyService.getAll()
    companies.value = Object.values(data)
  } catch (error) {
    console.error('Failed to load companies:', error)
  }
}

const confirm = async () => {
  userIdsError.value = ''

  if (selectedUserIds.value.length === 0) {
    userIdsError.value = t('validation.required', { field: t('common.user') })

    return
  }

  isSaving.value = true
  apiError.value = ''

  try {
    const results = await Promise.allSettled(
      selectedUserIds.value.map((userId) => GroupService.addMember(props.groupId, userId)),
    )
    const failed = results.filter((result) => result.status === 'rejected')

    if (failed.length > 0) {
      const firstError = failed[0] as PromiseRejectedResult
      const errorObject = firstError.reason as { data?: { message?: string } }
      apiError.value =
        failed.length === selectedUserIds.value.length
          ? (errorObject?.data?.message ?? t('common.error'))
          : t('groups.someUsersFailed', { count: failed.length })
    }

    const succeeded = results.filter((result) => result.status === 'fulfilled')

    if (succeeded.length > 0) {
      emit('confirm')
      selectedUserIds.value = []

      if (selectedCompanyId.value) {
        loadUsersForCompany(selectedCompanyId.value)
      }
    }
  } finally {
    isSaving.value = false
  }
}

const close = () => {
  apiError.value = ''
  userIdsError.value = ''
  selectedUserIds.value = []
  selectedCompanyId.value = null
  searchedUsers.value = []
  emit('close-modal')
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (isOpen) => {
    if (isOpen) {
      fetchCompanies()
      selectedCompanyId.value = props.defaultCompanyId

      if (props.defaultCompanyId) {
        loadUsersForCompany(props.defaultCompanyId)
      }
    } else {
      close()
    }
  },
  { immediate: false },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
/* END DEFINE LIFE CYCLE HOOK */
</script>
