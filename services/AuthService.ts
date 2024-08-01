import { apiClient } from '@/utils/apiClient'

export class AuthService {
  public static async login(email: string, password: string): Promise<any> {
    return await apiClient.post('/auth/login', { email, password })
  }

  public static async register(email: string, password: string): Promise<any> {
    return await apiClient.post('/auth/register', { email, password })
  }

  public static async logout(): Promise<any> {
    return await apiClient.post('/auth/logout', {})
  }

  public static async getUser(): Promise<any> {
    return await apiClient.get('/auth/user')
  }

  public static async forgotPassword(email: string): Promise<any> {
    return await apiClient.post('/auth/forgot-password', { email })
  }

  public static async resetPassword(token: string, password: string): Promise<any> {
    return await apiClient.post('/auth/reset-password', { token, password })
  }
}
