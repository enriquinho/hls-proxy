import proxy from 'express-http-proxy'
import { getKeyUri } from './key.js'
import { getURLFromRedirectUrl } from './redirect.js'
import {
  userResDecorator,
  userResHeaderDecorator,
  userResDecoratorForPlaylists,
  userResDecoratorFromRedirect,
  getProxyReqOptDecorator
} from './request-decorators.js'

const isUUIDPathExp = /^\/(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i

const getBasePath = playlistURL => playlistURL.replace(/\/(\w|\.)+$/, '')

export const addRequests = (app, config) => {
  const { enableLogging, streamURL } = config

  const doRedirect = (proxyURL, realURL) => {
    if (enableLogging) {
      console.log(`${proxyURL} => ${realURL}`)
    }
    return realURL
  }

  let finalStreamURL = streamURL
  const setFinalStreamURL = (url) => finalStreamURL = url

  const proxyReqOptDecorator = getProxyReqOptDecorator(config)
  const proxyReqFinalPathResolver = (req) => {
    return new URL(getBasePath(finalStreamURL)).pathname + req.url
  }

  app.get('/stream.m3u8', proxy(req => {
    return doRedirect(req.url, streamURL)
  }, {
    proxyReqOptDecorator,
    proxyReqPathResolver: (req) => new URL(config.streamURL).pathname,
    userResDecorator: userResDecoratorForPlaylists(config),
    userResHeaderDecorator
  }))

  app.get('/key', proxy(req => {
    return doRedirect(req.url, getKeyUri())
  }, {
    proxyReqOptDecorator,
    proxyReqPathResolver: (req) => {
      const uri = new URL(getKeyUri())
      return uri.pathname + uri.search
    },
    userResDecorator
  }))

  app.get(/.*\.ts$/, proxy((req) => {
    return doRedirect(req.url, getBasePath(finalStreamURL) + req.url)
  }, {
    proxyReqOptDecorator,
    proxyReqPathResolver: proxyReqFinalPathResolver,
    userResHeaderDecorator
  }))

  app.get(isUUIDPathExp, proxy((req) => {
    return doRedirect(req.url, getURLFromRedirectUrl(req.url))
  }, {
    proxyReqOptDecorator,
    proxyReqPathResolver: (req) => {
      const uri = new URL(getURLFromRedirectUrl(req.url))
      return uri.pathname + uri.search
    },
    userResDecorator: userResDecoratorFromRedirect(setFinalStreamURL),
  }))

  //handles child m3u8 playlists
  app.get(/.*\.m3u8$/, proxy((req) => {
    return doRedirect(req.url, getBasePath(finalStreamURL) + req.url)
  }, {
    proxyReqOptDecorator,
    proxyReqPathResolver: proxyReqFinalPathResolver,
    userResDecorator: userResDecoratorForPlaylists(config),
    userResHeaderDecorator
  }))

  app.get('*', proxy((req) => {
    return doRedirect(req.url, getBasePath(finalStreamURL) + req.url)
  }, {
    proxyReqOptDecorator,
    proxyReqPathResolver: proxyReqFinalPathResolver,
    userResDecorator,
    userResHeaderDecorator
  }))

}
