import type { Application } from 'express'
import proxy, { ProxyOptions } from 'express-http-proxy'

import { getConfig } from '../config'
import { cacheMiddleware, withCache, withRedirectCache } from './cache'
import { getKeyUri } from './key'
import { getURLFromRedirectUrl } from './redirect'
import {
  userResDecorator,
  userResHeaderDecorator,
  userResDecoratorForPlaylists,
  userResDecoratorFromRedirect,
  getProxyReqOptDecorator
} from './request-decorators'

const isUUIDPathExp = /^\/(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i

const getBasePath = (playlistURL: string) => playlistURL.replace(/\/(\w|\.)+$/, '')

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

  let finalStreamURL = streamURL
  const setFinalStreamURL = (url: string) => finalStreamURL = url

  const proxyReqOptDecorator = getProxyReqOptDecorator
  const proxyReqFinalPathResolver: ProxyOptions['proxyReqPathResolver'] = (req) => {
    return new URL(getBasePath(finalStreamURL)).pathname + req.url
  }

  app.get('/stream.m3u8', cacheMiddleware, proxy(req => {
    return doProxy(req.url, streamURL)
  }, {
    proxyReqOptDecorator,
    proxyReqPathResolver: (req) => new URL(config.streamURL).pathname,
    userResDecorator: withCache(userResDecoratorForPlaylists, playlistTTL),
    userResHeaderDecorator: withRedirectCache(userResHeaderDecorator, playlistTTL)
  }))

  app.get('/key', proxy(req => {
    return doProxy(req.url, getKeyUri())
  }, {
    proxyReqOptDecorator,
    proxyReqPathResolver: (req) => {
      const uri = new URL(getKeyUri())
      //TODO: keyUri fails when caching /.*\.m3u8$/ playlist
      return uri.pathname + uri.search
    },
    userResDecorator
  }))

  app.get(/.*\.ts$/, cacheMiddleware, proxy((req) => {
    return doProxy(req.url, getBasePath(finalStreamURL) + req.url)
  }, {
    proxyReqOptDecorator,
    proxyReqPathResolver: proxyReqFinalPathResolver,
    userResDecorator: withCache(userResDecorator),
    userResHeaderDecorator: withRedirectCache(userResHeaderDecorator)
  }))

  app.get(isUUIDPathExp, cacheMiddleware, proxy((req) => {
    return doProxy(req.url, getURLFromRedirectUrl(req.url))
  }, {
    proxyReqOptDecorator,
    proxyReqPathResolver: (req) => {
      const uri = new URL(getURLFromRedirectUrl(req.url))
      return uri.pathname + uri.search
    },
    userResDecorator: withCache(userResDecoratorFromRedirect(setFinalStreamURL)),
  }))

  //handles child m3u8 playlists
  app.get(/.*\.m3u8$/, proxy((req) => {
    return doProxy(req.url, getBasePath(finalStreamURL) + req.url)
  }, {
    proxyReqOptDecorator,
    proxyReqPathResolver: proxyReqFinalPathResolver,
    userResDecorator: withCache(userResDecoratorForPlaylists, playlistTTL),
    userResHeaderDecorator: withRedirectCache(userResHeaderDecorator, playlistTTL)
  }))

}
