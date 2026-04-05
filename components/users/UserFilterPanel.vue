<template>
  <v-expand-transition>
    <div v-if="expanded">
      <v-divider></v-divider>
      <v-container fluid class="py-3">
        <v-row comfortable>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              :model-value="modelValue.id"
              :label="$t('common.id')"
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
              :label="$t('common.name')"
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
              :label="$t('profile.position')"
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
              :label="$t('profile.email')"
              density="compact"
              hide-details
              clearable
              autocomplete="off"
              @update:model-value="update('email', $event)"
            ></v-text-field>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-autocomplete
              :model-value="modelValue.companyId"
              :label="$t('profile.company')"
              :items="companies"
              item-title="name"
              item-value="id"
              density="compact"
              hide-details
              clearable
              autocomplete="off"
              @update:model-value="update('companyId', $event)"
            ></v-autocomplete>
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-autocomplete
              :model-value="modelValue.departmentId"
              :label="$t('profile.department')"
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
              :label="$t('profile.roles')"
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
              :label="$t('common.status')"
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
              :label="$t('profile.contractType')"
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
              {{ $t('users.clearFilter') }}
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
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import type { DepartmentModel } from '@/interfaces/models/DepartmentModel'
import type { PermissionGroupModel } from '@/interfaces/models/PermissionGroupModel'
import type { UserFilters } from '@/types/user/UserFilters'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */

const props = defineProps({
  modelValue: {
    type: Object as PropType<UserFilters>,
    required: true,
  },
  expanded: {
    type: Boolean,
    required: true,
  },
  companies: {
    type: Array as PropType<CompanyModel[]>,
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
const { t } = useI18n()

const statusOptions = computed(() => [
  { label: t('common.active'), value: 'active' },
  { label: t('common.inactive'), value: 'inactive' },
])
/* END DEFINE STATE */

/** START DEFINE METHOD */
const update = (field: keyof UserFilters, value: unknown) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value ?? '' })
}
/* END DEFINE METHOD */
</script>
