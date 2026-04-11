import { apiClient } from '@/utils/apiClient'
import type {
  MeetingScheduledParticipantModel,
  ScheduledParticipantStatus,
} from '@/interfaces/models/MeetingScheduledParticipantModel'
import type { MeetingAutoCallConfigModel } from '@/interfaces/models/MeetingAutoCallConfigModel'

export default class MeetingScheduledParticipantService {
  /**
   * Returns all scheduled participants for a meeting.
   */
  public static async getAll(meetingUuid: string): Promise<MeetingScheduledParticipantModel[]> {
    return await apiClient.get<MeetingScheduledParticipantModel[]>(
      `/meetings/${meetingUuid}/scheduled-participants`,
    )
  }

  /**
   * Returns all pending scheduled participant invites for the current user across all meetings.
   */
  public static async getMyPendingInvites(): Promise<MeetingScheduledParticipantModel[]> {
    return await apiClient.get<MeetingScheduledParticipantModel[]>(
      '/meetings/scheduled-participants/my-pending',
    )
  }

  /**
   * Adds users as scheduled participants and triggers RSVP emails. Host only.
   */
  public static async create(
    meetingUuid: string,
    userIds: number[],
  ): Promise<MeetingScheduledParticipantModel[]> {
    return await apiClient.post<MeetingScheduledParticipantModel[]>(
      `/meetings/${meetingUuid}/scheduled-participants`,
      { user_ids: userIds },
    )
  }

  /**
   * Records the current user's RSVP response (in-app).
   */
  public static async rsvp(
    meetingUuid: string,
    status: ScheduledParticipantStatus,
  ): Promise<MeetingScheduledParticipantModel> {
    return await apiClient.patch<MeetingScheduledParticipantModel>(
      `/meetings/${meetingUuid}/scheduled-participants/rsvp`,
      { status },
    )
  }

  /**
   * Records RSVP via single-use email token (public, no auth required).
   * Server returns only { status } — full entity is never exposed on a public endpoint.
   */
  public static async rsvpByToken(
    token: string,
    status: ScheduledParticipantStatus,
  ): Promise<{ status: ScheduledParticipantStatus }> {
    return await apiClient.patch<{ status: ScheduledParticipantStatus }>(
      `/meetings/scheduled-participants/rsvp-by-token/${token}`,
      { status },
    )
  }

  /**
   * Removes a scheduled participant. Host only.
   */
  public static async remove(meetingUuid: string, userId: number): Promise<void> {
    await apiClient.delete(`/meetings/${meetingUuid}/scheduled-participants/${userId}`)
  }

  // ─── Auto-call config ────────────────────────────────────────────────────

  /**
   * Returns the auto-call config for a meeting, or null if not configured.
   */
  public static async getAutoCallConfig(
    meetingUuid: string,
  ): Promise<MeetingAutoCallConfigModel | null> {
    return await apiClient.get<MeetingAutoCallConfigModel | null>(
      `/meetings/${meetingUuid}/auto-call-config`,
    )
  }

  /**
   * Creates or updates the auto-call config. Host only.
   */
  public static async upsertAutoCallConfig(
    meetingUuid: string,
    data: Partial<MeetingAutoCallConfigModel>,
  ): Promise<MeetingAutoCallConfigModel> {
    return await apiClient.patch<MeetingAutoCallConfigModel>(
      `/meetings/${meetingUuid}/auto-call-config`,
      data,
    )
  }
}
