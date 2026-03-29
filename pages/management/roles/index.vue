<template>
  <v-container fluid class="py-6 px-6">
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">{{ $t('roles.title') }}</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="addItem()">
        {{ $t('roles.createRole') }}
      </v-btn>
    </div>

    <v-card rounded="xl" elevation="0" border class="table-responsive-card">
      <!-- Toolbar -->
      <div class="d-flex align-center px-4 py-3 ga-2 border-b table-toolbar">
        <v-btn
          :color="isFilterActive ? 'primary' : undefined"
          :variant="isFilterActive ? 'tonal' : 'text'"
          prepend-icon="mdi-filter-outline"
          size="small"
          @click="filterExpanded = !filterExpanded"
        >
          {{ $t('common.filter') }}
          <v-badge
            v-if="activeFilterCount > 0"
            :content="activeFilterCount"
            color="primary"
            floating
          ></v-badge>
        </v-btn>
        <v-spacer></v-spacer>
        <span class="text-caption text-medium-emphasis">{{ items.length }} records</span>
      </div>

      <!-- Filter panel -->
      <FilterPanel
        v-model="filters"
        :expanded="filterExpanded"
        :search-label="$t('common.search')"
        @reset="resetFilters"
      />

      <v-data-table
        v-model:sort-by="sortBy"
        :headers="headers"
        :items="items"
        :loading="isLoading"
        :hover="true"
      >
        <template #item.actions="{ item }">
          <div class="d-flex align-center ga-1">
            <v-btn icon size="x-small" variant="text" color="primary" @click="editItem(item)">
              <v-icon size="16">mdi-pencil-outline</v-icon>
              <v-tooltip activator="parent" location="top">{{ $t('common.edit') }}</v-tooltip>
            </v-btn>
            <v-btn icon size="x-small" variant="text" color="error" @click="deleteItem(item)">
              <v-icon size="16">mdi-delete-outline</v-icon>
              <v-tooltip activator="parent" location="top">{{ $t('common.delete') }}</v-tooltip>
            </v-btn>
          </div>
        </template>
        <template #loading>
          <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
        </template>
      </v-data-table>
    </v-card>

    <DialogCreateOrUpdate
      v-if="dialog"
      :item="editedItem"
      :dialog="dialog"
      @confirm="onConfirm"
      @close-modal="onClose"
    />

    <DialogDelete
      v-if="!!entityToDelete"
      :item="entityToDelete"
      :dialog="dialogDelete"
      @confirm-delete="onConfirmDelete"
      @close-delete="onCloseDelete"
    />
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import FilterPanel from '@/components/common/FilterPanel.vue'
import DialogCreateOrUpdate from '~/components/roles/DialogCreateOrUpdate.vue'
import DialogDelete from '@/components/roles/DialogDelete.vue'
import type { RoleModel } from '@/interfaces/models/RoleModel'
import RoleService from '@/services/RoleService'
/* END IMPORT */

const { t } = useI18n()

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.roles.index',
})
/* END DEFINE NAME COMPONENT */

/** START DEFINE STATE */
const headers = computed(() => [
  { title: t('common.id'), key: 'id', sortable: true },
  { title: t('common.name'), align: 'start' as const, key: 'name' },
  { title: t('common.key'), key: 'key' },
  { title: t('common.description'), key: 'descriptions' },
  { title: t('common.actions'), key: 'actions', sortable: false },
])

const {
  items,
  isLoading,
  dialog,
  dialogDelete,
  editedItem,
  entityToDelete,
  sortBy,
  filters,
  filterExpanded,
  activeFilterCount,
  isFilterActive,
  addItem,
  editItem,
  onConfirm,
  onClose,
  deleteItem,
  onConfirmDelete,
  onCloseDelete,
  resetFilters,
} = useCrudPage<RoleModel, typeof RoleService>(RoleService, {
  filters: { search: '' },
})
/* END DEFINE STATE */
</script>

<style scoped>
.table-toolbar {
  background-color: #f5ede4;
}
</style>
