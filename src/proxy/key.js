import { Parser } from 'm3u8-parser'

let keyUri = null

export const processPlaylistAndReplaceKey = (playlistData, config) => {
  const parser = new Parser()
  parser.push(playlistData)
  parser.end()
  keyUri = parser.manifest.segments?.[0]?.key?.uri || null

  if (keyUri) {
    const updatedPlayListData = playlistData.replace(keyUri, '/key')
    if (keyUri.startsWith('/')) {
      const streamURL = new URL(config.streamURL)
      const { origin } = streamURL
      keyUri = origin + keyUri
    }
    return updatedPlayListData
  }
  return playlistData
}

export const getKeyUri = () => keyUri