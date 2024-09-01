import NodeCache from 'node-cache'

import type { IncomingHttpHeaders, OutgoingHttpHeaders } from 'node:http'
import type { RequestHandler } from 'express'
import type { ProxyOptions } from 'express-http-proxy'

import { getConfig } from '../config'


interface ProxyCacheEntry {
  headers: IncomingHttpHeaders | OutgoingHttpHeaders
  body: any
  statusCode?: number
}

const redirectTTLs: Record<string, number> = {}

export const clearCache = () => {
  cache.flushAll()
}

let cache: NodeCache
let defaultTTL: number
export const initCache = () => {
  if (cache) {
    clearCache()
  }
  const config = getConfig()
  defaultTTL = config.cache.default
  cache = new NodeCache({ stdTTL: config.cache.default })
}

export const withCache = (userResDecorator: ProxyOptions['userResDecorator'], ttl: number = defaultTTL): ProxyOptions['userResDecorator'] =>
  (proxyRes, proxyResData, userReq, userRes) => {
    if (userResDecorator) {
      const response = userResDecorator(proxyRes, proxyResData, userReq, userRes)
      if (proxyRes.statusCode === 200) {
        const originalTTL = redirectTTLs[userReq.url]
        cache.set<ProxyCacheEntry>(userReq.url, { headers: proxyRes.headers, body: response, statusCode: 200 }, originalTTL !== undefined ? originalTTL : ttl)
      }
      return response
    }
    return proxyResData
  }

export const withRedirectCache = (userResHeaderDecorator: ProxyOptions['userResHeaderDecorator'], ttl: number = defaultTTL): ProxyOptions['userResHeaderDecorator'] =>
  (headers, userReq, userRes, proxyReq, proxyRes) => {
    if (userResHeaderDecorator) {
      const finalHeaders = userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes)
      if (finalHeaders.location) {
        redirectTTLs[finalHeaders.location] = ttl
        cache.set<ProxyCacheEntry>(userReq.url, { headers: finalHeaders, body: undefined, statusCode: proxyRes.statusCode }, ttl)
      }
      return finalHeaders
    }
    return headers
  }

export const cacheMiddleware: RequestHandler = (req, res, next) => {
  const config = getConfig()
  const cached = cache.get<ProxyCacheEntry>(req.url)
  if (cached) {
    Object.entries(cached.headers).forEach(([key, value]) => {
      if (value) {
        res.setHeader(key, value)
      }
    })
    if (cached.statusCode) {
      res.status(cached.statusCode)
    }
    res.send(cached.body)
    if (config.enableLogging) {
      console.log('(cache)', req.url, cached.statusCode)
    }
  } else {
    next()
  }
}