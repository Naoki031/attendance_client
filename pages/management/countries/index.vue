<template>
  <div>
    <v-data-table
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="countries"
      :loading="isLoading"
    >
      <template #top>
        <v-toolbar flat>
          <v-toolbar-title>List Countries</v-toolbar-title>
          <v-divider class="mx-4" inset vertical></v-divider>
          <v-spacer></v-spacer>
          <v-btn rounded="xl" variant="tonal" color="success" @click="addCountry()">
            New Country
          </v-btn>
        </v-toolbar>
      </template>
      <template #item.actions="{ item }">
        <v-icon class="me-2" small @click="editItem(item)">mdi-pencil</v-icon>
        <v-icon small @click="deleteItem(item)">mdi-delete</v-icon>
      </template>
      <template #loading>
        <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
      </template>
    </v-data-table>

    <DialogCreateOrUpdate
      v-if="dialog"
      :item="editedItem"
      :dialog="dialog"
      @confirm="onConfirm"
      @close-modal="onClose"
    />

    <DialogDelete
      v-if="!!country"
      :item="country"
      :dialog="dialogDelete"
      @confirm-delete="onConfirmDelete"
      @close-delete="onCloseDelete"
    />
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import DialogCreateOrUpdate from '~/components/countries/DialogCreateOrUpdate.vue'
import DialogDelete from '@/components/countries/DialogDelete.vue'
import type { CountryModel } from '@/interfaces/models/CountryModel'
import CountryService from '@/services/CountryService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  name: 'admin.countries.index',
})
/* END  DEFINE */

/** START DEFINE PROPERTY AND EMITS */
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE VALIDATE */
/* END DEFINE VALIDATE */

/** START DEFINE STATE */
const countries = ref<Array<CountryModel>>([])
const isLoading = ref(false)
const country = ref<CountryModel | null>(null)
const dialog = ref(false)
const dialogDelete = ref(false)
const sortBy = ref<Array<{ key: string; order: boolean | 'asc' | 'desc' | undefined }>>([
  { key: 'name', order: 'asc' },
])
const headers = ref<Array<object>>([
  {
    title: 'Name',
    align: 'start',
    key: 'name',
  },

  { title: 'Slug', key: 'slug' },

  { title: 'Capital', key: 'capital' },

  { title: 'Actions', key: 'actions', sortable: false },
])
const editedIndex = ref(-1)
const editedItem = ref<CountryModel | null>(null)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const onConfirm = async () => {
  try {
    onClose()
    await getCountries()
  } catch (error) {
    console.error('Failed to add country:', error)
  }
}

const addCountry = () => {
  editedItem.value = null
  dialog.value = true
}

const editItem = (item: CountryModel) => {
  editedIndex.value = countries.value.indexOf(item)
  editedItem.value = { ...item }
  dialog.value = true
}

const onClose = () => {
  dialog.value = false

  nextTick(() => {
    editedIndex.value = -1
  })
}

const onConfirmDelete = async (item: CountryModel) => {
  try {
    dialogDelete.value = false
    await nextTick()

    if (item.id) {
      await CountryService.delete(item.id)
      await getCountries()
      country.value = null
    } else {
      console.error('Invalid item id:', item.id)
    }
  } catch (error) {
    console.error('Failed to delete country:', error)
  }
}

const onCloseDelete = () => {
  dialogDelete.value = false

  nextTick(() => {
    country.value = null
  })
}

const deleteItem = async (item: any) => {
  country.value = await { ...item }
  dialogDelete.value = true
}

const getCountries = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    const data = await CountryService.getAll()
    countries.value = Object.values(data)

    setTimeout(() => {
      isLoading.value = false
    }, 1000)
  } catch (error) {
    console.error('Failed to fetch countries:', error)
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => dialog,
  (val) => {
    if (!val) {
      close()
    }
  },
  { immediate: false },
)
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  getCountries()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped></style>
