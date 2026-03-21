import { apiClient } from '@/utils/apiClient'
import type { PermissionModel } from '@/interfaces/models/PermissionModel'

export default class PermissionService {
  public static readonly resource = '/permissions'

  /**
   * Fetches all permissions from the server.
   *
   * @returns {Promise<PermissionModel[]>} A promise that resolves to an array of PermissionModel objects.
   */
  public static async getAll(): Promise<PermissionModel[]> {
    const response = await apiClient.get<PermissionModel[]>(this.resource)

    return response
  }

  /**
   * Creates a new permission record.
   *
   * @param data - The data for the new permission record.
   * @returns A promise that resolves to the created PermissionModel.
   */
  public static async create(data: Record<string, unknown>): Promise<PermissionModel> {
    return await apiClient.post<PermissionModel>(this.resource, data)
  }

  /**
   * Updates a permission record with the specified ID using the provided data.
   *
   * @param id - The ID of the permission record to update.
   * @param data - An object containing the fields to update in the permission record.
   * @returns A promise that resolves to the updated PermissionModel.
   */
  public static async update(
    permissionId: number,
    data: Record<string, unknown>,
  ): Promise<PermissionModel> {
    return await apiClient.put<PermissionModel>(`${this.resource}/${permissionId}`, data)
  }

  /**
   * Deletes a resource by its ID.
   *
   * @param {number} permissionId - The ID of the resource to delete.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the deletion was successful.
   */
  public static async delete(permissionId: number): Promise<boolean> {
    return (await apiClient.delete(`${this.resource}/${permissionId}`)) as boolean
  }
}
