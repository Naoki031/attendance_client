export interface TranslationLogModel {
  id?: number
  messageId?: number
  sourceLang: string
  targetLangs: string[]
  inputLength: number
  status: 'success' | 'error' | 'partial'
  errorMessage?: string
  inputTokens?: number
  outputTokens?: number
  cacheCreationTokens?: number
  cacheReadTokens?: number
  modelUsed?: string
  durationMs?: number
  mode?: 'sync' | 'stream'
  createdAt?: string
}

export interface TranslationLogStats {
  totalRequests: number
  successCount: number
  errorCount: number
  cacheHitRate: number
  tokensSavedRate: number
  avgDurationMs: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheCreationTokens: number
  totalCacheReadTokens: number
}

export interface CacheBreakdownItem {
  sourceLang: string
  targetLang: string
  totalRequests: number
  cacheHits: number
  cacheHitRate: number
  avgDurationMs: number
  totalInputTokens: number
  totalCacheReadTokens: number
}
