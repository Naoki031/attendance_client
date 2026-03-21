<template>
  <v-expand-transition>
    <div v-if="expanded">
      <v-divider></v-divider>
      <v-container fluid class="py-3">
        <v-row comfortable>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              :model-value="modelValue.id"
              label="ID"
              density="compact"
              hide-details
              clearable
              autocomplete="off"
              @update:model-value="update('id', $event)"
            ></v-text-field>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-text-field
              :model-value="modelValue.name"
              label="Name"
              density="compact"
              hide-details
              clearable
              autocomplete="off"
              @update:model-value="update('name', $event)"
            ></v-text-field>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-text-field
              :model-value="modelValue.position"
              label="Position"
              density="compact"
              hide-details
              clearable
              autocomplete="off"
              @update:model-value="update('position', $event)"
            ></v-text-field>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-text-field
              :model-value="modelValue.email"
              label="Email"
              density="compact"
              hide-details
              clearable
              autocomplete="off"
              @update:model-value="update('email', $event)"
            ></v-text-field>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-autocomplete
              :model-value="modelValue.departmentId"
              label="Department"
              :items="departments"
              item-title="name"
              item-value="id"
              density="compact"
              hide-details
              clearable
              autocomplete="off"
              @update:model-value="update('departmentId', $event)"
            ></v-autocomplete>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-autocomplete
              :model-value="modelValue.role"
              label="Role"
              :items="roles"
              item-title="name"
              item-value="name"
              density="compact"
              hide-details
              clearable
              autocomplete="off"
              @update:model-value="update('role', $event)"
            ></v-autocomplete>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-select
              :model-value="modelValue.status"
              label="Status"
              :items="statusOptions"
              item-title="label"
              item-value="value"
              density="compact"
              hide-details
              clearable
              @update:model-value="update('status', $event)"
            ></v-select>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-text-field
              :model-value="modelValue.contractType"
              label="Contract Type"
              density="compact"
              hide-details
              clearable
              autocomplete="off"
              @update:model-value="update('contractType', $event)"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row comfortable class="mt-1">
          <v-col cols="12" class="d-flex justify-end">
            <v-btn size="small" variant="text" color="error" @click="emit('reset')">
              Clear all
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
      <v-divider></v-divider>
    </div>
  </v-expand-transition>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import type { DepartmentModel } from '@/interfaces/models/DepartmentModel'
import type { PermissionGroupModel } from '@/interfaces/models/PermissionGroupModel'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
export interface UserFilters {
  id: string
  name: string
  position: string
  email: string
  departmentId: number | null
  role: string
  status: '' | 'active' | 'inactive'
  contractType: string
}

const props = defineProps({
  modelValue: {
    type: Object as PropType<UserFilters>,
    required: true,
  },
  expanded: {
    type: Boolean,
    required: true,
  },
  departments: {
    type: Array as PropType<DepartmentModel[]>,
    required: true,
  },
  roles: {
    type: Array as PropType<PermissionGroupModel[]>,
    required: true,
  },
})

const emit = defineEmits<{
  'update:modelValue': [value: UserFilters]
  reset: []
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]
/* END DEFINE STATE */

/** START DEFINE METHOD */
const update = (field: keyof UserFilters, value: unknown) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value ?? '' })
}
/* END DEFINE METHOD */
</script>
