import { apiClient } from '@/utils/apiClient'
import type { UserModel } from '@/interfaces/models/UserModel'

export default class AuthService {
  public static async login(email: string, password: string): Promise<{ access_token: string }> {
    return await apiClient.post('/auth/login', { email, password })
  }

  public static async logout(): Promise<void> {
    await apiClient.post('/auth/logout', {})
  }

  public static async getUser(): Promise<UserModel> {
    return await apiClient.get<UserModel>('/auth/user')
  }

  public static async updateProfile(data: Record<string, unknown>): Promise<UserModel> {
    return await apiClient.put('/auth/profile', data)
  }
}
