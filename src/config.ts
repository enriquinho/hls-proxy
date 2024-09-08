import defaultsDeep from 'lodash/defaultsDeep'
import type { RequestOptions } from 'node:http'

import { initCache } from './proxy/cache'

let _config: HLSProxyConfig

const DEFAULT_CONFIG: Omit<HLSProxyConfig, 'streamURL'> = {
  enableLogging: false,
  headers: {
    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
  },
  port: 8088,
  cache: {
    playlists: 1,
    default: 30
  }
}

export const getConfig = () => _config

type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>
export type InitialConfig = AtLeast<HLSProxyConfig, 'streamURL'>

export const setConfig = (config: InitialConfig) => {
  _config = defaultsDeep(config, DEFAULT_CONFIG)
  initCache()
  return _config
}

export interface HLSProxyConfig {
  enableLogging?: boolean
  streamURL: string
  headers?: Record<string, string>
  interceptProxyReqOpt?: (proxyReqOpts: RequestOptions) => void
  port: number
  cache: {
    playlists: number
    default: number
  }
}