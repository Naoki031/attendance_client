import { apiClient } from '@/utils/apiClient'

export default class AuthService {
  public static async login(email: string, password: string): Promise<{ access_token: string }> {
    return await apiClient.post('/auth/login', { email, password })
  }

  public static async logout(): Promise<any> {
    return await apiClient.post('/auth/logout', {})
  }

  public static async getUser(): Promise<any> {
    return await apiClient.get('/auth/user')
  }
}
