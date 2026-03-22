<template>
  <v-container fluid class="py-6 px-6">
    <!-- Page header -->
    <div class="d-flex align-center justify-space-between mb-5">
      <div class="d-flex align-center ga-2">
        <v-btn icon variant="text" size="small" :to="'/management/departments'">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <div>
          <div class="text-h5 font-weight-bold">{{ departmentName }}</div>
          <div class="text-body-2 text-medium-emphasis mt-1">Assigned users</div>
        </div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-account-plus" rounded="lg" @click="dialog = true">
        Assign User
      </v-btn>
    </div>

    <!-- Table card -->
    <v-card rounded="xl" elevation="0" border>
      <v-data-table :headers="headers" :items="assignments" :loading="isLoading" :hover="true">
        <template #item.user="{ item }">
          {{ item.user?.full_name ?? '-' }}
        </template>

        <template #item.email="{ item }">
          {{ item.user?.email ?? '-' }}
        </template>

        <template #item.company="{ item }">
          {{ item.company?.name ?? '-' }}
        </template>

        <template #item.actions="{ item }">
          <v-btn icon size="x-small" variant="text" color="error" @click="confirmRemove(item)">
            <v-icon size="16">mdi-delete-outline</v-icon>
            <v-tooltip activator="parent" location="top">Remove</v-tooltip>
          </v-btn>
        </template>

        <template #loading>
          <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
        </template>
      </v-data-table>
    </v-card>

    <!-- Confirm remove dialog -->
    <v-dialog v-model="dialogDelete" max-width="420px">
      <v-card>
        <v-card-title class="text-h6">Remove User</v-card-title>
        <v-card-text>
          Are you sure you want to remove
          <strong>{{ deletingAssignment?.user?.full_name ?? 'this user' }}</strong>
          from the department?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="cancelRemove">Cancel</v-btn>
          <v-btn color="error" variant="elevated" @click="executeRemove">Remove</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <DialogAssignUser
      v-if="dialog"
      :department-id="departmentId"
      :companies="allCompanies"
      :dialog="dialog"
      @confirm="onAssigned"
      @close-modal="dialog = false"
    />
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import DialogAssignUser from '@/components/departments/DialogAssignUser.vue'
import type { UserDepartmentModel } from '@/interfaces/models/UserDepartmentModel'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import UserDepartmentService from '@/services/UserDepartmentService'
import CompanyService from '@/services/CompanyService'
import DepartmentService from '@/services/DepartmentService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.departments.users',
})
/* END DEFINE */

/** START DEFINE STATE */
const route = useRoute()
const departmentId = computed(() => Number(route.params.id))
const departmentName = ref('')
const assignments = ref<Array<UserDepartmentModel>>([])
const allCompanies = ref<Array<CompanyModel>>([])
const isLoading = ref(false)
const dialog = ref(false)
const dialogDelete = ref(false)
const deletingAssignment = ref<UserDepartmentModel | null>(null)
const headers = ref<Array<object>>([
  { title: 'Full Name', key: 'user', sortable: false },
  { title: 'Email', key: 'email', sortable: false },
  { title: 'Company', key: 'company', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
])
/* END DEFINE STATE */

/** START DEFINE METHOD */
const loadAssignments = async () => {
  if (isLoading.value) return
  try {
    isLoading.value = true
    const data = await UserDepartmentService.getByDepartment(departmentId.value)
    assignments.value = Object.values(data)
  } catch (error) {
    console.error('Failed to fetch user-department assignments:', error)
  } finally {
    isLoading.value = false
  }
}

const confirmRemove = (item: UserDepartmentModel) => {
  deletingAssignment.value = item
  dialogDelete.value = true
}

const cancelRemove = () => {
  dialogDelete.value = false
  deletingAssignment.value = null
}

const executeRemove = async () => {
  if (!deletingAssignment.value) return
  try {
    await UserDepartmentService.delete(deletingAssignment.value.id)
    dialogDelete.value = false
    deletingAssignment.value = null
    await loadAssignments()
  } catch (error) {
    console.error('Failed to remove assignment:', error)
  }
}

const onAssigned = async () => {
  dialog.value = false
  await loadAssignments()
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(async () => {
  const [companiesData, department] = await Promise.all([
    CompanyService.getAll(),
    DepartmentService.getOne(departmentId.value),
  ])
  allCompanies.value = Object.values(companiesData)
  departmentName.value = department.name
  await loadAssignments()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
