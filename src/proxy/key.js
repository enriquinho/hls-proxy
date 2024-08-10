import { Parser } from 'm3u8-parser'

let keyUri = null

export const processPlaylistAndReplaceKey = (playlistData) => {
  const parser = new Parser()
  parser.push(playlistData)
  parser.end()
  keyUri = parser.manifest.segments?.[0]?.key?.uri || null

  if (keyUri) {
    return playlistData.replace(keyUri, '/key')
  }
  return playlistData
}

export const getKeyUri = () => keyUri