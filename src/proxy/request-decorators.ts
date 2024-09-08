import type { Request, Response } from 'express'
import type { ProxyOptions } from 'express-http-proxy'
import type { IncomingMessage } from 'node:http'

import { getConfig } from '../config'
import { processPlaylist } from './playlist'
import { getIdFromUri, getUriFromId } from './uri-mapper'

export interface IncomingMessageWithSource extends IncomingMessage {
  source?: {
    protocol: string
    host: string
    path: string
    port?: number
  }
}

const checkResponse = (res: IncomingMessage, resData: any, userReq: Request, userRes: Response) => {
  const isError = res.statusCode && res.statusCode >= 400
  if (isError) {
    console.error(resData.toString('utf8'))
  }
}

export const userResDecorator: ProxyOptions['userResDecorator'] = (proxyRes, proxyResData, userReq, userRes) => {
  checkResponse(proxyRes, proxyResData, userReq, userRes)
  return proxyResData
}

export const userResDecoratorForPlaylists: ProxyOptions['userResDecorator'] =
  (proxyRes: IncomingMessageWithSource, proxyResData, userReq, userRes) => {
    if (proxyRes.source) {
      checkResponse(proxyRes, proxyResData, userReq, userRes)
      const data = proxyResData.toString('utf8')

      const { protocol, host, path, port } = proxyRes.source
      return processPlaylist(data, `${protocol}//${host}${port ? `:${port}` : ''}${path}`)
    } else {
      throw new Error(`Unable to get proxy original url for: ${userReq.url}`)
    }
  }

const FORWARDED_HEADERS = ['connection', 'range']
export const proxyReqOptDecorator: ProxyOptions['proxyReqOptDecorator'] = (proxyReqOpts, srcReq) => {
  const headers = proxyReqOpts.headers

  if (!headers) return proxyReqOpts

  for (let header in headers) {
    if (!FORWARDED_HEADERS.includes(header.toLowerCase())) {
      delete headers[header]
    }
  }

  const config = getConfig()
  if (config) {
    Object.assign(headers, {
      'Accept': '*/*',
    }, config.headers)

    if (config.interceptProxyReqOpt) {
      config.interceptProxyReqOpt(proxyReqOpts)
    }
  }

  return proxyReqOpts
}

export const userResHeaderDecorator: ProxyOptions['userResHeaderDecorator'] = (headers, userReq, userRes, proxyReq, proxyRes: IncomingMessageWithSource) => {
  const port = proxyReq.socket && proxyReq.socket.remotePort
  const hasCustomPort = port && port !== 80 && port !== 443

  const { protocol, host, path } = proxyReq
  proxyRes.source = { protocol, host, path, port: hasCustomPort ? port : undefined }

  const isRedirect = String(proxyRes.statusCode).startsWith('30')
  let { location } = headers
  if (isRedirect && location) {
    if (location.startsWith('/')) {
      const { protocol, host } = proxyReq
      location = protocol + '//' + host + (hasCustomPort ? `:${port}` : '') + location
    }
    if (location.endsWith('.m3u8')) {
      headers.location = '/playlist/' + getIdFromUri(location)
    } else {
      headers.location = '/ts/' + getIdFromUri(location)
    }
  }
  return headers
}