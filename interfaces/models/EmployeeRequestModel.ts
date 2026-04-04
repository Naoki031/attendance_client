import type { UserModel } from '@/interfaces/models/UserModel'

export type EmployeeRequestType =
  | 'wfh'
  | 'off'
  | 'equipment'
  | 'clock_forget'
  | 'overtime'
  | 'business_trip'
export type EmployeeRequestStatus = 'pending' | 'approved' | 'rejected'
export type LeaveType =
  | 'paid_leave'
  | 'unpaid_leave'
  | 'woman_leave'
  | 'marriage_leave'
  | 'maternity_leave'
  | 'paternity_leave'
  | 'compassionate_leave'
export type ClockType = 'clock_in' | 'clock_out'
export type OvertimeType = 'weekday' | 'weekend' | 'public_holiday'

export interface EmployeeRequestModel {
  id: number
  user_id: number
  approver_id?: number
  type: EmployeeRequestType
  status: EmployeeRequestStatus

  // WFH / OFF
  from_datetime?: string
  to_datetime?: string
  reason?: string
  cc_user_ids?: number[]
  note?: string
  approver_note?: string

  // OFF-specific
  leave_type?: LeaveType
  unit_hours?: number

  // Equipment-specific
  equipment_name?: string
  location?: string
  quantity?: number

  // Clock forget-specific
  clock_type?: ClockType
  forget_date?: string

  // Overtime-specific
  overtime_type?: OvertimeType

  // Business trip-specific
  trip_destination?: string

  // Relations
  user?: UserModel
  approver?: UserModel
  created_at?: string
  updated_at?: string
}
