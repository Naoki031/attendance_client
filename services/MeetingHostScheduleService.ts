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

  public static async resolve(
    meetingUuid: string,
    date?: string,
  ): Promise<{ host_user_id: number; date: string }> {
    const parameters: Record<string, string> = {}
    if (date) parameters.date = date
    return apiClient.get<{ host_user_id: number; date: string }>(
      `meetings/${meetingUuid}/host-schedules/resolve`,
      parameters,
    )
  }
}
