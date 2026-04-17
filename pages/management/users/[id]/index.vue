<template>
  <v-container fluid class="py-6 px-6">
    <!-- Back navigation -->
    <div class="mb-4">
      <v-btn icon variant="text" size="small" to="/management/users">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
    </div>

    <!-- Profile banner -->
    <v-skeleton-loader v-if="isLoading" type="card" rounded="xl" height="100" class="mb-6" />
    <v-card v-else-if="user" rounded="xl" elevation="0" border class="mb-6">
      <div class="px-6 py-5 d-flex align-center ga-5">
        <v-avatar size="72" color="primary" class="flex-shrink-0">
          <v-img v-if="user.avatar" :src="user.avatar" cover />
          <span v-else class="text-h6 font-weight-bold text-white">{{ getInitials(user) }}</span>
        </v-avatar>
        <div class="flex-grow-1" style="min-width: 0">
          <div class="d-flex align-center flex-wrap ga-2 mb-1">
            <span class="text-h5 font-weight-bold text-truncate">{{ user.full_name }}</span>
            <v-chip
              :color="user.is_activated ? 'success' : 'default'"
              size="x-small"
              variant="tonal"
              class="flex-shrink-0"
            >
              {{ user.is_activated ? $t('common.active') : $t('common.inactive') }}
            </v-chip>
          </div>
          <div class="text-body-2 text-medium-emphasis text-truncate">
            {{ [user.position, user.email].filter(Boolean).join(' · ') }}
          </div>
        </div>
      </div>
    </v-card>

    <!-- Loading skeleton cards -->
    <v-row v-if="isLoading">
      <v-col cols="12" md="8">
        <v-skeleton-loader type="card" rounded="xl" class="mb-4"></v-skeleton-loader>
        <v-skeleton-loader type="card" rounded="xl"></v-skeleton-loader>
      </v-col>
      <v-col cols="12" md="4">
        <v-skeleton-loader type="card" rounded="xl" class="mb-4"></v-skeleton-loader>
        <v-skeleton-loader type="card" rounded="xl"></v-skeleton-loader>
      </v-col>
    </v-row>

    <template v-else-if="user">
      <v-row>
        <!-- Left column: basic info + contract history -->
        <v-col cols="12" md="8">
          <!-- Basic information -->
          <v-card rounded="xl" elevation="0" border class="mb-4">
            <div class="px-5 pt-5 pb-2">
              <div class="text-subtitle-2 font-weight-bold text-primary mb-4">
                {{ $t('profile.basicInfo').toUpperCase() }}
              </div>
              <v-row dense>
                <v-col cols="6">
                  <div class="info-label">{{ $t('common.id').toUpperCase() }}</div>
                  <div class="info-value">{{ user.id }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('profile.position').toUpperCase() }}</div>
                  <div class="info-value">{{ user.position ?? '—' }}</div>
                </v-col>
                <v-col cols="12">
                  <div class="info-label">{{ $t('profile.email').toUpperCase() }}</div>
                  <div class="info-value">{{ user.email }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('profile.username').toUpperCase() }}</div>
                  <div class="info-value">{{ user.username ?? '—' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('profile.joinDate').toUpperCase() }}</div>
                  <div class="info-value">{{ user.join_date ?? '—' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('common.phone').toUpperCase() }}</div>
                  <div class="info-value">{{ user.phone_number ?? '—' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('profile.dateOfBirth').toUpperCase() }}</div>
                  <div class="info-value">{{ user.date_of_birth ?? '—' }}</div>
                </v-col>
                <v-col cols="12">
                  <div class="info-label">{{ $t('profile.address').toUpperCase() }}</div>
                  <div class="info-value">{{ user.address ?? '—' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('profile.slackId').toUpperCase() }}</div>
                  <div class="info-value">{{ user.slack_id ?? '—' }}</div>
                </v-col>
              </v-row>
            </div>
          </v-card>

          <!-- Contract History -->
          <v-card rounded="xl" elevation="0" border>
            <div class="px-5 pt-5 pb-4">
              <!-- Section title -->
              <div class="text-subtitle-2 font-weight-bold text-primary mb-3">
                {{ $t('users.sectionContracts').toUpperCase() }}
              </div>

              <!-- Expiry reminder days (below title, not inline with it) -->
              <div class="d-flex align-center ga-2 mb-4">
                <v-text-field
                  v-model.number="editReminderDays"
                  :label="$t('users.contractExpiryReminderDays')"
                  variant="outlined"
                  density="compact"
                  rounded="lg"
                  type="number"
                  min="1"
                  max="365"
                  hide-details
                  style="max-width: 220px"
                  @blur="saveReminderDays"
                  @keydown.enter="saveReminderDays"
                />
                <v-tooltip location="bottom">
                  <template #activator="{ props: tooltipProps }">
                    <v-icon v-bind="tooltipProps" size="16" color="medium-emphasis">
                      mdi-information-outline
                    </v-icon>
                  </template>
                  {{ $t('users.contractExpiryReminderDaysHint', { days: editReminderDays }) }}
                </v-tooltip>
              </div>

              <!-- Loading state -->
              <div v-if="isLoadingContracts" class="d-flex justify-center py-4">
                <v-progress-circular indeterminate color="primary" size="24" />
              </div>

              <template v-else>
                <!-- Contract list -->
                <div v-if="contracts.length > 0" class="mb-4">
                  <div v-for="contract in contracts" :key="contract.id" class="contract-row">
                    <!-- View mode: two-line layout -->
                    <div v-if="editingContractId !== contract.id" class="py-2">
                      <!-- Line 1: chips + action buttons -->
                      <div class="d-flex align-center ga-1 mb-1">
                        <v-chip size="small" color="primary" variant="tonal">
                          #{{ contract.contract_number }}
                        </v-chip>
                        <v-chip
                          size="small"
                          :color="contractTypeColor(contract.contract_type)"
                          variant="tonal"
                        >
                          {{ contractTypeLabel(contract.contract_type) }}
                        </v-chip>
                        <v-spacer />
                        <v-btn
                          icon
                          variant="text"
                          size="x-small"
                          color="default"
                          @click="startEdit(contract)"
                        >
                          <v-icon size="16">mdi-pencil-outline</v-icon>
                        </v-btn>
                        <v-btn
                          icon
                          variant="text"
                          size="x-small"
                          color="error"
                          @click="confirmDelete(contract)"
                        >
                          <v-icon size="16">mdi-delete-outline</v-icon>
                        </v-btn>
                      </div>
                      <!-- Line 2: dates + notes -->
                      <div class="text-body-2 text-medium-emphasis pl-1">
                        {{ contract.signed_date }}
                        <span class="mx-1">→</span>
                        {{ contract.expired_date ?? $t('users.contractTypeIndefinite') }}
                        <span v-if="contract.notes"> · {{ contract.notes }}</span>
                      </div>
                    </div>

                    <!-- Edit mode -->
                    <div
                      v-else
                      class="rounded-lg pa-3 my-1"
                      style="
                        background: rgba(var(--v-theme-on-surface), 0.04);
                        border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
                      "
                    >
                      <div class="text-caption text-medium-emphasis mb-2">
                        {{ $t('users.editContract') }} #{{ contract.contract_number }}
                      </div>
                      <v-row dense>
                        <v-col cols="12" sm="6">
                          <div class="field-label">
                            {{ $t('users.contractType').toUpperCase() }}
                            <span class="text-error">*</span>
                          </div>
                          <v-select
                            v-model="editType"
                            :items="contractTypeOptions"
                            item-title="label"
                            item-value="value"
                            variant="filled"
                            rounded="lg"
                            flat
                            density="comfortable"
                          />
                        </v-col>

                        <v-col cols="12" sm="6">
                          <div class="field-label">
                            {{ $t('users.contractSignedDate').toUpperCase() }}
                            <span class="text-error">*</span>
                          </div>
                          <v-menu v-model="menuEditSignedDate" :close-on-content-click="false">
                            <template #activator="{ props: menuProps }">
                              <v-text-field
                                v-bind="menuProps"
                                :model-value="editSignedDate"
                                variant="filled"
                                rounded="lg"
                                flat
                                density="comfortable"
                                prepend-inner-icon="mdi-calendar-edit"
                                readonly
                              />
                            </template>
                            <v-date-picker
                              :model-value="toPickerDate(editSignedDate)"
                              hide-header
                              @update:model-value="
                                (selectedDate: Date) => {
                                  editSignedDate = formatDate(selectedDate)
                                  menuEditSignedDate = false
                                }
                              "
                            />
                          </v-menu>
                        </v-col>

                        <v-col v-if="editType !== 'indefinite'" cols="12" sm="6">
                          <div class="field-label">
                            {{ $t('users.contractExpiredDate').toUpperCase() }}
                          </div>
                          <v-menu v-model="menuEditExpiredDate" :close-on-content-click="false">
                            <template #activator="{ props: menuProps }">
                              <v-text-field
                                v-bind="menuProps"
                                :model-value="editExpiredDate"
                                variant="filled"
                                rounded="lg"
                                flat
                                density="comfortable"
                                prepend-inner-icon="mdi-calendar-remove"
                                :placeholder="$t('users.contractExpiredDateHint')"
                                readonly
                              />
                            </template>
                            <v-date-picker
                              :model-value="toPickerDate(editExpiredDate)"
                              hide-header
                              @update:model-value="
                                (selectedDate: Date) => {
                                  editExpiredDate = formatDate(selectedDate)
                                  menuEditExpiredDate = false
                                }
                              "
                            />
                          </v-menu>
                        </v-col>

                        <v-col cols="12" :sm="editType !== 'indefinite' ? 6 : 12">
                          <div class="field-label">
                            {{ $t('users.contractNotes').toUpperCase() }}
                          </div>
                          <v-text-field
                            v-model="editNotes"
                            variant="filled"
                            rounded="lg"
                            flat
                            density="comfortable"
                            autocomplete="off"
                          />
                        </v-col>

                        <v-col cols="12" class="d-flex ga-2">
                          <v-btn variant="text" size="small" @click="cancelEdit">
                            {{ $t('common.cancel') }}
                          </v-btn>
                          <v-btn
                            variant="tonal"
                            color="primary"
                            size="small"
                            :loading="isUpdating"
                            :disabled="!editType || !editSignedDate"
                            @click="saveEdit"
                          >
                            {{ $t('common.save') }}
                          </v-btn>
                        </v-col>
                      </v-row>
                    </div>
                  </div>
                </div>

                <div v-else-if="!showAddForm" class="text-body-2 text-medium-emphasis py-1 mb-3">
                  {{ $t('users.noContracts') }}
                </div>

                <!-- Inline add contract form -->
                <div
                  v-if="showAddForm"
                  class="rounded-lg pa-3 mb-3"
                  style="
                    background: rgba(var(--v-theme-on-surface), 0.04);
                    border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
                  "
                >
                  <v-row dense>
                    <v-col cols="12" sm="6">
                      <div class="field-label">
                        {{ $t('users.contractType').toUpperCase() }}
                        <span class="text-error">*</span>
                      </div>
                      <v-select
                        v-model="newType"
                        :items="contractTypeOptions"
                        item-title="label"
                        item-value="value"
                        variant="filled"
                        rounded="lg"
                        flat
                        density="comfortable"
                      />
                    </v-col>

                    <v-col cols="12" sm="6">
                      <div class="field-label">
                        {{ $t('users.contractSignedDate').toUpperCase() }}
                        <span class="text-error">*</span>
                      </div>
                      <v-menu v-model="menuSignedDate" :close-on-content-click="false">
                        <template #activator="{ props: menuProps }">
                          <v-text-field
                            v-bind="menuProps"
                            :model-value="newSignedDate"
                            variant="filled"
                            rounded="lg"
                            flat
                            density="comfortable"
                            prepend-inner-icon="mdi-calendar-edit"
                            readonly
                          />
                        </template>
                        <v-date-picker
                          :model-value="toPickerDate(newSignedDate)"
                          hide-header
                          @update:model-value="
                            (selectedDate: Date) => {
                              newSignedDate = formatDate(selectedDate)
                              menuSignedDate = false
                            }
                          "
                        />
                      </v-menu>
                    </v-col>

                    <v-col v-if="newType !== 'indefinite'" cols="12" sm="6">
                      <div class="field-label">
                        {{ $t('users.contractExpiredDate').toUpperCase() }}
                      </div>
                      <v-menu v-model="menuExpiredDate" :close-on-content-click="false">
                        <template #activator="{ props: menuProps }">
                          <v-text-field
                            v-bind="menuProps"
                            :model-value="newExpiredDate"
                            variant="filled"
                            rounded="lg"
                            flat
                            density="comfortable"
                            prepend-inner-icon="mdi-calendar-remove"
                            :placeholder="$t('users.contractExpiredDateHint')"
                            readonly
                          />
                        </template>
                        <v-date-picker
                          :model-value="toPickerDate(newExpiredDate)"
                          hide-header
                          @update:model-value="
                            (selectedDate: Date) => {
                              newExpiredDate = formatDate(selectedDate)
                              menuExpiredDate = false
                            }
                          "
                        />
                      </v-menu>
                    </v-col>

                    <v-col cols="12" :sm="newType !== 'indefinite' ? 6 : 12">
                      <div class="field-label">{{ $t('users.contractNotes').toUpperCase() }}</div>
                      <v-text-field
                        v-model="newNotes"
                        variant="filled"
                        rounded="lg"
                        flat
                        density="comfortable"
                        autocomplete="off"
                      />
                    </v-col>

                    <v-col cols="12" class="d-flex ga-2">
                      <v-btn variant="text" size="small" @click="cancelAdd">
                        {{ $t('common.cancel') }}
                      </v-btn>
                      <v-btn
                        variant="tonal"
                        color="primary"
                        size="small"
                        :loading="isAdding"
                        :disabled="!newType || !newSignedDate"
                        @click="addContract"
                      >
                        {{ $t('users.addContract') }}
                      </v-btn>
                    </v-col>
                  </v-row>
                </div>

                <!-- Add button -->
                <v-btn
                  v-if="!showAddForm"
                  variant="tonal"
                  color="primary"
                  size="small"
                  prepend-icon="mdi-plus"
                  @click="showAddForm = true"
                >
                  {{ $t('users.addContract') }}
                </v-btn>
              </template>
            </div>
          </v-card>
        </v-col>

        <!-- Right column -->
        <v-col cols="12" md="4">
          <!-- Contract summary (auto-updated from contracts) -->
          <v-card rounded="xl" elevation="0" border class="mb-4">
            <div class="px-5 pt-5 pb-2">
              <div class="text-subtitle-2 font-weight-bold text-primary mb-4">
                {{ $t('profile.contract').toUpperCase() }}
              </div>
              <v-row dense>
                <v-col cols="6">
                  <div class="info-label">{{ $t('common.type').toUpperCase() }}</div>
                  <div class="info-value">{{ contractTypeLabel(user.contract_type) }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('profile.count').toUpperCase() }}</div>
                  <div class="info-value">
                    {{ user.contract_count != null ? String(user.contract_count) : '—' }}
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('profile.signedDate').toUpperCase() }}</div>
                  <div class="info-value">{{ user.contract_signed_date ?? '—' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('profile.expiredDate').toUpperCase() }}</div>
                  <div class="info-value">{{ user.contract_expired_date ?? '—' }}</div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">{{ $t('profile.annualLeaveHours').toUpperCase() }}</div>
                  <div class="info-value">
                    {{ user.annual_leave_hours != null ? String(user.annual_leave_hours) : '—' }}
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="info-label">
                    {{ $t('profile.remainingLeaveHours').toUpperCase() }}
                  </div>
                  <div class="info-value">
                    {{
                      user.remaining_leave_hours != null ? String(user.remaining_leave_hours) : '—'
                    }}
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-card>

          <!-- Roles -->
          <v-card rounded="xl" elevation="0" border class="mb-4">
            <div class="px-5 pt-5 pb-4">
              <div class="text-subtitle-2 font-weight-bold text-primary mb-3">
                {{ $t('profile.roles').toUpperCase() }}
              </div>
              <div class="d-flex flex-wrap ga-2">
                <v-chip
                  v-for="role in user.roles"
                  :key="role"
                  color="primary"
                  variant="tonal"
                  size="small"
                >
                  {{ role }}
                </v-chip>
                <span v-if="!user.roles?.length" class="text-medium-emphasis text-body-2">—</span>
              </div>
            </div>
          </v-card>

          <!-- Departments -->
          <v-card rounded="xl" elevation="0" border>
            <div class="px-5 pt-5 pb-4">
              <div class="text-subtitle-2 font-weight-bold text-primary mb-3">
                {{ $t('departments.title').toUpperCase() }}
              </div>
              <div class="d-flex flex-wrap ga-2">
                <v-chip
                  v-for="assignment in user.user_departments"
                  :key="assignment.id"
                  color="primary"
                  variant="outlined"
                  size="small"
                  link
                  :to="`/management/departments/${assignment.department_id}/users`"
                >
                  {{ assignment.department?.name }}
                  <span v-if="assignment.company" class="ml-1 text-medium-emphasis">
                    ({{ assignment.company.name }})
                  </span>
                </v-chip>
                <span v-if="!user.user_departments?.length" class="text-medium-emphasis text-body-2"
                  >—</span
                >
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>

  <!-- Delete contract confirm dialog -->
  <v-dialog v-model="showDeleteConfirm" max-width="400" persistent>
    <v-card rounded="xl">
      <v-card-text class="pt-5 pb-2">
        {{
          $t('users.deleteContractConfirm', {
            number: contractToDelete?.contract_number,
            type: contractTypeLabel(contractToDelete?.contract_type ?? ''),
          })
        }}
      </v-card-text>
      <div class="d-flex justify-end ga-2 px-4 pb-4">
        <v-btn variant="text" @click="showDeleteConfirm = false">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn color="error" variant="tonal" :loading="isDeleting" @click="doDelete">
          {{ $t('users.deleteContract') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { UserModel } from '@/interfaces/models/UserModel'
import type { UserContractModel } from '@/interfaces/models/UserContractModel'
import UserService from '@/services/UserService'
import UserContractService from '@/services/UserContractService'
import { useAppNotifications } from '@/composables/useAppNotifications'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.users.detail',
})
/* END DEFINE */

/** START DEFINE STATE */
const { t } = useI18n()
const { notifyError, notifySuccess } = useAppNotifications()
const { moment } = useMoment()

const route = useRoute()
const userId = computed(() => Number(route.params.id))
const user = ref<UserModel | null>(null)
const isLoading = ref<boolean>(false)

// Contracts
const contracts = ref<UserContractModel[]>([])
const isLoadingContracts = ref<boolean>(false)
const showAddForm = ref<boolean>(false)
const isAdding = ref<boolean>(false)
const isDeleting = ref<boolean>(false)
const showDeleteConfirm = ref<boolean>(false)
const contractToDelete = ref<UserContractModel | null>(null)

// Add form fields
const newType = ref<string | null>(null)
const newSignedDate = ref<string | null>(null)
const newExpiredDate = ref<string | null>(null)
const newNotes = ref<string | null>(null)
const menuSignedDate = ref<boolean>(false)
const menuExpiredDate = ref<boolean>(false)

// Edit form fields
const editingContractId = ref<number | null>(null)
const editType = ref<string | null>(null)
const editSignedDate = ref<string | null>(null)
const editExpiredDate = ref<string | null>(null)
const editNotes = ref<string | null>(null)
const menuEditSignedDate = ref<boolean>(false)
const menuEditExpiredDate = ref<boolean>(false)
const isUpdating = ref<boolean>(false)

// Reminder days
const editReminderDays = ref<number>(30)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const contractTypeOptions = computed(() => [
  { value: 'probation', label: t('users.contractTypeProbation') },
  { value: 'fixed_term', label: t('users.contractTypeFixedTerm') },
  { value: 'indefinite', label: t('users.contractTypeIndefinite') },
])
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const contractTypeColor = (type: string): string => {
  if (type === 'probation') return 'warning'
  if (type === 'fixed_term') return 'info'
  if (type === 'indefinite') return 'success'
  return 'default'
}

const contractTypeLabel = (type: string): string => {
  if (type === 'probation') return t('users.contractTypeProbation')
  if (type === 'fixed_term') return t('users.contractTypeFixedTerm')
  if (type === 'indefinite') return t('users.contractTypeIndefinite')
  return type
}

const toPickerDate = (dateString: string | null | undefined): Date | undefined => {
  if (!dateString) return undefined
  return moment(dateString, 'YYYY-MM-DD').toDate()
}

const formatDate = (date: Date | null | undefined): string | null => {
  if (!date) return null
  return moment(date).format('YYYY-MM-DD')
}

const getInitials = (item: UserModel): string => {
  const name = item.full_name ?? ''
  const parts = name.trim().split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  if (parts.length >= 2) return (first + last).toUpperCase()
  return first.toUpperCase() || '?'
}

const loadUser = async () => {
  try {
    isLoading.value = true
    user.value = await UserService.getOne(userId.value)
    editReminderDays.value = user.value.contract_expiry_reminder_days ?? 30
  } catch {
    notifyError(t('users.loadUserFailed'))
  } finally {
    isLoading.value = false
  }
}

const loadContracts = async () => {
  try {
    isLoadingContracts.value = true
    contracts.value = await UserContractService.getByUser(userId.value)
  } catch {
    notifyError(t('users.loadContractsFailed'))
  } finally {
    isLoadingContracts.value = false
  }
}

const cancelAdd = () => {
  showAddForm.value = false
  newType.value = null
  newSignedDate.value = null
  newExpiredDate.value = null
  newNotes.value = null
}

const addContract = async () => {
  if (!newType.value || !newSignedDate.value) return
  try {
    isAdding.value = true
    const saved = await UserContractService.create({
      user_id: userId.value,
      contract_type: newType.value,
      signed_date: newSignedDate.value,
      expired_date: newType.value === 'indefinite' ? null : (newExpiredDate.value ?? null),
      notes: newNotes.value ?? null,
    })
    contracts.value.push(saved)
    // Refresh user to get updated contract summary fields
    user.value = await UserService.getOne(userId.value)
    cancelAdd()
  } catch {
    notifyError(t('users.saveContractFailed'))
  } finally {
    isAdding.value = false
  }
}

const confirmDelete = (contract: UserContractModel) => {
  contractToDelete.value = contract
  showDeleteConfirm.value = true
}

const doDelete = async () => {
  const contract = contractToDelete.value
  if (!contract) return
  try {
    isDeleting.value = true
    await UserContractService.delete(contract.id)
    contracts.value = contracts.value.filter((item) => item.id !== contract.id)
    // Refresh user to get updated contract summary fields
    user.value = await UserService.getOne(userId.value)
    showDeleteConfirm.value = false
    contractToDelete.value = null
  } catch {
    notifyError(t('users.deleteContractFailed'))
  } finally {
    isDeleting.value = false
  }
}

const startEdit = (contract: UserContractModel) => {
  editingContractId.value = contract.id
  editType.value = contract.contract_type
  editSignedDate.value = contract.signed_date
  editExpiredDate.value = contract.expired_date ?? null
  editNotes.value = contract.notes ?? null
  // Close add form if open
  showAddForm.value = false
}

const cancelEdit = () => {
  editingContractId.value = null
  editType.value = null
  editSignedDate.value = null
  editExpiredDate.value = null
  editNotes.value = null
}

const saveEdit = async () => {
  const contractId = editingContractId.value
  if (!contractId || !editType.value || !editSignedDate.value) return
  try {
    isUpdating.value = true
    const updated = await UserContractService.update(contractId, {
      contract_type: editType.value,
      signed_date: editSignedDate.value,
      expired_date: editType.value === 'indefinite' ? null : (editExpiredDate.value ?? null),
      notes: editNotes.value ?? null,
    })
    const index = contracts.value.findIndex((item) => item.id === contractId)
    if (index >= 0) contracts.value[index] = updated
    // Refresh user to get updated contract summary fields
    user.value = await UserService.getOne(userId.value)
    cancelEdit()
  } catch {
    notifyError(t('users.updateContractFailed'))
  } finally {
    isUpdating.value = false
  }
}

const saveReminderDays = async () => {
  if (!user.value) return
  const days = editReminderDays.value
  if (!days || days < 1) return
  if (days === user.value.contract_expiry_reminder_days) return
  try {
    await UserService.update(userId.value, { contract_expiry_reminder_days: days })
    if (user.value) user.value.contract_expiry_reminder_days = days
    notifySuccess(t('common.saved'))
  } catch {
    notifyError(t('users.saveFailed'))
  }
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  loadUser()
  loadContracts()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.info-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.07em;
  color: rgb(var(--v-theme-secondary));
  margin-bottom: 2px;
}

.info-value {
  font-size: 14px;
  color: rgb(var(--v-theme-primary-darken));
  margin-bottom: 16px;
}

.field-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.07em;
  color: rgb(var(--v-theme-secondary));
  margin-bottom: 4px;
}

.contract-row {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.contract-row:last-child {
  border-bottom: none;
}
</style>
