<template>
  <v-dialog :model-value="dialog" max-width="520px" persistent>
    <v-card>
      <v-card-title class="text-h5">Manage Departments</v-card-title>
      <v-card-subtitle>{{ user.full_name }}</v-card-subtitle>

      <v-divider></v-divider>

      <v-card-text>
        <v-container>
          <!-- Current assignments -->
          <div class="d-flex flex-wrap gap-2 mb-4">
            <v-chip
              v-for="assignment in departmentAssignments"
              :key="assignment.id"
              size="small"
              color="teal"
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

          <!-- API error alert -->
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

          <v-divider class="mb-4"></v-divider>

          <!-- Add assignment row -->
          <v-row>
            <v-col cols="12" md="12">
              <v-autocomplete
                v-model="newDepartmentId"
                label="Department"
                :items="availableDepartments"
                item-title="name"
                item-value="id"
                clearable
                autocomplete="off"
              ></v-autocomplete>
            </v-col>

            <v-col cols="12" md="12">
              <v-autocomplete
                v-model="newCompanyId"
                label="Company"
                :items="availableCompanies"
                item-title="name"
                item-value="id"
                clearable
                autocomplete="off"
              ></v-autocomplete>
            </v-col>

            <v-col cols="12" md="2" class="d-flex align-center">
              <v-btn
                color="success"
                variant="tonal"
                :loading="isAddingDepartment"
                @click="addAssignment"
                >Add</v-btn
              >
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue-grey-darken-4" variant="elevated" @click="close">Close</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Confirm remove dialog -->
  <v-dialog v-model="dialogConfirmRemove" max-width="400px">
    <v-card>
      <v-card-title class="text-h6">Remove Department</v-card-title>
      <v-card-text>
        Are you sure you want to remove
        <strong>{{ pendingRemoval?.department?.name }}</strong> from this user?
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="cancelRemove">Cancel</v-btn>
        <v-btn color="error" variant="elevated" @click="executeRemove">Remove</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
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
