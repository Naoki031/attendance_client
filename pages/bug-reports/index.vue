<template>
  <v-container fluid class="py-6 px-6">
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">{{ $t('bugReports.myReports') }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ $t('bugReports.title') }}
        </div>
      </div>
    </div>

    <v-card rounded="xl" elevation="0" border>
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="isLoading"
        :hover="true"
        items-per-page="25"
      >
        <!-- Title -->
        <template #item.title="{ item }">
          <span class="font-weight-medium">{{ item.title }}</span>
        </template>

        <!-- Status -->
        <template #item.status="{ item }">
          <v-chip size="x-small" :color="statusColor(item.status)" variant="tonal">
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>

        <!-- Admin note -->
        <template #item.admin_note="{ item }">
          <span v-if="item.admin_note" class="text-body-2">{{ item.admin_note }}</span>
          <span v-else class="text-caption text-disabled">—</span>
        </template>

        <!-- Screenshot -->
        <template #item.screenshot_path="{ item }">
          <v-btn
            v-if="item.screenshot_path"
            size="x-small"
            variant="tonal"
            color="primary"
            rounded="lg"
            @click="openScreenshot(item.screenshot_path)"
          >
            {{ $t('bugReports.viewScreenshot') }}
          </v-btn>
          <span v-else class="text-caption text-medium-emphasis">{{
            $t('bugReports.noScreenshot')
          }}</span>
        </template>

        <!-- Created at -->
        <template #item.created_at="{ item }">
          <span class="text-caption">{{ formatDatetime(item.created_at) }}</span>
        </template>

        <!-- Empty state -->
        <template #no-data>
          <div class="d-flex flex-column align-center justify-center py-12 ga-3">
            <v-icon icon="mdi-bug-check-outline" size="48" color="medium-emphasis" />
            <div class="text-body-1 text-medium-emphasis">{{ $t('bugReports.noReports') }}</div>
            <div class="text-body-2 text-disabled">{{ $t('bugReports.subtitle') }}</div>
          </div>
        </template>

        <template #loading>
          <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
        </template>
      </v-data-table>
    </v-card>

    <!-- Screenshot dialog -->
    <v-dialog v-model="dialogScreenshot" max-width="800px">
      <v-card rounded="xl" elevation="2" class="pa-4">
        <v-card-text>
          <v-img :src="selectedScreenshot" max-width="100%"></v-img>
        </v-card-text>
        <div class="d-flex justify-end pa-2">
          <v-btn variant="text" @click="dialogScreenshot = false">
            {{ $t('common.close') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { BugReportModel } from '@/interfaces/models/BugReportModel'
import BugReportService from '@/services/BugReportService'
import { useAppNotifications } from '@/composables/useAppNotifications'
import { useMoment } from '@/composables/useMoment'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'bug-reports.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const { t } = useI18n()
const { notifyError } = useAppNotifications()
const { moment } = useMoment()
const items = ref<Array<BugReportModel>>([])
const isLoading = ref<boolean>(false)
const dialogScreenshot = ref<boolean>(false)
const selectedScreenshot = ref<string>('')
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const headers = computed(() => [
  { title: t('common.id'), key: 'id', sortable: true },
  { title: t('common.title'), key: 'title', sortable: true },
  { title: t('common.status'), key: 'status', sortable: false },
  { title: t('bugReports.adminNote'), key: 'admin_note', sortable: false },
  { title: t('bugReports.screenshot'), key: 'screenshot_path', sortable: false },
  { title: t('bugReports.submittedAt'), key: 'created_at', sortable: true },
])
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const getItems = async () => {
  if (isLoading.value) return
  try {
    isLoading.value = true
    const data = await BugReportService.getMine()
    items.value = Object.values(data)
  } catch {
    notifyError(t('bugReports.loadFailed'))
  } finally {
    isLoading.value = false
  }
}

const statusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: t('bugReports.statusPending'),
    in_progress: t('bugReports.statusInProgress'),
    resolved: t('bugReports.statusResolved'),
  }

  return labels[status] ?? status
}

const statusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'warning',
    in_progress: 'info',
    resolved: 'success',
  }

  return colors[status] ?? 'default'
}

const formatDatetime = (value?: string): string => {
  if (!value) return '—'

  return moment.utc(value).local().format('YYYY-MM-DD HH:mm')
}

const openScreenshot = (path: string) => {
  selectedScreenshot.value = path
  dialogScreenshot.value = true
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  getItems()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
