export interface CountryModel {
  id?: number | null
  name: string
  slug: string
  capital?: string
  latitude?: number
  longitude?: number
  timezone?: string | null
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date
}
