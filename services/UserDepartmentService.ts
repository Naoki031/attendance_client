import { apiClient } from '@/utils/apiClient'
import type { UserDepartmentModel } from '@/interfaces/models/UserDepartmentModel'

export default class UserDepartmentService {
  public static async getAll(): Promise<UserDepartmentModel[]> {
    return await apiClient.get<UserDepartmentModel[]>('user-departments')
  }

  public static async getByDepartment(departmentId: number): Promise<UserDepartmentModel[]> {
    return await apiClient.get<UserDepartmentModel[]>(`user-departments/department/${departmentId}`)
  }

  public static async create(data: Record<string, unknown>): Promise<UserDepartmentModel> {
    return await apiClient.post<UserDepartmentModel>('/user-departments', data)
  }

  public static async delete(id: number): Promise<boolean> {
    return (await apiClient.delete(`/user-departments/${id}`)) as boolean
  }
}
