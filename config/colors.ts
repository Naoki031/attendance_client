/**
 * Central color configuration for the Attendance app.
 *
 * All color tokens are defined in `plugins/vuetify.ts` (single source of truth).
 * This file exposes the JS-side mappings used in Vue templates (<v-chip :color>, etc.)
 * so you never duplicate the same Record across multiple pages.
 *
 * To change a color: update `plugins/vuetify.ts`, not this file.
 * To add a new request type: add the token in vuetify.ts + add a key here.
 */

import type {
  EmployeeRequestType,
  EmployeeRequestStatus,
} from '@/interfaces/models/EmployeeRequestModel'
import type { SlackChannelFeature } from '@/interfaces/models/SlackChannelModel'

// ─── Request type → Vuetify color token ──────────────────────────────────────
// Token names match the keys defined in plugins/vuetify.ts `colors` section.
export const REQUEST_TYPE_COLOR: Record<EmployeeRequestType, string> = {
  wfh: 'request-wfh',
  off: 'request-off',
  overtime: 'request-overtime',
  equipment: 'request-equipment',
  clock_forget: 'request-clock-forget',
  business_trip: 'request-business-trip',
}

// ─── Request type → MDI icon ──────────────────────────────────────────────────
export const REQUEST_TYPE_ICON: Record<EmployeeRequestType, string> = {
  wfh: 'mdi-home-outline',
  off: 'mdi-umbrella-beach-outline',
  overtime: 'mdi-fire',
  equipment: 'mdi-laptop',
  clock_forget: 'mdi-clock-alert-outline',
  business_trip: 'mdi-briefcase-outline',
}

// ─── Approval status → Vuetify color token ───────────────────────────────────
export const REQUEST_STATUS_COLOR: Record<EmployeeRequestStatus, string> = {
  approved: 'success',
  rejected: 'error',
  pending: 'warning',
}

// ─── Approval status → MDI icon ──────────────────────────────────────────────
export const REQUEST_STATUS_ICON: Record<EmployeeRequestStatus, string> = {
  approved: 'mdi-check-circle-outline',
  rejected: 'mdi-close-circle-outline',
  pending: 'mdi-clock-outline',
}

// ─── Slack channel feature → Vuetify color token ─────────────────────────────
// "error" feature uses the semantic error color, not a request-type token.
export const SLACK_FEATURE_COLOR: Record<SlackChannelFeature, string> = {
  wfh: 'request-wfh',
  off: 'request-off',
  overtime: 'request-overtime',
  equipment: 'request-equipment',
  clock_forget: 'request-clock-forget',
  business_trip: 'request-business-trip',
  error: 'error',
}
