import express, { Request } from 'express'

let enableRedirects = false
export const setEnableRedirects = (redirect: boolean) => enableRedirects = redirect

let currentRequest: Request
export const getCurrentRequest = () => currentRequest

let requestCounters: Record<string, number> = {}
export const getRequestCounters = () => requestCounters
export const resetRequestCounters = () => {
  requestCounters = {}
}

export const playlistM3U8 =
  `#EXTM3U
#EXT-X-STREAM-INF:AVERAGE-BANDWIDTH=2560000,BANDWIDTH=3210000,RESOLUTION=1280x720,FRAME-RATE=30.000,CODECS="avc1.64001f,mp4a.40.2",CLOSED-CAPTIONS=NONE
tracks-v1a1/mono.m3u8
`

export const monoM3U8 =
  `#EXTM3U
#EXT-X-TARGETDURATION:5
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:22023
#EXT-X-PROGRAM-DATE-TIME:2024-08-11T13:23:33.945Z
#EXT-X-KEY:METHOD=AES-128,IV=0x30303030303030303030303066b8992e,URI="/wmsxx.php?name=premium80&number=1",KEYFORMAT="identity"
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
`

export const app = express()

app.use((req, res, next) => {
  currentRequest = req
  if (!requestCounters[req.url]) {
    requestCounters[req.url] = 1
  } else {
    requestCounters[req.url]++
  }
  next()
})

app.get('/lb/premium80/index.m3u8', (req, res) => {
  if (enableRedirects) {
    res.status(301)
    res.location('/ddh1/premium80/playlist.m3u8')
    res.send()
  } else {
    res.type('application/vnd.apple.mpegurl')
    res.send(playlistM3U8)
  }
})

app.get('/ddh1/premium80/playlist.m3u8', (req, res) => {
  res.type('application/vnd.apple.mpegurl')
  res.send(playlistM3U8)
})

app.get('/ddh1/premium80/tracks-v1a1/mono.m3u8', (req, res) => {
  res.type('application/vnd.apple.mpegurl')
  res.send(monoM3U8)
})

app.get('/wmsxx.php', (req, res) => {
  if (req.query.name === 'premium80' && req.query.number === '1') {
    res.type('application/octet-stream')
    res.send(Buffer.from('password'))
  } else {
    res.status(403)
    res.send()
  }
})

app.get('/ddh1/premium80/tracks-v1a1/2024/08/11/13/23/33-04800.ts', (req, res) => {
  if (enableRedirects) {
    res.status(301)
    res.location('/ddh1/premium80/tracks-v1a1/2024/08/11/13/23/33-04800.jpg?token=c2VydmVyX3RpbWU9MTcxNDMyNzU2MyZoYXNoX3ZhbHVlPU5EQmlObUV3TldZek1tUmhNemMwWkRJM09URXdaREU0TTJZMU9EQmhNR')
    res.send()
  } else {
    res.type('application/javascript')
    res.send('33-04800.ts')
  }
})
app.get('/ddh1/premium80/tracks-v1a1/2024/08/11/13/23/33-04800.jpg', (req, res) => {
  if (req.query.token === 'c2VydmVyX3RpbWU9MTcxNDMyNzU2MyZoYXNoX3ZhbHVlPU5EQmlObUV3TldZek1tUmhNemMwWkRJM09URXdaREU0TTJZMU9EQmhNR') {
    res.type('application/javascript')
    res.send('33-04800.ts')
  } else {
    res.status(403)
    res.send()
  }
})

app.get('/ddh1/premium80/tracks-v1a1/2024/08/11/13/23/43-04800.ts', (req, res) => {
  if (enableRedirects) {
    res.status(301)
    res.location('/ddh1/premium80/tracks-v1a1/2024/08/11/13/23/43-04800.xls?token=c2VydmVyX3RpbWU9MTcxNDMyNzU2MyZoYXNoX3ZhbHVlPU5EQmlObUV3TldZek1tUmhNemMwWkRJM09URXdaREU0TTJZMU9EQmhNR')
    res.send()
  } else {
    res.type('application/javascript')
    res.send('43-04800.ts')
  }
})
app.get('/ddh1/premium80/tracks-v1a1/2024/08/11/13/23/43-04800.xls', (req, res) => {
  if (req.query.token === 'c2VydmVyX3RpbWU9MTcxNDMyNzU2MyZoYXNoX3ZhbHVlPU5EQmlObUV3TldZek1tUmhNemMwWkRJM09URXdaREU0TTJZMU9EQmhNR') {
    res.type('application/javascript')
    res.send('43-04800.ts')
  } else {
    res.status(403)
    res.send()
  }
})
