import { apiClient } from '@/utils/apiClient'
import type {
  NotificationModel,
  NotificationListResult,
} from '@/interfaces/models/NotificationModel'

export default class NotificationService {
  public static async getAll(): Promise<NotificationListResult> {
    return await apiClient.get<NotificationListResult>('notifications')
  }

  public static async markAsRead(id: number): Promise<void> {
    await apiClient.patch(`notifications/${id}/read`, {})
  }

  public static async markAllAsRead(): Promise<void> {
    await apiClient.post('notifications/read-all', {})
  }
}

export type { NotificationModel, NotificationListResult }
