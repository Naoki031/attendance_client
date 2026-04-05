export interface FilterFieldConfig {
  key: string
  label: string
  type: 'autocomplete' | 'select'
  items: Array<Record<string, unknown>>
  itemTitle?: string
  itemValue?: string
}

export interface DefaultFilters {
  search: string
  [key: string]: unknown
}
