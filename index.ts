import fs from 'node:fs'
import express from 'express'

import { addRequests } from './src/proxy/requests.js'
import { setConfig, type InitialConfig } from './src/config.js'

const app = express()

const config: InitialConfig = {
  enableLogging: true,
  streamURL: '',
  headers: {
    Origin: '',
    Referer: ''
  }
}

const player = fs.readFileSync('./player.html')
app.get('/player.html', (req, res) => {
  res.contentType('html')
  res.send(player)
})

const fullConfig = setConfig(config)
addRequests(app)

app.listen(fullConfig.port)