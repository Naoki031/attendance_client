import type { CompanyModel } from '@/interfaces/models/CompanyModel'

export interface ColumnConfigItem {
  column: string
  field: string
  header: string
}

export interface SampleRowModel {
  headers: string[]
  sample: (string | number)[]
}

export interface CompanyGoogleSheetModel {
  id: number
  company_id: number
  request_type: string
  spreadsheet_id: string
  sheet_name: string
  column_config?: ColumnConfigItem[] | null
  is_active: boolean
  company?: CompanyModel
  created_at?: string
  updated_at?: string
}
