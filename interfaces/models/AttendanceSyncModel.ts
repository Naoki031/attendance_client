export interface DeviceInfo {
  connected: boolean
  ip: string
  port: number
  error: string | null
  deviceTime: string | null
  userCount: number | null
  attendanceCount: number | null
}

export interface PreviewRecord {
  deviceUserId: number
  systemUserId: number | null
  userEmail: string | null
  userName: string | null
  status: 'matched' | 'unmatched'
  date: string
  clockIn: string | null
  clockOut: string | null
  punchCount: number
  allPunches: string[]
}

export interface PreviewResult {
  deviceIp: string
  fetched: number
  matched: number
  unmatched: number
  unmappedDeviceUserIds: number[]
  records: PreviewRecord[]
}

export interface SyncResult {
  fetched: number
  saved: number
  skipped: number
  errors: number
}
