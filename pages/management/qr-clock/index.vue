<template>
  <v-container fluid class="py-6 px-6">
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">{{ $t('qrClock.title') }}</div>
      </div>
      <v-btn
        variant="tonal"
        color="primary"
        prepend-icon="mdi-refresh"
        rounded="lg"
        :loading="isLoading"
        @click="loadQr"
      >
        {{ $t('common.refresh') }}
      </v-btn>
    </div>

    <!-- Error state -->
    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      rounded="xl"
      class="mb-5"
      closable
      @click:close="errorMessage = ''"
    >
      {{ errorMessage }}
    </v-alert>

    <v-row justify="center">
      <v-col cols="12" sm="8" md="5">
        <v-card rounded="xl" elevation="0" border class="pa-6 text-center">
          <!-- QR code canvas -->
          <div class="d-flex justify-center mb-4">
            <canvas ref="qrCanvas" class="qr-canvas"></canvas>
          </div>

          <!-- Date label -->
          <div class="text-body-1 font-weight-bold mb-1">{{ qrData?.date ?? '—' }}</div>
          <div class="text-caption text-medium-emphasis mb-4">
            {{ $t('qrClock.validForToday') }}
          </div>

          <!-- Scan URL preview -->
          <v-text-field
            v-if="scanUrl"
            :model-value="scanUrl"
            readonly
            variant="outlined"
            rounded="lg"
            density="compact"
            hide-details
            class="mb-3"
          >
            <template #append-inner>
              <v-btn icon size="x-small" variant="text" @click="copyUrl">
                <v-icon size="16">mdi-content-copy</v-icon>
              </v-btn>
            </template>
          </v-text-field>

          <v-chip v-if="urlCopied" color="success" size="small" variant="tonal">
            <v-icon start>mdi-check</v-icon>{{ $t('qrClock.copied') }}
          </v-chip>
        </v-card>
      </v-col>

      <!-- Instructions panel -->
      <v-col cols="12" sm="8" md="4">
        <v-card rounded="xl" elevation="0" border class="pa-5">
          <div class="text-subtitle-2 font-weight-bold mb-3">{{ $t('qrClock.howItWorks') }}</div>
          <v-timeline density="compact" side="end">
            <v-timeline-item dot-color="primary" size="small">
              <div class="text-body-2 font-weight-medium">{{ $t('qrClock.adminDisplaysQr') }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ $t('qrClock.adminDisplaysQrDesc') }}
              </div>
            </v-timeline-item>
            <v-timeline-item dot-color="primary" size="small">
              <div class="text-body-2 font-weight-medium">{{ $t('qrClock.employeeScans') }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ $t('qrClock.employeeScansDesc') }}
              </div>
            </v-timeline-item>
            <v-timeline-item dot-color="success" size="small">
              <div class="text-body-2 font-weight-medium">{{ $t('qrClock.clockRecorded') }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ $t('qrClock.clockRecordedDesc') }}
              </div>
            </v-timeline-item>
          </v-timeline>

          <v-divider class="my-4"></v-divider>
          <div class="text-subtitle-2 font-weight-bold mb-2">{{ $t('qrClock.ipWhitelist') }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ $t('qrClock.ipWhitelistDesc') }}
          </div>
          <v-btn
            class="mt-3"
            variant="tonal"
            color="default"
            size="small"
            rounded="lg"
            :to="{ name: 'admin.companies.index' }"
          >
            {{ $t('qrClock.goToCompanySettings') }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import QRCode from 'qrcode'
import AttendanceLogsService from '@/services/AttendanceLogsService'
import type { TodayQrModel } from '@/interfaces/models/AttendanceLogModel'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.qr-clock.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const qrData = ref<TodayQrModel | null>(null)
const isLoading = ref<boolean>(false)
const errorMessage = ref<string>('')
const urlCopied = ref<boolean>(false)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const scanUrl = computed<string>(() => {
  if (!qrData.value || typeof window === 'undefined') return ''
  const { token, companyId, date } = qrData.value

  return `${window.location.origin}/clock?token=${token}&company=${companyId}&date=${date}`
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const renderQr = async () => {
  if (!qrCanvas.value || !scanUrl.value) return
  await QRCode.toCanvas(qrCanvas.value, scanUrl.value, {
    width: 256,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  })
}

const loadQr = async () => {
  if (isLoading.value) return
  isLoading.value = true
  errorMessage.value = ''

  try {
    qrData.value = await AttendanceLogsService.getTodayQr()
    await nextTick()
    await renderQr()
  } catch (error: unknown) {
    errorMessage.value =
      (error as { data?: { message?: string }; message?: string })?.data?.message ??
      (error as { message?: string })?.message ??
      'Failed to load QR code'
  } finally {
    isLoading.value = false
  }
}

const copyUrl = async () => {
  if (!scanUrl.value) return
  await navigator.clipboard.writeText(scanUrl.value)
  urlCopied.value = true
  setTimeout(() => {
    urlCopied.value = false
  }, 2000)
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  loadQr()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.qr-canvas {
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
