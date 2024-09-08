import { parse, stringify } from 'hls-parser'
import { Key, MasterPlaylist, MediaPlaylist } from 'hls-parser/types'

import { getIdFromUri } from './uri-mapper'

const getUri = (uri: string, playlistUri: string) => {
  const isAbsoluteUri = uri.startsWith('http')
  if (isAbsoluteUri) {
    return getIdFromUri(uri)
  } else {
    if (uri.startsWith('/')) {
      const { origin } = new URL(playlistUri)
      return getIdFromUri(origin + uri)
    } else {
      const paths = playlistUri.split('/')
      paths.pop()
      paths.push(uri)
      return getIdFromUri(paths.join('/'))
    }
  }
}

export const processPlaylist = (m3u8String: string, playlistUri: string) => {
  const playlist = parse(m3u8String)

  const usedKeys: Array<Key> = []
  if (!playlist.isMasterPlaylist) {
    const mediaPlaylist = playlist as MediaPlaylist

    for (const segment of mediaPlaylist.segments) {
      const { key, uri } = segment

      if (key?.uri && !usedKeys.includes(key)) {
        usedKeys.push(key)
        key.uri = '/key/' + getUri(key.uri, playlistUri)
      }
      if (uri) {
        segment.uri = '/ts/' + getUri(segment.uri, playlistUri)
      }
    }
  } else {
    const masterPlaylist = playlist as MasterPlaylist
    for (const variant of masterPlaylist.variants) {
      variant.uri = '/playlist/' + getUri(variant.uri, playlistUri)
    }
  }

  return stringify(playlist)
}