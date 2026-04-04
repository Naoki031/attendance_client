import type { CompanyModel } from '@/interfaces/models/CompanyModel'
import type { UserModel } from '@/interfaces/models/UserModel'

export type SlackChannelFeature =
  | 'wfh'
  | 'off'
  | 'equipment'
  | 'clock_forget'
  | 'overtime'
  | 'business_trip'
  | 'error'

export interface SlackChannelModel {
  id: number
  company_id?: number
  name: string
  webhook_url?: never
  channel_id?: string
  feature: SlackChannelFeature
  mention_user_ids?: number[]
  mention_users?: UserModel[]
  mention_slack_group_handles?: string[]
  message_template?: string
  include_approval_link?: boolean
  include_my_requests_link?: boolean
  company?: CompanyModel
  created_at?: string
  updated_at?: string
}
