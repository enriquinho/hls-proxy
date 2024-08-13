import type { RequestOptions } from 'node:http'

export interface HLSProxyConfig {
  enableLogging?: boolean
  streamURL: string
  headers?: Record<string, string>
  interceptProxyReqOpt?: (proxyReqOpts: RequestOptions) => void
}