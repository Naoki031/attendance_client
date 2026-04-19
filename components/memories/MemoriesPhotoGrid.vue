<template>
  <div class="cin-page" :class="{ 'cin-page--light': !isDarkPage }">
    <!-- Ambient color wash -->
    <div class="cin-wash" aria-hidden="true" />

    <!-- ── Topbar ─────────────────────────────────────────────── -->
    <header class="cin-topbar">
      <button class="cin-back" @click="emit('back')">
        <v-icon size="16">mdi-chevron-left</v-icon>
        <span>{{ t('memories.title') }}</span>
      </button>
      <div class="cin-brand">
        <span class="cin-brand-mark" />
        <span class="cin-brand-name">{{ album.title }}</span>
      </div>
      <div class="cin-topbar-actions">
        <button
          v-if="canUpload"
          class="cin-icon-btn"
          :aria-label="t('memories.inviteMembers')"
          @click="emit('invite-member')"
        >
          <v-icon size="16">mdi-account-plus-outline</v-icon>
        </button>
        <button
          v-if="isCreator"
          class="cin-icon-btn"
          :aria-label="t('memories.editAlbum')"
          @click="emit('edit-album')"
        >
          <v-icon size="16">mdi-pencil-outline</v-icon>
        </button>
        <button
          v-if="isCreator"
          class="cin-icon-btn"
          :aria-label="t('memories.changePrivacy')"
          @click="emit('change-privacy')"
        >
          <v-icon size="16">mdi-shield-edit-outline</v-icon>
        </button>
      </div>
    </header>

    <!-- ── Hero: cinematic mosaic ─────────────────────────────── -->
    <section class="cin-hero">
      <div class="cin-mosaic" aria-hidden="true">
        <div
          v-for="(mosaicPhoto, mosaicIndex) in mosaicPhotos"
          :key="`mosaic-${mosaicIndex}`"
          :class="`cin-mosaic-tile cin-mosaic-tile--${mosaicIndex}`"
        >
          <img
            v-if="mosaicPhoto?.thumbnailUrl || mosaicPhoto?.url"
            :src="mosaicPhoto.thumbnailUrl || mosaicPhoto.url"
            :alt="mosaicPhoto.caption ?? ''"
            class="cin-mosaic-img"
          />
          <div v-else class="cin-mosaic-fill" :style="{ background: MOSAIC_TONES[mosaicIndex] }" />
        </div>
        <div class="cin-hero-scrim" />
      </div>

      <!-- Top-right metadata badge -->
      <div class="cin-hero-meta">
        <span class="cin-hero-meta-item">
          <v-icon size="12">mdi-calendar-outline</v-icon>
          {{ formattedDate }}
        </span>
        <span class="cin-hero-meta-sep" />
        <span class="cin-hero-meta-item">
          <v-icon size="12">{{
            album.privacy === 'public' ? 'mdi-earth' : 'mdi-lock-outline'
          }}</v-icon>
          {{ album.privacy === 'public' ? t('memories.public') : t('memories.private') }}
        </span>
        <span class="cin-hero-meta-sep" />
        <button class="cin-hero-meta-item cin-hero-meta-item--btn" @click="openViewersDialog">
          <v-icon size="12">mdi-eye-outline</v-icon>
          {{ album.viewCount ?? 0 }} {{ t('memories.views') }}
        </button>
      </div>

      <div class="cin-hero-copy">
        <div class="cin-eyebrow">
          <span class="cin-chip">{{ eventTypeLabel }}</span>
        </div>

        <h1 class="cin-title">{{ album.title }}</h1>
        <p v-if="album.description" class="cin-lede">{{ album.description }}</p>

        <div class="cin-hero-foot">
          <div class="cin-members">
            <div class="cin-avatar-stack">
              <v-tooltip
                v-for="(member, avatarIndex) in visibleMembersInfo"
                :key="member.id"
                :text="member.name"
                location="top"
              >
                <template #activator="{ props: tooltipProps }">
                  <div
                    v-bind="tooltipProps"
                    class="cin-avatar-stack-item"
                    :style="{ zIndex: visibleMembersInfo.length - avatarIndex }"
                  >
                    <div
                      v-if="member.avatar"
                      class="cin-avatar cin-avatar--img"
                      :style="{ backgroundImage: `url(${member.avatar})` }"
                    />
                    <div
                      v-else
                      class="cin-avatar"
                      :style="{ background: MEMBER_COLORS[avatarIndex % MEMBER_COLORS.length] }"
                    >
                      {{ memberInitials(member.name) }}
                    </div>
                  </div>
                </template>
              </v-tooltip>
              <div v-if="extraMemberCount > 0" class="cin-avatar-stack-item" :style="{ zIndex: 0 }">
                <div class="cin-avatar cin-avatar--more">+{{ extraMemberCount }}</div>
              </div>
            </div>
            <div class="cin-members-copy">
              <strong>{{ album.memberIds.length }} {{ t('memories.members') }}</strong>
              <span>{{ album.photoCount }} {{ t('memories.photos') }}</span>
            </div>
          </div>

          <div class="cin-hero-tools">
            <button class="cin-btn cin-btn--accent" @click="startSlideshow">
              <v-icon size="14">mdi-play</v-icon>
              {{ t('memories.slideshow') }}
            </button>
            <button class="cin-btn cin-btn--ghost" @click="emit('share-album')">
              <v-icon size="14">mdi-share-variant-outline</v-icon>
              {{ t('memories.shareAlbum') }}
            </button>
            <button
              v-if="canUpload"
              class="cin-btn cin-btn--ghost"
              :disabled="isDownloading"
              @click="downloadAlbum"
            >
              <v-progress-circular v-if="isDownloading" size="14" width="2" indeterminate />
              <v-icon v-else size="14">mdi-download-outline</v-icon>
              {{ isDownloading ? t('memories.downloading') : t('memories.downloadAlbum') }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Stat ribbon ─────────────────────────────────────────── -->
    <div class="cin-ribbon">
      <div v-for="stat in stats" :key="stat.key" class="cin-ribbon-cell">
        <strong>{{ stat.value }}</strong>
        <span>{{ stat.label }}</span>
      </div>
    </div>

    <!-- ── Gallery header + filter pills ──────────────────────── -->
    <div class="cin-section-hd">
      <h2>{{ t('memories.gallery') }}</h2>
      <div class="cin-section-hd-right">
        <div class="cin-filter">
          <button
            v-for="pill in filterPills"
            :key="pill.key"
            :class="['cin-pill', { 'cin-pill--active': activeFilter === pill.key }]"
            @click="activeFilter = pill.key"
          >
            {{ pill.label }}
          </button>
        </div>
        <button v-if="canUpload && !selectMode" class="cin-upload-btn" @click="fabOpen = true">
          <v-icon size="15">mdi-plus</v-icon>
          <span>{{ t('memories.uploadNow') }}</span>
        </button>
        <button
          v-if="canUpload && filteredPhotos.length > 0"
          class="cin-select-btn"
          @click="toggleSelectMode"
        >
          <v-icon size="15">{{
            selectMode ? 'mdi-close' : 'mdi-checkbox-multiple-outline'
          }}</v-icon>
          <span>{{ selectMode ? t('common.cancel') : t('memories.select') }}</span>
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="cin-grid">
      <div v-for="skel in 9" :key="`skel-${skel}`" class="cin-skeleton" />
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredPhotos.length === 0" class="cin-empty">
      <v-icon size="48" color="primary">mdi-image-off-outline</v-icon>
      <p class="cin-empty-title">{{ t('memories.noPhotos') }}</p>
      <p v-if="canUpload" class="cin-empty-sub">{{ t('memories.noPhotosSub') }}</p>
    </div>

    <!-- Photo grid -->
    <div v-else class="cin-grid">
      <div
        v-for="(photo, photoIndex) in filteredPhotos"
        :key="photo.id"
        class="cin-cell"
        :class="{
          'cin-cell--selected': selectedIds.has(photo.id),
          'cin-cell--select-mode': selectMode,
          'cin-cell--not-deletable': selectMode && !canDeletePhoto(photo),
        }"
        :style="{ '--tilt': `${(photoIndex % 3) - 1}deg` }"
        role="button"
        :tabindex="0"
        @click="
          selectMode
            ? canDeletePhoto(photo)
              ? toggleSelectPhoto(photo.id)
              : undefined
            : emit('open-photo', photo)
        "
        @keydown.enter.prevent="
          selectMode
            ? canDeletePhoto(photo)
              ? toggleSelectPhoto(photo.id)
              : undefined
            : emit('open-photo', photo)
        "
        @keydown.space.prevent="
          selectMode
            ? canDeletePhoto(photo)
              ? toggleSelectPhoto(photo.id)
              : undefined
            : emit('open-photo', photo)
        "
      >
        <div class="cin-photo-tile">
          <img
            v-if="photo.thumbnailUrl || photo.url"
            :src="photo.thumbnailUrl || photo.url"
            :alt="photo.caption ?? ''"
            class="cin-photo-img"
            loading="lazy"
          />
          <div
            v-else
            class="cin-photo-fill"
            :style="{ background: MOSAIC_TONES[photoIndex % MOSAIC_TONES.length] }"
          />
          <div class="cin-photo-overlay">
            <p v-if="photo.caption" class="cin-photo-caption">{{ photo.caption }}</p>
            <div v-if="!selectMode" class="cin-photo-stats">
              <button
                :class="[
                  'cin-react-btn',
                  { 'cin-react-btn--liked': userReactions[photo.id] === 'heart' },
                ]"
                :aria-label="t('memories.reactions.heart')"
                @click.stop="handleToggleReaction(photo.id)"
              >
                <v-icon size="14">{{
                  userReactions[photo.id] === 'heart' ? 'mdi-heart' : 'mdi-heart-outline'
                }}</v-icon>
                <span>{{ totalReactionsForPhoto(photo.id) }}</span>
              </button>
              <span v-if="photo.viewCount" class="cin-view-stat">
                <v-icon size="13">mdi-eye-outline</v-icon>
                {{ photo.viewCount }}
              </span>
            </div>
          </div>
          <!-- Select checkbox overlay — only shown for deletable photos -->
          <div v-if="selectMode && canDeletePhoto(photo)" class="cin-select-check">
            <v-icon size="18" :color="selectedIds.has(photo.id) ? 'primary' : 'white'">
              {{
                selectedIds.has(photo.id)
                  ? 'mdi-checkbox-marked-circle'
                  : 'mdi-checkbox-blank-circle-outline'
              }}
            </v-icon>
          </div>
          <!-- Lock icon for photos the current user cannot delete -->
          <div v-else-if="selectMode && !canDeletePhoto(photo)" class="cin-select-lock">
            <v-icon size="16" color="white">mdi-lock-outline</v-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- Load-more spinner -->
    <div v-if="props.photosLoading && props.photos.length > 0" class="cin-load-more-spinner">
      <v-progress-circular indeterminate color="primary" size="28" width="2" />
    </div>

    <!-- Delete action bar -->
    <transition name="cin-bar">
      <div v-if="selectMode && selectedIds.size > 0" class="cin-delete-bar">
        <span class="cin-delete-bar-count">
          {{ selectedIds.size }} {{ t('memories.photosSelected') }}
        </span>
        <button class="cin-delete-bar-btn" @click="deleteConfirming = true">
          <v-icon size="16">mdi-delete-outline</v-icon>
          {{ t('memories.deleteSelected') }}
        </button>
      </div>
    </transition>

    <!-- Delete confirm dialog -->
    <v-dialog v-model="deleteConfirming" max-width="360">
      <v-card rounded="xl">
        <v-card-title class="pt-6 px-6 text-h6 font-weight-bold">
          {{ t('memories.confirmDelete') }}
        </v-card-title>
        <v-card-text class="px-6">
          {{ t('memories.confirmDeleteDesc', { count: selectedIds.size }) }}
        </v-card-text>
        <v-card-actions class="px-6 pb-5 ga-3 justify-end">
          <v-btn variant="text" rounded="lg" @click="deleteConfirming = false">
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn color="error" variant="flat" rounded="lg" @click="handleDeleteSelected">
            {{ t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Viewers dialog -->
    <v-dialog v-model="viewersDialogOpen" max-width="400" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pt-5 px-5 text-subtitle-1 font-weight-bold d-flex align-center gap-2">
          <v-icon size="18">mdi-eye-outline</v-icon>
          {{ t('memories.viewersDialogTitle') }}
          <v-chip size="x-small" class="ml-1">{{ viewersDialogData.viewCount }}</v-chip>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            density="compact"
            class="ml-auto"
            @click="viewersDialogOpen = false"
          />
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0" style="max-height: 400px; overflow-y: auto">
          <div v-if="viewersDialogLoading" class="d-flex justify-center py-6">
            <v-progress-circular indeterminate size="28" color="primary" />
          </div>
          <v-list v-else-if="viewersDialogData.viewers.length > 0" lines="two">
            <v-list-item
              v-for="viewer in viewersDialogData.viewers"
              :key="viewer.id"
              :subtitle="viewer.viewedAt ? formatDate(viewer.viewedAt) : ''"
            >
              <template #prepend>
                <v-avatar size="36" color="primary" class="mr-3">
                  <v-img v-if="viewer.avatar" :src="viewer.avatar" cover />
                  <span v-else class="text-caption font-weight-bold text-white">{{
                    viewer.name[0]?.toUpperCase()
                  }}</span>
                </v-avatar>
              </template>
              <template #title>
                <span class="text-body-2 font-weight-medium">{{ viewer.name }}</span>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-8 text-medium-emphasis text-body-2">
            {{ t('memories.noViewersYet') }}
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- ── FAB upload ──────────────────────────────────────────── -->
    <div v-if="canUpload && !photoViewing" ref="fabWrapReference" class="cin-fab-wrap">
      <Teleport to="body">
        <transition name="cin-backdrop">
          <div v-if="fabOpen" class="cin-fab-backdrop" @click="fabOpen = false" />
        </transition>
        <transition name="cin-fab-panel">
          <div
            v-if="fabOpen"
            ref="fabPanelReference"
            class="cin-fab-panel"
            :class="{ 'cin-fab-panel--drag': isDragging }"
            @dragenter.prevent="isDragging = true"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <div class="cin-fab-panel-hd">
              <strong>{{ t('memories.addToMemory') }}</strong>
              <button
                class="cin-icon-btn cin-icon-btn--sm"
                :aria-label="t('common.close')"
                @click="fabOpen = false"
              >
                <v-icon size="14">mdi-close</v-icon>
              </button>
            </div>

            <div v-if="pendingFiles.length > 0" class="cin-pending-list">
              <div class="cin-pending-summary">
                <span>{{ pendingFiles.length }} {{ t('memories.filesSelected') }}</span>
                <button v-if="!isUploading" class="cin-pending-clear" @click="pendingFiles = []">
                  {{ t('memories.clearAll') }}
                </button>
              </div>

              <div class="cin-pending-grid">
                <div
                  v-for="(item, itemIndex) in pendingFiles"
                  :key="item.name + itemIndex"
                  class="cin-pending-cell"
                  :class="`cin-pending-cell--${item.status}`"
                >
                  <!-- HEIC converting spinner -->
                  <div v-if="item.previewing" class="cin-pending-placeholder">
                    <v-progress-circular indeterminate color="white" size="22" width="2" />
                    <span class="cin-pending-ext">HEIC</span>
                  </div>
                  <!-- Image preview -->
                  <img
                    v-else-if="item.preview"
                    :src="item.preview"
                    :alt="item.name"
                    class="cin-pending-img"
                  />
                  <!-- Video placeholder -->
                  <div
                    v-else-if="item.file.type.startsWith('video/')"
                    class="cin-pending-placeholder cin-pending-placeholder--video"
                  >
                    <v-icon size="28" color="white">mdi-play-circle-outline</v-icon>
                    <span class="cin-pending-ext">{{
                      item.name.split('.').pop()?.toUpperCase()
                    }}</span>
                  </div>
                  <!-- PDF placeholder -->
                  <div
                    v-else-if="item.file.type === 'application/pdf'"
                    class="cin-pending-placeholder cin-pending-placeholder--pdf"
                  >
                    <v-icon size="28" color="white">mdi-file-pdf-box</v-icon>
                    <span class="cin-pending-ext">PDF</span>
                  </div>
                  <!-- Generic placeholder -->
                  <div v-else class="cin-pending-placeholder">
                    <v-icon size="28" color="white">mdi-image-outline</v-icon>
                  </div>

                  <!-- Overlay: uploading -->
                  <div v-if="item.status === 'uploading'" class="cin-pending-overlay">
                    <v-progress-circular indeterminate color="white" size="22" width="2" />
                  </div>
                  <!-- Overlay: done -->
                  <div
                    v-else-if="item.status === 'done'"
                    class="cin-pending-overlay cin-pending-overlay--done"
                  >
                    <v-icon size="22" color="white">mdi-check-circle-outline</v-icon>
                  </div>
                  <!-- Overlay: error -->
                  <div
                    v-else-if="item.status === 'error'"
                    class="cin-pending-overlay cin-pending-overlay--error"
                  >
                    <v-icon size="18" color="white">mdi-alert-circle-outline</v-icon>
                  </div>

                  <!-- Remove button (pending only) -->
                  <button
                    v-if="item.status === 'pending'"
                    class="cin-pending-remove"
                    :aria-label="t('common.remove')"
                    @click.stop="removePendingFile(itemIndex)"
                  >
                    <v-icon size="12">mdi-close</v-icon>
                  </button>

                  <!-- Filename tooltip on bottom -->
                  <div class="cin-pending-name">{{ item.name }}</div>
                </div>
              </div>

              <div class="cin-pending-actions">
                <v-btn
                  color="primary"
                  variant="flat"
                  size="small"
                  rounded="lg"
                  block
                  :loading="isUploading"
                  :disabled="
                    isUploading || pendingFiles.every((fileItem) => fileItem.status !== 'pending')
                  "
                  @click="handleUpload"
                >
                  {{ t('memories.uploadNow') }}
                </v-btn>
              </div>
            </div>

            <div class="cin-fab-drop">
              <v-icon size="22">mdi-cloud-upload-outline</v-icon>
              <div class="cin-fab-drop-title">{{ t('memories.dragFilesHere') }}</div>
              <div class="cin-fab-drop-sub">{{ t('memories.uploadZoneHint') }}</div>
            </div>

            <div class="cin-fab-actions">
              <button class="cin-fab-action" @click="triggerFileInput('image/*')">
                <v-icon size="16">mdi-image-outline</v-icon>
                {{ t('memories.photo') }}
              </button>
              <button class="cin-fab-action" @click="triggerFileInput('video/*')">
                <v-icon size="16">mdi-video-outline</v-icon>
                {{ t('memories.video') }}
              </button>
              <button class="cin-fab-action" @click="triggerFileInput('.pdf,application/pdf')">
                <v-icon size="16">mdi-file-pdf-box</v-icon>
                PDF
              </button>
            </div>

            <input
              ref="fileInputReference"
              type="file"
              accept="image/*,video/*,.pdf"
              multiple
              style="
                position: absolute;
                opacity: 0;
                width: 0;
                height: 0;
                overflow: hidden;
                pointer-events: none;
              "
              @change="handleFileChange"
            />
          </div>
        </transition>
      </Teleport>

      <button
        class="cin-fab"
        :class="{ 'cin-fab--open': fabOpen }"
        :aria-label="fabOpen ? t('common.close') : t('memories.addToMemory')"
        @click="fabOpen = !fabOpen"
      >
        <v-icon
          size="22"
          :style="{ transform: fabOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.25s' }"
        >
          mdi-plus
        </v-icon>
      </button>
    </div>

    <!-- ── Notes FAB (always visible, notes accessible anywhere on page) ── -->
    <div v-if="!photoViewing" class="cin-notes-wrap">
      <Teleport to="body">
        <transition name="cin-backdrop">
          <div v-if="notesOpen" class="cin-notes-backdrop" @click="notesOpen = false" />
        </transition>
        <transition name="notes-panel">
          <div v-if="notesOpen" class="notes-panel">
            <!-- Mobile drag handle -->
            <div class="notes-panel__handle" />

            <!-- Header -->
            <div class="notes-panel__header">
              <v-icon size="17" color="primary" class="mr-1">mdi-forum-outline</v-icon>
              <span class="notes-panel__title">{{ t('memories.albumNotes') }}</span>
              <span v-if="albumComments.length > 0" class="notes-panel__badge">
                {{ albumComments.length }}
              </span>
              <button
                class="notes-panel__close"
                :aria-label="t('common.close')"
                @click="notesOpen = false"
              >
                <v-icon size="15">mdi-close</v-icon>
              </button>
            </div>

            <!-- Body: empty state or comment list -->
            <div ref="notesPanelBodyReference" class="notes-panel__body">
              <div v-if="albumComments.length === 0" class="notes-panel__empty">
                <v-icon size="36">mdi-chat-outline</v-icon>
                <p>{{ t('memories.firstComment') }}</p>
              </div>

              <ul v-else ref="notesListReference" class="notes-panel__list">
                <li
                  v-for="comment in albumComments"
                  :key="comment.id"
                  :data-comment-id="comment.id"
                  class="notes-comment"
                >
                  <div
                    v-if="comment.user?.avatar"
                    class="notes-comment__avatar notes-comment__avatar--img"
                    :style="{ backgroundImage: `url(${comment.user.avatar})` }"
                  />
                  <div
                    v-else
                    class="notes-comment__avatar"
                    :style="{ background: avatarColorForUser(comment.userId) }"
                  >
                    {{ memberInitials(comment.user?.name ?? '') }}
                  </div>

                  <div class="notes-comment__content">
                    <!-- Inline edit mode -->
                    <div v-if="editingCommentId === comment.id" class="notes-comment__edit">
                      <textarea
                        v-model="editingText"
                        class="notes-comment__edit-input"
                        rows="2"
                        @keydown.enter.exact.prevent="handleSaveEditComment(comment.id)"
                        @keydown.esc="cancelEditComment"
                      />
                      <div class="notes-comment__edit-actions">
                        <button class="notes-comment__edit-cancel" @click="cancelEditComment">
                          {{ t('common.cancel') }}
                        </button>
                        <button
                          class="notes-comment__edit-save"
                          :disabled="!editingText.trim() || editingText.trim() === comment.text"
                          @click="handleSaveEditComment(comment.id)"
                        >
                          {{ t('common.save') }}
                        </button>
                      </div>
                    </div>

                    <!-- Normal display -->
                    <template v-else>
                      <div class="notes-comment__meta">
                        <span class="notes-comment__name">{{ comment.user.name }}</span>
                        <span class="notes-comment__time">
                          {{ formatCommentTime(comment.createdAt) }}
                        </span>
                        <v-menu
                          v-if="
                            comment.userId === currentUserId &&
                            !comment.id.startsWith('optimistic-')
                          "
                          location="bottom end"
                          :z-index="10002"
                        >
                          <template #activator="{ props: menuProps }">
                            <button v-bind="menuProps" class="notes-comment__menu-btn">
                              <v-icon size="12">mdi-dots-vertical</v-icon>
                            </button>
                          </template>
                          <v-list density="compact" rounded="lg" min-width="130">
                            <v-list-item
                              prepend-icon="mdi-pencil-outline"
                              :title="t('common.edit')"
                              @click="startEditComment(comment.id, comment.text)"
                            />
                            <v-divider class="my-1" />
                            <v-list-item
                              prepend-icon="mdi-delete-outline"
                              :title="t('common.delete')"
                              base-color="error"
                              @click="confirmDeleteAlbumComment(comment.id)"
                            />
                          </v-list>
                        </v-menu>
                      </div>
                      <!-- eslint-disable vue/no-v-html -->
                      <p
                        class="notes-comment__text chat-rendered-markdown"
                        v-html="
                          renderCommentText(albumCommentDisplayText(comment.id, comment.text))
                        "
                      />
                      <!-- eslint-enable vue/no-v-html -->
                      <button
                        v-if="
                          !comment.id.startsWith('optimistic-') &&
                          comment.detectedLanguage &&
                          comment.detectedLanguage !== userLanguage
                        "
                        class="cin-translate-btn"
                        :disabled="albumCommentTranslating[comment.id]"
                        @click="handleToggleAlbumCommentTranslation(comment.id)"
                      >
                        <v-progress-circular
                          v-if="albumCommentTranslating[comment.id]"
                          indeterminate
                          size="10"
                          width="1.5"
                        />
                        <v-icon v-else size="12">
                          {{
                            albumCommentShowTranslation[comment.id]
                              ? 'mdi-translate-off'
                              : 'mdi-translate'
                          }}
                        </v-icon>
                        <span>{{
                          albumCommentShowTranslation[comment.id]
                            ? t('memories.showOriginal')
                            : t('memories.showTranslated')
                        }}</span>
                      </button>
                    </template>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Footer: input -->
            <div class="notes-panel__footer">
              <div class="notes-panel__input-wrap">
                <input
                  ref="commentInputReference"
                  v-model="commentDraft"
                  class="notes-panel__input"
                  :placeholder="t('memories.commentPlaceholder')"
                  @keydown.enter.prevent="submitComment"
                />
                <v-menu
                  v-model="showEmojiPicker"
                  location="top end"
                  :close-on-content-click="false"
                  :z-index="10002"
                >
                  <template #activator="{ props: menuProps }">
                    <button class="notes-panel__emoji-btn" v-bind="menuProps">
                      <v-icon size="14">mdi-emoticon-outline</v-icon>
                    </button>
                  </template>
                  <EmojiPicker @select="insertEmoji" />
                </v-menu>
                <button
                  class="notes-panel__send"
                  :class="{
                    'notes-panel__send--active': commentDraft.trim() && !commentSubmitting,
                  }"
                  :disabled="!commentDraft.trim() || commentSubmitting"
                  :aria-label="t('memories.send')"
                  @click="submitComment"
                >
                  <v-icon size="15">mdi-send</v-icon>
                </button>
              </div>
            </div>
          </div>
        </transition>
      </Teleport>

      <!-- Notes FAB button -->
      <button
        class="cin-notes-fab"
        :class="{ 'cin-notes-fab--active': notesOpen }"
        :aria-label="t('memories.albumNotes')"
        @click="notesOpen = !notesOpen"
      >
        <v-badge
          v-if="albumComments.length > 0 && !notesOpen"
          :content="albumComments.length"
          color="primary"
          floating
        >
          <v-icon size="22">mdi-forum-outline</v-icon>
        </v-badge>
        <v-icon v-else size="22">{{ notesOpen ? 'mdi-close' : 'mdi-forum-outline' }}</v-icon>
      </button>
    </div>
  </div>

  <!-- Comment delete confirm dialog -->
  <v-dialog
    :model-value="!!deletingAlbumCommentId"
    max-width="340"
    @update:model-value="deletingAlbumCommentId = null"
  >
    <v-card rounded="xl">
      <v-card-title class="pt-6 px-6 text-subtitle-1 font-weight-bold">
        {{ t('memories.confirmDeleteComment') }}
      </v-card-title>
      <v-card-text class="px-6">
        {{ t('memories.confirmDeleteCommentBody') }}
      </v-card-text>
      <v-card-actions class="px-6 pb-5 ga-3 justify-end">
        <v-btn variant="text" rounded="lg" @click="deletingAlbumCommentId = null">
          {{ t('common.cancel') }}
        </v-btn>
        <v-btn color="error" variant="flat" rounded="lg" @click="handleDeleteAlbumComment">
          {{ t('common.delete') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { PropType } from 'vue'
import { useTheme } from 'vuetify'
import type { Album, Photo } from '@/types/memories'
import EmojiPicker from '@/components/chat/EmojiPicker.vue'
import { renderCommentText } from '@/utils/chatMarkdown'
import { useMoment } from '@/composables/useMoment'
import { usePhotoInteraction } from '@/composables/usePhotoInteraction'
import { useAppNotifications } from '@/composables/useAppNotifications'
import { useMemories } from '@/composables/useMemories'
import { useMemoriesSocket } from '@/composables/useMemoriesSocket'
import { apiClient } from '@/utils/apiClient'
/* END IMPORT */

/** START DEFINE NAME COMPONENT */
defineOptions({ name: 'MemoriesPhotoGrid' })
/* END DEFINE NAME COMPONENT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  album: {
    type: Object as PropType<Album>,
    required: true,
  },
  photos: {
    type: Array as PropType<Photo[]>,
    required: true,
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
  photosLoading: {
    type: Boolean,
    required: false,
    default: false,
  },
  hasMorePhotos: {
    type: Boolean,
    required: false,
    default: false,
  },
  photoViewing: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits<{
  'upload-photos': []
  back: []
  'change-privacy': []
  'invite-member': []
  'share-album': []
  'edit-album': []
  'share-photo': [photo: Photo]
  'open-photo': [photo: Photo]
  'delete-photos': [ids: string[]]
  'load-more': []
}>()
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { t } = useI18n()
const { moment } = useMoment()
const {
  reactionCounts,
  commentCounts,
  userReactions,
  fetchBulkReactions,
  fetchBulkCommentCounts,
  toggleReaction,
} = usePhotoInteraction()
const { notifyError, notifySuccess } = useAppNotifications()
const {
  albumComments,
  albumCommentsLoading,
  albumCommentTranslations,
  albumCommentTranslating,
  fetchAlbumComments,
  addAlbumComment,
  updateAlbumComment: updateAlbumCommentApi,
  deleteAlbumComment: deleteAlbumCommentApi,
  translateAlbumComment,
  fetchAlbumViewers,
  formatDate,
} = useMemories()
const userStore = useUserStore()

const MOSAIC_TONES = [
  'oklch(0.55 0.08 30)',
  'oklch(0.42 0.06 250)',
  'oklch(0.68 0.09 90)',
  'oklch(0.48 0.07 200)',
]

const MEMBER_COLORS = [
  'oklch(0.55 0.12 40)',
  'oklch(0.50 0.11 220)',
  'oklch(0.48 0.10 150)',
  'oklch(0.58 0.13 340)',
  'oklch(0.52 0.09 280)',
  'oklch(0.56 0.11 90)',
  'oklch(0.45 0.08 200)',
  'oklch(0.60 0.10 60)',
]

const USER_AVATAR_COLORS = [
  'oklch(0.55 0.12 40)',
  'oklch(0.50 0.11 220)',
  'oklch(0.48 0.10 150)',
  'oklch(0.58 0.13 340)',
  'oklch(0.52 0.09 280)',
  'oklch(0.56 0.11 90)',
]

type FilterKey = 'all' | 'liked' | 'mine'

const { current: currentVuetifyTheme } = useTheme()
const isDarkPage = computed(() => currentVuetifyTheme.value.dark)

const activeFilter = ref<FilterKey>('all')
const commentDraft = ref('')
const commentSubmitting = ref(false)
const showEmojiPicker = ref(false)
const commentInputReference = ref<HTMLInputElement | null>(null)
const editingCommentId = ref<string | null>(null)
const editingText = ref('')
const deletingAlbumCommentId = ref<string | null>(null)

const isDragging = ref(false)
const isUploading = ref(false)
const fabOpen = ref(false)
const selectMode = ref(false)
const selectedIds = ref<Set<string>>(new Set())
const deleteConfirming = ref(false)
const viewersDialogOpen = ref(false)
const viewersDialogLoading = ref(false)
const viewersDialogData = ref<{
  viewCount: number
  viewers: { id: string; name: string; avatar: string | null; viewedAt: string }[]
}>({ viewCount: 0, viewers: [] })
const fabWrapReference = ref<HTMLElement | null>(null)
const fabPanelReference = ref<HTMLElement | null>(null)
const notesOpen = ref(false)
const notesPanelBodyReference = ref<HTMLElement | null>(null)
const notesListReference = ref<HTMLElement | null>(null)
const fileInputReference = ref<HTMLInputElement | null>(null)

interface PendingUpload {
  uid: number
  file: File
  name: string
  preview: string
  previewing: boolean
  status: 'pending' | 'uploading' | 'done' | 'error'
}

let pendingUidCounter = 0

const pendingFiles = ref<PendingUpload[]>([])

const isDownloading = ref(false)
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const MAX_VISIBLE_MEMBERS = 5

const currentUserId = computed(() => String(userStore.user?.id ?? ''))

const userLanguage = computed(() => userStore.user?.preferred_language ?? 'en')

const _currentUserInitials = computed(() => {
  const name = userStore.user?.full_name ?? ''
  const parts = name.trim().split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.at(-1)?.[0] ?? ''
  return parts.length >= 2 ? (first + last).toUpperCase() : first.toUpperCase() || '?'
})

const isCreator = computed(() => String(props.album.createdById) === currentUserId.value)

function canDeletePhoto(photo: Photo): boolean {
  return isCreator.value || photo.uploadedById === currentUserId.value
}

const canUpload = computed(
  () => isCreator.value || (props.album.memberIds ?? []).includes(currentUserId.value),
)

const formattedDate = computed(() =>
  props.album.date ? moment(props.album.date).format(t('memories.dateFormat')) : '',
)

const eventTypeLabel = computed(() => t(`memories.eventType.${props.album.eventType}`))

const visibleMembers = computed(() => props.album.memberIds.slice(0, MAX_VISIBLE_MEMBERS))

const visibleMembersInfo = computed(() => {
  const membersData = props.album.members ?? []
  const memberMap = new Map(membersData.map((member) => [member.id, member]))
  return visibleMembers.value.map((id) => memberMap.get(id) ?? { id, name: id, avatar: null })
})

const extraMemberCount = computed(() =>
  Math.max(0, props.album.memberIds.length - MAX_VISIBLE_MEMBERS),
)

function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (parts[0]?.[0] ?? '').toUpperCase() || '?'
}

const MOSAIC_SLOTS = 5

const mosaicPhotoIds = ref<string[]>([])

watch(
  () => props.photos,
  (value) => {
    if (value.length === 0 || mosaicPhotoIds.value.length > 0) return
    const shuffled = [...value].sort(() => Math.random() - 0.5)
    mosaicPhotoIds.value = shuffled.slice(0, MOSAIC_SLOTS).map((photo) => photo.id)
  },
  { immediate: true },
)

const mosaicPhotos = computed(() => {
  if (mosaicPhotoIds.value.length === 0) {
    return Array.from({ length: MOSAIC_SLOTS }, (_, index) => props.photos[index] ?? null)
  }
  return Array.from({ length: MOSAIC_SLOTS }, (_, index) => {
    const id = mosaicPhotoIds.value[index]
    return id ? (props.photos.find((photo) => photo.id === id) ?? null) : null
  })
})

const filterPills = computed(() => [
  {
    key: 'all' as FilterKey,
    label: `${t('memories.filterAll')} · ${props.photos.length}`,
  },
  {
    key: 'liked' as FilterKey,
    label: `${t('memories.filterLiked')} · ${props.photos.filter((photo) => userReactions.value[photo.id] === 'heart').length}`,
  },
  {
    key: 'mine' as FilterKey,
    label: `${t('memories.filterMine')} · ${props.photos.filter((photo) => photo.uploadedById === currentUserId.value).length}`,
  },
])

const filteredPhotos = computed(() => {
  if (activeFilter.value === 'liked') {
    return props.photos.filter((photo) => userReactions.value[photo.id] === 'heart')
  }
  if (activeFilter.value === 'mine') {
    return props.photos.filter((photo) => photo.uploadedById === currentUserId.value)
  }
  return props.photos
})

const totalReactionsAll = computed(() =>
  props.photos.reduce((total, photo) => {
    const counts = reactionCounts.value[photo.id] ?? {}
    return total + Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0)
  }, 0),
)

const totalCommentsAll = computed(() =>
  props.photos.reduce((total, photo) => total + (commentCounts.value[photo.id] ?? 0), 0),
)

const stats = computed(() => [
  { key: 'photos', value: props.album.photoCount, label: t('memories.statsPhotos') },
  { key: 'members', value: props.album.memberIds.length, label: t('memories.statsMembers') },
  { key: 'reactions', value: totalReactionsAll.value, label: t('memories.statsReactions') },
  { key: 'comments', value: totalCommentsAll.value, label: t('memories.statsComments') },
  {
    key: 'days',
    value: Math.max(1, moment().diff(moment(props.album.date), 'days')),
    label: t('memories.statsDays'),
  },
])

/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
function totalReactionsForPhoto(photoId: string): number {
  const counts = reactionCounts.value[photoId] ?? {}
  return Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0)
}

function avatarColorForUser(userId: string): string {
  const hash = userId.split('').reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0)
  return USER_AVATAR_COLORS[hash % USER_AVATAR_COLORS.length] ?? USER_AVATAR_COLORS[0]!
}

function formatCommentTime(dateString: string): string {
  return moment.utc(dateString).local().fromNow()
}

async function handleToggleReaction(photoId: string): Promise<void> {
  await toggleReaction(photoId, 'heart')
}

function insertEmoji(emoji: string): void {
  const input = commentInputReference.value
  if (!input) {
    commentDraft.value += emoji
    return
  }
  const start = input.selectionStart ?? commentDraft.value.length
  const end = input.selectionEnd ?? commentDraft.value.length
  commentDraft.value = commentDraft.value.slice(0, start) + emoji + commentDraft.value.slice(end)
  showEmojiPicker.value = false
  nextTick(() => {
    input.focus()
    const cursor = start + emoji.length
    input.setSelectionRange(cursor, cursor)
  })
}

function scrollNotesToBottom(): void {
  const doScroll = () => {
    const body = notesPanelBodyReference.value
    if (body) body.scrollTop = body.scrollHeight
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      doScroll()
      // Re-scroll after emoji images finish loading (async)
      setTimeout(doScroll, 300)
    })
  })
}

async function submitComment(): Promise<void> {
  if (!commentDraft.value.trim() || commentSubmitting.value) return
  const text = commentDraft.value.trim()
  commentDraft.value = ''
  commentSubmitting.value = true
  try {
    await addAlbumComment(props.album.id, text)
    scrollNotesToBottom()
  } finally {
    commentSubmitting.value = false
  }
}

function startEditComment(commentId: string, currentText: string): void {
  editingCommentId.value = commentId
  editingText.value = currentText
}

function cancelEditComment(): void {
  editingCommentId.value = null
  editingText.value = ''
}

async function handleSaveEditComment(commentId: string): Promise<void> {
  const text = editingText.value.trim()
  if (!text) return
  cancelEditComment()
  // Clear translation cache since text changed
  albumCommentTranslations.value[commentId] = {}
  await updateAlbumCommentApi(commentId, text)
}

function confirmDeleteAlbumComment(commentId: string): void {
  deletingAlbumCommentId.value = commentId
}

async function handleDeleteAlbumComment(): Promise<void> {
  if (!deletingAlbumCommentId.value) return
  const commentId = deletingAlbumCommentId.value
  deletingAlbumCommentId.value = null
  await deleteAlbumCommentApi(commentId)
}

const albumCommentShowTranslation = ref<Record<string, boolean>>({})

function albumCommentDisplayText(commentId: string, original: string): string {
  if (!albumCommentShowTranslation.value[commentId]) return original
  return albumCommentTranslations.value[commentId]?.[userLanguage.value] ?? original
}

async function handleToggleAlbumCommentTranslation(commentId: string): Promise<void> {
  if (!albumCommentTranslations.value[commentId]) {
    await translateAlbumComment(commentId)
  }
  const hasTranslation = !!albumCommentTranslations.value[commentId]?.[userLanguage.value]
  if (hasTranslation) {
    albumCommentShowTranslation.value[commentId] = !albumCommentShowTranslation.value[commentId]
  }
}

function toggleSelectMode(): void {
  selectMode.value = !selectMode.value
  if (!selectMode.value) {
    selectedIds.value = new Set()
    deleteConfirming.value = false
  }
}

function toggleSelectPhoto(id: string): void {
  const next = new Set(selectedIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  selectedIds.value = next
}

function handleDeleteSelected(): void {
  emit('delete-photos', [...selectedIds.value])
  deleteConfirming.value = false
  selectMode.value = false
  selectedIds.value = new Set()
}

async function openViewersDialog(): Promise<void> {
  viewersDialogOpen.value = true
  viewersDialogLoading.value = true
  const result = await fetchAlbumViewers(props.album.id)
  if (result) viewersDialogData.value = result
  viewersDialogLoading.value = false
}

function startSlideshow(): void {
  const first = filteredPhotos.value[0]
  if (first) emit('open-photo', first)
}

async function downloadAlbum(): Promise<void> {
  if (isDownloading.value) return
  if (props.photos.length === 0) {
    notifyError(t('memories.errors.noPhotosToDownload'))
    return
  }

  isDownloading.value = true
  try {
    // Step 1: get a one-time download token (expires in 5 min)
    const tokenData = await apiClient.post<{ token: string }>(
      `/memories/albums/${props.album.id}/download-token`,
      {},
    )

    // Step 2: fetch the ZIP — await the full response so errors are caught in JS
    const runtimeConfig = useRuntimeConfig()
    const baseUrl = (runtimeConfig.public as Record<string, unknown>)['apiBaseUrl'] as string
    const downloadUrl = `${baseUrl}/memories/albums/${props.album.id}/download?token=${tokenData.token}`

    const response = await fetch(downloadUrl)
    if (!response.ok) throw new Error('Download failed')

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)

    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `${props.album.title}.zip`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)

    notifySuccess(t('memories.downloadComplete'))
  } catch {
    notifyError(t('memories.errors.downloadFailed'))
  } finally {
    isDownloading.value = false
  }
}

function triggerFileInput(accept?: string): void {
  if (fileInputReference.value) {
    fileInputReference.value.accept = accept ?? 'image/*,video/*,.pdf'
    fileInputReference.value.click()
  }
}

const { normalizeToJpeg, buildHeicPreview, buildInstantPreview, isHeic } = useImageCompress()

async function addFiles(files: FileList | File[]): Promise<void> {
  const fileArray = Array.from(files)

  const startIndex = pendingFiles.value.length
  const newPending: PendingUpload[] = fileArray.map((file) => ({
    uid: ++pendingUidCounter,
    file,
    name: file.name,
    preview: buildInstantPreview(file),
    previewing: isHeic(file),
    status: 'pending' as const,
  }))
  pendingFiles.value = [...pendingFiles.value, ...newPending]

  // Convert HEIC previews one by one in background (doesn't block UI)
  for (let index = 0; index < fileArray.length; index++) {
    const file = fileArray[index]
    if (!isHeic(file)) continue
    const listIndex = startIndex + index
    const url = await buildHeicPreview(file)
    const item = pendingFiles.value[listIndex]
    if (item) {
      pendingFiles.value[listIndex] = { ...item, preview: url, previewing: false }
    }
  }
}

function handleFileChange(event: Event): void {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) return
  addFiles(target.files)
  target.value = ''
}

function handleDrop(event: DragEvent): void {
  isDragging.value = false
  if (!event.dataTransfer?.files.length) return
  addFiles(event.dataTransfer.files)
}

function removePendingFile(index: number): void {
  pendingFiles.value = pendingFiles.value.filter((_, itemIndex) => itemIndex !== index)
}

async function uploadOne(item: PendingUpload): Promise<void> {
  const pending = pendingFiles.value.find((fileItem) => fileItem.uid === item.uid)
  if (!pending) return

  pending.status = 'uploading'

  try {
    const uploadFile = await normalizeToJpeg(item.file)
    const formData = new FormData()
    formData.append('files', uploadFile)
    await apiClient.postForm(`memories/albums/${props.album.id}/photos`, formData)
    pending.status = 'done'
  } catch {
    pending.status = 'error'
  }
}

async function handleUpload(): Promise<void> {
  if (isUploading.value) return

  const toUpload = pendingFiles.value.filter((fileItem) => fileItem.status === 'pending')
  if (toUpload.length === 0) return

  isUploading.value = true

  const CONCURRENCY = 3
  for (let index = 0; index < toUpload.length; index += CONCURRENCY) {
    const batch = toUpload.slice(index, index + CONCURRENCY)
    await Promise.all(batch.map((item) => uploadOne(item)))
  }

  isUploading.value = false

  const hasError = pendingFiles.value.some((fileItem) => fileItem.status === 'error')
  const hasSuccess = pendingFiles.value.some((fileItem) => fileItem.status === 'done')

  if (hasError) {
    notifyError(t('memories.errors.uploadPartial'))
  } else {
    notifySuccess(t('memories.uploadDone'))
  }

  if (hasSuccess) {
    pendingFiles.value = pendingFiles.value.filter((fileItem) => fileItem.status !== 'done')
    emit('upload-photos')
  }
}

function onDocumentMousedown(event: MouseEvent): void {
  if (!fabOpen.value) return
  const target = event.target as Node
  const insideWrap = fabWrapReference.value?.contains(target) ?? false
  const insidePanel = fabPanelReference.value?.contains(target) ?? false
  if (!insideWrap && !insidePanel) {
    fabOpen.value = false
  }
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.photos,
  async (newPhotos) => {
    if (newPhotos.length === 0) return
    // Bulk fetch reactions + comment counts for all photos
    await Promise.all([fetchBulkReactions(props.album.id), fetchBulkCommentCounts(props.album.id)])
  },
  { immediate: true },
)

watch(notesOpen, async (value) => {
  if (!value) return
  if (albumComments.value.length === 0 && !albumCommentsLoading.value) {
    await fetchAlbumComments(props.album.id)
  }
  await nextTick()
  scrollNotesToBottom()
})

/* END DEFINE WATCHER */

/** START DEFINE LIFE CYCLE HOOK */
function onWindowScroll(): void {
  if (!props.hasMorePhotos || props.photosLoading) return
  const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight)
  if (scrolled >= 0.7) emit('load-more')
}

const { connect: connectSocket, disconnect: disconnectSocket } = useMemoriesSocket({
  onAlbumCommentNew(data) {
    const comment = data.comment as (typeof albumComments.value)[number]
    const exists = albumComments.value.some((item) => item.id === comment.id)
    if (!exists) albumComments.value.push(comment)
  },
  onAlbumCommentUpdated(data) {
    const comment = albumComments.value.find((item) => item.id === data.commentId)
    if (comment) comment.text = data.text
  },
  onAlbumCommentDeleted(data) {
    albumComments.value = albumComments.value.filter((item) => item.id !== data.commentId)
  },
  onPhotoCommentNew(data) {
    window.dispatchEvent(new CustomEvent('memories:photo_comment_new', { detail: data }))
  },
  onPhotoCommentUpdated(data) {
    window.dispatchEvent(new CustomEvent('memories:photo_comment_updated', { detail: data }))
  },
  onPhotoCommentDeleted(data) {
    window.dispatchEvent(new CustomEvent('memories:photo_comment_deleted', { detail: data }))
  },
})

onMounted(() => {
  document.addEventListener('mousedown', onDocumentMousedown)
  window.addEventListener('scroll', onWindowScroll, { passive: true })
  connectSocket(props.album.id)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onDocumentMousedown)
  window.removeEventListener('scroll', onWindowScroll)
  disconnectSocket(props.album.id)
})

defineExpose({
  async openNotes() {
    notesOpen.value = true
    await nextTick()
    if (albumComments.value.length === 0) {
      await fetchAlbumComments(props.album.id)
      await nextTick()
    }
    scrollNotesToBottom()
  },
  async scrollToComment(commentId: string) {
    notesOpen.value = true
    // Wait for panel to render and comments to load
    await nextTick()
    if (albumComments.value.length === 0) {
      await fetchAlbumComments(props.album.id)
      await nextTick()
    }
    const item = notesListReference.value?.querySelector<HTMLElement>(
      `[data-comment-id="${commentId}"]`,
    )
    if (item && notesPanelBodyReference.value) {
      item.scrollIntoView({ block: 'center', behavior: 'smooth' })
      item.classList.add('notes-comment--highlight')
      setTimeout(() => item.classList.remove('notes-comment--highlight'), 2000)
    }
  },
})
/* END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
/* ── Page shell ──────────────────────────────────────────────── */
.cin-page {
  --cin-bg: #0b0b0e;
  --cin-bg-2: #111115;
  --cin-surface: #18181c;
  --cin-ink: #f3efe8;
  --cin-ink-mute: rgba(243, 239, 232, 0.64);
  --cin-ink-faint: rgba(243, 239, 232, 0.42);
  --cin-line: rgba(243, 239, 232, 0.1);
  --cin-line-soft: rgba(243, 239, 232, 0.06);
  --cin-accent: oklch(0.78 0.15 80);
  --cin-accent-2: oklch(0.58 0.18 30);
  --cin-serif: 'Georgia', ui-serif, serif;
  --cin-mono: ui-monospace, monospace;

  position: relative;
  overflow-x: hidden;
  background: var(--cin-bg);
  color: var(--cin-ink);
  min-height: 100vh;
  padding-bottom: 120px;
  font-family: inherit;
}

/* ── Ambient wash ─────────────────────────────────────────────── */
.cin-wash {
  position: absolute;
  inset: -20% -20% auto -20%;
  height: 90%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
.cin-wash::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      60% 50% at 20% 10%,
      color-mix(in oklch, var(--cin-accent) 25%, transparent) 0%,
      transparent 60%
    ),
    radial-gradient(
      50% 50% at 90% 0%,
      color-mix(in oklch, var(--cin-accent-2) 30%, transparent) 0%,
      transparent 60%
    );
  filter: blur(60px);
}

/* ── Topbar ───────────────────────────────────────────────────── */
.cin-topbar {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 20px clamp(16px, 5vw, 60px);
}

.cin-back {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px 7px 9px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--cin-ink-mute);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--cin-line);
  cursor: pointer;
  transition:
    background 0.18s,
    color 0.18s;
  font-family: inherit;
}
.cin-back:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--cin-ink);
}

.cin-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-style: italic;
  font-size: 20px;
  color: var(--cin-ink);
  font-family: var(--cin-serif);
}

.cin-brand-mark {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--cin-accent);
  box-shadow: 0 0 12px color-mix(in oklch, var(--cin-accent) 60%, transparent);
  flex-shrink: 0;
}

.cin-topbar-actions {
  justify-self: end;
  display: flex;
  gap: 4px;
}

.cin-icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--cin-ink-mute);
  background: transparent;
  border: none;
  cursor: pointer;
  transition:
    background 0.18s,
    color 0.18s;
}
.cin-icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--cin-ink);
}
.cin-icon-btn--sm {
  width: 26px;
  height: 26px;
  border-radius: 7px;
}

/* ── Hero ─────────────────────────────────────────────────────── */
.cin-hero {
  position: relative;
  z-index: 2;
  margin: 0 clamp(16px, 4vw, 48px) 0;
  border-radius: 18px;
  overflow: hidden;
  min-height: 340px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 32px clamp(20px, 4vw, 44px);
  background: var(--cin-bg-2);
  border: 1px solid var(--cin-line);
}

.cin-mosaic {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 2px;
  z-index: 0;
}

.cin-mosaic-tile {
  overflow: hidden;
}
.cin-mosaic-tile--0 {
  grid-row: span 2;
}

.cin-mosaic-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
  display: block;
}

.cin-mosaic-fill {
  width: 100%;
  height: 100%;
}

.cin-hero-scrim {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      to top,
      rgba(0, 0, 0, 0.72) 0%,
      rgba(0, 0, 0, 0.28) 45%,
      rgba(0, 0, 0, 0.08) 75%,
      rgba(0, 0, 0, 0) 100%
    ),
    linear-gradient(to right, rgba(0, 0, 0, 0.18) 0%, rgba(0, 0, 0, 0) 55%);
}

/* Top-right metadata pill */
.cin-hero-meta {
  position: absolute;
  top: 16px;
  right: 18px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.36);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: rgba(243, 239, 232, 0.92);
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.cin-hero-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.cin-hero-meta-sep {
  width: 1px;
  height: 12px;
  background: rgba(243, 239, 232, 0.3);
  flex-shrink: 0;
}

.cin-hero-meta-item--btn {
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font: inherit;
  border-radius: 4px;
  transition: opacity 0.15s;
}

.cin-hero-meta-item--btn:hover {
  opacity: 0.75;
  text-decoration: underline;
}

.cin-hero-copy {
  position: relative;
  z-index: 2;
  max-width: 780px;
}

.cin-eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.cin-chip {
  font-family: var(--cin-mono);
  font-size: 10.5px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  padding: 5px 10px;
  border-radius: 4px;
  background: color-mix(in oklch, var(--cin-accent) 22%, transparent);
  color: var(--cin-accent);
}

.cin-title {
  font-family: var(--cin-serif);
  font-weight: 400;
  font-size: clamp(26px, 3.5vw, 48px);
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0 0 14px;
  text-wrap: balance;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.3);
  color: #f3efe8;
}

.cin-lede {
  font-family: var(--cin-serif);
  font-style: italic;
  font-size: clamp(14px, 1.4vw, 17px);
  line-height: 1.5;
  color: rgba(243, 239, 232, 0.85);
  max-width: 560px;
  text-wrap: pretty;
  margin: 0;
}

.cin-hero-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 24px;
}

/* ── Avatar stack ────────────────────────────────────────────── */
.cin-members {
  display: flex;
  align-items: center;
  gap: 14px;
}

.cin-avatar-stack {
  display: inline-flex;
}

.cin-avatar-stack-item {
  margin-right: -10px;
}
.cin-avatar-stack-item:last-child {
  margin-right: 0;
}

.cin-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
}

.cin-avatar--more {
  background: rgba(255, 255, 255, 0.12) !important;
}

.cin-avatar--img {
  background-size: cover;
  background-position: center;
}

.cin-avatar--user {
  width: 36px;
  height: 36px;
  font-size: 13px;
}

.cin-members-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.cin-members-copy strong {
  font-size: 14px;
  font-weight: 600;
  color: #f3efe8;
}
.cin-members-copy span {
  font-size: 12px;
  color: var(--cin-ink-mute);
}

/* ── View count ──────────────────────────────────────────────── */
.cin-views {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cin-avatar-stack--sm {
  display: flex;
  flex-direction: row-reverse;
}

.cin-avatar-stack--sm .v-avatar {
  margin-left: -6px;
  border: 1.5px solid rgba(0, 0, 0, 0.35);
}

.cin-avatar-stack--sm .v-avatar:last-child {
  margin-left: 0;
}

.cin-avatar-initial--sm {
  font-size: 9px;
  font-weight: 700;
  color: #fff;
}

.cin-views-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--cin-ink-mute);
}

.cin-hero-tools {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ── Buttons ─────────────────────────────────────────────────── */
.cin-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition:
    background 0.18s,
    filter 0.18s,
    transform 0.18s;
  white-space: nowrap;
}
.cin-btn--accent {
  background: var(--cin-accent);
  color: #111;
  font-weight: 600;
}
.cin-btn--accent:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}
.cin-btn--ghost {
  background: rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #f3efe8;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.cin-btn--ghost:hover {
  background: rgba(0, 0, 0, 0.48);
}

/* ── Ribbon ──────────────────────────────────────────────────── */
.cin-ribbon {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1px;
  margin: 24px clamp(16px, 4vw, 48px) 32px;
  background: var(--cin-line);
  border: 1px solid var(--cin-line);
  border-radius: 12px;
  overflow: hidden;
}

.cin-ribbon-cell {
  background: var(--cin-bg);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: background 0.2s;
}
.cin-ribbon-cell:hover {
  background: var(--cin-bg-2);
}
.cin-ribbon-cell strong {
  font-family: var(--cin-serif);
  font-size: 24px;
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--cin-ink);
}
.cin-ribbon-cell span {
  font-family: var(--cin-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--cin-ink-faint);
}

@media (max-width: 720px) {
  .cin-ribbon {
    grid-template-columns: repeat(2, 1fr);
  }
  .cin-ribbon-cell:nth-child(5) {
    grid-column: span 2;
  }
}

/* ── Section header + filter ─────────────────────────────────── */
.cin-section-hd {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0 clamp(16px, 4vw, 48px) 16px;
}
.cin-section-hd h2 {
  font-family: var(--cin-serif);
  font-weight: 400;
  font-size: 22px;
  letter-spacing: -0.01em;
  color: var(--cin-ink);
  margin: 0;
}

.cin-brand-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.cin-section-hd-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cin-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  background: var(--cin-accent);
  color: #111;
  border: none;
  transition: filter 0.18s;
  white-space: nowrap;
  flex-shrink: 0;
}
.cin-upload-btn:hover {
  filter: brightness(1.08);
}

.cin-filter {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.cin-pill {
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--cin-line);
  color: var(--cin-ink-mute);
  transition:
    background 0.18s,
    color 0.18s,
    border-color 0.18s;
}
.cin-pill:hover {
  color: var(--cin-ink);
}
.cin-pill--active {
  background: var(--cin-ink);
  color: var(--cin-bg);
  border-color: var(--cin-ink);
}

/* ── Photo grid ──────────────────────────────────────────────── */
.cin-grid {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 0 clamp(16px, 4vw, 48px);
}

@media (max-width: 900px) {
  .cin-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ── Mobile: Instagram-style ────────────────────────────────── */
@media (max-width: 600px) {
  .cin-page {
    padding-bottom: 80px;
  }

  .cin-topbar {
    padding: 12px 16px;
  }

  .cin-brand {
    font-size: 15px;
  }

  .cin-hero {
    margin: 0 12px;
    border-radius: 14px;
    min-height: 200px;
    padding: 20px 18px;
  }

  .cin-ribbon {
    margin: 16px 12px 20px;
    border-radius: 10px;
  }

  .cin-ribbon-cell {
    padding: 10px 12px;
  }

  .cin-ribbon-cell strong {
    font-size: 20px;
  }

  .cin-ribbon-cell span {
    font-size: 9px;
  }

  .cin-section-hd {
    margin: 0 12px 10px;
  }

  .cin-section-hd h2 {
    font-size: 18px;
  }

  .cin-filter {
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 2px;
  }
  .cin-filter::-webkit-scrollbar {
    display: none;
  }

  .cin-pill {
    flex-shrink: 0;
    padding: 5px 12px;
    font-size: 11px;
  }

  /* Instagram grid: edge-to-edge, 3 columns square, 2px gap */
  .cin-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    margin: 0;
  }

  .cin-cell {
    aspect-ratio: 1 / 1;
    border-radius: 0;
  }

  .cin-skeleton {
    aspect-ratio: 1 / 1;
    border-radius: 0;
  }

  .cin-cell:hover {
    transform: none;
    box-shadow: none;
  }
}

/* ── Infinite scroll sentinel ────────────────────────────────── */
.cin-scroll-sentinel {
  height: 1px;
  margin: 0 0 16px;
}
.cin-load-more-spinner {
  display: flex;
  justify-content: center;
  padding: 24px 0;
  height: auto;
}

/* ── Select mode ─────────────────────────────────────────────── */
.cin-select-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1.5px solid var(--cin-line);
  background: transparent;
  color: var(--cin-ink);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.cin-select-btn:hover {
  background: var(--cin-surface);
}
.cin-cell--select-mode {
  cursor: pointer;
}
.cin-cell--selected .cin-photo-tile {
  outline: 2.5px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}
.cin-cell--selected .cin-photo-img,
.cin-cell--selected .cin-photo-fill {
  opacity: 0.75;
}
.cin-select-check {
  position: absolute;
  top: 6px;
  left: 6px;
  pointer-events: none;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}
.cin-cell--not-deletable {
  cursor: default;
}
.cin-cell--not-deletable .cin-photo-img,
.cin-cell--not-deletable .cin-photo-fill {
  opacity: 0.45;
}
.cin-select-lock {
  position: absolute;
  top: 6px;
  left: 6px;
  pointer-events: none;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}

/* ── Delete action bar ───────────────────────────────────────── */
.cin-delete-bar {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background: #1a1a1b;
  color: #fff;
  border-radius: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  z-index: 500;
  white-space: nowrap;
}
.cin-delete-bar-count {
  font-size: 13px;
  font-weight: 500;
}
.cin-delete-bar-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 20px;
  background: #e53935;
  border: none;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.cin-delete-bar-btn:hover {
  background: #c62828;
}
.cin-bar-enter-active,
.cin-bar-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s cubic-bezier(0.3, 0.7, 0.3, 1);
}
.cin-bar-enter-from,
.cin-bar-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

.cin-skeleton {
  aspect-ratio: 4 / 3;
  border-radius: 10px;
  background: var(--cin-surface);
  animation: cin-pulse 1.6s ease-in-out infinite;
}

@keyframes cin-pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.cin-cell {
  aspect-ratio: 4 / 3;
  border-radius: 10px;
  overflow: hidden;
  background: var(--cin-surface);
  cursor: pointer;
  transition:
    transform 0.25s cubic-bezier(0.3, 0.7, 0.3, 1),
    box-shadow 0.25s;
}
.cin-cell:hover {
  transform: scale(1.025) translateY(-3px);
  box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.45);
  z-index: 3;
  position: relative;
}
.cin-cell:focus-visible {
  outline: 2px solid var(--cin-accent);
  outline-offset: 2px;
}

.cin-photo-tile {
  position: relative;
  width: 100%;
  height: 100%;
}

.cin-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cin-photo-fill {
  width: 100%;
  height: 100%;
}

.cin-photo-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 55%);
  opacity: 0;
  transition: opacity 0.25s;
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.cin-cell:hover .cin-photo-overlay {
  opacity: 1;
}

.cin-photo-caption {
  font-family: var(--cin-serif);
  font-size: 15px;
  line-height: 1.25;
  color: #fff;
  margin: 0 0 10px;
  text-wrap: pretty;
}

.cin-photo-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
}

.cin-view-stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  pointer-events: none;
}

.cin-react-btn {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition:
    transform 0.18s,
    background 0.18s;
}
.cin-react-btn:hover {
  transform: scale(1.05);
}
.cin-react-btn--liked {
  background: oklch(0.62 0.19 25);
}

/* ── Empty ───────────────────────────────────────────────────── */
.cin-empty {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  gap: 10px;
  text-align: center;
  margin: 0 clamp(16px, 5vw, 60px);
}
.cin-empty-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--cin-ink);
  margin: 0;
}
.cin-empty-sub {
  font-size: 0.8rem;
  color: var(--cin-ink-mute);
  margin: 0;
}

/* ── Comments ────────────────────────────────────────────────── */
/* ── Album discussion ────────────────────────────────────────── */
.cin-discussion {
  position: relative;
  z-index: 2;
  margin: 48px clamp(16px, 4vw, 48px) 0;
  background: var(--cin-bg-2);
  border: 1px solid var(--cin-line);
  border-radius: 16px;
  overflow: hidden;
}

.cin-discussion-hd-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cin-discussion-icon {
  color: var(--cin-ink-mute);
}

.cin-discussion-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--cin-ink);
  letter-spacing: 0.01em;
}

.cin-discussion-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--cin-bg);
  background: var(--cin-ink-mute);
  padding: 1px 7px;
  border-radius: 999px;
  line-height: 1.6;
}

.cin-discussion-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 20px;
  color: var(--cin-ink-faint);
  font-size: 13px;
}

.cin-discussion-list {
  list-style: none;
  padding: 16px 20px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cin-discussion-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.cin-discussion-bubble {
  flex: 1;
  min-width: 0;
  background: var(--cin-surface);
  border-radius: 4px 12px 12px 12px;
  padding: 10px 14px;
}

.cin-discussion-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.cin-discussion-meta strong {
  font-size: 12px;
  font-weight: 600;
  color: var(--cin-accent);
}

.cin-discussion-meta span {
  font-size: 11px;
  color: var(--cin-ink-faint);
}

.cin-discussion-bubble p {
  font-size: 14px;
  line-height: 1.5;
  color: var(--cin-ink);
  margin: 0;
  word-break: break-word;
}
.cin-translate-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 4px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  color: var(--cin-ink-mute);
  transition: color 0.15s;
}
.cin-translate-btn:hover:not(:disabled) {
  color: var(--cin-accent);
}
.cin-translate-btn:disabled {
  cursor: default;
}

/* ── FAB ─────────────────────────────────────────────────────── */
.cin-fab-wrap {
  position: fixed;
  right: 24px;
  bottom: 88px;
  z-index: 10001;
}

.cin-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cin-accent);
  color: #111;
  border: none;
  cursor: pointer;
  box-shadow:
    0 12px 32px -8px rgba(0, 0, 0, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.2);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.cin-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px -10px rgba(0, 0, 0, 0.5);
}

.cin-fab-panel {
  /* Teleported to body — must use fixed so coordinates match the FAB button position */
  position: fixed;
  bottom: 156px; /* cin-fab-wrap bottom (88) + FAB height (56) + gap (12) */
  right: 24px;
  width: 300px;
  padding: 14px;
  background: #fff;
  color: #1a1a1b;
  border-radius: 16px;
  box-shadow:
    0 24px 60px -12px rgba(0, 0, 0, 0.35),
    0 4px 12px rgba(0, 0, 0, 0.08);
  transform-origin: bottom right;
  z-index: 10001;
}
.cin-fab-panel--drag .cin-fab-drop {
  background: color-mix(in oklch, var(--cin-accent) 12%, transparent);
  border-color: var(--cin-accent);
  color: #333;
}

.cin-fab-panel-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
}
.cin-fab-panel-hd .cin-icon-btn {
  color: #666;
}
.cin-fab-panel-hd .cin-icon-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #1a1a1b;
}

.cin-fab-drop {
  border: 1.5px dashed rgba(0, 0, 0, 0.18);
  border-radius: 12px;
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
  color: #666;
  transition:
    background 0.18s,
    border-color 0.18s;
}
.cin-fab-drop-title {
  font-weight: 500;
  font-size: 13px;
  color: #1a1a1b;
  margin-top: 6px;
}
.cin-fab-drop-sub {
  font-size: 11.5px;
  color: #888;
}

.cin-fab-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}
.cin-fab-action {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 6px;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.04);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  border: none;
  cursor: pointer;
  color: #1a1a1b;
  transition: background 0.15s;
}
.cin-fab-action:hover {
  background: rgba(0, 0, 0, 0.08);
}

.cin-pending-list {
  margin-bottom: 10px;
}
.cin-pending-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}
.cin-pending-clear {
  font-size: 12px;
  color: #e53935;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.cin-pending-clear:hover {
  text-decoration: underline;
}
.cin-pending-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 10px;
}
.cin-pending-cell {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  background: #e8e8e8;
}
.cin-pending-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.cin-pending-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: #555;
}
.cin-pending-placeholder--video {
  background: #1a1a2e;
}
.cin-pending-placeholder--pdf {
  background: #c62828;
}
.cin-pending-ext {
  font-size: 9px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.5px;
}
.cin-pending-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}
.cin-pending-overlay--done {
  background: rgba(46, 125, 50, 0.55);
}
.cin-pending-overlay--error {
  background: rgba(183, 28, 28, 0.55);
}
.cin-pending-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: background 0.15s;
}
.cin-pending-remove:hover {
  background: rgba(0, 0, 0, 0.8);
}
.cin-pending-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  font-size: 9px;
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  padding: 8px 4px 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cin-pending-actions {
  padding-top: 4px;
}

/* FAB backdrop (mobile) */
.cin-fab-backdrop {
  display: none;
}

/* FAB panel transition */
.cin-fab-panel-enter-active,
.cin-fab-panel-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s cubic-bezier(0.3, 0.7, 0.3, 1);
}
.cin-fab-panel-enter-from,
.cin-fab-panel-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.96);
}

.cin-backdrop-enter-active,
.cin-backdrop-leave-active {
  transition: opacity 0.25s;
}
.cin-backdrop-enter-from,
.cin-backdrop-leave-to {
  opacity: 0;
}

/* ── Mobile: full-screen bottom sheet ───────────────────────── */
@media (max-width: 600px) {
  .cin-fab-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 10000;
  }

  .cin-fab-panel {
    position: fixed;
    inset: auto 0 0 0;
    width: 100%;
    min-height: 60dvh;
    max-height: 90dvh;
    border-radius: 20px 20px 0 0;
    overflow-y: auto;
    transform-origin: bottom center;
    z-index: 10001;
    padding-bottom: env(safe-area-inset-bottom, 16px);
  }

  .cin-fab-panel-enter-from,
  .cin-fab-panel-leave-to {
    opacity: 0;
    transform: translateY(100%);
  }
}

/* ── Light mode override ─────────────────────────────────────── */
.cin-page--light {
  --cin-bg: #f7f4ef;
  --cin-bg-2: #ede9e2;
  --cin-surface: #e5e0d8;
  --cin-ink: #1a1714;
  --cin-ink-mute: rgba(26, 23, 20, 0.62);
  --cin-ink-faint: rgba(26, 23, 20, 0.4);
  --cin-line: rgba(26, 23, 20, 0.1);
  --cin-line-soft: rgba(26, 23, 20, 0.06);
  --cin-accent: oklch(0.6 0.17 50);
  --cin-accent-2: oklch(0.5 0.16 30);
}
.cin-page--light .cin-back {
  background: rgba(0, 0, 0, 0.04);
  color: var(--cin-ink-mute);
}
.cin-page--light .cin-back:hover {
  background: rgba(0, 0, 0, 0.08);
  color: var(--cin-ink);
}
.cin-page--light .cin-icon-btn:hover {
  background: rgba(0, 0, 0, 0.07);
}
.cin-page--light .cin-btn--ghost {
  background: rgba(0, 0, 0, 0.06);
  color: var(--cin-ink);
}
.cin-page--light .cin-btn--ghost:hover {
  background: rgba(0, 0, 0, 0.1);
}
.cin-page--light .cin-hero .cin-btn--ghost {
  background: rgba(0, 0, 0, 0.32);
  color: #f3efe8;
  border-color: rgba(255, 255, 255, 0.2);
}
.cin-page--light .cin-hero .cin-btn--ghost:hover {
  background: rgba(0, 0, 0, 0.48);
}
.cin-page--light .cin-pill {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(26, 23, 20, 0.18);
  color: rgba(26, 23, 20, 0.7);
}
.cin-page--light .cin-pill:hover {
  background: rgba(0, 0, 0, 0.09);
  color: #1a1714;
}
.cin-page--light .cin-pill--active {
  background: #1a1714;
  color: #f7f4ef;
  border-color: #1a1714;
}
.cin-page--light .cin-title {
  color: #1a1714;
}
.cin-page--light .cin-wash {
  opacity: 0.4;
}

/* ── Lightbox ────────────────────────────────────────────────── */
.cin-lightbox {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(6, 6, 8, 0.96);
  backdrop-filter: blur(14px);
  display: flex;
}

.cin-lb-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.cin-lb-panel {
  width: 320px;
  flex-shrink: 0;
  background: rgba(18, 18, 22, 0.95);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cin-lb-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  color: #fff;
  flex-shrink: 0;
}

.cin-lb-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.cin-lb-index {
  font-family: var(--cin-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.55);
  flex-shrink: 0;
}

.cin-lb-caption {
  font-family: var(--cin-serif);
  font-size: 18px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cin-lb-tools {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.cin-lb-btn {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  background: transparent;
  border: none;
  cursor: pointer;
  transition:
    background 0.18s,
    color 0.18s;
}
.cin-lb-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.cin-lb-btn--active {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.cin-lb-stage-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
  display: flex;
  align-items: stretch;
}

.cin-lb-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 80px;
  min-height: 0;
}

.cin-lb-photo {
  max-height: 100%;
  max-width: 1100px;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 40px 120px rgba(0, 0, 0, 0.6);
}

.cin-lb-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.cin-lb-placeholder {
  width: 100%;
  height: 100%;
}

.cin-lb-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  border: none;
  cursor: pointer;
  transition: background 0.18s;
  z-index: 2;
}
.cin-lb-nav:hover {
  background: rgba(255, 255, 255, 0.18);
}
.cin-lb-nav--left {
  left: 18px;
}
.cin-lb-nav--right {
  right: 18px;
}

.cin-lb-strip {
  display: flex;
  gap: 6px;
  justify-content: center;
  padding: 14px 24px;
  overflow-x: auto;
  flex-shrink: 0;
}

.cin-lb-strip-thumb {
  width: 54px;
  height: 54px;
  border-radius: 6px;
  flex-shrink: 0;
  opacity: 0.5;
  border: 2px solid transparent;
  overflow: hidden;
  cursor: pointer;
  background: none;
  padding: 0;
  transition:
    opacity 0.18s,
    transform 0.18s;
}
.cin-lb-strip-thumb:hover {
  opacity: 0.85;
}
.cin-lb-strip-thumb--active {
  opacity: 1;
  border-color: #fff;
  transform: scale(1.05);
}

/* ── Lightbox panel ──────────────────────────────────────────── */
.cin-lb-panel-hd {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 0;
  flex-shrink: 0;
}

.cin-lb-panel-hd-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cin-lb-panel-uploader {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cin-lb-panel-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.42);
}

.cin-lb-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.07);
  margin: 14px 0;
  flex-shrink: 0;
}

.cin-lb-panel-caption {
  padding: 0 20px;
  font-family: var(--cin-serif);
  font-style: italic;
  font-size: 15px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
  flex-shrink: 0;
}

/* Reactions row */
.cin-lb-reactions {
  display: flex;
  gap: 6px;
  padding: 0 20px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.cin-lb-reaction-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-family: inherit;
  transition:
    background 0.18s,
    border-color 0.18s;
}
.cin-lb-reaction-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}
.cin-lb-reaction-btn--active {
  background: color-mix(in oklch, var(--cin-accent) 22%, transparent);
  border-color: var(--cin-accent);
  color: var(--cin-accent);
}

.cin-lb-reaction-emoji {
  font-size: 14px;
}
.cin-lb-reaction-label {
  font-size: 11px;
  text-transform: capitalize;
}
.cin-lb-reaction-count {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  min-width: 12px;
  text-align: center;
}
.cin-lb-reaction-btn--active .cin-lb-reaction-count {
  color: var(--cin-accent);
}

/* Comments area */
.cin-lb-comment-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

.cin-lb-comments-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 0;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

.cin-lb-comment {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.cin-avatar--sm {
  width: 28px;
  height: 28px;
  font-size: 10px;
  flex-shrink: 0;
}

.cin-lb-comment-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cin-lb-comment-bubble {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px 12px 12px 12px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cin-lb-comment-author {
  font-size: 11.5px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.cin-lb-comment-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.45;
  word-break: break-word;
}

.cin-lb-comment-time {
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.32);
  padding-left: 2px;
}

.cin-lb-comment-delete {
  opacity: 0;
  margin-top: 2px;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  transition:
    opacity 0.15s,
    background 0.15s;
  flex-shrink: 0;
}
.cin-lb-comment:hover .cin-lb-comment-delete {
  opacity: 1;
}
.cin-lb-comment-delete:hover {
  background: rgba(255, 80, 80, 0.15);
  color: #ff6060;
}

/* Comment input */
.cin-lb-comment-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.cin-lb-comment-input {
  flex: 1;
  border: none;
  outline: none;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  font-family: inherit;
}
.cin-lb-comment-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

/* Actions row */
.cin-lb-actions {
  display: flex;
  gap: 8px;
  padding: 0 20px 20px;
  flex-shrink: 0;
}

.cin-lb-action-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 9px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.09);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  color: rgba(255, 255, 255, 0.75);
  transition:
    background 0.18s,
    color 0.18s;
}
.cin-lb-action-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.95);
}

/* Lightbox transition */
.cin-lightbox-enter-active,
.cin-lightbox-leave-active {
  transition: opacity 0.22s;
}
.cin-lightbox-enter-from,
.cin-lightbox-leave-to {
  opacity: 0;
}

/* ── Notes FAB ───────────────────────────────────────────────── */
.cin-notes-wrap {
  position: fixed;
  right: 24px;
  /* sits above the upload FAB (88px wrap bottom + 56px FAB + 12px gap) */
  bottom: 156px;
  z-index: 10001;
}
.cin-notes-fab {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border: 1.5px solid rgba(var(--v-theme-on-surface), 0.12);
  cursor: pointer;
  box-shadow:
    0 8px 24px -6px rgba(0, 0, 0, 0.22),
    0 2px 6px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    background 0.2s;
}
.cin-notes-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.3);
}
.cin-notes-fab--active {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border-color: transparent;
}

/* ── Notes panel ──────────────────────────────────────────────── */
.cin-notes-backdrop {
  display: none;
}

.notes-panel {
  position: fixed;
  right: 24px;
  bottom: 216px;
  width: 360px;
  max-height: 520px;
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border-radius: 20px;
  box-shadow:
    0 20px 60px -10px rgba(0, 0, 0, 0.22),
    0 4px 16px rgba(0, 0, 0, 0.06);
  z-index: 10001;
  overflow: hidden;
}

.notes-panel__handle {
  display: none;
}

.notes-panel__header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  flex-shrink: 0;
}

.notes-panel__title {
  font-size: 13px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.notes-panel__badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notes-panel__close {
  margin-left: auto;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}

.notes-panel__close:hover {
  background: rgba(var(--v-theme-on-surface), 0.12);
}

.notes-panel__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 0;
}

.notes-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 20px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.35);
  opacity: 0.7;
}

.notes-panel__empty p {
  margin: 0;
}

.notes-panel__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.notes-comment {
  display: flex;
  gap: 10px;
  padding: 8px 16px;
  transition: background 0.12s;
}

.notes-comment:hover {
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.notes-comment--highlight {
  background: rgba(var(--v-theme-primary), 0.1);
  transition: background 0.3s;
}

.notes-comment__avatar {
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  margin-top: 1px;
}

.notes-comment__avatar--img {
  background-size: cover;
  background-position: center;
}

.notes-comment__content {
  flex: 1;
  min-width: 0;
}

.notes-comment__meta {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 2px;
}

.notes-comment__name {
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.notes-comment__time {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.4);
  white-space: nowrap;
}

.notes-comment__text {
  font-size: 13px;
  line-height: 1.5;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 4px;
  word-break: break-word;
}

.notes-comment__menu-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  opacity: 0;
  transition:
    opacity 0.15s,
    background 0.12s;
}

.notes-comment:hover .notes-comment__menu-btn {
  opacity: 1;
}

.notes-comment__menu-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

@media (hover: none) {
  .notes-comment__menu-btn {
    opacity: 1;
  }
}

.notes-comment__edit {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.notes-comment__edit-input {
  width: 100%;
  padding: 5px 8px;
  border: 1px solid rgba(var(--v-theme-primary), 0.5);
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  line-height: 1.5;
  resize: none;
  background: rgba(var(--v-theme-surface), 1);
  color: rgb(var(--v-theme-on-surface));
  outline: none;
}

.notes-comment__edit-input:focus {
  border-color: rgb(var(--v-theme-primary));
}

.notes-comment__edit-actions {
  display: flex;
  gap: 5px;
  justify-content: flex-end;
}

.notes-comment__edit-cancel,
.notes-comment__edit-save {
  font-size: 11.5px;
  font-family: inherit;
  padding: 2px 8px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.notes-comment__edit-cancel {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgb(var(--v-theme-on-surface));
}

.notes-comment__edit-cancel:hover {
  background: rgba(var(--v-theme-on-surface), 0.14);
}

.notes-comment__edit-save {
  background: rgb(var(--v-theme-primary));
  color: #fff;
}

.notes-comment__edit-save:hover:not(:disabled) {
  opacity: 0.9;
}

.notes-comment__edit-save:disabled {
  opacity: 0.4;
  cursor: default;
}

.notes-panel__footer {
  flex-shrink: 0;
  padding: 10px 14px 12px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}

.notes-panel__input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-radius: 24px;
  padding: 7px 7px 7px 14px;
  transition: background 0.15s;
}

.notes-panel__input-wrap:focus-within {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.notes-panel__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  font-family: inherit;
  padding: 0;
}

.notes-panel__input::placeholder {
  color: rgba(var(--v-theme-on-surface), 0.35);
}

.notes-panel__emoji-btn {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 6px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  transition:
    color 0.15s,
    background 0.15s;
}

.notes-panel__emoji-btn:hover {
  color: rgb(var(--v-theme-on-surface));
  background: rgba(var(--v-theme-on-surface), 0.06);
}

.notes-panel__send {
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 50%;
  border: none;
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  flex-shrink: 0;
}

.notes-panel__send--active {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  cursor: pointer;
}

.notes-panel__send:disabled {
  cursor: default;
}

/* Notes panel transition */
.notes-panel-enter-active,
.notes-panel-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s cubic-bezier(0.3, 0.7, 0.3, 1);
}

.notes-panel-enter-from,
.notes-panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}

/* ── Mobile: bottom sheet ─────────────────────────────────────── */
@media (max-width: 600px) {
  .cin-notes-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 10000;
  }

  .notes-panel {
    right: 0;
    left: 0;
    bottom: 0;
    width: 100%;
    max-height: 72dvh;
    border-radius: 20px 20px 0 0;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    z-index: 10001;
  }

  .notes-panel__handle {
    display: block;
    width: 36px;
    height: 4px;
    background: rgba(var(--v-theme-on-surface), 0.15);
    border-radius: 2px;
    margin: 10px auto 2px;
    flex-shrink: 0;
  }

  .cin-notes-fab {
    right: 16px;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
  }

  .notes-panel-enter-from,
  .notes-panel-leave-to {
    opacity: 0;
    transform: translateY(100%);
  }
}
</style>
