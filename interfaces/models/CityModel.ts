import type { CountryModel } from '@/interfaces/models/CountryModel'

export interface CityModel {
  id?: number | null
  country_id: number
  name: string
  slug: string
  is_capital?: boolean
  latitude?: number
  longitude?: number
  country?: CountryModel
  created_at?: string
  updated_at?: string
  deleted_at?: string
}
