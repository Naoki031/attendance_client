import { apiClient } from '@/utils/apiClient'
import type { PermissionGroupModel } from '~/interfaces/models/PermissionGroupModel'

export default class PermissionGroupService {
  public static readonly resource = '/permission-groups'

  /**
   * Fetches all permission groups from the server.
   *
   * @returns {Promise<PermissionGroupModel[]>} A promise that resolves to an array of PermissionGroupModel objects.
   */
  public static async getAll(): Promise<PermissionGroupModel[]> {
    const response = await apiClient.get<PermissionGroupModel[]>(this.resource)

    return response
  }

  /**
   * Creates a new permission group.
   *
   * @param data - The data for the new permission group.
   * @returns A promise that resolves to the created PermissionGroupModel.
   */
  public static async create(data: Record<string, unknown>): Promise<PermissionGroupModel> {
    return apiClient.post<PermissionGroupModel>(this.resource, data)
  }

  /**
   * Updates a permission group with the specified ID using the provided data.
   *
   * @param id - The ID of the permission group to update.
   * @param data - An object containing the data to update the permission group with.
   * @returns A promise that resolves to the updated PermissionGroupModel.
   */
  public static async update(
    id: number,
    data: Record<string, unknown>,
  ): Promise<PermissionGroupModel> {
    return apiClient.put<PermissionGroupModel>(`${this.resource}/${id}`, data)
  }

  /**
   * Deletes a permission group by its ID.
   *
   * @param {number} id - The ID of the permission group to delete.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the deletion was successful.
   */
  public static async delete(id: number): Promise<boolean> {
    const response = await apiClient.delete<{ status: number }>(`${this.resource}/${id}`)

    return response.status === 200
  }
}
