/**
 * Module-level reactive state for cross-component meeting events.
 * Allows HostScheduleSummary components to react to server-side schedule changes
 * without prop drilling through MeetingCard → HostScheduleSummary.
 */
import { ref, readonly } from 'vue'

interface HostScheduleChangedEvent {
  meetingUuid: string
  /** Monotonically increasing counter so that repeated changes to the same
   *  meeting UUID always produce a new object reference and trigger watchers. */
  seq: number
}

let _seq = 0
const _hostScheduleChangedEvent = ref<HostScheduleChangedEvent | null>(null)

export function useMeetingEvents() {
  function notifyHostScheduleChanged(meetingUuid: string) {
    _seq += 1
    _hostScheduleChangedEvent.value = { meetingUuid, seq: _seq }
  }

  return {
    hostScheduleChangedEvent: readonly(_hostScheduleChangedEvent),
    notifyHostScheduleChanged,
  }
}
