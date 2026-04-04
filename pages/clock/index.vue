<template>
  <v-container class="py-10 d-flex justify-center">
    <v-card rounded="xl" elevation="0" border width="100%" max-width="400" class="pa-6">
      <!-- Header -->
      <div class="text-center mb-6">
        <v-icon size="48" color="primary" class="mb-2">mdi-qrcode-scan</v-icon>
        <div class="text-h6 font-weight-bold">{{ $t('qrClock.title') }}</div>
        <div class="text-caption text-medium-emphasis mt-1">{{ today }}</div>
      </div>

      <!-- Processing state -->
      <div v-if="isProcessing" class="text-center py-6">
        <v-progress-circular
          indeterminate
          color="primary"
          size="48"
          class="mb-4"
        ></v-progress-circular>
        <div class="text-body-2 text-medium-emphasis">{{ $t('qrClock.processing') }}</div>
      </div>

      <!-- Success state -->
      <div v-else-if="result" class="text-center py-4">
        <v-icon
          size="64"
          :color="result.action === 'clock_in' ? 'success' : 'primary'"
          class="mb-3"
        >
          {{ result.action === 'clock_in' ? 'mdi-login' : 'mdi-logout' }}
        </v-icon>
        <div class="text-h6 font-weight-bold mb-1">
          {{ result.action === 'clock_in' ? $t('qrClock.clockedIn') : $t('qrClock.clockedOut') }}
        </div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          {{ result.action === 'clock_in' ? result.log.clock_in : result.log.clock_out }}
        </div>
        <v-btn
          variant="tonal"
          rounded="lg"
          class="btn-shine"
          :to="{ name: 'home' }"
          @click="goHome"
        >
          {{ $t('qrClock.goHome') }}
        </v-btn>
      </div>

      <!-- Error state -->
      <div v-else-if="errorMessage" class="text-center py-4">
        <v-icon size="64" color="error" class="mb-3">mdi-alert-circle-outline</v-icon>
        <div class="text-body-1 font-weight-medium mb-2">{{ $t('qrClock.failed') }}</div>
        <div class="text-body-2 text-medium-emphasis mb-4">{{ errorMessage }}</div>
        <v-btn variant="tonal" rounded="lg" class="btn-shine" :to="{ name: 'home' }">{{
          $t('qrClock.goHome')
        }}</v-btn>
      </div>

      <!-- Invalid QR params -->
      <div v-else class="text-center py-4">
        <v-icon size="64" color="warning" class="mb-3">mdi-qrcode-remove</v-icon>
        <div class="text-body-1 font-weight-medium mb-2">{{ $t('qrClock.invalidQrCode') }}</div>
        <div class="text-caption text-medium-emphasis">{{ $t('qrClock.invalidQrDesc') }}</div>
      </div>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import AttendanceLogsService from '@/services/AttendanceLogsService'
import type { ClockQrResultModel } from '@/interfaces/models/AttendanceLogModel'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'clock.index',
  layout: 'default',
})
/* END DEFINE */

/** START DEFINE STATE */
const { t } = useI18n()
const { moment } = useMoment()
const route = useRoute()
const isProcessing = ref<boolean>(false)
const result = ref<ClockQrResultModel | null>(null)
const errorMessage = ref<string>('')

const today = moment().toDate().toLocaleDateString('vi-VN', {
  weekday: 'long',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
/* END DEFINE STATE */

/** START DEFINE METHOD */
const goHome = () => navigateTo({ name: 'home' })

const processQr = async () => {
  const token = route.query.token as string | undefined
  const company = route.query.company as string | undefined
  const date = route.query.date as string | undefined

  if (!token || !company || !date) return

  isProcessing.value = true

  try {
    result.value = await AttendanceLogsService.clockByQr(token, Number(company), date)
  } catch (error: unknown) {
    const fetchError = error as {
      data?: { message?: string }
      status?: number
      statusCode?: number
    }
    const apiMessage = fetchError.data?.message ?? ''
    const status = fetchError.status ?? fetchError.statusCode ?? 0

    if (apiMessage.includes('expired')) {
      errorMessage.value = t('qrClock.error.expired')
    } else if (status === 400) {
      errorMessage.value = t('qrClock.error.invalidToken')
    } else if (status === 404) {
      errorMessage.value = t('qrClock.error.companyNotFound')
    } else if (status === 403) {
      if (apiMessage.includes('No IP whitelist')) {
        errorMessage.value = t('qrClock.error.noIpConfig')
      } else {
        errorMessage.value = t('qrClock.error.ipRestricted')
      }
    } else {
      errorMessage.value = t('qrClock.error.connectionError')
    }
  } finally {
    isProcessing.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  processQr()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>
