import { apiClient } from '@/utils/apiClient'
import type { CountryModel } from '@/interfaces/models/CountryModel'

export default class CountryService {
  public static async getAll(): Promise<CountryModel[]> {
    const response = await apiClient.get<CountryModel[]>('countries')

    return response
  }

  public static async create(data: Record<string, unknown>): Promise<CountryModel> {
    return await apiClient.post<CountryModel>('/countries', data)
  }

  public static async update(
    countryId: number,
    data: Record<string, unknown>,
  ): Promise<CountryModel> {
    return await apiClient.put<CountryModel>(`/countries/${countryId}`, data)
  }

  public static async delete(countryId: number): Promise<boolean> {
    return (await apiClient.delete(`/countries/${countryId}`)) as boolean
  }
}
