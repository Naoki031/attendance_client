import { apiClient } from '@/utils/apiClient'

export default class MeetingService {
  public static async pin(uuid: string): Promise<void> {
    await apiClient.post<undefined>(`meetings/${uuid}/pin`, {})
  }

  public static async unpin(uuid: string): Promise<void> {
    await apiClient.delete<undefined>(`meetings/${uuid}/pin`)
  }
}
