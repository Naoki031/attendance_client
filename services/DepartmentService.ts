import { apiClient } from '@/utils/apiClient'
import type { DepartmentModel } from '@/interfaces/models/DepartmentModel'

export default class DepartmentService {
  public static async getAll(): Promise<DepartmentModel[]> {
    return await apiClient.get<DepartmentModel[]>('departments')
  }

  public static async getOne(id: number): Promise<DepartmentModel> {
    return await apiClient.get<DepartmentModel>(`departments/${id}`)
  }

  public static async create(data: Record<string, unknown>): Promise<DepartmentModel> {
    return await apiClient.post<DepartmentModel>('/departments', data)
  }

  public static async update(id: number, data: Record<string, unknown>): Promise<DepartmentModel> {
    return await apiClient.put<DepartmentModel>(`/departments/${id}`, data)
  }

  public static async delete(id: number): Promise<boolean> {
    return (await apiClient.delete(`/departments/${id}`)) as boolean
  }
}
