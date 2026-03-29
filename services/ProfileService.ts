import { apiClient } from '@/utils/apiClient'
import type { UserModel } from '@/interfaces/models/UserModel'

export default class ProfileService {
  public static async updateProfile(data: Record<string, unknown>): Promise<UserModel> {
    return await apiClient.put<UserModel>('/auth/profile', data)
  }

  public static async changePassword(data: Record<string, unknown>): Promise<void> {
    await apiClient.put('/auth/change-password', data)
  }

  public static async updateAvatar(data: { avatar: string }): Promise<UserModel> {
    return await apiClient.put<UserModel>('/auth/avatar', data)
  }
}
