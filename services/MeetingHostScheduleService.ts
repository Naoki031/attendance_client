import { apiClient } from '@/utils/apiClient'
import type {
  MeetingHostSchedule,
  CreateHostSchedulePayload,
  UpdateHostSchedulePayload,
} from '@/interfaces/models/MeetingHostScheduleModel'

export default class MeetingHostScheduleService {
  public static async findAll(meetingUuid: string): Promise<MeetingHostSchedule[]> {
    return apiClient.get<MeetingHostSchedule[]>(`meetings/${meetingUuid}/host-schedules`)
  }

  public static async create(
    meetingUuid: string,
    payload: CreateHostSchedulePayload,
  ): Promise<MeetingHostSchedule> {
    return apiClient.post<MeetingHostSchedule>(
      `meetings/${meetingUuid}/host-schedules`,
      payload as unknown as Record<string, unknown>,
    )
  }

  public static async update(
    meetingUuid: string,
    scheduleId: number,
    payload: UpdateHostSchedulePayload,
  ): Promise<MeetingHostSchedule> {
    return apiClient.patch<MeetingHostSchedule>(
      `meetings/${meetingUuid}/host-schedules/${scheduleId}`,
      payload as unknown as Record<string, unknown>,
    )
  }

  public static async remove(meetingUuid: string, scheduleId: number): Promise<void> {
    await apiClient.delete<undefined>(`meetings/${meetingUuid}/host-schedules/${scheduleId}`)
  }

  public static async excludeDate(
    meetingUuid: string,
    scheduleId: number,
    date: string,
  ): Promise<void> {
    await apiClient.patch<undefined>(
      `meetings/${meetingUuid}/host-schedules/${scheduleId}/exclude-date`,
      { date } as unknown as Record<string, unknown>,
    )
  }

  public static async truncateFromDate(
    meetingUuid: string,
    scheduleId: number,
    date: string,
  ): Promise<void> {
    await apiClient.patch<undefined>(
      `meetings/${meetingUuid}/host-schedules/${scheduleId}/truncate`,
      { date } as unknown as Record<string, unknown>,
    )
  }

  public static async swapDates(meetingUuid: string, dateA: string, dateB: string): Promise<void> {
    await apiClient.post<undefined>(`meetings/${meetingUuid}/host-schedules/swap-dates`, {
      date_a: dateA,
      date_b: dateB,
    } as unknown as Record<string, unknown>)
  }

  public static async resolve(
    meetingUuid: string,
    date?: string,
  ): Promise<{ host_user_id: number | null; date: string }> {
    const parameters: Record<string, string> = {}
    if (date) parameters.date = date
    return apiClient.get<{ host_user_id: number | null; date: string }>(
      `meetings/${meetingUuid}/host-schedules/resolve`,
      parameters,
    )
  }
}
