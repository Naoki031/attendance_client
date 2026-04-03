<template>
  <v-container class="py-8" max-width="1100">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <div class="text-h5 font-weight-bold">{{ $t('face.kyc.reviewTitle') }}</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
          {{ $t('face.kyc.pendingCount', { count: users.length }) }}
        </div>
      </div>
      <v-btn-toggle v-model="tabFilter" mandatory density="compact" rounded="lg" color="primary">
        <v-btn value="pending" size="small">{{ $t('face.kyc.statusPending') }}</v-btn>
        <v-btn value="approved" size="small">{{ $t('face.kyc.statusApproved') }}</v-btn>
        <v-btn value="rejected" size="small">{{ $t('face.kyc.statusRejected') }}</v-btn>
      </v-btn-toggle>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Empty state -->
    <div v-else-if="users.length === 0" class="text-center py-16">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-face-recognition</v-icon>
      <div class="text-body-1 text-medium-emphasis">
        {{ tabFilter === 'pending' ? $t('face.kyc.noPending') : $t('face.kyc.noSubmission') }}
      </div>
    </div>

    <!-- KYC cards grid -->
    <v-row v-else>
      <v-col v-for="item in users" :key="item.id" cols="12" sm="6" md="4">
        <KycAdminCard
          :user="item"
          :tab-filter="tabFilter"
          :loading-id="loadingId"
          :review-action="reviewAction"
          @approve="submitReview($event, 'approved')"
          @reject="openRejectDialog"
        />
      </v-col>
    </v-row>

    <KycRejectDialog
      :dialog="rejectDialog"
      :user="rejectTarget"
      :loading="!!loadingId"
      @confirm="submitReview(rejectTarget!, 'rejected', $event)"
      @close="rejectDialog = false"
    />

    <v-snackbar v-model="errorSnackbar" color="error" :timeout="4000" location="bottom right">
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import KycAdminCard from '@/components/kyc/KycAdminCard.vue'
import KycRejectDialog from '@/components/kyc/KycRejectDialog.vue'
import UserService from '@/services/UserService'
import FaceAttendanceService from '@/services/FaceAttendanceService'
import type { UserModel } from '@/interfaces/models/UserModel'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  layout: 'default',
  name: 'admin.kyc.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const users = ref<UserModel[]>([])
const loading = ref(false)
const loadingId = ref<number | null>(null)
const reviewAction = ref<'approved' | 'rejected' | null>(null)
const tabFilter = ref<'pending' | 'approved' | 'rejected'>('pending')
const rejectDialog = ref(false)
const rejectTarget = ref<UserModel | null>(null)
const errorSnackbar = ref(false)
const errorMessage = ref<string>('')
/* END DEFINE STATE */

/** START DEFINE METHOD */
const loadUsers = async () => {
  loading.value = true

  try {
    users.value = await UserService.filter({ kycStatus: tabFilter.value })
  } finally {
    loading.value = false
  }
}

const openRejectDialog = (item: UserModel) => {
  rejectTarget.value = item
  rejectDialog.value = true
}

const submitReview = async (
  item: UserModel,
  status: 'approved' | 'rejected',
  rejectionReason?: string,
) => {
  if (!item.id) return

  loadingId.value = item.id
  reviewAction.value = status

  try {
    await FaceAttendanceService.reviewKyc(item.id, status, rejectionReason || undefined)
    users.value = users.value.filter((userItem) => userItem.id !== item.id)
    rejectDialog.value = false
  } catch (error) {
    console.error('KYC review error:', error)
    errorMessage.value =
      error instanceof Error ? error.message : 'Failed to submit KYC review. Please try again.'
    errorSnackbar.value = true
  } finally {
    loadingId.value = null
    reviewAction.value = null
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(tabFilter, loadUsers)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(loadUsers)
/* END DEFINE LIFE CYCLE HOOK */
</script>
