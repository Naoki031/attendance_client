import { apiClient } from '@/utils/apiClient'
import type {
  CompanyGoogleSheetModel,
  SampleRowModel,
} from '@/interfaces/models/CompanyGoogleSheetModel'

export default class CompanyGoogleSheetService {
  public static async getAll(): Promise<CompanyGoogleSheetModel[]> {
    return await apiClient.get<CompanyGoogleSheetModel[]>('company-google-sheets')
  }

  public static async getOne(id: number): Promise<CompanyGoogleSheetModel> {
    return await apiClient.get<CompanyGoogleSheetModel>(`company-google-sheets/${id}`)
  }

  public static async create(data: Record<string, unknown>): Promise<CompanyGoogleSheetModel> {
    return await apiClient.post<CompanyGoogleSheetModel>('/company-google-sheets', data)
  }

  public static async update(
    id: number,
    data: Record<string, unknown>,
  ): Promise<CompanyGoogleSheetModel> {
    return await apiClient.put<CompanyGoogleSheetModel>(`/company-google-sheets/${id}`, data)
  }

  public static async delete(id: number): Promise<boolean> {
    return (await apiClient.delete(`/company-google-sheets/${id}`)) as boolean
  }

  public static async getSampleRow(id: number): Promise<SampleRowModel> {
    return await apiClient.get<SampleRowModel>(`company-google-sheets/${id}/sample-row`)
  }
}
