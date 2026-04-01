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
  allowed_ips?: string | null
  google_calendar_id?: string | null
  work_start_time?: string | null
  work_end_time?: string | null
  country?: CountryModel
  city?: CityModel
  user_count?: number
  created_at?: string
  updated_at?: string
  deleted_at?: string
}
