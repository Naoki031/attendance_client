import { apiClient } from '@/utils/apiClient'
import type { RoleModel } from '@/interfaces/models/RoleModel'

export default class RoleService {
  public static async getAll(): Promise<RoleModel[]> {
    const response = await apiClient.get<RoleModel[]>('roles')

    return response
  }

  public static async create(data: Record<string, unknown>): Promise<RoleModel> {
    return await apiClient.post<RoleModel>('/roles', data)
  }

  public static async update(id: number, data: Record<string, unknown>): Promise<RoleModel> {
    return await apiClient.put<RoleModel>(`/roles/${id}`, data)
  }

  public static async delete(id: number): Promise<boolean> {
    return (await apiClient.delete(`/roles/${id}`)) as boolean
  }
}
