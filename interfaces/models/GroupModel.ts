import type { UserModel } from './UserModel'
import type { CompanyModel } from './CompanyModel'

export interface GroupModel {
  id: number
  name: string
  slug: string
  descriptions?: string
  slack_channel_id?: string
  slack_user_group_id?: string
  company_id?: number
  company?: CompanyModel
  member_count?: number
  created_at?: string
  updated_at?: string
}

export interface UserGroupModel {
  id: number
  user_id: number
  group_id: number
  user?: UserModel
  created_at?: string
}
