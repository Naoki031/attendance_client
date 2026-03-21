import type { UserDepartmentModel } from '@/interfaces/models/UserDepartmentModel'

export interface UserModel {
  id: number
  username: string
  first_name: string
  last_name: string
  full_name: string
  position?: string
  phone_number?: string
  email: string
  address?: string
  is_active?: boolean
  is_activated?: boolean
  roles?: string[]
  highest_role?: 'super_admin' | 'admin' | 'user'
  avatar?: string
  date_of_birth?: string
  join_date?: string
  contract_signed_date?: string
  contract_expired_date?: string
  contract_type?: string
  contract_count?: number
  user_group_permissions?: { permission_group_id: number; permission_group?: { name: string } }[]
  user_departments?: UserDepartmentModel[]
}
