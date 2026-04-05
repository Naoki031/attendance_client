export interface UserFilters {
  id: string
  name: string
  position: string
  email: string
  companyId: number | null
  departmentId: number | null
  role: string
  status: '' | 'active' | 'inactive'
  contractType: string
}
