import { apiClient } from '@/utils/apiClient'
import type { MeetingInviteModel } from '@/interfaces/models/MeetingInviteModel'

export default class MeetingInviteService {
  /**
   * Sends invites to a list of users for a meeting. Host only.
   */
  public static async createInvites(
    meetingUuid: string,
    userIds: number[],
  ): Promise<MeetingInviteModel[]> {
    return await apiClient.post<MeetingInviteModel[]>(`/meetings/${meetingUuid}/invites`, {
      user_ids: userIds,
    })
  }

  /**
   * Returns all invites with RSVP status for a meeting. Host only.
   */
  public static async getInvites(meetingUuid: string): Promise<MeetingInviteModel[]> {
    return await apiClient.get<MeetingInviteModel[]>(`/meetings/${meetingUuid}/invites`)
  }

  /**
   * Returns the current user's invite for a meeting.
   */
  public static async getMyInvite(meetingUuid: string): Promise<MeetingInviteModel | null> {
    return await apiClient.get<MeetingInviteModel | null>(`/meetings/${meetingUuid}/invites/me`)
  }

  /**
   * Records the current user's RSVP response.
   */
  public static async rsvp(
    meetingUuid: string,
    status: 'accepted' | 'declined' | 'maybe',
  ): Promise<MeetingInviteModel> {
    return await apiClient.patch<MeetingInviteModel>(`/meetings/${meetingUuid}/invites/rsvp`, {
      status,
    })
  }

  /**
   * Cancels an invite for a specific user. Host only.
   */
  public static async cancelInvite(meetingUuid: string, userId: number): Promise<void> {
    await apiClient.delete(`/meetings/${meetingUuid}/invites/${userId}`)
  }

  /**
   * Returns all pending invites for the current user across all meetings in one request.
   * Use this instead of calling getMyInvite() per meeting to avoid N+1 calls.
   */
  public static async getMyPendingInvites(): Promise<MeetingInviteModel[]> {
    return await apiClient.get<MeetingInviteModel[]>('/meetings/invites/pending')
  }

  /**
   * Returns missed invites for the current user in the last 24 hours.
   * Used to restore missed-call banners when the user comes back online.
   */
  public static async getMyMissedInvites(): Promise<
    { meetingTitle: string; meetingUuid: string; missedAt: string }[]
  > {
    return await apiClient.get<{ meetingTitle: string; meetingUuid: string; missedAt: string }[]>(
      '/meetings/invites/missed',
    )
  }
}
