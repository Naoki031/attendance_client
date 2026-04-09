export interface VoteOption {
  id: string
  text: string
}

export type VoteType = 'single' | 'multiple' | 'story_point'

/** Fibonacci sequence used for story point voting */
export const FIBONACCI_OPTIONS = ['1', '2', '3', '5', '8', '13', '21', '34', '55']

/** Special story point values */
export const STORY_POINT_COFFEE = 'coffee'
export const STORY_POINT_QUESTION = 'question'

export const STORY_POINT_SPECIAL_OPTIONS = [STORY_POINT_COFFEE, STORY_POINT_QUESTION]

export interface MeetingVote {
  id: string
  createdBy: number
  creatorName: string
  question: string
  options: VoteOption[]
  type: VoteType
  /** userId → array of selected option IDs */
  votes: Record<number, string[]>
  /** User IDs allowed to vote. Empty = everyone can vote. */
  participantIds: number[]
  status: 'active' | 'closed'
  createdAt: number
}
