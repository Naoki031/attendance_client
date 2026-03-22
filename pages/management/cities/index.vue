<template>
  <v-container fluid class="py-6 px-6">
    <div class="d-flex align-center justify-space-between mb-5">
      <div>
        <div class="text-h5 font-weight-bold">Cities</div>
        <div class="text-body-2 text-medium-emphasis mt-1">Manage city records</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="addCity()">
        New City
      </v-btn>
    </div>

    <v-card rounded="xl" elevation="0" border>
      <v-data-table
        v-model:sort-by="sortBy"
        :headers="headers"
        :items="cities"
        :loading="isLoading"
        :hover="true"
      >
        <template #item.country="{ item }">
          {{ item.country?.name ?? '-' }}
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex align-center ga-1">
            <v-btn icon size="x-small" variant="text" color="primary" @click="editItem(item)">
              <v-icon size="16">mdi-pencil-outline</v-icon>
              <v-tooltip activator="parent" location="top">Edit</v-tooltip>
            </v-btn>
            <v-btn icon size="x-small" variant="text" color="error" @click="deleteItem(item)">
              <v-icon size="16">mdi-delete-outline</v-icon>
              <v-tooltip activator="parent" location="top">Delete</v-tooltip>
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
      v-if="!!city"
      :item="city"
      :dialog="dialogDelete"
      @confirm-delete="onConfirmDelete"
      @close-delete="onCloseDelete"
    />
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import DialogCreateOrUpdate from '@/components/cities/DialogCreateOrUpdate.vue'
import DialogDelete from '@/components/cities/DialogDelete.vue'
import type { CityModel } from '@/interfaces/models/CityModel'
import CityService from '@/services/CityService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.cities.index',
})
/* END DEFINE */

/** START DEFINE STATE */
const cities = ref<Array<CityModel>>([])
const isLoading = ref(false)
const city = ref<CityModel | null>(null)
const dialog = ref(false)
const dialogDelete = ref(false)
const sortBy = ref<Array<{ key: string; order: boolean | 'asc' | 'desc' | undefined }>>([
  { key: 'name', order: 'asc' },
])
const headers = ref<Array<object>>([
  { title: 'Name', align: 'start', key: 'name' },
  { title: 'Slug', key: 'slug' },
  { title: 'Country', key: 'country', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
])
const editedIndex = ref(-1)
const editedItem = ref<CityModel | null>(null)
/* END DEFINE STATE */

/** START DEFINE METHOD */
const onConfirm = async () => {
  try {
    onClose()
    await getCities()
  } catch (error) {
    console.error('Failed to refresh cities:', error)
  }
}

const addCity = () => {
  editedItem.value = null
  dialog.value = true
}

const editItem = (item: CityModel) => {
  editedIndex.value = cities.value.indexOf(item)
  editedItem.value = { ...item }
  dialog.value = true
}

const onClose = () => {
  dialog.value = false
  nextTick(() => {
    editedIndex.value = -1
  })
}

const onConfirmDelete = async (item: CityModel) => {
  try {
    dialogDelete.value = false
    await nextTick()

    if (item.id) {
      await CityService.delete(item.id)
      await getCities()
      city.value = null
    } else {
      console.error('Invalid item id:', item.id)
    }
  } catch (error) {
    console.error('Failed to delete city:', error)
  }
}

const onCloseDelete = () => {
  dialogDelete.value = false
  nextTick(() => {
    city.value = null
  })
}

const deleteItem = (item: CityModel) => {
  city.value = { ...item }
  dialogDelete.value = true
}

const getCities = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    const data = await CityService.getAll()
    cities.value = Object.values(data)
  } catch (error) {
    console.error('Failed to fetch cities:', error)
  } finally {
    isLoading.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => dialog,
  (newValue) => {
    if (!newValue) onClose()
  },
  { immediate: false },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  getCities()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
