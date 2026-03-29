<template>
  <v-container fluid class="py-6 px-6">
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">{{ $t('bugReports.manageReports') }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ $t('bugReports.allReports') }}
        </div>
      </div>
    </div>

    <v-card rounded="xl" elevation="0" border>
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="isLoading"
        :hover="true"
        items-per-page="50"
      >
        <!-- User -->
        <template #item.user="{ item }">
          <div class="d-flex align-center ga-2 py-1">
            <v-avatar size="28" color="primary" rounded="lg">
              <span class="text-caption text-white font-weight-bold">{{
                getInitials(item.user?.full_name)
              }}</span>
            </v-avatar>
            <span class="font-weight-medium text-body-2">{{ item.user?.full_name ?? '—' }}</span>
          </div>
        </template>

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

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex align-center ga-1">
            <v-btn
              size="x-small"
              variant="tonal"
              color="primary"
              rounded="lg"
              @click="openUpdate(item)"
            >
              {{ $t('bugReports.updateStatus') }}
            </v-btn>
          </div>
        </template>

        <template #loading>
          <v-skeleton-loader type="table-row@8"></v-skeleton-loader>
        </template>
      </v-data-table>
    </v-card>

    <!-- Update status dialog -->
    <v-dialog v-model="dialogUpdate" max-width="500px">
      <v-card rounded="xl" elevation="2" class="pa-6">
        <div class="text-h6 font-weight-bold mb-2">{{ $t('bugReports.updateStatus') }}</div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          {{ selectedItem?.title }}
        </div>

        <v-select
          v-model="updateStatus"
          :items="statusOptions"
          :label="$t('common.status')"
          variant="filled"
          rounded="lg"
          flat
          density="comfortable"
        ></v-select>

        <v-textarea
          v-model="updateNote"
          :label="$t('bugReports.adminNote')"
          variant="filled"
          rounded="lg"
          flat
          density="comfortable"
          rows="3"
          no-resize
          class="mt-2"
        ></v-textarea>

        <div class="d-flex justify-end ga-3 mt-4">
          <v-btn variant="text" color="default" rounded="lg" @click="dialogUpdate = false">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            rounded="lg"
            :loading="isUpdating"
            @click="submitUpdate"
          >
            {{ $t('common.save') }}
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

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
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.bug-reports.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const items = ref<Array<BugReportModel>>([])
const isLoading = ref(false)
const dialogUpdate = ref(false)
const dialogScreenshot = ref(false)
const selectedItem = ref<BugReportModel | null>(null)
const selectedScreenshot = ref<string>('')
const updateStatus = ref<'pending' | 'in_progress' | 'resolved'>('pending')
const updateNote = ref<string>('')
const isUpdating = ref(false)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const headers = computed(() => [
  { title: $t('common.id'), key: 'id', sortable: true },
  { title: $t('bugReports.submittedBy'), key: 'user', sortable: false },
  { title: $t('common.title'), key: 'title', sortable: true },
  { title: $t('common.status'), key: 'status' },
  { title: $t('bugReports.screenshot'), key: 'screenshot_path', sortable: false },
  { title: $t('bugReports.submittedAt'), key: 'created_at', sortable: true },
  { title: $t('common.actions'), key: 'actions', sortable: false },
])

const statusOptions = computed(() => [
  { title: $t('bugReports.statusPending'), value: 'pending' },
  { title: $t('bugReports.statusInProgress'), value: 'in_progress' },
  { title: $t('bugReports.statusResolved'), value: 'resolved' },
])
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const getItems = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    const data = await BugReportService.getAll()
    items.value = Object.values(data)
  } catch (error) {
    console.error('Failed to fetch bug reports:', error)
  } finally {
    isLoading.value = false
  }
}

const getInitials = (name?: string): string => {
  if (!name) return '?'
  const parts = name.trim().split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''

  return parts.length >= 2 ? (first + last).toUpperCase() : first.toUpperCase() || '?'
}

const statusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: $t('bugReports.statusPending'),
    in_progress: $t('bugReports.statusInProgress'),
    resolved: $t('bugReports.statusResolved'),
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

  return new Date(value).toLocaleString()
}

const openUpdate = (item: BugReportModel) => {
  selectedItem.value = item
  updateStatus.value = item.status
  updateNote.value = item.admin_note || ''
  dialogUpdate.value = true
}

const submitUpdate = async () => {
  if (!selectedItem.value) return
  isUpdating.value = true

  try {
    await BugReportService.update(selectedItem.value.id, {
      status: updateStatus.value,
      admin_note: updateNote.value || undefined,
    })
    dialogUpdate.value = false
    selectedItem.value = null
    await getItems()
  } catch (error) {
    console.error('Failed to update bug report:', error)
  } finally {
    isUpdating.value = false
  }
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
