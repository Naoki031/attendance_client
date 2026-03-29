import { apiClient } from '@/utils/apiClient'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import type { UserModel } from '@/interfaces/models/UserModel'

export default class CompanyService {
  public static async getAll(): Promise<CompanyModel[]> {
    return apiClient.get<CompanyModel[]>('companies')
  }

  public static async filter(parameters: {
    search?: string
    countryId?: number | null
    cityId?: number | null
  }): Promise<CompanyModel[]> {
    const searchParameters = new URLSearchParams()
    if (parameters.search) searchParameters.set('search', parameters.search)
    if (parameters.countryId) searchParameters.set('country_id', String(parameters.countryId))
    if (parameters.cityId) searchParameters.set('city_id', String(parameters.cityId))

    return apiClient.get<CompanyModel[]>(`companies?${searchParameters.toString()}`)
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

  public static async getApprovers(companyId: number): Promise<UserModel[]> {
    return apiClient.get<UserModel[]>(`/companies/${companyId}/approvers`)
  }

  public static async setApprovers(companyId: number, userIds: number[]): Promise<UserModel[]> {
    return apiClient.put<UserModel[]>(`/companies/${companyId}/approvers`, { user_ids: userIds })
  }
}
