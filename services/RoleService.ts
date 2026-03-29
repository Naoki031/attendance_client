import { apiClient } from '@/utils/apiClient'
import type { RoleModel } from '@/interfaces/models/RoleModel'

export default class RoleService {
  public static async getAll(): Promise<RoleModel[]> {
    const response = await apiClient.get<RoleModel[]>('roles')

    return response
  }

  public static async filter(parameters: { search?: string }): Promise<RoleModel[]> {
    const searchParameters = new URLSearchParams()
    if (parameters.search) searchParameters.set('search', parameters.search)

    return apiClient.get<RoleModel[]>(`roles?${searchParameters.toString()}`)
  }

  public static async create(data: Record<string, unknown>): Promise<RoleModel> {
    return await apiClient.post<RoleModel>('/roles', data)
  }

  public static async update(roleId: number, data: Record<string, unknown>): Promise<RoleModel> {
    return await apiClient.put<RoleModel>(`/roles/${roleId}`, data)
  }

  public static async delete(roleId: number): Promise<boolean> {
    return (await apiClient.delete(`/roles/${roleId}`)) as boolean
  }
}
