export interface PermissionGroupModel {
  id?: number | null
  name: string
  permissions: string[]
  descriptions?: string | null
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date
}