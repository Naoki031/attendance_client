<template>
  <v-container class="py-0 px-0" style="max-width: 100%; padding: 0">
    <div v-if="loading && !currentAlbum" class="d-flex justify-center py-16">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <v-alert
      v-else-if="!currentAlbum && !loading"
      type="error"
      variant="tonal"
      rounded="xl"
      class="mx-4 mt-4"
    >
      {{ t('memories.errors.loadAlbum') }}
    </v-alert>

    <template v-else-if="currentAlbum">
      <MemoriesPhotoGrid
        :album="currentAlbum"
        :photos="photos"
        :loading="loading"
        :photos-loading="photosLoading"
        :has-more-photos="photosHasMore"
        :photo-viewing="!!selectedPhoto"
        @upload-photos="handleUploadDone"
        @back="navigateTo('/memories')"
        @change-privacy="privacyDialog = true"
        @invite-member="inviteDialog = true"
        @share-album="shareAlbumDialog = true"
        @edit-album="editAlbumDialog = true"
        @share-photo="handleSharePhoto"
        @open-photo="handleOpenPhoto"
        @delete-photos="handleDeletePhotos"
        @load-more="loadMorePhotos(albumId)"
      />

      <!-- Photo detail dialog -->
      <MemoriesPhotoDetail
        v-if="selectedPhoto"
        :photo="selectedPhoto"
        :album="currentAlbum"
        :all-photos="photos"
        @close="selectedPhoto = null"
        @prev="navigatePhoto(-1)"
        @next="navigatePhoto(1)"
        @share="handleSharePhoto(selectedPhoto!)"
        @delete="handleDeleteFromDetail"
      />

      <!-- Share photo panel -->
      <MemoriesSharePanel
        v-if="photoToShare"
        v-model="shareDialog"
        :photo="photoToShare"
        :album="currentAlbum"
        @shared="shareDialog = false"
      />

      <!-- Share album panel -->
      <MemoriesShareAlbumPanel
        v-model="shareAlbumDialog"
        :album="currentAlbum"
        @shared="shareAlbumDialog = false"
      />

      <!-- Edit album modal -->
      <MemoriesEditAlbumModal
        :album="currentAlbum"
        :dialog="editAlbumDialog"
        @updated="editAlbumDialog = false"
        @close-modal="editAlbumDialog = false"
      />

      <!-- Invite member dialog -->
      <v-dialog v-model="inviteDialog" max-width="480" scrollable>
        <v-card rounded="xl" class="invite-dialog">
          <!-- Header -->
          <div class="invite-dialog__header">
            <div class="invite-dialog__icon">
              <v-icon size="18" color="primary">mdi-account-multiple-plus-outline</v-icon>
            </div>
            <div class="invite-dialog__titles">
              <div class="invite-dialog__title">{{ t('memories.inviteMembers') }}</div>
              <div class="invite-dialog__subtitle">{{ t('memories.inviteMembersSubtitle') }}</div>
            </div>
            <v-btn
              icon="mdi-close"
              variant="text"
              size="small"
              density="compact"
              class="ml-auto"
              @click="inviteDialog = false"
            />
          </div>

          <v-divider />

          <!-- Body -->
          <v-card-text class="invite-dialog__body">
            <div v-if="membersLoadingInitial" class="d-flex justify-center py-10">
              <v-progress-circular indeterminate color="primary" size="32" width="2" />
            </div>

            <template v-else>
              <v-autocomplete
                v-model="selectedMembers"
                :placeholder="t('memories.form.members')"
                :items="filteredMemberResults"
                :loading="memberSearchLoading"
                item-title="full_name"
                item-value="id"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                multiple
                return-object
                hide-details
                no-filter
                autocomplete="off"
                prepend-inner-icon="mdi-magnify"
                @update:search="onMemberSearch"
              >
                <template #chip="{ props: chipProps, item: chipItem }">
                  <v-chip
                    v-bind="chipProps"
                    size="small"
                    closable
                    color="primary"
                    variant="tonal"
                    class="invite-dialog__chip"
                    :prepend-avatar="(chipItem as UserModel).avatar || undefined"
                  >
                    {{ (chipItem as UserModel).full_name }}
                  </v-chip>
                </template>

                <template #no-data>
                  <div class="invite-dialog__no-data">
                    <v-icon size="32" color="grey-lighten-1">mdi-account-search-outline</v-icon>
                    <span>{{
                      memberSearchQuery.length < 2
                        ? t('memories.typeToSearch')
                        : t('memories.noMembersFound')
                    }}</span>
                  </div>
                </template>
              </v-autocomplete>

              <div v-if="selectedMembers.length > 0" class="invite-dialog__count">
                <v-icon size="14" color="primary">mdi-account-check-outline</v-icon>
                {{ t('memories.selectedCount', { count: selectedMembers.length }) }}
              </div>
            </template>
          </v-card-text>

          <v-divider />

          <!-- Footer -->
          <v-card-actions class="invite-dialog__footer">
            <span class="invite-dialog__footer-info">
              <v-icon size="14">mdi-account-group-outline</v-icon>
              {{
                t('memories.currentMemberCount', { count: currentAlbum?.memberIds?.length ?? 0 })
              }}
            </span>
            <v-spacer />
            <v-btn
              variant="text"
              rounded="lg"
              :disabled="inviteLoading"
              @click="inviteDialog = false"
            >
              {{ t('common.cancel') }}
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              rounded="lg"
              :loading="inviteLoading"
              :disabled="selectedMembers.length === 0"
              @click="handleInviteMembers"
            >
              {{ t('memories.confirmInvite', { count: selectedMembers.length }) }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Change privacy -->
      <v-dialog v-model="privacyDialog" max-width="420">
        <v-card rounded="xl" elevation="0" border>
          <!-- Header -->
          <div class="privacy-dialog-head px-6 pt-5 pb-4">
            <div class="privacy-dialog-head__icon">
              <v-icon size="18" color="primary">mdi-shield-lock-outline</v-icon>
            </div>
            <div>
              <div class="text-subtitle-1 font-weight-bold">{{ t('memories.changePrivacy') }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ t('memories.changePrivacySubtitle') }}
              </div>
            </div>
            <v-spacer />
            <v-btn icon variant="text" size="small" color="default" @click="privacyDialog = false">
              <v-icon size="18">mdi-close</v-icon>
            </v-btn>
          </div>

          <v-divider />

          <v-card-text class="pa-4">
            <div class="privacy-option-list">
              <!-- Public -->
              <button
                class="privacy-option"
                :class="{ 'privacy-option--active': pendingPrivacy === 'public' }"
                @click="pendingPrivacy = 'public'"
              >
                <div class="privacy-option__icon privacy-option__icon--public">
                  <v-icon size="20">mdi-earth</v-icon>
                </div>
                <div class="privacy-option__text">
                  <div class="privacy-option__title">{{ t('memories.public') }}</div>
                  <div class="privacy-option__desc">{{ t('memories.publicDesc') }}</div>
                </div>
                <v-icon
                  v-if="pendingPrivacy === 'public'"
                  size="18"
                  color="primary"
                  class="ml-auto"
                >
                  mdi-check-circle
                </v-icon>
              </button>

              <!-- Private -->
              <button
                class="privacy-option"
                :class="{ 'privacy-option--active': pendingPrivacy === 'private' }"
                @click="pendingPrivacy = 'private'"
              >
                <div class="privacy-option__icon privacy-option__icon--private">
                  <v-icon size="20">mdi-lock-outline</v-icon>
                </div>
                <div class="privacy-option__text">
                  <div class="privacy-option__title">{{ t('memories.private') }}</div>
                  <div class="privacy-option__desc">{{ t('memories.privateDesc') }}</div>
                </div>
                <v-icon
                  v-if="pendingPrivacy === 'private'"
                  size="18"
                  color="primary"
                  class="ml-auto"
                >
                  mdi-check-circle
                </v-icon>
              </button>
            </div>
          </v-card-text>

          <v-divider />

          <div class="d-flex justify-end ga-3 px-6 py-4">
            <v-btn variant="text" rounded="lg" color="default" @click="privacyDialog = false">
              {{ t('common.cancel') }}
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              rounded="lg"
              :loading="privacyLoading"
              prepend-icon="mdi-content-save-outline"
              @click="handlePrivacyChange"
            >
              {{ t('common.save') }}
            </v-btn>
          </div>
        </v-card>
      </v-dialog>
    </template>
  </v-container>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { Photo } from '@/types/memories'
import type { UserModel } from '@/interfaces/models/UserModel'
import { useMemories } from '@/composables/useMemories'
import { useAppNotifications } from '@/composables/useAppNotifications'
import { useUserStore } from '@/stores/user'
import UserService from '@/services/UserService'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
definePageMeta({
  layout: 'default',
  name: 'memories.album',
})
/* END DEFINE NAME COMPONENT */

/** START DEFINE STATE */
const { t } = useI18n()
const route = useRoute()
const {
  currentAlbum,
  photos,
  loading,
  photosLoading,
  photosHasMore,
  forbidden,
  fetchAlbum,
  loadMorePhotos,
  updateAlbum,
  updateMembers,
  deletePhoto,
} = useMemories()
const { notifySuccess, notifyError } = useAppNotifications()

const albumId = computed(() => route.params.id as string)

const shareDialog = ref(false)
const shareAlbumDialog = ref(false)
const editAlbumDialog = ref(false)
const photoToShare = ref<Photo | null>(null)
const selectedPhoto = ref<Photo | null>(null)
const photoViewerOpen = useState('memoriesPhotoViewerOpen', () => false)
const privacyDialog = ref(false)
const privacyLoading = ref(false)
const pendingPrivacy = ref<'public' | 'private'>('public')

const inviteDialog = ref(false)
const inviteLoading = ref(false)
const selectedMembers = ref<UserModel[]>([])
const memberSearchQuery = ref('')
const memberSearchLoading = ref(false)
const searchedMembers = ref<UserModel[]>([])
const membersLoadingInitial = ref<boolean>(false)
let memberSearchTimer: ReturnType<typeof setTimeout> | null = null
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const filteredMemberResults = computed(() => {
  const selectedIds = new Set(selectedMembers.value.map((member) => member.id))
  // Always include selectedMembers in the items pool so Vuetify can resolve chip titles
  const merged = [
    ...selectedMembers.value,
    ...searchedMembers.value.filter((user) => !selectedIds.has(user.id)),
  ]
  return merged
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
function handleSharePhoto(photo: Photo): void {
  photoToShare.value = photo
  shareDialog.value = true
}

function handleOpenPhoto(photo: Photo): void {
  selectedPhoto.value = photo
}

function navigatePhoto(direction: -1 | 1): void {
  if (!selectedPhoto.value) return
  const index = photos.value.findIndex((photo) => photo.id === selectedPhoto.value!.id)
  if (index === -1) return
  const next = photos.value[index + direction]
  if (next) selectedPhoto.value = next
}

function handleUploadDone(): void {
  fetchAlbum(albumId.value)
}

async function handleDeletePhotos(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => deletePhoto(id, false)))
  // Apply the total count adjustment once after all deletes complete
  if (currentAlbum.value) {
    currentAlbum.value = {
      ...currentAlbum.value,
      photoCount: Math.max(0, currentAlbum.value.photoCount - ids.length),
    }
  }
  notifySuccess(t('memories.deleteSuccess'))
}

async function handleDeleteFromDetail(id: string): Promise<void> {
  // Navigate to adjacent photo before deleting so dialog doesn't flash empty
  const index = photos.value.findIndex((photo) => photo.id === id)
  const next = photos.value[index + 1] ?? photos.value[index - 1] ?? null
  selectedPhoto.value = next

  await deletePhoto(id)
  notifySuccess(t('memories.deleteSuccess'))
}

async function handlePrivacyChange(): Promise<void> {
  if (!currentAlbum.value) return

  privacyLoading.value = true
  try {
    await updateAlbum(currentAlbum.value.id, { privacy: pendingPrivacy.value })
    privacyDialog.value = false
  } finally {
    privacyLoading.value = false
  }
}

function loadCurrentMembers(): void {
  const members = currentAlbum.value?.members ?? []
  // Map AlbumMember (id/name/avatar) to the shape v-autocomplete expects (full_name/id/avatar)
  selectedMembers.value = members.map((member) => ({
    id: Number(member.id),
    full_name: member.name,
    avatar: member.avatar ?? null,
  })) as unknown as UserModel[]
}

function onMemberSearch(query: string): void {
  memberSearchQuery.value = query
  if (memberSearchTimer) clearTimeout(memberSearchTimer)
  if (!query?.trim() || query.length < 2) {
    searchedMembers.value = []
    memberSearchLoading.value = false
    return
  }
  memberSearchLoading.value = true
  memberSearchTimer = setTimeout(() => searchMembers(query), 300)
}

async function searchMembers(query: string): Promise<void> {
  memberSearchLoading.value = true
  try {
    const userStore = useUserStore()
    const currentUserId = userStore.user?.id
    const results = await UserService.search(query)
    searchedMembers.value = currentUserId
      ? results.filter((user) => user.id !== currentUserId)
      : results
  } catch {
    searchedMembers.value = []
  } finally {
    memberSearchLoading.value = false
  }
}

async function handleInviteMembers(): Promise<void> {
  if (!currentAlbum.value) return

  inviteLoading.value = true
  try {
    const memberIds = selectedMembers.value.map((member) => String(member.id))
    const result = await updateMembers(currentAlbum.value.id, memberIds)
    if (result) {
      notifySuccess(t('memories.inviteSuccess'))
      inviteDialog.value = false
    } else {
      notifyError(t('memories.errors.inviteMembers'))
    }
  } finally {
    inviteLoading.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(forbidden, (value) => {
  if (value) navigateTo('/memories')
})

watch(selectedPhoto, (value) => {
  photoViewerOpen.value = value !== null
})

watch(
  () => currentAlbum.value?.privacy,
  (value) => {
    if (value) pendingPrivacy.value = value
  },
  { immediate: true },
)

watch(inviteDialog, (opened) => {
  if (opened) {
    memberSearchQuery.value = ''
    searchedMembers.value = []
    selectedMembers.value = []
    if (memberSearchTimer) clearTimeout(memberSearchTimer)
    loadCurrentMembers()
  }
})
/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  fetchAlbum(albumId.value)
})

onUnmounted(() => {
  photoViewerOpen.value = false
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.invite-dialog__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 16px;
}

.invite-dialog__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.invite-dialog__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
}

.invite-dialog__subtitle {
  font-size: 12.5px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-top: 2px;
}

.invite-dialog__body {
  padding: 16px 20px 12px;
  min-height: 220px;
}

.invite-dialog__chip {
  margin: 2px;
}

.invite-dialog__no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: 13px;
}

.invite-dialog__count {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  font-size: 12.5px;
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

.invite-dialog__footer {
  padding: 12px 20px 16px;
  gap: 8px;
}

.invite-dialog__footer-info {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

/* ── Privacy dialog ─────────────────────────────────────────── */
.privacy-dialog-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.privacy-dialog-head__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.1);
  flex-shrink: 0;
}

.privacy-option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.privacy-option {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.1);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.18s,
    background 0.18s;
}

.privacy-option:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.privacy-option--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
}

.privacy-option__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
}

.privacy-option__icon--public {
  background: rgba(var(--v-theme-success, 76, 175, 80), 0.12);
  color: rgb(var(--v-theme-success, 76, 175, 80));
}

.privacy-option__icon--private {
  background: rgba(var(--v-theme-warning, 255, 152, 0), 0.12);
  color: rgb(var(--v-theme-warning, 255, 152, 0));
}

.privacy-option__text {
  min-width: 0;
  flex: 1;
}

.privacy-option__title {
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.3;
}

.privacy-option__desc {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-top: 2px;
  line-height: 1.4;
}
</style>
