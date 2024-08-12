import express from 'express'
import request from 'supertest'

import { addRequests } from './requests.js'
import { app as hlsApp, playlistM3U8, setEnableRedirects, getCurrentRequest, monoM3U8 } from '../test/hls-server-mock.js'

const mockConfig = {
  streamURL: 'http://localhost:8090/lb/premium80/index.m3u8',
  headers: {
    Origin: 'http://hls-server.xyz',
    Referer: 'http://hls-server.xyz/',
    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
  }
}

describe('requests.js', () => {
  let app, hlsServer

  beforeAll(() => {
    setEnableRedirects(false)
    hlsServer = hlsApp.listen(8090)
  })

  beforeEach(() => {
    app = express()
    addRequests(app, mockConfig)
  })

  describe('main stream m3u8 file request', () => {
    test('it should properly return proxied m3u8 file when requesting stream.m3u8', () => {
      return request(app)
        .get('/stream.m3u8')
        .expect(200)
        .then(response => {
          expect(response.text).toBe(playlistM3U8)
        })
    })

    test('it should properly return proxied m3u8 file when requesting stream.m3u8 through HTTP redirect', () => {
      setEnableRedirects(true)
      return request(app)
        .get('/stream.m3u8')
        .redirects(1)
        .expect(200)
        .then(response => {
          expect(response.text).toBe(playlistM3U8)
        })
    })
  })

  describe('child playlist m3u8 file requests', () => {
    let req
    beforeEach(() => {
      setEnableRedirects(true)
      req = request(app)
      return req.get('/stream.m3u8').redirects(1)
    })

    it('should properly return proxied m3u8 child playlist files correctly and replace EXT-X-KEY URL with proxied /key path', () => {
      return req
        .get('/tracks-v1a1/mono.m3u8')
        .expect(200)
        .then(response => {
          expect(response.text).toMatchInlineSnapshot(`
"#EXTM3U
#EXT-X-TARGETDURATION:5
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:22023
#EXT-X-PROGRAM-DATE-TIME:2024-08-11T13:23:33.945Z
#EXT-X-KEY:METHOD=AES-128,IV=0x30303030303030303030303066b8992e,URI="/key",KEYFORMAT="identity"
#EXTINF:4.800,
2024/08/11/13/23/33-04800.ts
#EXTINF:4.800,
2024/08/11/13/23/38-04800.ts
#EXTINF:4.800,
2024/08/11/13/23/43-04800.ts
#EXTINF:4.800,
2024/08/11/13/23/48-04800.ts
#EXTINF:4.800,
2024/08/11/13/23/53-04800.ts
#EXTINF:4.800,
2024/08/11/13/23/57-04800.ts
"
`)
        })
    })
  })

  describe('HLS encoding key URI proxying', () => {
    let req
    beforeEach(() => {
      setEnableRedirects(true)
      req = request(app)
      return req.get('/stream.m3u8').redirects(1)
    })

    it('should proxy the key URL thorugh the /key path', () => {
      return req
        .get('/tracks-v1a1/mono.m3u8')
        .then(() => {
          return req
            .get('/key')
            .expect(200)
            .then(response => {
              expect(Buffer.from(response.body).toString()).toBe('password')
            })
        })
    })
  })

  afterAll(() => {
    hlsServer.close()
  })

})