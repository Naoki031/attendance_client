import type { CountryModel } from '@/interfaces/models/CountryModel'
import type { CityModel } from '@/interfaces/models/CityModel'

export interface CompanyModel {
  id?: number | null
  name: string
  slug: string
  country_id?: number | null
  city_id?: number | null
  address?: string
  phone?: string
  email?: string
  website?: string
  logo?: string
  country?: CountryModel
  city?: CityModel
  created_at?: string
  updated_at?: string
  deleted_at?: string
}
