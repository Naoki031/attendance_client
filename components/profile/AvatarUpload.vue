<template>
  <div class="avatar-upload-wrapper" :style="{ width: `${size}px`, height: `${size}px` }">
    <v-avatar :size="size" :color="currentAvatarUrl ? undefined : 'primary'" class="avatar-display">
      <v-img v-if="currentAvatarUrl" :src="currentAvatarUrl" cover />
      <span v-else class="text-white font-weight-bold" :style="{ fontSize: `${size * 0.35}px` }">
        {{ initials }}
      </span>
    </v-avatar>
    <div
      class="avatar-overlay"
      :class="{ 'avatar-overlay--active': isProcessing }"
      @click="triggerFileInput"
    >
      <v-progress-circular
        v-if="isProcessing"
        color="white"
        :size="Math.max(size * 0.3, 20)"
        :width="2"
        indeterminate
      />
      <v-icon v-else color="white" :size="Math.max(size * 0.2, 16)">mdi-camera</v-icon>
    </div>
    <input
      ref="fileInputReference"
      type="file"
      accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif"
      style="display: none"
      @change="handleFileSelect"
    />
  </div>

  <!-- Crop dialog — Facebook-style circular avatar crop -->
  <v-dialog v-model="cropDialog" max-width="560px" persistent>
    <v-card rounded="xl" elevation="2">
      <div class="dialog-header px-6 pt-6 pb-4">
        <div class="text-h6 font-weight-bold text-primary">{{ $t('profile.cropAvatar') }}</div>
        <v-btn icon variant="text" size="small" @click="cancelCrop">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="px-6 py-0">
        <div class="d-flex ga-6 align-start">
          <!-- Main crop area -->
          <div class="crop-area flex-grow-1">
            <div class="crop-container">
              <img ref="cropImageReference" :src="cropImageSource" class="crop-image" />
              <!-- Circular mask overlay -->
              <div class="circle-mask">
                <div class="circle-hole"></div>
              </div>
            </div>
          </div>

          <!-- Circular preview -->
          <div class="preview-section">
            <div class="text-caption text-medium-emphasis mb-2">{{ $t('common.preview') }}</div>
            <v-avatar size="80" class="preview-avatar">
              <v-img v-if="previewSource" :src="previewSource" cover />
            </v-avatar>
          </div>
        </div>

        <!-- Zoom slider -->
        <div class="d-flex align-center mt-4">
          <v-icon size="16" class="mr-2">mdi-magnify-minus</v-icon>
          <v-slider
            v-model="zoomValue"
            :min="0.1"
            :max="3"
            step="0.01"
            hide-details
            @update:model-value="handleZoom"
          />
          <v-icon size="16" class="ml-2">mdi-magnify-plus</v-icon>
        </div>

        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          density="compact"
          rounded="lg"
          class="mt-3"
        >
          {{ errorMessage }}
        </v-alert>
      </v-card-text>

      <div class="d-flex justify-end ga-3 px-6 py-4">
        <v-btn variant="text" rounded="lg" @click="cancelCrop">{{ $t('common.cancel') }}</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          rounded="lg"
          :loading="isProcessing"
          @click="applyCrop"
        >
          {{ $t('common.save') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>

  <!-- Error toast for pre-processing errors (visible outside dialog) -->
  <v-snackbar v-model="showErrorSnackbar" :timeout="4000" color="error" location="bottom">
    {{ errorSnackbarMessage }}
  </v-snackbar>
</template>

<script lang="ts" setup>
/** START IMPORT */
import { useImageCompress } from '@/composables/useImageCompress'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  currentAvatar: {
    type: String,
    default: '',
  },
  fullName: {
    type: String,
    default: '',
  },
  size: {
    type: Number,
    default: 96,
  },
})

const emit = defineEmits(['saved'])
/* END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const { t } = useI18n()
const userStore = useUserStore()
const { compress } = useImageCompress()

const fileInputReference = ref<HTMLInputElement | null>(null)
const cropImageReference = ref<HTMLImageElement | null>(null)
const cropDialog = ref(false)
const cropImageSource = ref('')
const previewSource = ref('')
const zoomValue = ref(1)
const isProcessing = ref(false)
const errorMessage = ref('')
const showErrorSnackbar = ref(false)
const errorSnackbarMessage = ref('')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cropperInstance: any = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let CropperModule: any = null
/* END DEFINE STATE */

/** START DEFINE COMPUTED */
const currentAvatarUrl = computed(() => {
  if (!props.currentAvatar) return ''

  return props.currentAvatar.startsWith('http') ? props.currentAvatar : props.currentAvatar
})

const initials = computed(() => {
  const name = props.fullName.trim()
  const parts = name.split(' ').filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  if (parts.length >= 2) return (first + last).toUpperCase()
  if (parts.length === 1) return first.toUpperCase() || 'U'

  return 'U'
})
/* END DEFINE COMPUTED */

/** START DEFINE METHOD */
const HEIC_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
])
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'])
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', ...HEIC_TYPES])

const triggerFileInput = () => {
  fileInputReference.value?.click()
}

const isHeicFile = (file: File): boolean => {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (extension === 'heic' || extension === 'heif') return true
  if (HEIC_TYPES.has(file.type)) return true

  // iOS sometimes sends HEIC as application/octet-stream
  if (file.type === 'application/octet-stream' && (extension === 'heic' || extension === 'heif'))
    return true

  return false
}

const validateFile = (file: File): { valid: boolean; error?: string } => {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

  // Reject GIF explicitly
  if (extension === 'gif' || file.type === 'image/gif') {
    return {
      valid: false,
      error: t('profile.avatarNoGif'),
    }
  }

  // Check extension OR mime type
  const hasValidExtension = ALLOWED_EXTENSIONS.has(extension)
  const hasValidMimeType = ALLOWED_MIME_TYPES.has(file.type)

  // iOS may send HEIC with empty type or application/octet-stream
  const isHeic = isHeicFile(file)

  if (!hasValidExtension && !hasValidMimeType && !isHeic) {
    return {
      valid: false,
      error: t('profile.avatarInvalidType'),
    }
  }

  // Max input size: 50MB — pre-resize handles large files gracefully
  if (file.size > 200 * 1024 * 1024) {
    return {
      valid: false,
      error: t('profile.avatarTooLarge'),
    }
  }

  return { valid: true }
}

const convertHeic = async (file: File): Promise<Blob> => {
  const heic2any = (await import('heic2any')).default
  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.95,
  })
  const blob = Array.isArray(result) ? result[0] : result

  if (!(blob instanceof Blob)) {
    throw new Error('HEIC conversion did not return a Blob')
  }

  return blob
}

const PRE_RESIZE_MAX_DIMENSION = 2048
const MIN_IMAGE_DIMENSION = 256

const preResizeImage = async (blob: Blob): Promise<Blob> => {
  const sourceBitmap = await createImageBitmap(blob)
  const { width, height } = sourceBitmap

  // Reject images too small for a quality avatar
  if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
    sourceBitmap.close()
    throw new Error('IMAGE_TOO_SMALL')
  }

  // Skip resize if already within limits
  if (width <= PRE_RESIZE_MAX_DIMENSION && height <= PRE_RESIZE_MAX_DIMENSION) {
    sourceBitmap.close()
    return blob
  }

  const scale = PRE_RESIZE_MAX_DIMENSION / Math.max(width, height)
  const targetWidth = Math.round(width * scale)
  const targetHeight = Math.round(height * scale)

  // GPU-accelerated resize via createImageBitmap — avoids allocating full-resolution memory
  const resizedBitmap = await createImageBitmap(sourceBitmap, {
    resizeWidth: targetWidth,
    resizeHeight: targetHeight,
    resizeQuality: 'high',
  })
  sourceBitmap.close()

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const context = canvas.getContext('2d')!
  context.drawImage(resizedBitmap, 0, 0)
  resizedBitmap.close()

  // Use PNG (lossless) for intermediate — avoids double JPEG compression
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('Canvas toBlob failed'))
    }, 'image/png')
  })
}

const showPreProcessingError = (message: string) => {
  errorSnackbarMessage.value = message
  showErrorSnackbar.value = true
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Reset input so same file can be re-selected
  target.value = ''

  // Validate
  const validation = validateFile(file)

  if (!validation.valid) {
    showPreProcessingError(validation.error!)
    return
  }

  try {
    isProcessing.value = true
    // Let Vue render the spinner before heavy work
    await nextTick()

    let imageBlob: Blob = file

    // Convert HEIC to JPEG first
    if (isHeicFile(file)) {
      imageBlob = await convertHeic(file)
    }

    // Pre-resize large images to prevent browser freeze
    imageBlob = await preResizeImage(imageBlob)

    // Create object URL for cropper
    cropImageSource.value = URL.createObjectURL(imageBlob)
    zoomValue.value = 1
    previewSource.value = ''
    cropDialog.value = true
  } catch (error) {
    if (error instanceof Error && error.message === 'IMAGE_TOO_SMALL') {
      showPreProcessingError(t('profile.avatarTooSmall'))
      return
    }

    console.error('Failed to load image:', error)
    showPreProcessingError(t('profile.avatarLoadFailed'))
  } finally {
    isProcessing.value = false
  }
}

const initCropper = async () => {
  await import('cropperjs/dist/cropper.css')

  if (!CropperModule) {
    const module = await import('cropperjs')
    CropperModule = module.default
  }

  await nextTick()
  if (!cropImageReference.value) return

  cropperInstance = new CropperModule(cropImageReference.value, {
    aspectRatio: 1,
    viewMode: 1,
    dragMode: 'move',
    cropBoxMovable: false,
    cropBoxResizable: false,
    autoCropArea: 0.85,
    responsive: true,
    restore: false,
    toggleDragModeOnDblclick: false,
    modal: false,
    guides: false,
    center: false,
    highlight: false,
    background: false,
    ready: () => {
      zoomValue.value = 1
      updatePreview()
    },
    crop: () => {
      updatePreview()
    },
  })
}

const updatePreview = () => {
  if (!cropperInstance) return

  try {
    const canvas = cropperInstance.getCroppedCanvas({
      width: 160,
      height: 160,
      fillColor: '#fff',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'medium',
    })

    if (canvas) {
      previewSource.value = canvas.toDataURL('image/jpeg', 0.85)
    }
  } catch {
    // Preview generation is non-critical
  }
}

const handleZoom = (value: number) => {
  if (cropperInstance) {
    cropperInstance.zoomTo(value)
  }
}

const applyCrop = async () => {
  if (!cropperInstance) return

  isProcessing.value = true
  errorMessage.value = ''

  try {
    const canvas = cropperInstance.getCroppedCanvas({
      width: 512,
      height: 512,
      fillColor: '#fff',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    })

    if (!canvas) {
      errorMessage.value = t('profile.avatarCropFailed')
      return
    }

    // Compress to < 3MB
    const blob = await compress(canvas)

    // Convert to base64
    const base64 = await blobToBase64(blob)

    // Upload
    const ProfileService = (await import('@/services/ProfileService')).default
    const updatedUser = await ProfileService.updateAvatar({ avatar: base64 })
    userStore.user = updatedUser
    emit('saved', updatedUser)

    cropDialog.value = false
  } catch (error) {
    console.error('Failed to upload avatar:', error)
    errorMessage.value = t('profile.avatarUploadFailed')
  } finally {
    isProcessing.value = false
  }
}

const cancelCrop = () => {
  cropDialog.value = false
  errorMessage.value = ''
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
/* END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(cropDialog, (value) => {
  if (value) {
    nextTick(() => initCropper())
  } else {
    cropperInstance?.destroy()
    cropperInstance = null

    if (cropImageSource.value) {
      URL.revokeObjectURL(cropImageSource.value)
      cropImageSource.value = ''
    }

    previewSource.value = ''
  }
})
/* END DEFINE WATCHER */
</script>

<style scoped>
.avatar-upload-wrapper {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
}

.avatar-display {
  width: 100%;
  height: 100%;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;
  border-radius: 50%;
}

.avatar-upload-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay--active {
  opacity: 1;
  pointer-events: none;
}

/* ── Crop area with circular mask ── */
.crop-container {
  position: relative;
  max-height: 400px;
  overflow: hidden;
  background: #000;
  border-radius: 12px;
}

.crop-image {
  max-width: 100%;
  display: block;
}

/* Circular mask: dark overlay with transparent circle in center */
.circle-mask {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.circle-hole {
  position: absolute;
  inset: 0;
  /* Dark overlay with circular cutout using box-shadow trick */
  border-radius: 0;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  /* Center the circle */
  width: 75%;
  height: 0;
  padding-bottom: 75%;
  margin: auto;
  border-radius: 50%;
}

/* ── Preview ── */
.preview-section {
  flex-shrink: 0;
  text-align: center;
}

.preview-avatar {
  border: 2px solid rgba(0, 0, 0, 0.12);
}

/* ── Override cropperjs styles for circular crop ── */
.crop-container :deep(.cropper-view-box) {
  border-radius: 50%;
  outline: 2px solid #39f;
}

.crop-container :deep(.cropper-face) {
  border-radius: 50%;
}

.crop-container :deep(.cropper-drag-box) {
  background: transparent;
}

.crop-container :deep(.cropper-modal) {
  background-color: transparent;
}

.crop-container :deep(.cropper-line),
.crop-container :deep(.cropper-point) {
  display: none;
}
</style>
