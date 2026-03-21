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
  contract_signed_date: string | null
  contract_expired_date: string | null
  contract_type: string | null
  contract_count: number | null
}
