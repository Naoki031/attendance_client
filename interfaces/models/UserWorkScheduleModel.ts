import type { UserModel } from '@/interfaces/models/UserModel'

export interface UserWorkScheduleModel {
  id: number
  user_id: number
  start_time: string
  end_time: string
  effective_from: string
  effective_to?: string | null
  note?: string | null
  user?: UserModel
  created_at?: string
  updated_at?: string
}
