<template>
  <v-container class="pa-4" max-width="1000">
    <div class="d-flex align-center ga-3 mb-6">
      <v-icon color="primary" size="28">mdi-help-circle-outline</v-icon>
      <div>
        <div class="text-h6 font-weight-bold text-primary">{{ $t('howItWorks.title') }}</div>
        <div class="text-body-2 text-medium-emphasis">{{ $t('howItWorks.subtitle') }}</div>
      </div>
    </div>

    <!-- Prerequisites -->
    <v-card rounded="xl" border elevation="0" class="mb-4">
      <div class="d-flex align-center ga-3 pa-4 pb-3">
        <v-avatar color="warning" size="40" rounded="lg">
          <v-icon color="white" size="22">mdi-checkbox-marked-circle-outline</v-icon>
        </v-avatar>
        <div class="text-body-1 font-weight-bold">{{ $t('howItWorks.prerequisites.title') }}</div>
      </div>
      <v-divider />
      <div class="pa-4">
        <div class="text-body-2 text-medium-emphasis mb-3">
          {{ $t('howItWorks.prerequisites.subtitle') }}
        </div>
        <div class="d-flex flex-column ga-3">
          <div v-for="(item, index) in prerequisites" :key="index" class="d-flex align-start ga-3">
            <v-avatar color="warning" size="28" rounded="lg" class="flex-shrink-0">
              <span class="text-caption font-weight-bold text-white">{{ index + 1 }}</span>
            </v-avatar>
            <div class="pt-1">
              <div class="text-body-2 font-weight-medium">{{ item.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </v-card>

    <!-- Method 1: ZK Device -->
    <v-card rounded="xl" border elevation="0" class="mb-4">
      <div class="d-flex align-center ga-3 pa-4 pb-3">
        <v-avatar color="primary" size="40" rounded="lg">
          <v-icon color="white" size="22">mdi-fingerprint</v-icon>
        </v-avatar>
        <div>
          <div class="text-body-1 font-weight-bold">{{ $t('howItWorks.zkDevice.title') }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ $t('howItWorks.zkDevice.subtitle') }}
          </div>
        </div>
        <v-spacer />
        <v-chip color="primary" variant="tonal" size="small">{{
          $t('howItWorks.automatic')
        }}</v-chip>
      </div>
      <v-divider />
      <div class="pa-4">
        <div class="text-body-2 text-medium-emphasis mb-4">
          {{ $t('howItWorks.zkDevice.description') }}
        </div>

        <!-- Flow steps -->
        <div class="d-flex flex-column ga-2">
          <div v-for="(step, index) in zkSteps" :key="index" class="d-flex align-start ga-3">
            <div class="step-number text-caption font-weight-bold">{{ index + 1 }}</div>
            <div>
              <div class="text-body-2 font-weight-medium">{{ step.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ step.desc }}</div>
            </div>
          </div>
        </div>

        <v-divider class="my-4" />
        <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-2">
          {{ $t('howItWorks.requirements') }}
        </div>
        <div class="d-flex flex-column ga-1">
          <div v-for="(req, index) in zkRequirements" :key="index" class="d-flex align-center ga-2">
            <v-icon color="error" size="14">mdi-circle-small</v-icon>
            <span class="text-caption">{{ req }}</span>
          </div>
        </div>
        <v-alert type="info" variant="tonal" rounded="lg" class="mt-4" density="compact">
          {{ $t('howItWorks.zkDevice.note') }}
        </v-alert>
      </div>
    </v-card>

    <!-- Method 2: QR Clock -->
    <v-card rounded="xl" border elevation="0" class="mb-4">
      <div class="d-flex align-center ga-3 pa-4 pb-3">
        <v-avatar color="request-clock-forget" size="40" rounded="lg">
          <v-icon color="white" size="22">mdi-qrcode-scan</v-icon>
        </v-avatar>
        <div>
          <div class="text-body-1 font-weight-bold">{{ $t('howItWorks.qrClock.title') }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ $t('howItWorks.qrClock.subtitle') }}
          </div>
        </div>
        <v-spacer />
        <v-chip color="request-clock-forget" variant="tonal" size="small">{{
          $t('howItWorks.manual')
        }}</v-chip>
      </div>
      <v-divider />
      <div class="pa-4">
        <div class="text-body-2 text-medium-emphasis mb-4">
          {{ $t('howItWorks.qrClock.description') }}
        </div>

        <div class="d-flex flex-column ga-2">
          <div v-for="(step, index) in qrSteps" :key="index" class="d-flex align-start ga-3">
            <div class="step-number step-number--orange text-caption font-weight-bold">
              {{ index + 1 }}
            </div>
            <div>
              <div class="text-body-2 font-weight-medium">{{ step.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ step.desc }}</div>
            </div>
          </div>
        </div>

        <v-divider class="my-4" />
        <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-2">
          {{ $t('howItWorks.requirements') }}
        </div>
        <div class="d-flex flex-column ga-1">
          <div v-for="(req, index) in qrRequirements" :key="index" class="d-flex align-center ga-2">
            <v-icon color="error" size="14">mdi-circle-small</v-icon>
            <span class="text-caption">{{ req }}</span>
          </div>
        </div>
        <v-alert type="warning" variant="tonal" rounded="lg" class="mt-4" density="compact">
          {{ $t('howItWorks.qrClock.note') }}
        </v-alert>
      </div>
    </v-card>

    <!-- Method 3: App Clock -->
    <v-card rounded="xl" border elevation="0" class="mb-4">
      <div class="d-flex align-center ga-3 pa-4 pb-3">
        <v-avatar color="success" size="40" rounded="lg">
          <v-icon color="white" size="22">mdi-cellphone-check</v-icon>
        </v-avatar>
        <div>
          <div class="text-body-1 font-weight-bold">{{ $t('howItWorks.appClock.title') }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ $t('howItWorks.appClock.subtitle') }}
          </div>
        </div>
        <v-spacer />
        <v-chip color="success" variant="tonal" size="small">{{ $t('howItWorks.manual') }}</v-chip>
      </div>
      <v-divider />
      <div class="pa-4">
        <div class="text-body-2 text-medium-emphasis mb-4">
          {{ $t('howItWorks.appClock.description') }}
        </div>

        <div class="d-flex flex-column ga-2">
          <div v-for="(step, index) in appSteps" :key="index" class="d-flex align-start ga-3">
            <div class="step-number step-number--green text-caption font-weight-bold">
              {{ index + 1 }}
            </div>
            <div>
              <div class="text-body-2 font-weight-medium">{{ step.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ step.desc }}</div>
            </div>
          </div>
        </div>

        <v-divider class="my-4" />
        <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-2">
          {{ $t('howItWorks.requirements') }}
        </div>
        <div class="d-flex flex-column ga-1">
          <div
            v-for="(req, index) in appRequirements"
            :key="index"
            class="d-flex align-center ga-2"
          >
            <v-icon color="error" size="14">mdi-circle-small</v-icon>
            <span class="text-caption">{{ req }}</span>
          </div>
        </div>
        <v-alert type="warning" variant="tonal" rounded="lg" class="mt-4" density="compact">
          {{ $t('howItWorks.appClock.note') }}
        </v-alert>
      </div>
    </v-card>

    <!-- Method 4: Face Checkin -->
    <v-card rounded="xl" border elevation="0" class="mb-4">
      <div class="d-flex align-center ga-3 pa-4 pb-3">
        <v-avatar color="action" size="40" rounded="lg">
          <v-icon color="white" size="22">mdi-face-man</v-icon>
        </v-avatar>
        <div>
          <div class="text-body-1 font-weight-bold">{{ $t('howItWorks.faceCheckin.title') }}</div>
          <div class="text-caption text-medium-emphasis">
            {{ $t('howItWorks.faceCheckin.subtitle') }}
          </div>
        </div>
        <v-spacer />
        <v-chip color="action" variant="tonal" size="small">{{
          $t('howItWorks.automatic')
        }}</v-chip>
      </div>
      <v-divider />
      <div class="pa-4">
        <div class="text-body-2 text-medium-emphasis mb-4">
          {{ $t('howItWorks.faceCheckin.description') }}
        </div>

        <div class="d-flex flex-column ga-2">
          <div
            v-for="(step, index) in faceCheckinSteps"
            :key="index"
            class="d-flex align-start ga-3"
          >
            <div class="step-number step-number--teal text-caption font-weight-bold">
              {{ index + 1 }}
            </div>
            <div>
              <div class="text-body-2 font-weight-medium">{{ step.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ step.desc }}</div>
            </div>
          </div>
        </div>

        <v-divider class="my-4" />
        <div class="text-caption font-weight-bold text-medium-emphasis text-uppercase mb-2">
          {{ $t('howItWorks.requirements') }}
        </div>
        <div class="d-flex flex-column ga-1">
          <div
            v-for="(req, index) in faceCheckinRequirements"
            :key="index"
            class="d-flex align-center ga-2"
          >
            <v-icon color="error" size="14">mdi-circle-small</v-icon>
            <span class="text-caption">{{ req }}</span>
          </div>
        </div>
      </div>
    </v-card>

    <!-- Method 5: KYC -->
    <v-card rounded="xl" border elevation="0" class="mb-4">
      <div class="d-flex align-center ga-3 pa-4 pb-3">
        <v-avatar color="accent" size="40" rounded="lg">
          <v-icon color="white" size="22">mdi-shield-account-outline</v-icon>
        </v-avatar>
        <div>
          <div class="text-body-1 font-weight-bold">{{ $t('howItWorks.kyc.title') }}</div>
          <div class="text-caption text-medium-emphasis">{{ $t('howItWorks.kyc.subtitle') }}</div>
        </div>
        <v-spacer />
        <v-chip color="accent" variant="tonal" size="small">{{
          $t('howItWorks.verification')
        }}</v-chip>
      </div>
      <v-divider />
      <div class="pa-4">
        <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
          {{ $t('howItWorks.kyc.distinction') }}
        </v-alert>
        <div class="text-body-2 text-medium-emphasis mb-4">
          {{ $t('howItWorks.kyc.description') }}
        </div>

        <div class="d-flex flex-column ga-2">
          <div v-for="(step, index) in kycSteps" :key="index" class="d-flex align-start ga-3">
            <div class="step-number step-number--purple text-caption font-weight-bold">
              {{ index + 1 }}
            </div>
            <div>
              <div class="text-body-2 font-weight-medium">{{ step.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ step.desc }}</div>
            </div>
          </div>
        </div>

        <v-btn
          variant="tonal"
          color="accent"
          rounded="lg"
          class="btn-shine mt-4"
          size="small"
          prepend-icon="mdi-face-recognition"
          to="/management/kyc"
        >
          {{ $t('nav.kycApproval') }}
        </v-btn>
      </div>
    </v-card>

    <!-- Where data ends up -->
    <v-card rounded="xl" border elevation="0" class="mb-4">
      <div class="d-flex align-center ga-3 pa-4 pb-3">
        <v-avatar color="secondary" size="40" rounded="lg">
          <v-icon color="white" size="22">mdi-database-check-outline</v-icon>
        </v-avatar>
        <div class="text-body-1 font-weight-bold">{{ $t('howItWorks.dataStorage.title') }}</div>
      </div>
      <v-divider />
      <div class="pa-4">
        <div class="text-body-2 text-medium-emphasis mb-4">
          {{ $t('howItWorks.dataStorage.description') }}
        </div>
        <div class="d-flex flex-wrap ga-2">
          <v-chip prepend-icon="mdi-clock-in" color="success" variant="tonal" size="small">
            {{ $t('howItWorks.dataStorage.clockIn') }}
          </v-chip>
          <v-chip prepend-icon="mdi-clock-out" color="primary" variant="tonal" size="small">
            {{ $t('howItWorks.dataStorage.clockOut') }}
          </v-chip>
          <v-chip prepend-icon="mdi-calendar-today" color="secondary" variant="tonal" size="small">
            {{ $t('howItWorks.dataStorage.date') }}
          </v-chip>
          <v-chip prepend-icon="mdi-account" color="warning" variant="tonal" size="small">
            {{ $t('howItWorks.dataStorage.employee') }}
          </v-chip>
          <v-chip prepend-icon="mdi-source-branch" color="info" variant="tonal" size="small">
            {{ $t('howItWorks.dataStorage.source') }}
          </v-chip>
        </div>
        <v-btn
          variant="tonal"
          color="primary"
          rounded="lg"
          class="btn-shine mt-4"
          size="small"
          prepend-icon="mdi-clipboard-clock-outline"
          to="/management/attendance-logs"
        >
          {{ $t('howItWorks.dataStorage.viewLogs') }}
        </v-btn>
      </div>
    </v-card>

    <!-- Clock-in / Clock-out logic -->
    <v-card rounded="xl" border elevation="0">
      <div class="d-flex align-center ga-3 pa-4 pb-3">
        <v-avatar color="accent" size="40" rounded="lg">
          <v-icon color="white" size="22">mdi-information-outline</v-icon>
        </v-avatar>
        <div class="text-body-1 font-weight-bold">{{ $t('howItWorks.logic.title') }}</div>
      </div>
      <v-divider />
      <div class="pa-4">
        <v-row>
          <v-col cols="12" sm="6">
            <div class="d-flex align-start ga-2 mb-3">
              <v-icon color="success" size="18" class="mt-0.5">mdi-login</v-icon>
              <div>
                <div class="text-body-2 font-weight-medium">
                  {{ $t('howItWorks.logic.clockIn') }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ $t('howItWorks.logic.clockInDesc') }}
                </div>
              </div>
            </div>
          </v-col>
          <v-col cols="12" sm="6">
            <div class="d-flex align-start ga-2 mb-3">
              <v-icon color="primary" size="18" class="mt-0.5">mdi-logout</v-icon>
              <div>
                <div class="text-body-2 font-weight-medium">
                  {{ $t('howItWorks.logic.clockOut') }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ $t('howItWorks.logic.clockOutDesc') }}
                </div>
              </div>
            </div>
          </v-col>
          <v-col cols="12" sm="6">
            <div class="d-flex align-start ga-2">
              <v-icon color="warning" size="18" class="mt-0.5">mdi-clock-alert-outline</v-icon>
              <div>
                <div class="text-body-2 font-weight-medium">
                  {{ $t('howItWorks.logic.forgotClock') }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ $t('howItWorks.logic.forgotClockDesc') }}
                </div>
              </div>
            </div>
          </v-col>
          <v-col cols="12" sm="6">
            <div class="d-flex align-start ga-2">
              <v-icon color="info" size="18" class="mt-0.5">mdi-ip-network-outline</v-icon>
              <div>
                <div class="text-body-2 font-weight-medium">
                  {{ $t('howItWorks.logic.ipWhitelist') }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ $t('howItWorks.logic.ipWhitelistDesc') }}
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </div>
    </v-card>
  </v-container>
</template>

<script lang="ts" setup>
/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.how-it-works.index',
})
/* END DEFINE */

const { t } = useI18n()

/** START DEFINE COMPUTED */
const zkSteps = computed(() => [
  { title: t('howItWorks.zkDevice.step1Title'), desc: t('howItWorks.zkDevice.step1Desc') },
  { title: t('howItWorks.zkDevice.step2Title'), desc: t('howItWorks.zkDevice.step2Desc') },
  { title: t('howItWorks.zkDevice.step3Title'), desc: t('howItWorks.zkDevice.step3Desc') },
  { title: t('howItWorks.zkDevice.step4Title'), desc: t('howItWorks.zkDevice.step4Desc') },
])

const qrSteps = computed(() => [
  { title: t('howItWorks.qrClock.step1Title'), desc: t('howItWorks.qrClock.step1Desc') },
  { title: t('howItWorks.qrClock.step2Title'), desc: t('howItWorks.qrClock.step2Desc') },
  { title: t('howItWorks.qrClock.step3Title'), desc: t('howItWorks.qrClock.step3Desc') },
])

const appSteps = computed(() => [
  { title: t('howItWorks.appClock.step1Title'), desc: t('howItWorks.appClock.step1Desc') },
  { title: t('howItWorks.appClock.step2Title'), desc: t('howItWorks.appClock.step2Desc') },
  { title: t('howItWorks.appClock.step3Title'), desc: t('howItWorks.appClock.step3Desc') },
])

const faceCheckinSteps = computed(() => [
  { title: t('howItWorks.faceCheckin.step1Title'), desc: t('howItWorks.faceCheckin.step1Desc') },
  { title: t('howItWorks.faceCheckin.step2Title'), desc: t('howItWorks.faceCheckin.step2Desc') },
  { title: t('howItWorks.faceCheckin.step3Title'), desc: t('howItWorks.faceCheckin.step3Desc') },
])

const kycSteps = computed(() => [
  { title: t('howItWorks.kyc.step1Title'), desc: t('howItWorks.kyc.step1Desc') },
  { title: t('howItWorks.kyc.step2Title'), desc: t('howItWorks.kyc.step2Desc') },
  { title: t('howItWorks.kyc.step3Title'), desc: t('howItWorks.kyc.step3Desc') },
])

const prerequisites = computed(() => [
  {
    title: t('howItWorks.prerequisites.employeeDepartment'),
    desc: t('howItWorks.prerequisites.employeeDepartmentDesc'),
  },
  {
    title: t('howItWorks.prerequisites.companyConfigured'),
    desc: t('howItWorks.prerequisites.companyConfiguredDesc'),
  },
  {
    title: t('howItWorks.prerequisites.userAccount'),
    desc: t('howItWorks.prerequisites.userAccountDesc'),
  },
])

const zkRequirements = computed(() => [
  t('howItWorks.zkDevice.req1'),
  t('howItWorks.zkDevice.req2'),
  t('howItWorks.zkDevice.req3'),
])

const qrRequirements = computed(() => [
  t('howItWorks.qrClock.req1'),
  t('howItWorks.qrClock.req2'),
  t('howItWorks.qrClock.req3'),
])

const appRequirements = computed(() => [
  t('howItWorks.appClock.req1'),
  t('howItWorks.appClock.req2'),
])

const faceCheckinRequirements = computed(() => [
  t('howItWorks.faceCheckin.req1'),
  t('howItWorks.faceCheckin.req2'),
  t('howItWorks.faceCheckin.req3'),
  t('howItWorks.faceCheckin.req4'),
])
/* END DEFINE COMPUTED */
</script>

<style scoped>
.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  min-width: 22px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.15);
  color: rgb(var(--v-theme-primary));
  font-size: 11px;
  font-weight: 700;
}

.step-number--orange {
  background: rgba(var(--v-theme-deep-orange), 0.15);
  color: rgb(var(--v-theme-deep-orange));
}

.step-number--green {
  background: rgba(var(--v-theme-success), 0.15);
  color: rgb(var(--v-theme-success));
}

.step-number--purple {
  background: rgba(var(--v-theme-purple), 0.15);
  color: rgb(var(--v-theme-purple));
}

.step-number--teal {
  background: rgba(var(--v-theme-teal), 0.15);
  color: rgb(var(--v-theme-teal));
}
</style>
