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
                  v-for="role in user?.roles"
                  :key="role"
                  size="x-small"
                  color="primary"
                  variant="tonal"
                >
                  {{ role }}
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
              <v-list-item-subtitle>{{ $t('profile.contractType') }}</v-list-item-subtitle>
              <v-list-item-title>{{ user?.contract_type ?? '—' }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-calendar-check-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>{{ $t('profile.contractSignedDate') }}</v-list-item-subtitle>
              <v-list-item-title>{{ formatDate(user?.contract_signed_date) }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3"
                  >mdi-calendar-remove-outline</v-icon
                >
              </template>
              <v-list-item-subtitle>{{ $t('profile.contractExpiredDate') }}</v-list-item-subtitle>
              <v-list-item-title>{{ formatDate(user?.contract_expired_date) }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template #prepend>
                <v-icon size="16" color="medium-emphasis" class="mr-3">mdi-counter</v-icon>
              </template>
              <v-list-item-subtitle>{{ $t('profile.contractCount') }}</v-list-item-subtitle>
              <v-list-item-title>{{ user?.contract_count ?? '—' }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
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
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  layout: 'default',
  name: 'profile.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const userStore = useUserStore()
const user = computed(() => userStore.user)
const dialogReportBug = ref(false)
const kycDialog = ref(false)
/* END DEFINE STATE */

/** START DEFINE METHOD */
const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  return value.substring(0, 10)
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

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  userStore.getUser()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>
