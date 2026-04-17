<template>
  <v-container class="py-8" max-width="860">
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <div class="text-h5 font-weight-bold">{{ $t('profile.title') }}</div>
      </div>
      <div class="d-flex ga-2">
        <v-btn color="primary" prepend-icon="mdi-pencil-outline" :to="{ name: 'profile.edit' }">
          {{ $t('profile.editProfile') }}
        </v-btn>
      </div>
    </div>

    <!-- Avatar & identity card -->
    <v-card rounded="lg" class="mb-4">
      <v-card-text class="pa-6">
        <div class="d-flex flex-wrap align-start justify-space-between ga-6">
          <!-- Left: avatar + info -->
          <div class="d-flex align-center ga-6">
            <AvatarUpload
              :current-avatar="user?.avatar ?? ''"
              :full-name="user?.full_name ?? ''"
              :size="88"
              @saved="onAvatarSaved"
            />
            <div>
              <div class="text-h5 font-weight-bold">{{ user?.full_name }}</div>
              <div class="text-body-1 text-medium-emphasis">{{ user?.position ?? '—' }}</div>
              <div class="text-body-2 text-medium-emphasis mt-1">
                <v-icon size="14" class="mr-1">mdi-email-outline</v-icon>{{ user?.email }}
              </div>
              <div class="text-caption text-medium-emphasis">
                <v-icon size="12" class="mr-1">mdi-account-circle-outline</v-icon>@{{
                  user?.username
                }}
              </div>
              <div class="d-flex flex-wrap ga-1 mt-2">
                <v-chip
                  v-if="getHighestRole(user?.roles ?? [])"
                  size="x-small"
                  :color="getRoleColor(getHighestRole(user?.roles ?? [])!)"
                  variant="tonal"
                >
                  {{ getHighestRole(user?.roles ?? []) }}
                </v-chip>

                <!-- Face approved badge — visible once KYC is approved -->
                <v-tooltip v-if="user?.kyc_status === 'approved'" location="bottom">
                  <template #activator="{ props }">
                    <v-chip
                      v-bind="props"
                      size="x-small"
                      color="success"
                      variant="tonal"
                      prepend-icon="mdi-face-recognition"
                    >
                      {{ $t('face.kyc.approvedLabel') }}
                    </v-chip>
                  </template>
                  {{ $t('face.kyc.approvedTooltip') }}
                </v-tooltip>
              </div>
            </div>
          </div>

          <!-- Right: KYC status panel — hidden once approved -->
          <KycStatusPanel @open-kyc="kycDialog = true" />
        </div>
      </v-card-text>
    </v-card>

    <v-row>
      <!-- Personal information -->
      <v-col cols="12" md="6">
        <v-card rounded="lg" height="100%">
          <v-card-title class="pa-5 pb-3 text-body-1 font-weight-bold">
            <v-icon size="18" color="primary" class="mr-2">mdi-account-outline</v-icon
            >{{ $t('profile.personalInfo') }}
          </v-card-title>
          <v-divider></v-divider>
          <v-list density="compact" class="pa-2">
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-card-account-details-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>{{ $t('profile.firstName') }}</v-list-item-subtitle>
              <v-list-item-title>{{ user?.first_name ?? '—' }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-card-account-details-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>{{ $t('profile.lastName') }}</v-list-item-subtitle>
              <v-list-item-title>{{ user?.last_name ?? '—' }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3">mdi-phone-outline</v-icon>
              </template>
              <v-list-item-subtitle>{{ $t('profile.phone') }}</v-list-item-subtitle>
              <v-list-item-title>{{ user?.phone_number ?? '—' }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-map-marker-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>{{ $t('profile.address') }}</v-list-item-subtitle>
              <v-list-item-title>{{ user?.address ?? '—' }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-cake-variant-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>{{ $t('profile.dateOfBirth') }}</v-list-item-subtitle>
              <v-list-item-title>{{ formatDate(user?.date_of_birth) }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Employment information -->
      <v-col cols="12" md="6">
        <v-card rounded="lg" height="100%">
          <v-card-title class="pa-5 pb-3 text-body-1 font-weight-bold">
            <v-icon size="18" color="primary" class="mr-2">mdi-briefcase-outline</v-icon
            >{{ $t('profile.employmentInfo') }}
          </v-card-title>
          <v-divider></v-divider>
          <v-list density="compact" class="pa-2">
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-briefcase-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>{{ $t('profile.position') }}</v-list-item-subtitle>
              <v-list-item-title>{{ user?.position ?? '—' }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-office-building-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>{{ $t('profile.company') }}</v-list-item-subtitle>
              <v-list-item-title>{{
                user?.user_departments?.[0]?.company?.name ?? '—'
              }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-calendar-account-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>{{ $t('profile.joinDate') }}</v-list-item-subtitle>
              <v-list-item-title>{{ formatDate(user?.join_date) }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3">mdi-file-sign</v-icon>
              </template>
              <v-list-item-subtitle>{{ $t('profile.contract') }}</v-list-item-subtitle>
              <v-list-item-title>
                <template v-if="user?.contract_type">
                  <v-chip
                    size="x-small"
                    :color="contractTypeColor(user.contract_type)"
                    variant="tonal"
                  >
                    {{ contractTypeLabel(user.contract_type) }}
                  </v-chip>
                </template>
                <span v-else>—</span>
              </v-list-item-title>
              <v-list-item-subtitle v-if="user?.contract_count || user?.contract_signed_date">
                <span class="text-caption">
                  #{{ user.contract_count }}
                  <template v-if="user.contract_signed_date">
                    · {{ formatDate(user.contract_signed_date) }}
                    <template v-if="user.contract_expired_date">
                      → {{ formatDate(user.contract_expired_date) }}
                    </template>
                  </template>
                </span>
              </v-list-item-subtitle>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-clock-time-eight-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>{{ $t('profile.annualLeaveHours') }}</v-list-item-subtitle>
              <v-list-item-title>{{ user?.annual_leave_hours ?? '—' }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-clock-check-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>{{ $t('profile.remainingLeaveHours') }}</v-list-item-subtitle>
              <v-list-item-title>{{ user?.remaining_leave_hours ?? '—' }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Attendance history -->
    <v-card rounded="lg" class="mt-4">
      <v-card-title class="pa-5 pb-3 d-flex align-center justify-space-between flex-wrap ga-3">
        <div class="d-flex align-center">
          <v-icon size="18" color="primary" class="mr-2">mdi-calendar-clock</v-icon>
          <span class="text-body-1 font-weight-bold">{{ $t('profile.attendanceHistory') }}</span>
        </div>
        <div class="d-flex ga-2">
          <v-select
            v-model="selectedMonth"
            :items="monthOptions"
            item-title="label"
            item-value="value"
            :label="$t('requests.filterByMonth')"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            hide-details
            style="min-width: 130px"
          />
          <v-select
            v-model="selectedYear"
            :items="yearOptions"
            :label="$t('requests.filterByYear')"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            hide-details
            style="min-width: 100px"
          />
        </div>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-0">
        <div v-if="isLoadingAttendance" class="d-flex justify-center pa-6">
          <v-progress-circular indeterminate color="primary" size="32" />
        </div>
        <div
          v-else-if="attendanceLogs.length === 0"
          class="text-center text-medium-emphasis text-body-2 pa-8"
        >
          <v-icon size="40" class="mb-2 d-block" color="medium-emphasis"
            >mdi-calendar-blank-outline</v-icon
          >
          {{ $t('profile.noAttendanceLogs') }}
        </div>
        <v-table v-else density="compact">
          <thead>
            <tr>
              <th class="text-left">{{ $t('common.date') }}</th>
              <th class="text-left">{{ $t('profile.scheduledHours') }}</th>
              <th class="text-left">{{ $t('home.clockIn') }}</th>
              <th class="text-left">{{ $t('home.clockOut') }}</th>
              <th class="text-left">{{ $t('common.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in attendanceLogs" :key="log.id">
              <td class="text-body-2">{{ log.date }}</td>
              <td class="text-body-2 text-medium-emphasis">
                <span v-if="log.scheduled_start && log.scheduled_end">
                  {{ log.scheduled_start.substring(0, 5) }} –
                  {{ log.scheduled_end.substring(0, 5) }}
                </span>
                <span v-else>—</span>
              </td>
              <td class="text-body-2">
                <span v-if="log.clock_in" class="text-success">
                  {{ log.clock_in.substring(0, 5) }}
                </span>
                <span v-else class="text-medium-emphasis">—</span>
              </td>
              <td class="text-body-2">
                <span v-if="log.clock_out" class="text-medium-emphasis">
                  {{ log.clock_out.substring(0, 5) }}
                </span>
                <span v-else class="text-medium-emphasis">—</span>
              </td>
              <td>
                <v-chip
                  :color="log.attendance_count > 0 ? 'success' : 'error'"
                  size="x-small"
                  variant="tonal"
                >
                  {{ log.attendance_count > 0 ? $t('profile.present') : $t('profile.absent') }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>

  <!-- KYC registration dialog -->
  <v-dialog v-model="kycDialog" max-width="540" persistent>
    <FaceRegister
      v-if="kycDialog && user"
      :employee-id="user.id"
      :employee-name="user.full_name ?? ''"
      @registered="onKycSubmitted"
      @close="kycDialog = false"
    />
  </v-dialog>

  <!-- Bug report dialog -->
  <DialogReportBug
    :dialog="dialogReportBug"
    @confirm="handleBugReportConfirm"
    @close-modal="dialogReportBug = false"
  />
</template>

<script lang="ts" setup>
/** START IMPORT */
import DialogReportBug from '@/components/common/DialogReportBug.vue'
import AvatarUpload from '@/components/profile/AvatarUpload.vue'
import FaceRegister from '@/components/face/FaceRegister.vue'
import KycStatusPanel from '@/components/kyc/KycStatusPanel.vue'
import AttendanceLogService from '@/services/AttendanceLogService'
import { useMoment } from '@/composables/useMoment'
import type { AttendanceLogModel } from '@/interfaces/models/AttendanceLogModel'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  layout: 'default',
  name: 'profile.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const { t } = useI18n()
const userStore = useUserStore()
const user = computed(() => userStore.user)
const dialogReportBug = ref(false)
const kycDialog = ref(false)

const { moment } = useMoment()
const now = moment()
const attendanceLogs = ref<AttendanceLogModel[]>([])
const isLoadingAttendance = ref(false)
const selectedMonth = ref(now.month() + 1)
const selectedYear = ref(now.year())

const monthOptions = computed(() =>
  Array.from({ length: 12 }, (_, index) => ({
    label: t(`months.${index + 1}`),
    value: index + 1,
  })),
)
const yearOptions = Array.from({ length: 3 }, (_, index) => now.year() - index)
/* END DEFINE STATE */

/** START DEFINE METHOD */
function normalizeRole(role: string): string {
  return role.toLowerCase().replace(/[\s_]+/g, '')
}

function getRolePriority(role: string): number {
  const normalized = normalizeRole(role)
  if (normalized === 'superadmin' || normalized === 'super') return 3
  if (normalized === 'admin') return 2
  return 1
}

function getHighestRole(roles: string[]): string | null {
  if (!roles.length) return null
  return roles.reduce((highest, role) => {
    return getRolePriority(role) > getRolePriority(highest) ? role : highest
  })
}

function getRoleColor(role: string): string {
  const priority = getRolePriority(role)
  if (priority === 3) return 'error'
  if (priority === 2) return 'warning'
  return 'primary'
}

const loadAttendanceLogs = async () => {
  if (isLoadingAttendance.value) return

  try {
    isLoadingAttendance.value = true
    const month = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`
    attendanceLogs.value = await AttendanceLogService.getMyHistory(month)
  } catch (error) {
    console.error('Failed to load attendance logs:', error)
  } finally {
    isLoadingAttendance.value = false
  }
}

const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  return value.substring(0, 10)
}

const contractTypeLabel = (type?: string | null): string => {
  if (type === 'probation') return t('users.contractTypeProbation')
  if (type === 'fixed_term') return t('users.contractTypeFixedTerm')
  if (type === 'indefinite') return t('users.contractTypeIndefinite')
  return type ?? '—'
}

const contractTypeColor = (type?: string | null): string => {
  if (type === 'probation') return 'warning'
  if (type === 'fixed_term') return 'info'
  if (type === 'indefinite') return 'success'
  return 'default'
}

const handleBugReportConfirm = () => {
  dialogReportBug.value = false
}

const onAvatarSaved = () => {
  // User store already updated inside AvatarUpload
}

const onKycSubmitted = (updatedUser: {
  face_avatar_url?: string | null
  kyc_status?: 'pending' | 'approved' | 'rejected' | null
}) => {
  if (userStore.user) {
    userStore.user.face_avatar_url = updatedUser.face_avatar_url ?? null
    userStore.user.kyc_status = updatedUser.kyc_status ?? null
  }

  kycDialog.value = false
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch([selectedMonth, selectedYear], () => {
  loadAttendanceLogs()
})
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  userStore.getUser()
  loadAttendanceLogs()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>
