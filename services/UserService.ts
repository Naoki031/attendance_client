import { apiClient } from '@/utils/apiClient'
import type { UserModel } from '~/interfaces/models/UserModel'
import type { UserFormType } from '@/types/index'

function toPayload(form: UserFormType): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, confirm_password, ...payload } = form

  // Remove null/undefined optional fields to keep payload clean
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([, fieldValue]) => fieldValue !== null && fieldValue !== undefined && fieldValue !== '',
    ),
  )
}

export default class UserService {
  public static async getAll(): Promise<UserModel[]> {
    return apiClient.get<UserModel[]>('users')
  }

  public static async create(form: UserFormType): Promise<UserModel> {
    return apiClient.post<UserModel>('/users', toPayload(form))
  }

  public static async update(userId: number, form: UserFormType): Promise<UserModel> {
    const payload = toPayload(form)

    // Exclude password fields if both are empty (no change intended)
    if (!payload.password) {
      delete payload.password
    }

    return apiClient.put<UserModel>(`/users/${userId}`, payload)
  }

  public static async delete(userId: number): Promise<boolean> {
    return (await apiClient.delete(`/users/${userId}`)) as boolean
  }
}
