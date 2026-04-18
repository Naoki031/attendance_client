<template>
  <v-container class="py-8" max-width="1200">
    <MemoriesAlbumList
      :albums="albums"
      :loading="loading"
      @open-album="handleOpenAlbum"
      @create-album="createDialog = true"
    />

    <MemoriesCreateAlbumModal
      :dialog="createDialog"
      @created="handleAlbumCreated"
      @close-modal="createDialog = false"
    />
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { Album } from '@/types/memories'
import { useMemories } from '@/composables/useMemories'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  layout: 'default',
  name: 'memories.index',
})
/* END DEFINE NAME COMPONENT */

/** START DEFINE STATE */
const { albums, loading, fetchAlbums } = useMemories()
const createDialog = ref(false)
/* END DEFINE STATE */

/** START DEFINE METHOD */
function handleOpenAlbum(album: Album): void {
  navigateTo(`/memories/${album.id}`)
}

function handleAlbumCreated(): void {
  createDialog.value = false
  fetchAlbums()
}
/* END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  fetchAlbums()
})
/* END DEFINE LIFE CYCLE HOOK */
</script>
