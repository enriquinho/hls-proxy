# HTTP Live Streaming Proxy

## Overview
This is a simple nodeJS HLS proxy server built on top of [`express`](https://expressjs.com/) and [`express-http-proxy`](https://github.com/villadora/express-http-proxy) that will serve an HTTP stream on your local network from a given m3u8 stream URL.
I've been using it myself in order to play HLS streams with [`ffplay`](https://www.ffmpeg.org/ffplay.html) from my computer without being in a website that has ads or other annoying stuff.
It can also be used to serve a HLS stream in your local network and play it from a smart TV player app, such as [SS IPTV](https://gb.lgappstv.com/main/tvapp/detail?appId=339090) that I use for my LG TV.

## Features
- Allows sending custom HTTP headers to the HLS server to bypass cross origin checks
- Supports HTTP redirects returned by the HLS server
- Supports HLS encryption through proxying the URI in EXT-X-KEY

## How to use it

### Getting started
- Install dependencies by running `npm i`
- Edit the config in [index.ts](./index.ts) file: 
  - Change the `streamURL` to the target m3u8 stream you want to proxy
  - Likely stream will be restricted to be played only on some websites, edit the `Origin` and `Referer` URLs to match the target website
- Run `npm run start`
- Now your computer will be serving a new stream in `http://localhost:8088/stream.m3u8`
- You can test it by installing [`ffplay`](https://www.ffmpeg.org/ffplay.html) and simply running `ffplay http://localhost:8088/stream.m3u8`

### Changing stream
It's not supported to change a stream on the fly, if you want to change it you must stop the server, change the config file and start it again.