import { apiClient } from '@/utils/apiClient'
import { UserModel } from '~/interfaces/models/UserModel'

export default class UserService {
  public static async getAll(): Promise<UserModel[]> {
    const response = await apiClient.get<UserModel[]>('users')

    return response
  }

  public static async create(data: Record<string, unknown>): Promise<UserModel> {
    return await apiClient.post<UserModel>('/users', data)
  }

  public static async update(id: number, data: Record<string, unknown>): Promise<UserModel> {
    return await apiClient.put<UserModel>(`/users/${id}`, data)
  }

  public static async delete(id: number): Promise<boolean> {
    return (await apiClient.delete(`/users/${id}`)) as boolean
  }
}
