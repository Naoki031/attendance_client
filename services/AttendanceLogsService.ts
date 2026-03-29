import { apiClient } from '@/utils/apiClient'
import type {
  AttendanceLogModel,
  TodayStatusModel,
  TodayQrModel,
  ClockQrResultModel,
} from '@/interfaces/models/AttendanceLogModel'

export default class AttendanceLogsService {
  public static async getTodayStatus(): Promise<TodayStatusModel> {
    return await apiClient.get<TodayStatusModel>('attendance-logs/today-status')
  }

  public static async clockIn(): Promise<AttendanceLogModel> {
    return await apiClient.post<AttendanceLogModel>('attendance-logs/clock-in', {})
  }

  public static async clockOut(): Promise<AttendanceLogModel> {
    return await apiClient.post<AttendanceLogModel>('attendance-logs/clock-out', {})
  }

  public static async getTodayQr(): Promise<TodayQrModel> {
    return await apiClient.get<TodayQrModel>('attendance-logs/today-qr')
  }

  public static async clockByQr(
    token: string,
    companyId: number,
    date: string,
  ): Promise<ClockQrResultModel> {
    return await apiClient.post<ClockQrResultModel>('attendance-logs/clock-qr', {
      token,
      companyId,
      date,
    })
  }

  public static async getAll(from: string, to: string): Promise<AttendanceLogModel[]> {
    return await apiClient.get<AttendanceLogModel[]>(`attendance-logs?from=${from}&to=${to}`)
  }
}
