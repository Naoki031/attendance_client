import { apiClient } from '@/utils/apiClient'
import type { Meeting } from '@/interfaces/models/MeetingModel'
import type { UserModel } from '@/interfaces/models/UserModel'

export default class MeetingService {
  public static async getAll(): Promise<Meeting[]> {
    return apiClient.get<Meeting[]>('/meetings')
  }

  public static async getOne(uuid: string): Promise<Meeting> {
    return apiClient.get<Meeting>(`/meetings/${uuid}`)
  }

  public static async getToken(uuid: string, password?: string): Promise<{ token: string }> {
    return apiClient.post<{ token: string }>(
      `/meetings/${uuid}/token`,
      password ? { password } : {},
    )
  }

  public static async create(payload: Record<string, unknown>): Promise<Meeting> {
    return apiClient.post<Meeting>('/meetings', payload)
  }

  public static async update(uuid: string, payload: Record<string, unknown>): Promise<Meeting> {
    return apiClient.patch<Meeting>(`/meetings/${uuid}`, payload)
  }

  public static async getChatRoom(uuid: string): Promise<{ chatRoomUuid: string }> {
    return apiClient.get<{ chatRoomUuid: string }>(`/meetings/${uuid}/chat-room`)
  }

  public static async generatePassword(uuid: string): Promise<{ plain_password: string }> {
    return apiClient.post<{ plain_password: string }>(`/meetings/${uuid}/generate-password`, {})
  }

  public static async deleteMeeting(uuid: string): Promise<void> {
    await apiClient.delete(`/meetings/${uuid}`)
  }

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
