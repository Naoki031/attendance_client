<template>
  <v-data-table :headers="headers" :items="countries" :loading="isLoading">
    <template #top>
      <v-toolbar flat>
        <v-toolbar-title>List Countries</v-toolbar-title>
        <v-divider class="mx-4" inset vertical></v-divider>
        <v-spacer></v-spacer>
        <v-btn rounded="xl" @click="addCountry()" variant="tonal" color="success">
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
    :item="country as CountryModel"
    :dialog="dialogDelete"
    @confirm-delete="onConfirmDelete"
    @close-delete="onCloseDelete"
  />
</template>
<script lang="ts" setup>
/** 0. start import*/
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import DialogDelete from '@/components/countries/DialogDelete.vue'
import DialogCreateOrUpdate from '~/components/countries/DialogCreateOrUpdate.vue'
import type { CountryModel } from '@/interfaces/models/CountryModel'
import CountryService from '@/services/CountryService'
/* end import*/

/** 1. start import name component*/
/* end import*/

/** 2. start define property and emits */
/* end define property and emits*/

/** 3. start define validate */
/* end define validate */

/** 4. start defined state */
const countries = ref<Array<CountryModel>>([])
const isLoading = ref(false)
const country = ref<CountryModel | null>(null)
const dialog = ref(false)
const dialogDelete = ref(false)

const headers = ref<Array<Object>>([
  {
    title: 'Name',
    align: 'start',
    sortable: true,
    key: 'name',
  },
  { title: 'Slug', key: 'slug' },
  { title: 'Code', key: 'code' },
  { title: 'Capital', key: 'capital' },
  { title: 'Actions', key: 'actions', sortable: false },
])

const editedIndex = ref(-1)
const editedItem = ref<CountryModel | null>(null)

const defaultItem = {
  name: '',
  calories: 0,
  fat: 0,
  carbs: 0,
  protein: 0,
}
/* end defined state */

/** 5. start defined computed */
/* end defined computed */

/** 6. start defined methods */

const onConfirm = async () => {
  try {
    onClose()
    getCountries()
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

const onConfirmDelete = async (item: any) => {
  try {
    dialogDelete.value = false
    nextTick(() => {
      // await CountryService.delete(item.id)
      // getCountries()
      country.value = null
    })
  } catch (error) {
    // console.error('Failed to delete country:', error)
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
/* end defined methods */

/** 7. start define watcher */
watch(
  () => dialog,
  (val) => {
    if (!val) {
      close()
    }
  },
  { immediate: false },
)
/* end define life watcher */

/** 8. start define life cycle hook */
onMounted(() => {
  getCountries()
})
/* end define life cycle hook */
</script>
<style scoped></style>
