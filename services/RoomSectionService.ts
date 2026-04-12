import { apiClient } from '@/utils/apiClient'
import type { RoomSectionModel } from '@/interfaces/models/RoomSectionModel'

export default class RoomSectionService {
  public static async getAll(): Promise<RoomSectionModel[]> {
    return apiClient.get<RoomSectionModel[]>('room-sections')
  }

  public static async create(data: { name: string; position?: number }): Promise<RoomSectionModel> {
    return apiClient.post<RoomSectionModel>('room-sections', data)
  }

  public static async update(
    id: number,
    data: { name?: string; position?: number },
  ): Promise<RoomSectionModel> {
    return apiClient.put<RoomSectionModel>(`room-sections/${id}`, data)
  }

  public static async delete(id: number): Promise<void> {
    await apiClient.delete(`room-sections/${id}`)
  }

  public static async addItem(
    sectionId: number,
    resourceType: 'meeting' | 'chat_room',
    resourceId: number,
  ): Promise<RoomSectionModel> {
    return apiClient.post<RoomSectionModel>(`room-sections/${sectionId}/items`, {
      resource_type: resourceType,
      resource_id: resourceId,
    })
  }

  public static async removeItem(
    sectionId: number,
    resourceType: 'meeting' | 'chat_room',
    resourceId: number,
  ): Promise<void> {
    await apiClient.delete(`room-sections/${sectionId}/items`, {
      resource_type: resourceType,
      resource_id: String(resourceId),
    })
  }
}
