<template>
  <v-expand-transition>
    <div v-if="expanded">
      <v-divider></v-divider>
      <v-container fluid class="py-3">
        <v-row comfortable>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              :model-value="modelValue.search"
              :label="searchLabel"
              density="compact"
              hide-details
              clearable
              autocomplete="off"
              prepend-inner-icon="mdi-magnify"
              @update:model-value="update('search', $event)"
            ></v-text-field>
          </v-col>

          <v-col v-for="field in fields" :key="field.key" cols="12" sm="6" md="3">
            <v-autocomplete
              v-if="field.type === 'autocomplete'"
              :model-value="modelValue[field.key]"
              :label="field.label"
              :items="field.items"
              :item-title="field.itemTitle ?? 'name'"
              :item-value="field.itemValue ?? 'id'"
              density="compact"
              hide-details
              clearable
              autocomplete="off"
              @update:model-value="update(field.key, $event)"
            ></v-autocomplete>

            <v-select
              v-else-if="field.type === 'select'"
              :model-value="modelValue[field.key]"
              :label="field.label"
              :items="field.items"
              :item-title="field.itemTitle ?? 'label'"
              :item-value="field.itemValue ?? 'value'"
              density="compact"
              hide-details
              clearable
              @update:model-value="update(field.key, $event)"
            ></v-select>
          </v-col>
        </v-row>

        <v-row comfortable class="mt-1">
          <v-col cols="12" class="d-flex justify-end">
            <v-btn size="small" variant="text" color="error" @click="emit('reset')">
              {{ $t('common.clearFilter') }}
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
import type { FilterFieldConfig, DefaultFilters } from '@/types/common/FilterPanel'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */

const props = defineProps({
  modelValue: {
    type: Object as PropType<DefaultFilters>,
    required: true,
  },
  expanded: {
    type: Boolean,
    required: true,
  },
  searchLabel: {
    type: String,
    default: 'Search',
  },
  fields: {
    type: Array as PropType<FilterFieldConfig[]>,
    default: () => [],
  },
})

const emit = defineEmits<{
  'update:modelValue': [value: DefaultFilters]
  reset: []
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE METHOD */
const update = (field: string, value: unknown) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value ?? '' })
}
/* END DEFINE METHOD */
</script>
