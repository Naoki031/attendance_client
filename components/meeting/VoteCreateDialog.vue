<template>
  <v-dialog
    :model-value="dialog"
    max-width="480"
    @update:model-value="emit('update:model-value', $event)"
  >
    <v-card>
      <v-card-title class="text-h6">{{ $t('meetings.vote.createVote') }}</v-card-title>

      <v-card-text>
        <!-- Question -->
        <v-text-field
          v-model="question"
          :label="$t('meetings.vote.question')"
          :placeholder="$t('meetings.vote.questionPlaceholder')"
          :error-messages="questionError"
          variant="outlined"
          density="compact"
          class="mb-3"
          @update:model-value="questionError = ''"
        />

        <!-- Vote type -->
        <div class="mb-3">
          <div class="text-body-2 mb-1">{{ $t('meetings.vote.type') }}</div>
          <v-btn-toggle v-model="voteType" mandatory divided density="compact" variant="outlined">
            <v-btn value="single">
              <v-icon icon="mdi-radiobox-marked" size="18" class="mr-1"></v-icon>
              {{ $t('meetings.vote.single') }}
            </v-btn>
            <v-btn value="multiple">
              <v-icon icon="mdi-checkbox-marked" size="18" class="mr-1"></v-icon>
              {{ $t('meetings.vote.multiple') }}
            </v-btn>
            <v-btn value="story_point">
              <v-icon icon="mdi-counter" size="18" class="mr-1"></v-icon>
              {{ $t('meetings.vote.storyPoint') }}
            </v-btn>
          </v-btn-toggle>
        </div>

        <!-- Custom options (hidden for story_point — auto-generated Fibonacci) -->
        <template v-if="voteType !== 'story_point'">
          <div class="text-body-2 mb-1">{{ $t('meetings.vote.options') }}</div>
          <div v-for="(_, index) in options" :key="index" class="d-flex align-center ga-2 mb-2">
            <v-text-field
              v-model="options[index]"
              :placeholder="`${$t('meetings.vote.options')} ${index + 1}`"
              :error-messages="index === optionsErrorIndex ? optionsError : ''"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="
                () => {
                  optionsError = ''
                  optionsErrorIndex = -1
                }
              "
            />
            <v-btn
              v-if="options.length > 2"
              icon="mdi-close"
              size="x-small"
              variant="text"
              @click="removeOption(index)"
            />
          </div>

          <v-btn variant="text" size="small" :disabled="options.length >= 10" @click="addOption">
            <v-icon icon="mdi-plus" size="16" class="mr-1"></v-icon>
            {{ $t('meetings.vote.addOption') }}
          </v-btn>
        </template>

        <!-- Fibonacci preview (story_point mode) -->
        <div v-else class="fibonacci-preview">
          <div class="text-body-2 mb-1">{{ $t('meetings.vote.fibonacciCards') }}</div>
          <div class="d-flex flex-wrap ga-1">
            <v-chip
              v-for="numberValue in fibonacciPreview"
              :key="numberValue"
              size="small"
              variant="outlined"
            >
              {{ numberValue }}
            </v-chip>
          </div>
        </div>

        <!-- Participant selector -->
        <div class="mt-3">
          <div class="d-flex align-center justify-space-between mb-1">
            <span class="text-body-2">{{ $t('meetings.vote.participants') }}</span>
            <v-btn size="x-small" variant="text" @click="toggleAllParticipants">
              {{ isAllSelected ? $t('meetings.vote.deselectAll') : $t('meetings.vote.selectAll') }}
            </v-btn>
          </div>
          <div class="participant-chips">
            <v-chip
              v-for="participant in participants"
              :key="participant.userId"
              :model-value="selectedParticipantIds.includes(participant.userId)"
              variant="outlined"
              size="small"
              filter
              @click="toggleParticipant(participant.userId)"
            >
              {{ participant.username }}
            </v-chip>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">{{ $t('common.cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" @click="handleCreate">
          {{ $t('meetings.vote.create') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
/** START IMPORT */
import {
  FIBONACCI_OPTIONS,
  STORY_POINT_COFFEE,
  STORY_POINT_QUESTION,
} from '@/types/meeting/MeetingVote'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps({
  dialog: {
    type: Boolean,
    required: true,
  },
  participants: {
    type: Array as PropType<Array<{ userId: number; username: string }>>,
    required: false,
    default: () => [],
  },
})

const emit = defineEmits<{
  'update:model-value': [value: boolean]
  create: [
    payload: {
      question: string
      options: string[]
      type: 'single' | 'multiple' | 'story_point'
      participantIds: number[]
    },
  ]
}>()
/** END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const question = ref('')
const options = ref<string[]>(['', ''])
const voteType = ref<'single' | 'multiple' | 'story_point'>('single')
const questionError = ref('')
const optionsError = ref('')
const optionsErrorIndex = ref(-1)
const selectedParticipantIds = ref<number[]>([])

const fibonacciPreview = computed(() => [
  ...FIBONACCI_OPTIONS,
  STORY_POINT_COFFEE,
  STORY_POINT_QUESTION,
])

const isAllSelected = computed(
  () => selectedParticipantIds.value.length === props.participants.length,
)
/** END DEFINE STATE */

/** START DEFINE METHOD */
function addOption() {
  if (options.value.length >= 10) return
  options.value.push('')
}

function removeOption(index: number) {
  options.value.splice(index, 1)
}

function toggleParticipant(userId: number) {
  const index = selectedParticipantIds.value.indexOf(userId)
  if (index === -1) {
    selectedParticipantIds.value = [...selectedParticipantIds.value, userId]
  } else {
    selectedParticipantIds.value = selectedParticipantIds.value.filter((id) => id !== userId)
  }
}

function toggleAllParticipants() {
  selectedParticipantIds.value = isAllSelected.value
    ? []
    : props.participants.map((participant) => participant.userId)
}

/** Reset participant selection when dialog opens — pre-select all participants */
function resetSelections() {
  question.value = ''
  options.value = ['', '']
  voteType.value = 'single'
  questionError.value = ''
  optionsError.value = ''
  optionsErrorIndex.value = -1
  // Pre-select all participants — empty participantIds on server means everyone can vote
  // so we always send an explicit list. When all are selected, send [] (= everyone).
  selectedParticipantIds.value = props.participants.map((participant) => participant.userId)
}

function handleCreate() {
  let valid = true

  if (!question.value.trim()) {
    questionError.value = 'meetings.vote.questionRequired'
    valid = false
  }

  if (voteType.value === 'story_point') {
    if (!valid) return

    const storyPointOptions = [...FIBONACCI_OPTIONS, STORY_POINT_COFFEE, STORY_POINT_QUESTION]

    emit('create', {
      question: question.value.trim(),
      options: storyPointOptions,
      type: 'story_point',
      // Send empty array when all selected (server treats [] as "everyone")
      participantIds: isAllSelected.value ? [] : selectedParticipantIds.value,
    })

    close()
    return
  }

  const filledOptions = options.value.map((option) => option.trim())
  const emptyIndex = filledOptions.findIndex((option) => !option)
  if (emptyIndex !== -1) {
    optionsError.value = 'meetings.vote.optionTextRequired'
    optionsErrorIndex.value = emptyIndex
    valid = false
  }

  if (filledOptions.filter(Boolean).length < 2) {
    optionsError.value = 'meetings.vote.optionRequired'
    valid = false
  }

  if (!valid) return

  emit('create', {
    question: question.value.trim(),
    options: filledOptions as string[],
    type: voteType.value,
    // Send empty array when all selected (server treats [] as "everyone")
    participantIds: isAllSelected.value ? [] : selectedParticipantIds.value,
  })

  close()
}

function close() {
  resetSelections()
  emit('update:model-value', false)
}
/** END DEFINE METHOD */

/** START DEFINE WATCHER */
watch(
  () => props.dialog,
  (isOpen) => {
    if (isOpen) resetSelections()
  },
)
/** END DEFINE WATCHER */
</script>

<style scoped>
.fibonacci-preview {
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 8px;
  padding: 10px;
}

.participant-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
