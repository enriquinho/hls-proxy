import type { Application, Request } from 'express'
import proxy, { ProxyOptions } from 'express-http-proxy'

import { getConfig } from '../config'
import { cacheMiddleware, withCache, withRedirectCache } from './cache'
import { getUriFromId } from './uri-mapper'
import {
  userResDecorator,
  userResHeaderDecorator,
  userResDecoratorForPlaylists,
  proxyReqOptDecorator
} from './request-decorators'

export const addRequests = (app: Application) => {
  const config = getConfig()
  if (config === null) {
    throw new Error('Config not found')
  }

  const { enableLogging, streamURL, cache } = config
  const playlistTTL = cache.playlists

  const doProxy = (proxyURL: string, realURL: string) => {
    if (enableLogging) {
      console.log(`${proxyURL} => ${realURL}`)
    }
    return realURL
  }

  const proxyReqPathResolver: ProxyOptions['proxyReqPathResolver'] = (req) => {
    const uri = new URL(getUriFromId(req.params.id))
    return uri.pathname + uri.search
  }
  const fromId = (req: Request) => doProxy(req.url, getUriFromId(req.params.id))

  app.get('/stream.m3u8', cacheMiddleware, proxy(req => {
    return doProxy(req.url, streamURL)
  }, {
    proxyReqOptDecorator,
    proxyReqPathResolver: (req) => new URL(config.streamURL).pathname,
    userResDecorator: withCache(userResDecoratorForPlaylists, playlistTTL),
    userResHeaderDecorator: withRedirectCache(userResHeaderDecorator, playlistTTL)
  }))

  app.get('/playlist/:id', cacheMiddleware, proxy(fromId, {
    proxyReqOptDecorator,
    proxyReqPathResolver,
    userResDecorator: withCache(userResDecoratorForPlaylists, playlistTTL),
    userResHeaderDecorator: withRedirectCache(userResHeaderDecorator, playlistTTL)
  }))

  app.get('/key/:id', proxy(fromId, {
    proxyReqOptDecorator,
    proxyReqPathResolver,
    userResDecorator
  }))

  app.get('/ts/:id', cacheMiddleware, proxy(fromId, {
    proxyReqOptDecorator,
    proxyReqPathResolver,
    userResDecorator: withCache(userResDecorator),
    userResHeaderDecorator: withRedirectCache(userResHeaderDecorator)
  }))
}
