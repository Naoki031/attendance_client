import { apiClient } from '@/utils/apiClient'
import type { CityModel } from '@/interfaces/models/CityModel'

export default class CityService {
  public static async getAll(): Promise<CityModel[]> {
    return apiClient.get<CityModel[]>('cities')
  }

  public static async create(data: Record<string, unknown>): Promise<CityModel> {
    return apiClient.post<CityModel>('/cities', data)
  }

  public static async update(cityId: number, data: Record<string, unknown>): Promise<CityModel> {
    return apiClient.put<CityModel>(`/cities/${cityId}`, data)
  }

  public static async delete(cityId: number): Promise<boolean> {
    return (await apiClient.delete(`/cities/${cityId}`)) as boolean
  }
}
