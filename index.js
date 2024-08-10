import express from 'express'

import { addRequests } from './src/requests.js'

const app = express()

const config = {
  streamURL: 'https://rbmn-live.akamaized.net/hls/live/657156/geoBlockPadel240601PadCcMultiPri/master_6500.m3u8',
  headers: {
    Origin: 'https://www.redbull.com',
    Referer: 'https://www.redbull.com/',
    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
  }
}

addRequests(app, config)

app.listen(8088)