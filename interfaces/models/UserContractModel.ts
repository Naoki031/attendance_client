export interface UserContractModel {
  id: number
  user_id: number
  contract_number: number
  contract_type: string
  signed_date: string
  expired_date?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}
