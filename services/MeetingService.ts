import { apiClient } from '@/utils/apiClient'
import type { UserModel } from '@/interfaces/models/UserModel'

export default class MeetingService {
  public static async getUsersForMeeting(uuid: string): Promise<UserModel[]> {
    return apiClient.get<UserModel[]>(`meetings/${uuid}/users`)
  }

  public static async pin(uuid: string): Promise<void> {
    await apiClient.post<undefined>(`meetings/${uuid}/pin`, {})
  }

  public static async unpin(uuid: string): Promise<void> {
    await apiClient.delete<undefined>(`meetings/${uuid}/pin`)
  }
}
