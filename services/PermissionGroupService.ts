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
   * Fetches permission groups matching the given filter criteria.
   *
   * @param parameters - The filter parameters.
   * @returns A promise that resolves to an array of matching PermissionGroupModel objects.
   */
  public static async filter(parameters: { search?: string }): Promise<PermissionGroupModel[]> {
    const searchParameters = new URLSearchParams()
    if (parameters.search) searchParameters.set('search', parameters.search)

    return apiClient.get<PermissionGroupModel[]>(`${this.resource}?${searchParameters.toString()}`)
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
    permissionGroupId: number,
    data: Record<string, unknown>,
  ): Promise<PermissionGroupModel> {
    return apiClient.put<PermissionGroupModel>(`${this.resource}/${permissionGroupId}`, data)
  }

  /**
   * Deletes a permission group by its ID.
   *
   * @param {number} permissionGroupId - The ID of the permission group to delete.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the deletion was successful.
   */
  public static async delete(permissionGroupId: number): Promise<boolean> {
    const response = await apiClient.delete<{ status: number }>(
      `${this.resource}/${permissionGroupId}`,
    )

    return response.status === 200
  }
}
