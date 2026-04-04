import { apiClient } from '@/utils/apiClient'
import type { PinnedMessageModel } from '@/interfaces/models/PinnedMessageModel'

export default class PinnedMessageService {
  public static async getByRoom(roomUuid: string): Promise<PinnedMessageModel[]> {
    return await apiClient.get<PinnedMessageModel[]>(`chat-rooms/${roomUuid}/pinned-messages`)
  }
}
