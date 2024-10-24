export interface CountryModel {
  id?: number | null
  name: string
  slug: string
  capital?: string
  latitude?: number
  longitude?: number
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date
}
