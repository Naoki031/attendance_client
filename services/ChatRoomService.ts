import { apiClient } from '@/utils/apiClient'
import type { ChatRoomModel, ChatRoomMemberModel } from '@/interfaces/models/ChatRoomModel'
import type { UnreadMessageModel } from '@/interfaces/models/UnreadMessageModel'

export default class ChatRoomService {
  public static async create(data: {
    name?: string
    description?: string
    type?: string
    visibility?: string
    targetUserId?: number
    memberUserIds?: number[]
    groupIds?: number[]
  }): Promise<ChatRoomModel> {
    return await apiClient.post<ChatRoomModel>(
      'chat-rooms',
      data as unknown as Record<string, unknown>,
    )
  }

  public static async getMyRooms(): Promise<ChatRoomModel[]> {
    return await apiClient.get<ChatRoomModel[]>('chat-rooms')
  }

  public static async getPublicRooms(): Promise<ChatRoomModel[]> {
    return await apiClient.get<ChatRoomModel[]>('chat-rooms/public')
  }

  public static async getOne(uuid: string): Promise<ChatRoomModel> {
    return await apiClient.get<ChatRoomModel>(`chat-rooms/${uuid}`)
  }

  public static async update(
    uuid: string,
    data: { name?: string; description?: string },
  ): Promise<ChatRoomModel> {
    return await apiClient.put<ChatRoomModel>(
      `chat-rooms/${uuid}`,
      data as unknown as Record<string, unknown>,
    )
  }

  public static async delete(uuid: string): Promise<void> {
    await apiClient.delete(`chat-rooms/${uuid}`)
  }

  public static async join(uuid: string): Promise<ChatRoomMemberModel> {
    return await apiClient.post<ChatRoomMemberModel>(`chat-rooms/${uuid}/join`, {})
  }

  public static async leave(uuid: string): Promise<void> {
    await apiClient.post(`chat-rooms/${uuid}/leave`, {})
  }

  public static async getMembers(uuid: string): Promise<ChatRoomMemberModel[]> {
    return await apiClient.get<ChatRoomMemberModel[]>(`chat-rooms/${uuid}/members`)
  }

  public static async inviteUser(uuid: string, userId: number): Promise<ChatRoomMemberModel> {
    return await apiClient.post<ChatRoomMemberModel>(`chat-rooms/${uuid}/invite`, {
      user_id: userId,
    })
  }

  public static async inviteUsers(
    uuid: string,
    data: { user_ids?: number[]; groupIds?: number[] },
  ): Promise<ChatRoomMemberModel[]> {
    return await apiClient.post<ChatRoomMemberModel[]>(
      `chat-rooms/${uuid}/invite-batch`,
      data as unknown as Record<string, unknown>,
    )
  }

  public static async removeMember(
    uuid: string,
    userId: number,
  ): Promise<{ roomDeleted: boolean }> {
    return await apiClient.delete<{ roomDeleted: boolean }>(`chat-rooms/${uuid}/members/${userId}`)
  }

  public static async getUnreadCounts(): Promise<Record<string, number>> {
    return await apiClient.get<Record<string, number>>('chat-rooms/unread-counts')
  }

  public static async markAsRead(uuid: string): Promise<void> {
    await apiClient.post(`chat-rooms/${uuid}/mark-read`, {})
  }

  public static async getLastReadAt(uuid: string): Promise<string | null> {
    const result = await apiClient.get<{ last_read_at: string | null }>(
      `chat-rooms/${uuid}/last-read-at`,
    )

    return result.last_read_at
  }

  public static async getUnreadMessages(): Promise<UnreadMessageModel[]> {
    return await apiClient.get<UnreadMessageModel[]>('chat-rooms/unread-messages')
  }

  public static async getReadMessages(): Promise<UnreadMessageModel[]> {
    return await apiClient.get<UnreadMessageModel[]>('chat-rooms/read-messages')
  }

  public static async retranslateRoom(uuid: string): Promise<{ retranslated: number }> {
    return await apiClient.post<{ retranslated: number }>(`messages/retranslate-room/${uuid}`, {})
  }
}
