import { apiClient } from '@/utils/apiClient'
import type { DeviceInfo, PreviewResult, SyncResult } from '@/interfaces/models/AttendanceSyncModel'

export default class AttendanceSyncService {
  public static async getDeviceInfo(): Promise<DeviceInfo> {
    return await apiClient.get<DeviceInfo>('attendance-sync/device-info')
  }

  public static async preview(): Promise<PreviewResult> {
    return await apiClient.get<PreviewResult>('attendance-sync/preview')
  }

  public static async trigger(): Promise<SyncResult> {
    return await apiClient.post<SyncResult>('attendance-sync/trigger', {})
  }
}
