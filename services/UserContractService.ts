import { apiClient } from '@/utils/apiClient'
import type { UserContractModel } from '@/interfaces/models/UserContractModel'

export default class UserContractService {
  public static async getByUser(userId: number): Promise<UserContractModel[]> {
    return await apiClient.get<UserContractModel[]>(`user-contracts/user/${userId}`)
  }

  public static async create(data: {
    user_id: number
    contract_type: string
    signed_date: string
    expired_date?: string | null
    notes?: string | null
  }): Promise<UserContractModel> {
    return await apiClient.post<UserContractModel>('user-contracts', data)
  }

  public static async update(
    id: number,
    data: {
      contract_type?: string
      signed_date?: string
      expired_date?: string | null
      notes?: string | null
    },
  ): Promise<UserContractModel> {
    return await apiClient.put<UserContractModel>(`user-contracts/${id}`, data)
  }

  public static async delete(id: number): Promise<void> {
    await apiClient.delete(`user-contracts/${id}`)
  }
}
