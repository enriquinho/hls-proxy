import express, { Application } from 'express'
import type { Server } from 'node:http'
import request from 'supertest'
import type TestAgent from 'supertest/lib/agent'

import { addRequests } from './requests'
import { app as hlsApp, setEnableRedirects, getCurrentRequest, getRequestCounters, resetRequestCounters } from '../test/hls-server-mock'
import { setConfig } from '../config'
import { clearCache } from './cache'
import { resetMappings } from './uri-mapper'

const { resetUUIDs } = require('../../__mocks__/uuid')

const mockConfig = {
  enableLogging: false,
  streamURL: 'http://localhost:8090/lb/premium80/index.m3u8',
  headers: {
    Origin: 'http://hls-server.xyz',
    Referer: 'http://hls-server.xyz/',
    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
  },
  cache: {
    playlists: 1,
    default: 2
  }
}

const checkHeaders = () => {
  const proxyReq = getCurrentRequest()
  if (mockConfig.headers) {
    Object.entries(mockConfig.headers).forEach(([key, value]) => {
      expect(proxyReq.get(key)).toBe(value)
    })
  }

}

describe('requests.ts', () => {
  let app: Application, hlsServer: Server

  beforeAll(() => {
    hlsServer = hlsApp.listen(8090)
  })

  beforeEach(() => {
    resetMappings()
    resetUUIDs()
    resetRequestCounters()
    setEnableRedirects(false)
    app = express()
    setConfig(mockConfig)
    clearCache()
    addRequests(app)
  })

  test('it should forward the http headers specified in the config file for all requests', async () => {
    setEnableRedirects(true)
    const req = request(app)
    await req.get('/stream.m3u8').redirects(1).expect(200)
    checkHeaders()
    await req.get('/playlist/1b261666-d0c5-46e9-94c1-efca58a654d1').expect(200)
    checkHeaders()
    await req.get('/key/4d35648a-da81-4a25-bb73-631ee0daf1ee').expect(200)
    checkHeaders()
    await req.get('/ts/1b261666-d0c5-46e9-94c1-efca58a654d1').redirects(1).expect(200)
    checkHeaders()
    expect.assertions(12)
  })

  describe('main stream m3u8 file request', () => {
    test('it should properly return proxied m3u8 file when requesting stream.m3u8', async () => {
      const response = await request(app).get('/stream.m3u8').expect(200)
      expect(response.text).toMatchInlineSnapshot(`
"#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=3210000,AVERAGE-BANDWIDTH=2560000,CODECS="avc1.64001f,mp4a.40.2",RESOLUTION=1280x720,FRAME-RATE=30.000
/playlist/2d4aa74c-34f4-454a-9196-a6db4a3f528a"
`)
    })

    test('it should properly return proxied m3u8 file when requesting stream.m3u8 through HTTP redirect', async () => {
      setEnableRedirects(true)
      const response = await request(app).get('/stream.m3u8').redirects(1).expect(200)
      expect(response.text).toMatchInlineSnapshot(`
"#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=3210000,AVERAGE-BANDWIDTH=2560000,CODECS="avc1.64001f,mp4a.40.2",RESOLUTION=1280x720,FRAME-RATE=30.000
/playlist/1b261666-d0c5-46e9-94c1-efca58a654d1"
`)
    })
  })

  describe('child playlist m3u8 file requests', () => {
    let req: TestAgent
    beforeEach(() => {
      setEnableRedirects(true)
      req = request(app)
      return req.get('/stream.m3u8').redirects(1)
    })

    it('should properly return proxied m3u8 child playlist files correctly and replace EXT-X-KEY URL with proxied /key path', async () => {
      const response = await req.get('/playlist/1b261666-d0c5-46e9-94c1-efca58a654d1').expect(200)
      expect(response.text).toMatchInlineSnapshot(`
"#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:5
#EXT-X-MEDIA-SEQUENCE:22023
#EXT-X-KEY:METHOD=AES-128,URI="/key/4d35648a-da81-4a25-bb73-631ee0daf1ee",IV=0x30303030303030303030303066B8992E,KEYFORMAT="identity"
#EXT-X-PROGRAM-DATE-TIME:2024-08-11T13:23:33.945Z
#EXTINF:4.8,
/ts/a9e2d9d1-84c8-41ea-9090-f36a8cadacaa
#EXTINF:4.8,
/ts/82ab178c-adf7-421f-8656-a9fa81cd391d
#EXTINF:4.8,
/ts/b685c7b4-cbd9-452d-82f7-6e3e927f685b
#EXTINF:4.8,
/ts/90065b5a-cacf-46da-a4ad-ffa7d36ecdfb
#EXTINF:4.8,
/ts/0b2f092c-6ec0-4f9c-b0da-eafda0140372
#EXTINF:4.8,
/ts/8ee29c1f-4e86-4362-9cbc-c0d85f1e2689"
`)
    })
  })

  describe('HLS encoding key URI proxying', () => {
    let req: TestAgent
    beforeEach(() => {
      setEnableRedirects(true)
      req = request(app)
      return req.get('/stream.m3u8').redirects(1)
    })

    it('should proxy the key URL thorugh the /key path', async () => {
      await req.get('/playlist/1b261666-d0c5-46e9-94c1-efca58a654d1')
      const response = await req.get('/key/4d35648a-da81-4a25-bb73-631ee0daf1ee').expect(200)
      console.log(response.body)
      expect(Buffer.from(response.body).toString()).toBe('password')
    })
  })

  describe('HLS transport stream video files', () => {
    let req: TestAgent
    beforeEach(async () => {
      setEnableRedirects(true)
      req = request(app)
      await req.get('/stream.m3u8').redirects(1).expect(200)
      checkHeaders()
      await req.get('/playlist/1b261666-d0c5-46e9-94c1-efca58a654d1').expect(200)
      checkHeaders()
      await req.get('/key/4d35648a-da81-4a25-bb73-631ee0daf1ee').expect(200)
    })

    it('should proxy the transport stream files properly', async () => {
      let response = await req.get('/ts/a9e2d9d1-84c8-41ea-9090-f36a8cadacaa').redirects(1).expect(200)
      expect(response.text).toBe('33-04800.ts')
      response = await req.get('/ts/b685c7b4-cbd9-452d-82f7-6e3e927f685b').redirects(1).expect(200)
      expect(response.text).toBe('43-04800.ts')
    })
  })

  describe('caching', () => {
    beforeEach(() => {
      setEnableRedirects(true)
    })

    it('should cache requests for the main playlist until the provided time in config', async () => {
      const req = request(app)
      const response1 = await req.get('/stream.m3u8').redirects(1).expect(200)
      const response2 = await req.get('/stream.m3u8').redirects(1).expect(200)
      const response3 = await req.get('/stream.m3u8').redirects(1).expect(200)
      expect(response1.text).toMatchInlineSnapshot(`
"#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=3210000,AVERAGE-BANDWIDTH=2560000,CODECS="avc1.64001f,mp4a.40.2",RESOLUTION=1280x720,FRAME-RATE=30.000
/playlist/1b261666-d0c5-46e9-94c1-efca58a654d1"
`)
      expect(response2.text).toBe(response1.text)
      expect(response3.text).toBe(response1.text)
      expect(Object.values(getRequestCounters())).toEqual([1, 1])
      await new Promise(resolve => setTimeout(() => resolve(true), mockConfig.cache.playlists * 1000))
      await req.get('/stream.m3u8').redirects(1).expect(200)
      expect(Object.values(getRequestCounters())).toEqual([2, 2])
    })

    it('should cache requests for the main ts files until the provided time in config', async () => {
      const req = request(app)
      await req.get('/stream.m3u8').redirects(1).expect(200)
      await req.get('/playlist/1b261666-d0c5-46e9-94c1-efca58a654d1').expect(200)
      await req.get('/key/4d35648a-da81-4a25-bb73-631ee0daf1ee').expect(200)
      resetRequestCounters()
      const response1 = await req.get('/ts/a9e2d9d1-84c8-41ea-9090-f36a8cadacaa').redirects(1).expect(200)
      await new Promise(resolve => setTimeout(() => resolve(true), mockConfig.cache.default / 2 * 1000))
      const response2 = await req.get('/ts/a9e2d9d1-84c8-41ea-9090-f36a8cadacaa').redirects(1).expect(200)
      expect(Object.values(getRequestCounters())).toEqual([1, 1])
      expect(response1.text).toBe('33-04800.ts')
      expect(response2.text).toBe('33-04800.ts')
      await new Promise(resolve => setTimeout(() => resolve(true), mockConfig.cache.default / 2 * 1000))
      await req.get('/ts/a9e2d9d1-84c8-41ea-9090-f36a8cadacaa').redirects(1).expect(200)
      expect(Object.values(getRequestCounters())).toEqual([2, 2])
    })
  })

  afterAll(() => {
    hlsServer.close()
  })

})