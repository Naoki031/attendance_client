import { apiClient } from '@/utils/apiClient'
import type { BugReportModel } from '@/interfaces/models/BugReportModel'

export default class BugReportService {
  public static async create(data: {
    title: string
    description?: string
    screenshot?: string
  }): Promise<BugReportModel> {
    return await apiClient.post<BugReportModel>('bug-reports', data)
  }

  public static async getMine(): Promise<BugReportModel[]> {
    return await apiClient.get<BugReportModel[]>('bug-reports/mine')
  }

  public static async getAll(): Promise<BugReportModel[]> {
    return await apiClient.get<BugReportModel[]>('bug-reports')
  }

  public static async getOne(id: number): Promise<BugReportModel> {
    return await apiClient.get<BugReportModel>(`bug-reports/${id}`)
  }

  public static async update(
    id: number,
    data: { status?: string; admin_note?: string },
  ): Promise<BugReportModel> {
    return await apiClient.put<BugReportModel>(`bug-reports/${id}`, data)
  }
}
