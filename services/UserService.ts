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

  public static async getOne(userId: number): Promise<UserModel> {
    return apiClient.get<UserModel>(`users/${userId}`)
  }

  public static async search(query: string): Promise<UserModel[]> {
    return apiClient.get<UserModel[]>(`users?search=${encodeURIComponent(query)}`)
  }

  public static async filter(parameters: {
    id?: string
    name?: string
    position?: string
    email?: string
    departmentId?: number | null
    companyId?: number | null
    companyIds?: number[]
    role?: string
    status?: string
    contractType?: string
    kycStatus?: string
  }): Promise<UserModel[]> {
    const searchParameters = new URLSearchParams()
    if (parameters.id) searchParameters.set('id', parameters.id)
    if (parameters.name) searchParameters.set('name', parameters.name)
    if (parameters.position) searchParameters.set('position', parameters.position)
    if (parameters.email) searchParameters.set('email', parameters.email)
    if (parameters.departmentId)
      searchParameters.set('department_id', String(parameters.departmentId))
    if (parameters.companyId) searchParameters.set('company_id', String(parameters.companyId))
    if (parameters.companyIds?.length)
      searchParameters.set('company_ids', parameters.companyIds.join(','))
    if (parameters.role) searchParameters.set('role', parameters.role)
    if (parameters.status) searchParameters.set('status', parameters.status)
    if (parameters.contractType) searchParameters.set('contract_type', parameters.contractType)
    if (parameters.kycStatus) searchParameters.set('kyc_status', parameters.kycStatus)

    return apiClient.get<UserModel[]>(`users?${searchParameters.toString()}`)
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
