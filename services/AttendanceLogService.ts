import { apiClient } from '@/utils/apiClient'
import type {
  AttendanceLogModel,
  AttendanceLogEditModel,
} from '@/interfaces/models/AttendanceLogModel'

export default class AttendanceLogService {
  public static async getAll(
    from?: string,
    to?: string,
    companyId?: number | null,
  ): Promise<AttendanceLogModel[]> {
    const parameters = new URLSearchParams()
    if (from) parameters.append('from', from)
    if (to) parameters.append('to', to)
    if (companyId) parameters.append('company_id', String(companyId))
    const query = parameters.toString() ? `?${parameters.toString()}` : ''

    return await apiClient.get<AttendanceLogModel[]>(`attendance-logs${query}`)
  }

  public static async exportToSheet(
    companyId: number,
    month: string,
  ): Promise<{ rows: number; spreadsheetUrl: string }> {
    return await apiClient.post<{ rows: number; spreadsheetUrl: string }>(
      `attendance-logs/export-sheet?month=${month}&company_id=${companyId}`,
      {},
    )
  }

  public static async adminEdit(
    id: number,
    data: { clock_in?: string; clock_out?: string; reason: string },
  ): Promise<AttendanceLogModel> {
    return await apiClient.put<AttendanceLogModel>(`attendance-logs/${id}`, data)
  }

  public static async getEditHistory(id: number): Promise<AttendanceLogEditModel[]> {
    return await apiClient.get<AttendanceLogEditModel[]>(`attendance-logs/${id}/history`)
  }

  /**
   * Returns the current user's attendance logs for a given month.
   * @param month - YYYY-MM format. Defaults to current month if omitted.
   */
  public static async getMyHistory(month?: string): Promise<AttendanceLogModel[]> {
    const query = month ? `?month=${month}` : ''
    return await apiClient.get<AttendanceLogModel[]>(`attendance-logs/my${query}`)
  }
}
