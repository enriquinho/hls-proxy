import proxy from 'express-http-proxy'
import { Parser } from 'm3u8-parser'
import { processPlaylistAndReplaceKey, getKeyUri } from './key.js'
import { getProxyRedirectUrl, getURLFromRedirectUrl } from './redirect.js'

const isUUIDPathExp = /^\/(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i

const getProxyReqOptDecorator = (config) => (proxyReqOpts, srcReq) => {
  const headers = proxyReqOpts.headers
  for (let header in headers) {
    delete headers[header]
  }
  Object.assign(headers, {
    'Accept': '*/*'
  }, config.headers)
  return proxyReqOpts
}

const userResHeaderDecorator = (headers, userReq, userRes, proxyReq, proxyRes) => {
  const isRedirect = String(proxyRes.statusCode).startsWith('30')
  if (isRedirect) {
    headers.location = getProxyRedirectUrl(headers.location)
  }
  return headers
}

const getBasePath = playlistURL => playlistURL.replace(/\/(\w|\.)+$/, '')

const checkForError = (res, resData) => {
  const isError = String(res.statusCode).startsWith('40')
  if (isError) {
    console.log(resData.toString('utf8'))
  }
}

export const hasPlaylistChildren = (playlistData) => {
  const parser = new Parser()
  parser.push(playlistData)
  parser.end()
  const childStream = parser.manifest.playlists?.[0]?.uri
  return childStream && /.*\.m3u8$/.test(childStream)
}

export const addRequests = (app, config) => {
  let finalStreamURL = config.streamURL

  app.get('/stream.m3u8', proxy(config.streamURL, {
    proxyReqOptDecorator: getProxyReqOptDecorator(config),
    proxyReqPathResolver: (req) => new URL(config.streamURL).pathname,
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      checkForError(proxyRes, proxyResData)
      const data = proxyResData.toString('utf8')
      return processPlaylistAndReplaceKey(data)
    },
    userResHeaderDecorator,
  }))

  app.get('/key', proxy(() => getKeyUri(), {
    proxyReqOptDecorator: getProxyReqOptDecorator(config),
    proxyReqPathResolver: (req) => {
      const uri = new URL(getKeyUri())
      return uri.pathname + uri.search
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      checkForError(proxyRes, proxyResData)
      return proxyResData
    }
  }))

  app.get(/.*\.ts$/, proxy((req) => {
    return (getBasePath(finalStreamURL) + req.url)
  }, {
    proxyReqOptDecorator: getProxyReqOptDecorator(config),
    proxyReqPathResolver: (req) => new URL(getBasePath(finalStreamURL)).pathname + req.url,
    userResHeaderDecorator
  }))

  app.get(isUUIDPathExp, proxy((req) => {
    return getURLFromRedirectUrl(req.url)
  }, {
    proxyReqOptDecorator: getProxyReqOptDecorator(config),
    proxyReqPathResolver: (req) => new URL(getURLFromRedirectUrl(req.url)).pathname,
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      checkForError(proxyRes, proxyResData)
      const url = getURLFromRedirectUrl(userReq.url)
      if (/.*\.m3u8$/.test(url)) {
        const data = proxyResData.toString('utf8')
        if (hasPlaylistChildren(data)) {
          finalStreamURL = url
        }
      }
      return proxyResData
    },
  }))

  //handles child m3u8 playlists
  app.get(/.*\.m3u8$/, proxy((req) => {
    return (getBasePath(finalStreamURL) + req.url)
  }, {
    proxyReqOptDecorator: getProxyReqOptDecorator(config),
    proxyReqPathResolver: (req) => new URL(getBasePath(finalStreamURL)).pathname + req.url,
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      checkForError(proxyRes, proxyResData)
      const data = proxyResData.toString('utf8')
      return processPlaylistAndReplaceKey(data)
    },
    userResHeaderDecorator
  }))

  app.get('*', proxy((req) => {
    return (getBasePath(finalStreamURL) + req.url)
  }, {
    proxyReqOptDecorator: getProxyReqOptDecorator(config),
    proxyReqPathResolver: (req) => new URL(getBasePath(finalStreamURL)).pathname + req.url,
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      checkForError(proxyRes, proxyResData)
      return proxyResData
    },
    userResHeaderDecorator
  }))

}
