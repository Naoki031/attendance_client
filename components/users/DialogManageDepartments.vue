<template>
  <v-dialog :model-value="dialog" max-width="520px" persistent>
    <v-card rounded="xl" elevation="2">
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">Manage Departments</div>
          <div class="text-body-2 text-medium-emphasis mt-1">{{ user.full_name }}</div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0">
        <v-container class="pa-0">
          <!-- Current assignments -->
          <div class="d-flex flex-wrap ga-2 mb-4">
            <v-chip
              v-for="assignment in departmentAssignments"
              :key="assignment.id"
              size="small"
              color="primary"
              variant="tonal"
            >
              {{ assignment.department?.name }}
              <span v-if="assignment.company" class="text-medium-emphasis ml-1">
                ({{ assignment.company.name }})
              </span>
              <template #append>
                <v-icon size="x-small" class="ms-1" @click.stop="confirmRemove(assignment)"
                  >mdi-close-circle</v-icon
                >
              </template>
            </v-chip>
            <span v-if="!departmentAssignments.length" class="text-medium-emphasis text-caption"
              >No departments assigned</span
            >
          </div>

          <v-alert
            v-if="departmentError"
            type="error"
            variant="tonal"
            class="mb-3"
            closable
            @click:close="departmentError = ''"
          >
            {{ departmentError }}
          </v-alert>

          <div class="section-label mb-3">ADD ASSIGNMENT</div>

          <div class="field-label">DEPARTMENT</div>
          <v-autocomplete
            v-model="newDepartmentId"
            :items="availableDepartments"
            item-title="name"
            item-value="id"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            clearable
            autocomplete="off"
          ></v-autocomplete>

          <div class="field-label">COMPANY</div>
          <v-autocomplete
            v-model="newCompanyId"
            :items="availableCompanies"
            item-title="name"
            item-value="id"
            variant="filled"
            rounded="lg"
            flat
            density="comfortable"
            clearable
            autocomplete="off"
          ></v-autocomplete>

          <v-btn
            color="primary"
            variant="tonal"
            rounded="lg"
            :loading="isAddingDepartment"
            class="mb-2"
            @click="addAssignment"
          >
            Add
          </v-btn>
        </v-container>
      </v-card-text>

      <div class="d-flex justify-end px-6 py-4">
        <v-btn color="default" variant="elevated" rounded="lg" @click="close">Close</v-btn>
      </div>
    </v-card>
  </v-dialog>

  <!-- Confirm remove dialog -->
  <v-dialog v-model="dialogConfirmRemove" max-width="420px">
    <v-card rounded="xl" elevation="2" class="text-center pa-6">
      <div class="d-flex justify-center mb-4">
        <div class="warning-icon-wrap">
          <v-icon color="error" size="28">mdi-alert</v-icon>
        </div>
      </div>
      <div class="text-h6 font-weight-bold mb-2">Remove Department?</div>
      <div class="text-body-2 text-medium-emphasis mb-6 px-4">
        Are you sure you want to remove
        <strong>{{ pendingRemoval?.department?.name }}</strong> from this user?
      </div>
      <div class="d-flex justify-center ga-3">
        <v-btn variant="text" color="default" rounded="lg" min-width="100" @click="cancelRemove">
          Cancel
        </v-btn>
        <v-btn color="error" variant="elevated" rounded="lg" min-width="100" @click="executeRemove">
          Remove
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** start import */
import type { PropType } from 'vue'
import type { UserModel } from '@/interfaces/models/UserModel'
import type { DepartmentModel } from '@/interfaces/models/DepartmentModel'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import type { UserDepartmentModel } from '@/interfaces/models/UserDepartmentModel'
import DepartmentService from '@/services/DepartmentService'
import CompanyService from '@/services/CompanyService'
import UserDepartmentService from '@/services/UserDepartmentService'
/* end import */

/** start define property and emits */
const props = defineProps({
  user: {
    type: Object as PropType<UserModel>,
    required: true,
  },
  dialog: {
    type: Boolean,
    required: true,
  },
})
const emit = defineEmits(['close-modal', 'changed'])
/* end define property and emits */

/** start defined state */
const departmentAssignments = ref<UserDepartmentModel[]>([])
const availableDepartments = ref<DepartmentModel[]>([])
const availableCompanies = ref<CompanyModel[]>([])
const newDepartmentId = ref<number | null>(null)
const newCompanyId = ref<number | null>(null)
const isAddingDepartment = ref(false)
const departmentError = ref('')
const dialogConfirmRemove = ref(false)
const pendingRemoval = ref<UserDepartmentModel | null>(null)
/* end defined state */

/** start defined methods */
const loadAll = async () => {
  try {
    const [departments, companies] = await Promise.all([
      DepartmentService.getAll(),
      CompanyService.getAll(),
    ])
    availableDepartments.value = Object.values(departments)
    availableCompanies.value = Object.values(companies)
  } catch (error) {
    console.error('Failed to load departments and companies:', error)
  }
}

const addAssignment = async () => {
  if (!newDepartmentId.value || !newCompanyId.value) return
  try {
    isAddingDepartment.value = true
    departmentError.value = ''
    const created = await UserDepartmentService.create({
      user_id: props.user.id,
      department_id: newDepartmentId.value,
      company_id: newCompanyId.value,
    })
    const department = availableDepartments.value.find(
      (availableDepartment) => availableDepartment.id === newDepartmentId.value,
    )
    const company = availableCompanies.value.find(
      (availableCompany) => availableCompany.id === newCompanyId.value,
    )
    departmentAssignments.value.push({ ...created, department, company })
    newDepartmentId.value = null
    newCompanyId.value = null
    emit('changed')
  } catch (error: unknown) {
    departmentError.value =
      (error as { data?: { message?: string } })?.data?.message ?? 'Failed to add department'
  } finally {
    isAddingDepartment.value = false
  }
}

const confirmRemove = (assignment: UserDepartmentModel) => {
  pendingRemoval.value = assignment
  dialogConfirmRemove.value = true
}

const cancelRemove = () => {
  dialogConfirmRemove.value = false
  pendingRemoval.value = null
}

const executeRemove = async () => {
  if (!pendingRemoval.value) return
  try {
    await UserDepartmentService.delete(pendingRemoval.value.id)
    departmentAssignments.value = departmentAssignments.value.filter(
      (existing) => existing.id !== pendingRemoval.value!.id,
    )
    dialogConfirmRemove.value = false
    pendingRemoval.value = null
    emit('changed')
  } catch (error) {
    console.error('Failed to remove department assignment:', error)
  }
}

const close = () => {
  emit('close-modal')
}
/* end defined methods */

/** start define watcher */
watch(
  () => props.dialog,
  (value) => {
    if (!value) close()
  },
  { immediate: false },
)

watch(
  () => props.user,
  (user) => {
    departmentAssignments.value = user.user_departments ?? []
    departmentError.value = ''
    newDepartmentId.value = null
    newCompanyId.value = null
  },
  { immediate: true },
)
/* end define watcher */

/** start define life cycle hook */
onMounted(() => {
  loadAll()
})
/* end define life cycle hook */
</script>
