import { apiClient } from '@/utils/apiClient'
import type { ErrorLogModel, ErrorLogStats } from '@/interfaces/models/ErrorLogModel'

export default class ErrorLogService {
  public static async getAll(
    parameters: Record<string, unknown> = {},
  ): Promise<{ data: ErrorLogModel[]; total: number; page: number; limit: number }> {
    const searchParameters = new URLSearchParams()

    if (parameters.page) searchParameters.set('page', String(parameters.page))
    if (parameters.limit) searchParameters.set('limit', String(parameters.limit))
    if (parameters.level) searchParameters.set('level', String(parameters.level))
    if (parameters.is_resolved !== undefined && parameters.is_resolved !== null)
      searchParameters.set('is_resolved', String(parameters.is_resolved))
    if (parameters.search) searchParameters.set('search', String(parameters.search))
    if (parameters.date_from) searchParameters.set('date_from', String(parameters.date_from))
    if (parameters.date_to) searchParameters.set('date_to', String(parameters.date_to))
    if (parameters.status_code) searchParameters.set('status_code', String(parameters.status_code))

    return await apiClient.get<{
      data: ErrorLogModel[]
      total: number
      page: number
      limit: number
    }>(`error-logs?${searchParameters.toString()}`)
  }

  public static async getOne(id: number): Promise<ErrorLogModel> {
    return await apiClient.get<ErrorLogModel>(`error-logs/${id}`)
  }

  public static async getStats(): Promise<ErrorLogStats> {
    return await apiClient.get<ErrorLogStats>('error-logs/stats')
  }

  public static async resolve(id: number): Promise<ErrorLogModel> {
    return await apiClient.put<ErrorLogModel>(`error-logs/${id}/resolve`, {})
  }

  public static async resolveBatch(ids: number[]): Promise<{ affected: number }> {
    return await apiClient.put<{ affected: number }>('error-logs/resolve-batch', {
      ids,
    })
  }

  public static async purge(olderThanDays: number): Promise<{ deleted: number }> {
    return await apiClient.post<{ deleted: number }>('error-logs/purge', {
      olderThanDays,
    })
  }
}
