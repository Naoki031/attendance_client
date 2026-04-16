import type { UserDepartmentModel } from '@/interfaces/models/UserDepartmentModel'
import type { UserWorkScheduleModel } from '@/interfaces/models/UserWorkScheduleModel'

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
  contract_expiry_reminder_days?: number
  annual_leave_hours?: number | null
  remaining_leave_hours?: number | null
  slack_id?: string
  device_user_id?: number | null
  face_descriptor?: number[] | null
  face_avatar_url?: string | null
  kyc_status?: 'pending' | 'approved' | 'rejected' | null
  kyc_rejection_reason?: string | null
  skip_attendance?: boolean
  permanent_remote?: boolean
  permanent_remote_reason?: string | null
  preferred_language?: string
  last_seen_at?: string | null
  permission_group_ids?: number[]
  user_group_permissions?: { permission_group_id: number; permission_group?: { name: string } }[]
  user_departments?: UserDepartmentModel[]
  user_work_schedules?: UserWorkScheduleModel[]
}
