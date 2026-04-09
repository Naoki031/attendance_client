<template>
  <v-container fluid class="py-6 px-6">
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">{{ $t('slackChannels.title') }}</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="addItem()">
        {{ $t('slackChannels.createChannel') }}
      </v-btn>
    </div>

    <!-- Table card -->
    <v-card rounded="xl" elevation="0" border class="table-responsive-card">
      <div class="d-flex align-center px-4 py-3 ga-2 border-b table-toolbar">
        <v-spacer></v-spacer>
        <span class="text-caption text-medium-emphasis">{{ items.length }} channels</span>
      </div>

      <v-data-table
        :headers="headers"
        :items="items"
        :loading="isLoading"
        :hover="true"
        items-per-page="50"
      >
        <!-- Company -->
        <template #item.company="{ item }">
          <span>{{ item.company?.name ?? '—' }}</span>
        </template>

        <!-- Feature badge -->
        <template #item.feature="{ item }">
          <v-chip size="x-small" :color="featureColor(item.feature)" variant="tonal">
            {{ featureLabel(item.feature) }}
          </v-chip>
        </template>

        <!-- Webhook URL hidden for security -->
        <template #item.webhook_url>
          <span class="text-caption text-medium-emphasis">••••••••••••••••</span>
        </template>

        <!-- Mention users -->
        <template #item.mention_users="{ item }">
          <div
            v-if="item.mention_users && item.mention_users.length"
            class="d-flex flex-wrap ga-1 py-1"
          >
            <v-chip
              v-for="user in item.mention_users"
              :key="user.id"
              size="x-small"
              color="accent"
              variant="tonal"
            >
              {{ user.full_name }}
            </v-chip>
          </div>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center ga-1">
            <v-btn
              size="x-small"
              variant="tonal"
              color="primary"
              rounded="lg"
              class="btn-shine"
              @click="editItem(item)"
            >
              <v-icon size="16">mdi-pencil-outline</v-icon>
              <v-tooltip activator="parent" location="top">{{ $t('common.edit') }}</v-tooltip>
            </v-btn>
            <v-btn
              size="x-small"
              variant="tonal"
              color="secondary"
              rounded="lg"
              class="btn-shine"
              @click="duplicateItem(item)"
            >
              <v-icon size="16">mdi-content-copy</v-icon>
              <v-tooltip activator="parent" location="top">{{
                $t('slackChannels.duplicate')
              }}</v-tooltip>
            </v-btn>
            <v-btn
              size="x-small"
              variant="tonal"
              color="error"
              rounded="lg"
              class="btn-shine"
              @click="deleteItem(item)"
            >
              <v-icon size="16">mdi-delete-outline</v-icon>
              <v-tooltip activator="parent" location="top">{{ $t('common.delete') }}</v-tooltip>
            </v-btn>
          </div>
        </template>

        <template #loading>
          <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
        </template>
      </v-data-table>
    </v-card>

    <DialogCreateOrUpdateSlackChannel
      v-if="dialog"
      :item="editedItem"
      :dialog="dialog"
      :companies="availableCompanies"
      :is-duplicate="isDuplicate"
      @confirm="onConfirm"
      @close-modal="onClose"
    />

    <DialogDeleteSlackChannel
      v-if="!!selectedItem"
      :item="selectedItem"
      :dialog="dialogDelete"
      @confirm-delete="onConfirmDelete"
      @close-delete="onCloseDelete"
    />
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import DialogCreateOrUpdateSlackChannel from '@/components/slack_channels/DialogCreateOrUpdate.vue'
import DialogDeleteSlackChannel from '@/components/slack_channels/DialogDelete.vue'
import type { SlackChannelModel, SlackChannelFeature } from '@/interfaces/models/SlackChannelModel'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import SlackChannelService from '@/services/SlackChannelService'
import CompanyService from '@/services/CompanyService'
import { SLACK_FEATURE_COLOR } from '@/config/colors'
/* END IMPORT */

const { t } = useI18n()

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.slack-channels.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const items = ref<SlackChannelModel[]>([])
const availableCompanies = ref<CompanyModel[]>([])
const isLoading = ref<boolean>(false)
const dialog = ref<boolean>(false)
const dialogDelete = ref<boolean>(false)
const editedItem = ref<SlackChannelModel | null>(null)
const selectedItem = ref<SlackChannelModel | null>(null)
const isDuplicate = ref<boolean>(false)

const headers = computed(() => [
  { title: t('common.id'), key: 'id', sortable: true },
  { title: t('common.name'), key: 'name' },
  { title: t('common.company'), key: 'company', sortable: false },
  { title: t('slackChannels.requestType'), key: 'feature' },
  { title: t('slackChannels.webhookUrl'), key: 'webhook_url', sortable: false },
  { title: t('slackChannels.mentions'), key: 'mention_users', sortable: false },
  { title: t('common.actions'), key: 'actions', sortable: false },
])
/* END DEFINE STATE */

/** START DEFINE METHOD */
const getItems = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    items.value = Object.values(await SlackChannelService.getAll())
  } catch (error) {
    console.error('Failed to fetch slack channels:', error)
  } finally {
    isLoading.value = false
  }
}

const featureLabel = (feature: SlackChannelFeature): string => {
  const labels: Record<SlackChannelFeature, string> = {
    wfh: t('requestType.wfh'),
    off: t('requestType.off'),
    equipment: t('requestType.equipment'),
    clock_forget: t('requestType.clockForget'),
    overtime: t('requestType.overtime'),
    business_trip: t('requestType.businessTrip'),
    error: t('slackChannels.errorNotification'),
  }

  return labels[feature] ?? feature
}

const featureColor = (feature: SlackChannelFeature): string =>
  SLACK_FEATURE_COLOR[feature] ?? 'secondary'

const addItem = () => {
  editedItem.value = null
  isDuplicate.value = false
  dialog.value = true
}

const editItem = (item: SlackChannelModel) => {
  editedItem.value = { ...item }
  isDuplicate.value = false
  dialog.value = true
}

const duplicateItem = (item: SlackChannelModel) => {
  editedItem.value = { ...item }
  isDuplicate.value = true
  dialog.value = true
}

const onConfirm = async () => {
  onClose()
  await getItems()
}

const onClose = () => {
  dialog.value = false
  nextTick(() => {
    editedItem.value = null
    isDuplicate.value = false
  })
}

const deleteItem = (item: SlackChannelModel) => {
  selectedItem.value = { ...item }
  dialogDelete.value = true
}

const onConfirmDelete = async (item: SlackChannelModel) => {
  try {
    dialogDelete.value = false

    if (item.id) {
      await SlackChannelService.delete(item.id)
      await getItems()
    }
  } catch (error) {
    console.error('Failed to delete slack channel:', error)
  } finally {
    selectedItem.value = null
  }
}

const onCloseDelete = () => {
  dialogDelete.value = false
  nextTick(() => {
    selectedItem.value = null
  })
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(async () => {
  const companies = await CompanyService.getAll()
  availableCompanies.value = Object.values(companies)
  await getItems()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.table-toolbar {
  background-color: var(--color-table-toolbar);
}
</style>
