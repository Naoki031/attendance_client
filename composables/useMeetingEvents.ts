/**
 * Module-level reactive state for cross-component meeting events.
 * Allows HostScheduleSummary components to react to server-side schedule changes
 * without prop drilling through MeetingCard → HostScheduleSummary.
 */
import { ref, readonly } from 'vue'

const _hostScheduleChangedUuid = ref<string | null>(null)

export function useMeetingEvents() {
  function notifyHostScheduleChanged(meetingUuid: string) {
    _hostScheduleChangedUuid.value = meetingUuid
  }

  return {
    hostScheduleChangedUuid: readonly(_hostScheduleChangedUuid),
    notifyHostScheduleChanged,
  }
}
