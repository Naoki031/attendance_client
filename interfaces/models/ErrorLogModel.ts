export interface ErrorLogModel {
  id: number
  level: 'error' | 'warn' | 'fatal'
  message: string
  stack_trace?: string
  status_code?: number
  path?: string
  method?: string
  request_body?: string
  request_query?: string
  request_headers?: string
  user_id?: number
  user_email?: string
  user_name?: string
  ip_address?: string
  user_agent?: string
  is_resolved: boolean
  resolved_by?: number
  resolved_at?: string
  created_at?: string
}

export interface ErrorLogStats {
  total: number
  unresolved: number
  resolved: number
  errorCount: number
  warnCount: number
  fatalCount: number
}
