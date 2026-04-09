<template>
  <!-- Transparent overlay on top of .presentation-main (position: absolute; inset: 0 in CSS) -->
  <!-- Always pointer-events: none — cursor tracking and click-to-mark handled on parent element -->
  <div class="annotation-layer">
    <canvas ref="canvasReference" class="annotation-layer__canvas" />
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { CursorPosition, ScreenMarker } from '@/types/meeting/ScreenCursor'
/** END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps<{
  /** Map of String(userId) → cursor position for all remote participants */
  cursors: Record<string, CursorPosition>
  /** Click-markers from all participants */
  markers: ScreenMarker[]
  /** Map of String(userId) → display name for cursor labels */
  participantNameMap: Record<string, string>
  /** Map of String(userId) → annotation color */
  participantColorMap: Record<string, string>
  /** Whether the local user is sharing their screen — hides own cursor */
  isLocalScreenSharing: boolean
}>()

const emit = defineEmits<{
  'cursor-move': [position: { x: number; y: number }]
  'cursor-hide': []
  'marker-place': [position: { x: number; y: number }]
  'markers-clear': []
}>()
/** END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const canvasReference = ref<HTMLCanvasElement | null>(null)

// Marker timing constants (ms)
const MARKER_PULSE_DURATION_MS = 800
const MARKER_FADE_START_MS = 5000
const MARKER_FADE_DURATION_MS = 3000

// Cursor auto-hide: remove stale cursors after 5s of no update
const _CURSOR_STALE_MS = 5000

let animFrame: number | null = null
let resizeObserver: ResizeObserver | null = null

// Last known local cursor position (normalized 0-1)
let _lastLocalX = 0
let _lastLocalY = 0

/** END DEFINE STATE */

/** START DEFINE METHOD */
/**
 * The render loop runs via requestAnimationFrame.
 * Draws remote participant cursors (colored dot + name) and click-markers (pulsing circle).
 */
function renderLoop() {
  const canvas = canvasReference.value
  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    animFrame = requestAnimationFrame(renderLoop)
    return
  }

  const context = canvas.getContext('2d')
  if (!context) {
    animFrame = requestAnimationFrame(renderLoop)
    return
  }

  const now = Date.now()
  context.clearRect(0, 0, canvas.width, canvas.height)

  // Draw markers (pulsing circles)
  for (const marker of props.markers) {
    const elapsed = now - marker.timestamp
    if (elapsed >= MARKER_FADE_START_MS + MARKER_FADE_DURATION_MS) continue

    const centerX = marker.x * canvas.width
    const centerY = marker.y * canvas.height
    const color = marker.color

    // Alpha: full opacity for first 5s, then fade out
    let alpha = 1.0
    if (elapsed > MARKER_FADE_START_MS) {
      alpha = 1.0 - (elapsed - MARKER_FADE_START_MS) / MARKER_FADE_DURATION_MS
      alpha = Math.max(0, alpha)
    }

    // Pulse ring animation
    const pulseProgress = (elapsed % MARKER_PULSE_DURATION_MS) / MARKER_PULSE_DURATION_MS
    const pulseRadius = 12 + pulseProgress * 24
    const pulseAlpha = (1.0 - pulseProgress) * 0.6 * alpha

    context.globalAlpha = pulseAlpha
    context.beginPath()
    context.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2)
    context.strokeStyle = color
    context.lineWidth = 2.5
    context.stroke()

    // Solid inner circle
    context.globalAlpha = alpha
    context.beginPath()
    context.arc(centerX, centerY, 10, 0, Math.PI * 2)
    context.fillStyle = color
    context.fill()

    // White center dot
    context.globalAlpha = alpha
    context.beginPath()
    context.arc(centerX, centerY, 4, 0, Math.PI * 2)
    context.fillStyle = '#fff'
    context.fill()
  }

  // Draw cursors (colored dot + name label)
  for (const [userId, cursor] of Object.entries(props.cursors)) {
    // Hide stale cursors (no update for CURSOR_STALE_MS)
    // Note: cursor doesn't carry timestamp — rely on purge in useMeeting
    const color = props.participantColorMap[userId] || '#fff'
    const name = props.participantNameMap[userId] || `User ${userId}`
    const dotX = cursor.x * canvas.width
    const dotY = cursor.y * canvas.height

    // Cursor arrow shape (simplified — colored dot with pointer)
    context.globalAlpha = 0.9
    context.beginPath()
    context.arc(dotX, dotY, 6, 0, Math.PI * 2)
    context.fillStyle = color
    context.fill()

    // White outline
    context.beginPath()
    context.arc(dotX, dotY, 6, 0, Math.PI * 2)
    context.strokeStyle = '#fff'
    context.lineWidth = 1.5
    context.stroke()

    // Name label
    context.globalAlpha = 0.85
    context.font = '11px system-ui, -apple-system, sans-serif'
    const textWidth = context.measureText(name).width
    const labelX = dotX + 10
    const labelY = dotY + 4

    // Label background
    context.fillStyle = color
    const padding = 4
    context.beginPath()
    roundRect(context, labelX - padding, labelY - 10, textWidth + padding * 2, 16, 4)
    context.fill()

    // Label text
    context.fillStyle = '#fff'
    context.fillText(name, labelX, labelY)
  }

  context.globalAlpha = 1.0
  animFrame = requestAnimationFrame(renderLoop)
}

/** Canvas roundRect helper */
function roundRect(
  context: CanvasRenderingContext2D,
  posX: number,
  posY: number,
  width: number,
  height: number,
  radius: number,
) {
  context.moveTo(posX + radius, posY)
  context.lineTo(posX + width - radius, posY)
  context.arcTo(posX + width, posY, posX + width, posY + radius, radius)
  context.lineTo(posX + width, posY + height - radius)
  context.arcTo(posX + width, posY + height, posX + width - radius, posY + height, radius)
  context.lineTo(posX + radius, posY + height)
  context.arcTo(posX, posY + height, posX, posY + height - radius, radius)
  context.lineTo(posX, posY + radius)
  context.arcTo(posX, posY, posX + radius, posY, radius)
}

function resizeCanvas() {
  const canvas = canvasReference.value
  if (!canvas) return
  // Use grandparent (.presentation-main) for sizing — parent is .annotation-layer (pointer-events: none wrapper)
  const presentationMain = canvas.parentElement?.parentElement
  if (!presentationMain) return

  const rect = presentationMain.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return

  canvas.width = rect.width
  canvas.height = rect.height
}

function getNormalizedPoint(event: MouseEvent): { x: number; y: number } {
  const canvas = canvasReference.value!
  const rect = canvas.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
  }
}

function onParentMouseMove(event: MouseEvent) {
  // Local sharer doesn't send cursor — they see their own screen
  if (props.isLocalScreenSharing) return
  const point = getNormalizedPoint(event)
  _lastLocalX = point.x
  _lastLocalY = point.y
  emit('cursor-move', point)
}

function onParentMouseLeave() {
  if (props.isLocalScreenSharing) return
  emit('cursor-hide')
}

function onParentClick(event: MouseEvent) {
  // Only non-sharing participants can place markers
  if (props.isLocalScreenSharing) return
  const point = getNormalizedPoint(event)
  emit('marker-place', point)
}
/** END DEFINE METHOD */

/** START DEFINE LIFE CYCLE HOOK */
onMounted(() => {
  const canvas = canvasReference.value
  if (!canvas) return

  nextTick(() => {
    resizeCanvas()
    animFrame = requestAnimationFrame(renderLoop)
  })

  // Listen on grandparent (.presentation-main) — canvas parent is .annotation-layer with pointer-events: none
  const presentationMain = canvas.parentElement?.parentElement
  if (presentationMain) {
    presentationMain.addEventListener('mousemove', onParentMouseMove)
    presentationMain.addEventListener('mouseleave', onParentMouseLeave)
    presentationMain.addEventListener('click', onParentClick)

    resizeObserver = new ResizeObserver(() => {
      resizeCanvas()
    })
    resizeObserver.observe(presentationMain)
  }
})

onUnmounted(() => {
  if (animFrame !== null) {
    cancelAnimationFrame(animFrame)
    animFrame = null
  }

  resizeObserver?.disconnect()

  const canvas = canvasReference.value
  if (!canvas) return
  const presentationMain = canvas.parentElement?.parentElement
  if (presentationMain) {
    presentationMain.removeEventListener('mousemove', onParentMouseMove)
    presentationMain.removeEventListener('mouseleave', onParentMouseLeave)
    presentationMain.removeEventListener('click', onParentClick)
  }
})
/** END DEFINE LIFE CYCLE HOOK */
</script>

<style scoped>
.annotation-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}

.annotation-layer__canvas {
  position: absolute;
  inset: 0;
}
</style>
