import type { UserModel } from '@/interfaces/models/UserModel'
import type { DepartmentModel } from '@/interfaces/models/DepartmentModel'
import type { CompanyModel } from '@/interfaces/models/CompanyModel'

export interface UserDepartmentModel {
  id: number
  user_id: number
  company_id: number
  department_id: number
  user?: UserModel
  company?: CompanyModel
  department?: DepartmentModel
  created_at?: string
  updated_at?: string
}
