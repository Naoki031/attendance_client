import { apiClient } from '@/utils/apiClient'
import type { EmployeeRequestModel } from '@/interfaces/models/EmployeeRequestModel'

export default class EmployeeRequestService {
  public static async getAll(filters?: {
    status?: string
    type?: string
    month?: number
    year?: number
    search?: string
  }): Promise<EmployeeRequestModel[]> {
    const parameters = new URLSearchParams()
    if (filters?.status) parameters.set('status', filters.status)
    if (filters?.type) parameters.set('type', filters.type)
    if (filters?.month) parameters.set('month', String(filters.month))
    if (filters?.year) parameters.set('year', String(filters.year))
    if (filters?.search) parameters.set('search', filters.search)
    const query = parameters.size ? `?${parameters.toString()}` : ''
    return await apiClient.get<EmployeeRequestModel[]>(`employee-requests${query}`)
  }

  public static async getAllApproved(): Promise<EmployeeRequestModel[]> {
    return await apiClient.get<EmployeeRequestModel[]>('employee-requests/approved')
  }

  public static async getAllForCalendar(): Promise<EmployeeRequestModel[]> {
    return await apiClient.get<EmployeeRequestModel[]>('employee-requests/calendar')
  }

  public static async getMine(status?: string): Promise<EmployeeRequestModel[]> {
    const query = status ? `?status=${status}` : ''
    return await apiClient.get<EmployeeRequestModel[]>(`employee-requests/my${query}`)
  }

  public static async getOne(id: number): Promise<EmployeeRequestModel> {
    return await apiClient.get<EmployeeRequestModel>(`employee-requests/${id}`)
  }

  public static async create(data: Record<string, unknown>): Promise<EmployeeRequestModel> {
    return await apiClient.post<EmployeeRequestModel>('/employee-requests', data)
  }

  public static async update(
    id: number,
    data: Record<string, unknown>,
  ): Promise<EmployeeRequestModel> {
    return await apiClient.patch<EmployeeRequestModel>(`/employee-requests/${id}`, data)
  }

  public static async approve(
    id: number,
    data: { status: 'approved' | 'rejected'; note?: string },
  ): Promise<EmployeeRequestModel> {
    return await apiClient.put<EmployeeRequestModel>(`/employee-requests/${id}/approve`, data)
  }

  public static async getPendingCount(): Promise<number> {
    const result = await apiClient.get<{ count: number }>('employee-requests/pending-count')
    return result.count
  }

  public static async canApprove(): Promise<boolean> {
    const result = await apiClient.get<{ canApprove: boolean }>('employee-requests/can-approve')
    return result.canApprove
  }
}
