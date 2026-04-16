export type UserFormType = {
  id: number | null
  first_name: string | null
  last_name: string | null
  position: string | null
  phone_number: string | null
  email: string | null
  address: string | null
  password: string | null
  confirm_password: string | null
  is_active: boolean | null
  permission_group_ids: number[] | null
  date_of_birth: string | null
  join_date: string | null
  annual_leave_hours: number | null
  remaining_leave_hours: number | null
  slack_id: string | null
  device_user_id: number | null
  skip_attendance: boolean
  permanent_remote: boolean
  permanent_remote_reason: string | null
}
