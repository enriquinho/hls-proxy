import type { Request, Response } from 'express'
import type { ProxyOptions } from 'express-http-proxy'
import type { IncomingMessage } from 'node:http'

import { Parser } from 'm3u8-parser'

import { processPlaylistAndReplaceKey } from './key'
import { getProxyRedirectUrl, getURLFromRedirectUrl } from './redirect'


const checkForError = (res: IncomingMessage, resData: any, userReq: Request, userRes: Response) => {
  const isError = String(res.statusCode).startsWith('40')
  if (isError) {
    console.error(resData.toString('utf8'))
  }
}

export const userResDecorator:ProxyOptions['userResDecorator'] = (proxyRes, proxyResData, userReq, userRes) => {
  checkForError(proxyRes, proxyResData, userReq, userRes)
  return proxyResData
}

export const userResDecoratorForPlaylists: (config:any) => ProxyOptions['userResDecorator'] = 
  config => (proxyRes, proxyResData, userReq, userRes) => {
    checkForError(proxyRes, proxyResData, userReq, userRes)
    const data = proxyResData.toString('utf8')
    return processPlaylistAndReplaceKey(data, config)
}

const hasPlaylistChildren = (playlistData: string) => {
  const parser = new Parser()
  parser.push(playlistData)
  parser.end()
  const childStream = parser.manifest.playlists?.[0]?.uri
  return childStream && /.*\.m3u8$/.test(childStream)
}

export const userResDecoratorFromRedirect: (setFinalStreamURL: (url: string) => void) => ProxyOptions['userResDecorator'] = 
(setFinalStreamURL) => (proxyRes, proxyResData, userReq, userRes) => {
  checkForError(proxyRes, proxyResData, userReq, userRes)
  const url = getURLFromRedirectUrl(userReq.url)
  if (/.*\.m3u8$/.test(url)) {
    const data = proxyResData.toString('utf8')
    if (hasPlaylistChildren(data)) {
      setFinalStreamURL(url)
    }
  }
  return proxyResData
}

export const getProxyReqOptDecorator: (config:any) => ProxyOptions['proxyReqOptDecorator']  = (config) => (proxyReqOpts, srcReq) => {
  const headers = proxyReqOpts.headers

  if (!headers) return proxyReqOpts

  for (let header in headers) {
    delete headers[header]
  }
  Object.assign(headers, {
    'Accept': '*/*',
  }, config.headers)

  if (config.interceptProxyRequest) {
    config.interceptProxyRequest(proxyReqOpts)
  }

  return proxyReqOpts
}

export const userResHeaderDecorator: ProxyOptions['userResHeaderDecorator'] = (headers, userReq, userRes, proxyReq, proxyRes) => {
  const isRedirect = String(proxyRes.statusCode).startsWith('30')
  let { location } = headers
  if (isRedirect && location) {
    if (location.startsWith('/')) {
      const { protocol, host } = proxyReq
      const port = proxyReq.socket && proxyReq.socket.remotePort
      const hasCustomPort = port && port !== 80 && port !== 443
      location = protocol + '//' + host + (hasCustomPort ? `:${port}` : '') + location
    }
    headers.location = getProxyRedirectUrl(location)
  }
  return headers
}