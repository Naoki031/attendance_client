import { apiClient } from '@/utils/apiClient'
import type { UserWorkScheduleModel } from '@/interfaces/models/UserWorkScheduleModel'

export default class UserWorkScheduleService {
  public static async getByUser(userId: number): Promise<UserWorkScheduleModel[]> {
    return await apiClient.get<UserWorkScheduleModel[]>(`user-work-schedules?user_id=${userId}`)
  }

  public static async create(data: Record<string, unknown>): Promise<UserWorkScheduleModel> {
    return await apiClient.post<UserWorkScheduleModel>('user-work-schedules', data)
  }

  public static async update(
    id: number,
    data: Record<string, unknown>,
  ): Promise<UserWorkScheduleModel> {
    return await apiClient.put<UserWorkScheduleModel>(`user-work-schedules/${id}`, data)
  }

  public static async delete(id: number): Promise<boolean> {
    return (await apiClient.delete(`user-work-schedules/${id}`)) as boolean
  }
}
