import { apiClient } from '@/utils/apiClient'
import type { CountryModel } from '@/interfaces/models/CountryModel'

export default class CountryService {
  public static async getAll(): Promise<any> {
    const response = await apiClient.get('countries')
    return response
  }

  // public static async getOne(id: number): Promise<CountryModel> {
  //   return (await apiClient.get(`/countries/${id}`)) as CountryModel
  // }

  public static async create(data: object): Promise<any> {
    return (await apiClient.post('/countries', data))
  }

  // public static async update(id: number, data: object): Promise<CountryModel> {
  //   return (await apiClient.put(`/countries/${id}`, data)) as CountryModel
  // }

  // public static async delete(id: number): Promise<boolean> {
  //   return (await apiClient.delete(`/countries/${id}`)) as boolean
  // }
}
