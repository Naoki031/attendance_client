<template>
  <v-dialog
    :model-value="dialog"
    max-width="560"
    persistent
    @update:model-value="
      (value) => {
        if (!value) emit('close-modal')
      }
    "
  >
    <v-card rounded="xl">
      <v-card-title class="pt-6 px-6 text-h6 font-weight-bold">
        {{ t('memories.createAlbum') }}
      </v-card-title>

      <v-card-text class="px-6 pb-2">
        <v-form ref="formReference" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.title"
            :label="t('memories.form.title')"
            :rules="titleRules"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            class="mb-3"
          />

          <v-select
            v-model="form.eventType"
            :label="t('memories.form.eventType')"
            :items="eventTypeOptions"
            :rules="requiredRule"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            class="mb-3"
          />

          <v-menu
            v-model="dateMenuOpen"
            :close-on-content-click="false"
            :attach="false"
            :eager="true"
          >
            <template #activator="{ props: menuProps }">
              <v-text-field
                v-bind="menuProps"
                :model-value="form.date"
                :label="t('memories.form.date')"
                :rules="requiredRule"
                variant="filled"
                rounded="lg"
                flat
                density="comfortable"
                prepend-inner-icon="mdi-calendar"
                readonly
                class="mb-3"
              />
            </template>
            <v-date-picker
              :model-value="toPickerDate(form.date)"
              hide-header
              @update:model-value="onDateSelected"
            />
          </v-menu>

          <v-textarea
            v-model="form.description"
            :label="t('memories.form.description')"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            rows="2"
            auto-grow
            class="mb-3"
          />

          <div class="mb-3">
            <div class="text-body-2 text-medium-emphasis mb-2">
              {{ t('memories.form.privacy') }}
            </div>
            <v-radio-group v-model="form.privacy" :rules="requiredRule" inline hide-details>
              <v-radio value="public" :label="t('memories.public')" class="mr-6" />
              <v-radio value="private" :label="t('memories.private')" />
            </v-radio-group>
          </div>

          <v-autocomplete
            v-model="selectedMembers"
            :label="t('memories.form.members')"
            :items="displayItems"
            :loading="loadingMembers"
            item-title="full_name"
            item-value="id"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            multiple
            chips
            closable-chips
            return-object
            no-filter
            hide-details
            autocomplete="off"
            @update:search="onMemberSearch"
          />
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-5 ga-3 justify-end">
        <v-btn variant="text" rounded="lg" :disabled="submitting" @click="emit('close-modal')">
          {{ t('common.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          :loading="submitting"
          @click="handleSubmit"
        >
          {{ t('memories.form.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { VForm } from 'vuetify/components'
import type { EventType } from '@/types/memories'
import type { UserModel } from '@/interfaces/models/UserModel'
import { useMemories } from '@/composables/useMemories'
import { useMoment } from '@/composables/useMoment'
import { useAppNotifications } from '@/composables/useAppNotifications'
import UserService from '@/services/UserService'
import { useUserStore } from '@/stores/user'
/* END IMPORT */

/** START DEFINE PROPS AND EMITS */
const props = defineProps({
  dialog: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['created', 'close-modal'])
/* END DEFINE PROPS AND EMITS */

/** START DEFINE STATE */
const { t } = useI18n()
const { moment } = useMoment()
const { createAlbum } = useMemories()
const { notifyError } = useAppNotifications()

const formReference = ref<VForm | null>(null)
const submitting = ref(false)
const dateMenuOpen = ref(false)
const searchResults = ref<UserModel[]>([])
const loadingMembers = ref(false)
const selectedMembers = ref<UserModel[]>([])
let searchTimer: ReturnType<typeof setTimeout> | null = null

const form = ref({
  title: '',
  eventType: null as EventType | null,
  date: '',
  description: '',
  privacy: 'public' as 'public' | 'private',
})
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const eventTypeOptions = computed(() => [
  { title: t('memories.eventType.team_building'), value: 'team_building' },
  { title: t('memories.eventType.birthday'), value: 'birthday' },
  { title: t('memories.eventType.trip'), value: 'trip' },
  { title: t('memories.eventType.award'), value: 'award' },
  { title: t('memories.eventType.launch'), value: 'launch' },
  { title: t('memories.eventType.other'), value: 'other' },
])

const displayItems = computed(() => {
  const selectedIds = new Set(selectedMembers.value.map((user) => user.id))
  const nonSelected = searchResults.value.filter((user) => !selectedIds.has(user.id))
  return [...selectedMembers.value, ...nonSelected]
})
/* END DEFINE COMPUTED */

/** START DEFINE VALIDATE */
const titleRules = [
  (value: string) => !!value?.trim() || t('memories.form.titleRequired'),
  (value: string) => value.length <= 100 || t('memories.form.titleMaxLength'),
]

const requiredRule = [(value: unknown) => !!value || t('common.required')]
/* END DEFINE VALIDATE */

/** START DEFINE METHOD */
async function searchMembers(query: string): Promise<void> {
  loadingMembers.value = true
  try {
    const userStore = useUserStore()
    const currentUserId = userStore.user?.id
    const results = await UserService.search(query.trim())
    searchResults.value = currentUserId
      ? results.filter((user) => user.id !== currentUserId)
      : results
  } catch {
    notifyError(t('memories.errors.loadMembers'))
  } finally {
    loadingMembers.value = false
  }
}

function onMemberSearch(query: string): void {
  if (searchTimer) clearTimeout(searchTimer)
  if (!query?.trim() || query.length < 2) return
  searchTimer = setTimeout(() => searchMembers(query), 300)
}

function toPickerDate(dateString: string): Date | undefined {
  if (!dateString) return undefined
  return moment(dateString, 'YYYY-MM-DD').toDate()
}

function onDateSelected(selectedDate: Date): void {
  form.value.date = moment(selectedDate).format('YYYY-MM-DD')
  dateMenuOpen.value = false
}

function resetForm(): void {
  form.value = {
    title: '',
    eventType: null,
    date: '',
    description: '',
    privacy: 'public',
  }
  selectedMembers.value = []
  searchResults.value = []
  formReference.value?.resetValidation()
}

async function handleSubmit(): Promise<void> {
  const validation = await formReference.value?.validate()
  if (!validation?.valid) return

  submitting.value = true

  try {
    const album = await createAlbum({
      title: form.value.title,
      eventType: form.value.eventType as EventType,
      date: form.value.date,
      description: form.value.description || undefined,
      privacy: form.value.privacy,
      memberIds: selectedMembers.value.map((user) => String(user.id)),
    })

    if (!album) {
      notifyError(t('memories.errors.createAlbum'))
      return
    }

    emit('created')
    resetForm()
  } finally {
    submitting.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (value) => {
    if (value) resetForm()
  },
)
/* END DEFINE WATCHER */
</script>
