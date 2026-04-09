<template>
  <div class="vote-panel">
    <div class="vote-panel__header">
      <div class="d-flex align-center ga-1">
        <v-icon icon="mdi-poll" size="16"></v-icon>
        <span class="text-body-2 font-weight-medium">{{ $t('meetings.vote.title') }}</span>
      </div>
      <v-btn icon="mdi-plus" size="x-small" variant="tonal" @click="emit('create-vote')">
        <v-icon size="16" />
      </v-btn>
    </div>

    <div class="vote-panel__body">
      <div v-if="votes.length === 0" class="vote-panel__empty">
        <v-icon icon="mdi-poll" size="32" color="grey"></v-icon>
        <span class="text-caption text-grey">{{ $t('meetings.vote.noVotes') }}</span>
      </div>

      <div v-for="vote in sortedVotes" :key="vote.id" class="vote-card">
        <div class="vote-card__header">
          <span class="text-body-2 font-weight-medium">{{ vote.question }}</span>
          <v-chip
            v-if="vote.status === 'closed'"
            size="x-small"
            variant="tonal"
            color="grey"
            class="ml-2"
          >
            {{ $t('meetings.vote.closed') }}
          </v-chip>
        </div>

        <div class="vote-card__meta">
          <span class="text-caption text-grey">
            {{ $t('meetings.vote.by', { name: vote.creatorName }) }}
            ·
            {{ $t('meetings.vote.voters', { count: Object.keys(vote.votes).length }) }}
            ·
            {{
              vote.type === 'story_point'
                ? $t('meetings.vote.storyPoint')
                : vote.type === 'single'
                  ? $t('meetings.vote.single')
                  : $t('meetings.vote.multiple')
            }}
          </span>
        </div>

        <!-- Not invited notice -->
        <div v-if="!canVote(vote) && vote.status === 'active'" class="vote-card__not-invited">
          <v-icon icon="mdi-account-cancel-outline" size="14" class="mr-1"></v-icon>
          {{ $t('meetings.vote.notInvited') }}
        </div>

        <!-- Story point: clickable number cards -->
        <template v-if="vote.type === 'story_point'">
          <div class="sp-cards">
            <button
              v-for="option in visibleStoryPointOptions(vote)"
              :key="option.id"
              class="sp-card"
              :class="{
                'sp-card--chosen': localSelectedIds(vote).includes(option.id),
                'sp-card--disabled': vote.status === 'closed',
                'sp-card--special': isSpecialOption(option.text),
              }"
              @click="handleSelect(vote, option.id)"
            >
              <span v-if="option.text === 'coffee'" class="sp-card__icon">&#9749;</span>
              <span v-else-if="option.text === 'question'" class="sp-card__icon">?</span>
              <span v-else class="sp-card__number">{{ option.text }}</span>

              <!-- Mini count badge when results visible -->
              <span v-if="allVotersDone(vote) || vote.status === 'closed'" class="sp-card__count">
                {{ getOptionCount(vote, option.id) }}
              </span>
            </button>
          </div>

          <!-- Story point stats (only when results visible) -->
          <div v-if="allVotersDone(vote) || vote.status === 'closed'" class="sp-stats">
            <div class="sp-stat">
              <span class="sp-stat__label">{{ $t('meetings.vote.average') }}</span>
              <span class="sp-stat__value">{{ getStoryPointAverage(vote) }}</span>
            </div>
          </div>
        </template>

        <!-- Standard single/multiple choice options -->
        <template v-else>
          <div class="vote-card__options">
            <div v-for="option in vote.options" :key="option.id" class="vote-option">
              <button
                class="vote-option__select"
                :class="{
                  'vote-option__select--chosen': localSelectedIds(vote).includes(option.id),
                  'vote-option__select--disabled': vote.status === 'closed',
                }"
                @click="handleSelect(vote, option.id)"
              >
                <v-icon
                  :icon="
                    vote.type === 'single'
                      ? localSelectedIds(vote).includes(option.id)
                        ? 'mdi-radiobox-marked'
                        : 'mdi-radiobox-blank'
                      : localSelectedIds(vote).includes(option.id)
                        ? 'mdi-checkbox-marked'
                        : 'mdi-checkbox-blank-outline'
                  "
                  size="18"
                  class="mr-2 flex-shrink-0"
                />
                <span class="vote-option__text">{{ option.text }}</span>
              </button>

              <div
                v-if="allVotersDone(vote) || vote.status === 'closed'"
                class="vote-option__bar-wrap"
              >
                <div
                  class="vote-option__bar"
                  :style="{ width: `${getOptionPercent(vote, option.id)}%` }"
                ></div>
                <span class="vote-option__percent">{{ getOptionPercent(vote, option.id) }}%</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Actions (only for allowed voters + creator close) -->
        <div class="vote-card__actions">
          <!-- Change vote button: only when active, user voted, not all voted yet, not editing -->
          <v-btn
            v-if="canVote(vote) && canChangeVote(vote) && editingVoteId !== vote.id"
            size="x-small"
            variant="tonal"
            color="primary"
            @click="startChangeVote(vote)"
          >
            {{ $t('meetings.vote.updateVote') }}
          </v-btn>
          <!-- Vote button: shown when not yet voted OR in edit mode (re-selecting) -->
          <v-btn
            v-if="
              vote.status === 'active' &&
              canVote(vote) &&
              (!hasVoted(vote) || editingVoteId === vote.id)
            "
            size="x-small"
            variant="flat"
            color="primary"
            :disabled="localSelectedIds(vote).length === 0"
            @click="submitVote(vote)"
          >
            {{ $t('meetings.vote.cast') }}
          </v-btn>
          <v-spacer />
          <v-btn
            v-if="vote.status === 'active' && isCreator(vote)"
            size="x-small"
            variant="tonal"
            color="error"
            @click="emit('close-vote', vote.id)"
          >
            {{ $t('meetings.vote.closeVote') }}
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
/** START IMPORT */
import type { MeetingVote } from '@/types/meeting/MeetingVote'
import { STORY_POINT_COFFEE, STORY_POINT_QUESTION } from '@/types/meeting/MeetingVote'
/* END IMPORT */

/** START DEFINE PROPERTY AND EMITS */
const props = defineProps<{
  votes: MeetingVote[]
  localUserId: number
  /** Total participants in the meeting room (used to check if all have voted) */
  meetingParticipantCount: number
}>()

const emit = defineEmits<{
  'create-vote': []
  'cast-vote': [voteId: string, optionIds: string[]]
  'close-vote': [voteId: string]
}>()
/** END DEFINE PROPERTY AND EMITS */

/** START DEFINE STATE */
const localSelections = ref<Record<string, string[]>>({})
/** Tracks which vote is currently in "re-select" mode after clicking Change vote */
const editingVoteId = ref<string | null>(null)

/** Sort votes: active first, then closed. Within each group, newest first. */
const sortedVotes = computed(() =>
  [...props.votes].sort((first, second) => {
    if (first.status !== second.status) return first.status === 'active' ? -1 : 1
    return second.createdAt - first.createdAt
  }),
)
/** END DEFINE STATE */

/** START DEFINE METHOD */
function isCreator(vote: MeetingVote): boolean {
  return vote.createdBy === props.localUserId
}

function canVote(vote: MeetingVote): boolean {
  // Empty participantIds = everyone can vote
  if (!vote.participantIds || vote.participantIds.length === 0) return true
  return vote.participantIds.includes(props.localUserId)
}

/** Checks if all invited participants have submitted their vote */
function allVotersDone(vote: MeetingVote): boolean {
  const voterCount = Object.keys(vote.votes).length
  // Specific participants invited: check if all have voted
  if (vote.participantIds && vote.participantIds.length > 0) {
    return vote.participantIds.every((participantId) => participantId in vote.votes)
  }
  // Everyone can vote: check against total meeting participants
  return voterCount >= props.meetingParticipantCount
}

/** Whether the current user can change their vote:
 *  - Vote must be active
 *  - User must have voted
 *  - Not all participants have voted yet
 */
function canChangeVote(vote: MeetingVote): boolean {
  return vote.status === 'active' && hasVoted(vote) && !allVotersDone(vote)
}

function hasVoted(vote: MeetingVote): boolean {
  return props.localUserId in vote.votes
}

function isSpecialOption(text: string): boolean {
  return text === STORY_POINT_COFFEE || text === STORY_POINT_QUESTION
}

/** Returns visible story point options. Before voting or editing: show all.
 *  After voting/closed: hide options with 0 votes. */
/** Returns visible story point options. Shows all cards while voting is in progress.
 *  Only hides zero-vote cards when results are final (all voted or closed). */
function visibleStoryPointOptions(vote: MeetingVote) {
  const resultsFinal = allVotersDone(vote) || vote.status === 'closed'
  if (!resultsFinal) return vote.options
  return vote.options.filter((option) => getOptionCount(vote, option.id) > 0)
}

function localSelectedIds(vote: MeetingVote): string[] {
  // When in edit mode, only show local selection (cleared on "Change vote" click)
  if (editingVoteId.value === vote.id) {
    return localSelections.value[vote.id] ?? []
  }
  // Not editing — show server state if voted, otherwise local selection
  if (props.localUserId in vote.votes) {
    return vote.votes[props.localUserId]!
  }
  return localSelections.value[vote.id] ?? []
}

function handleSelect(vote: MeetingVote, optionId: string) {
  if (vote.status === 'closed') return

  // Story point and single choice: only one selection
  if (vote.type === 'story_point' || vote.type === 'single') {
    localSelections.value = {
      ...localSelections.value,
      [vote.id]: [optionId],
    }
  } else {
    const current = localSelectedIds(vote)
    const isSelected = current.includes(optionId)
    const updated = isSelected ? current.filter((id) => id !== optionId) : [...current, optionId]
    localSelections.value = {
      ...localSelections.value,
      [vote.id]: updated,
    }
  }
}

function getOptionPercent(vote: MeetingVote, optionId: string): number {
  const totalVoters = Object.keys(vote.votes).length
  if (totalVoters === 0) return 0
  const count = Object.values(vote.votes).filter((ids) => ids.includes(optionId)).length
  return Math.round((count / totalVoters) * 100)
}

function getOptionCount(vote: MeetingVote, optionId: string): number {
  return Object.values(vote.votes).filter((ids) => ids.includes(optionId)).length
}

/**
 * Computes the average story point from numeric votes.
 * Excludes special values (coffee, question).
 */
function getStoryPointAverage(vote: MeetingVote): string {
  const numericValues: number[] = []
  for (const ids of Object.values(vote.votes)) {
    const optionText = vote.options.find((option) => ids.includes(option.id))?.text
    if (optionText) {
      const parsed = Number.parseFloat(optionText)
      if (!Number.isNaN(parsed)) {
        numericValues.push(parsed)
      }
    }
  }
  if (numericValues.length === 0) return '-'
  const average = numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length
  return Number.isInteger(average) ? String(average) : average.toFixed(1)
}

function submitVote(vote: MeetingVote) {
  const selectedIds = localSelectedIds(vote)
  if (selectedIds.length === 0) return
  emit('cast-vote', vote.id, selectedIds)
  const { [vote.id]: _removed, ...remaining } = localSelections.value
  localSelections.value = remaining
  editingVoteId.value = null
}

/** Enters edit mode: clears current selection so user can re-choose */
function startChangeVote(vote: MeetingVote) {
  editingVoteId.value = vote.id
  localSelections.value = {
    ...localSelections.value,
    [vote.id]: [],
  }
}
/** END DEFINE METHOD */
</script>

<style scoped>
.vote-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--vg-bg, #1a1a1a);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}

.vote-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.87);
}

.vote-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.vote-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  min-height: 120px;
}

.vote-card {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
}

.vote-card__header {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.9);
}

.vote-card__meta {
  margin: 4px 0 8px;
}

.vote-card__not-invited {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  margin-bottom: 6px;
}

.vote-card__options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vote-option__select {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.vote-option__select:hover:not(.vote-option__select--disabled) {
  background: rgba(255, 255, 255, 0.06);
}

.vote-option__select--chosen {
  border-color: rgba(var(--v-theme-primary), 0.6);
  background: rgba(var(--v-theme-primary), 0.1);
}

.vote-option__select--disabled {
  cursor: default;
  opacity: 0.7;
}

.vote-option__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vote-option__bar-wrap {
  position: relative;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.08);
  margin: 2px 0 4px 28px;
}

.vote-option__bar {
  height: 100%;
  border-radius: 3px;
  background: rgba(var(--v-theme-primary), 0.5);
  transition: width 0.3s ease;
  min-width: 0;
}

.vote-option__percent {
  position: absolute;
  right: 0;
  top: -14px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}

.vote-card__actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

/* ── Story point cards ── */
.sp-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  margin-bottom: 6px;
}

.sp-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 2px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.sp-card:hover:not(.sp-card--disabled) {
  background: rgba(255, 255, 255, 0.06);
}

.sp-card--chosen {
  border-color: rgba(var(--v-theme-primary), 0.6);
  background: rgba(var(--v-theme-primary), 0.15);
}

.sp-card--disabled {
  cursor: default;
  opacity: 0.7;
}

.sp-card--special {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
}

.sp-card__number {
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.sp-card__icon {
  font-size: 16px;
  line-height: 1;
}

.sp-card__count {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
  min-height: 11px;
}

.sp-stats {
  display: flex;
  gap: 12px;
  padding: 6px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.sp-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sp-stat__label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.sp-stat__value {
  font-size: 16px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}
</style>
