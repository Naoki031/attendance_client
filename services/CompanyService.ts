import { apiClient } from '@/utils/apiClient'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'

export default class CompanyService {
  public static async getAll(): Promise<CompanyModel[]> {
    return apiClient.get<CompanyModel[]>('companies')
  }

  public static async create(data: Record<string, unknown>): Promise<CompanyModel> {
    return apiClient.post<CompanyModel>('/companies', data)
  }

  public static async update(
    companyId: number,
    data: Record<string, unknown>,
  ): Promise<CompanyModel> {
    return apiClient.put<CompanyModel>(`/companies/${companyId}`, data)
  }

  public static async delete(companyId: number): Promise<boolean> {
    return (await apiClient.delete(`/companies/${companyId}`)) as boolean
  }
}
