import { apiClient } from '@/utils/apiClient'
import type { SlackChannelModel } from '@/interfaces/models/SlackChannelModel'

export default class SlackChannelService {
  public static async getAll(): Promise<SlackChannelModel[]> {
    return await apiClient.get<SlackChannelModel[]>('slack-channels')
  }

  public static async getOne(id: number): Promise<SlackChannelModel> {
    return await apiClient.get<SlackChannelModel>(`slack-channels/${id}`)
  }

  public static async create(data: Record<string, unknown>): Promise<SlackChannelModel> {
    return await apiClient.post<SlackChannelModel>('/slack-channels', data)
  }

  public static async update(
    id: number,
    data: Record<string, unknown>,
  ): Promise<SlackChannelModel> {
    return await apiClient.put<SlackChannelModel>(`/slack-channels/${id}`, data)
  }

  public static async delete(id: number): Promise<boolean> {
    return (await apiClient.delete(`/slack-channels/${id}`)) as boolean
  }
}
