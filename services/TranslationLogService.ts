import { apiClient } from '@/utils/apiClient'
import type {
  TranslationLogModel,
  TranslationLogStats,
  CacheBreakdownItem,
} from '@/interfaces/models/TranslationLogModel'

export default class TranslationLogService {
  public static async getAll(
    parameters: Record<string, unknown> = {},
  ): Promise<{ data: TranslationLogModel[]; total: number; page: number; limit: number }> {
    const searchParameters = new URLSearchParams()

    if (parameters.page) searchParameters.set('page', String(parameters.page))
    if (parameters.limit) searchParameters.set('limit', String(parameters.limit))
    if (parameters.status) searchParameters.set('status', String(parameters.status))
    if (parameters.dateFrom) searchParameters.set('dateFrom', String(parameters.dateFrom))
    if (parameters.dateTo) searchParameters.set('dateTo', String(parameters.dateTo))

    return await apiClient.get<{
      data: TranslationLogModel[]
      total: number
      page: number
      limit: number
    }>(`translation-logs?${searchParameters.toString()}`)
  }

  public static async getStats(): Promise<TranslationLogStats> {
    return await apiClient.get<TranslationLogStats>('translation-logs/stats')
  }

  public static async getCacheBreakdown(): Promise<CacheBreakdownItem[]> {
    return await apiClient.get<CacheBreakdownItem[]>('translation-logs/cache-breakdown')
  }

  public static async purge(olderThanDays: number): Promise<{ deleted: number }> {
    return await apiClient.post<{ deleted: number }>('translation-logs/purge', {
      olderThanDays,
    })
  }
}
