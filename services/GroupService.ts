import { apiClient } from '@/utils/apiClient'
import type { GroupModel, UserGroupModel } from '@/interfaces/models/GroupModel'

export default class GroupService {
  public static async getAll(): Promise<GroupModel[]> {
    return await apiClient.get<GroupModel[]>('groups')
  }

  public static async getOne(id: number): Promise<GroupModel> {
    return await apiClient.get<GroupModel>(`groups/${id}`)
  }

  public static async create(data: Record<string, unknown>): Promise<GroupModel> {
    return await apiClient.post<GroupModel>('/groups', data)
  }

  public static async update(id: number, data: Record<string, unknown>): Promise<GroupModel> {
    return await apiClient.put<GroupModel>(`/groups/${id}`, data)
  }

  public static async delete(id: number): Promise<boolean> {
    return (await apiClient.delete(`/groups/${id}`)) as boolean
  }

  public static async getMembers(groupId: number): Promise<UserGroupModel[]> {
    return await apiClient.get<UserGroupModel[]>(`groups/${groupId}/members`)
  }

  public static async addMember(groupId: number, userId: number): Promise<UserGroupModel> {
    return await apiClient.post<UserGroupModel>(`/groups/${groupId}/members`, { user_id: userId })
  }

  public static async removeMember(groupId: number, memberId: number): Promise<boolean> {
    return (await apiClient.delete(`/groups/${groupId}/members/${memberId}`)) as boolean
  }
}
