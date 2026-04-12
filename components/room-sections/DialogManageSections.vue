<template>
  <v-dialog :model-value="dialog" max-width="480" persistent scrollable>
    <v-card rounded="xl" elevation="2">
      <!-- Header -->
      <div class="dialog-header px-6 pt-6 pb-4">
        <div>
          <div class="text-h6 font-weight-bold text-primary">
            {{ $t('sections.manageSections') }}
          </div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ $t('sections.manageSectionsDesc') }}
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0">
        <!-- Create new section -->
        <div class="d-flex ga-2 mb-4">
          <v-text-field
            v-model="newSectionName"
            :placeholder="$t('sections.newSectionPlaceholder')"
            variant="filled"
            density="comfortable"
            rounded="lg"
            flat
            hide-details
            :disabled="isCreating"
            @keydown.enter="createSection"
          />
          <v-btn
            color="primary"
            variant="elevated"
            rounded="lg"
            :loading="isCreating"
            :disabled="!newSectionName.trim()"
            @click="createSection"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </div>

        <!-- Section list -->
        <div v-if="sectionsStore.sections.length === 0" class="text-center py-6">
          <v-icon size="36" color="medium-emphasis" class="mb-2">mdi-folder-outline</v-icon>
          <div class="text-body-2 text-medium-emphasis">{{ $t('sections.noSections') }}</div>
        </div>

        <v-list v-else density="compact" class="pa-0">
          <v-list-item
            v-for="section in sectionsStore.sections"
            :key="section.id"
            rounded="lg"
            class="px-0 mb-1"
          >
            <template #prepend>
              <v-icon size="18" color="medium-emphasis" class="mr-2">mdi-folder-outline</v-icon>
            </template>

            <template #default>
              <template v-if="editingId === section.id">
                <v-text-field
                  v-model="editingName"
                  variant="filled"
                  density="compact"
                  rounded="lg"
                  flat
                  hide-details
                  autofocus
                  @keydown.enter="saveEdit(section.id)"
                  @keydown.esc="cancelEdit"
                />
              </template>
              <template v-else>
                <span class="text-body-2 font-weight-medium">{{ section.name }}</span>
                <span class="text-caption text-disabled ml-2">
                  ({{ (section.items ?? []).length }})
                </span>
              </template>
            </template>

            <template #append>
              <div v-if="editingId === section.id" class="d-flex ga-1">
                <v-btn
                  icon
                  size="x-small"
                  variant="tonal"
                  color="primary"
                  :loading="isSavingEdit"
                  @click="saveEdit(section.id)"
                >
                  <v-icon size="14">mdi-check</v-icon>
                </v-btn>
                <v-btn icon size="x-small" variant="text" @click="cancelEdit">
                  <v-icon size="14">mdi-close</v-icon>
                </v-btn>
              </div>
              <div v-else-if="confirmingDeleteId === section.id" class="d-flex align-center ga-1">
                <span class="text-caption text-error">{{ $t('common.confirm') }}?</span>
                <v-btn
                  size="x-small"
                  variant="tonal"
                  color="error"
                  :loading="deletingId === section.id"
                  @click="confirmDelete(section.id)"
                >
                  <v-icon size="14">mdi-check</v-icon>
                </v-btn>
                <v-btn icon size="x-small" variant="text" @click="cancelDelete">
                  <v-icon size="14">mdi-close</v-icon>
                </v-btn>
              </div>
              <div v-else class="d-flex ga-1">
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  color="medium-emphasis"
                  @click="startEdit(section)"
                >
                  <v-icon size="14">mdi-pencil-outline</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  color="error"
                  @click="requestDeleteSection(section.id)"
                >
                  <v-icon size="14">mdi-delete-outline</v-icon>
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <div class="d-flex justify-end px-6 py-4">
        <v-btn variant="text" color="default" rounded="lg" @click="close">
          {{ $t('common.close') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { RoomSectionModel } from '@/interfaces/models/RoomSectionModel'
import { useRoomSectionsStore } from '@/stores/room-sections'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
defineOptions({ name: 'RoomSectionDialogManageSections' })
/* END DEFINE NAME COMPONENT */

/** START DEFINE PROPERTY AND EMITS */
defineProps({
  dialog: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits<{
  'close-modal': []
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const sectionsStore = useRoomSectionsStore()

const newSectionName = ref('')
const isCreating = ref(false)
const editingId = ref<number | null>(null)
const editingName = ref('')
const isSavingEdit = ref(false)
const deletingId = ref<number | null>(null)
const confirmingDeleteId = ref<number | null>(null)
/* END DEFINE STATE */

/** START DEFINE METHOD */
async function createSection() {
  const name = newSectionName.value.trim()
  if (!name) return

  try {
    isCreating.value = true
    await sectionsStore.createSection(name)
    newSectionName.value = ''
  } catch (error) {
    console.error('Failed to create section:', error)
  } finally {
    isCreating.value = false
  }
}

function startEdit(section: RoomSectionModel) {
  editingId.value = section.id
  editingName.value = section.name
}

function cancelEdit() {
  editingId.value = null
  editingName.value = ''
}

async function saveEdit(id: number) {
  const name = editingName.value.trim()
  if (!name) return

  try {
    isSavingEdit.value = true
    await sectionsStore.renameSection(id, name)
    cancelEdit()
  } catch (error) {
    console.error('Failed to rename section:', error)
  } finally {
    isSavingEdit.value = false
  }
}

function requestDeleteSection(id: number) {
  confirmingDeleteId.value = id
}

function cancelDelete() {
  confirmingDeleteId.value = null
}

async function confirmDelete(id: number) {
  try {
    deletingId.value = id
    confirmingDeleteId.value = null
    await sectionsStore.deleteSection(id)
  } catch (error) {
    console.error('Failed to delete section:', error)
  } finally {
    deletingId.value = null
  }
}

function close() {
  emit('close-modal')
}
/* END DEFINE METHOD */
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
</style>
