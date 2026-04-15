export interface EmailTemplateModel {
  id: number
  key: string
  subject: string
  body_html: string
  description?: string
  variables?: string[]
  is_system: boolean
  company_id?: number | null
  company?: { id: number; name: string } | null
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}
