import { Parser } from 'm3u8-parser'

const keyUriToId: Record<string, string> = {}
const keyIdToUri: Record<string, string> = {}

export const processPlaylistAndReplaceKey = (playlistData: string, config: any) => {
  const parser = new Parser()
  parser.push(playlistData)
  parser.end()

  let updatedPlayListData = playlistData

  const segments = parser.manifest.segments
  if (segments) {
    for (const segment of segments) {
      let keyUri = segment?.key?.uri
      const originalKeyUri = keyUri
      if (keyUri) {
        if (keyUri.startsWith('/')) {
          const streamURL = new URL(config.streamURL)
          const { origin } = streamURL
          keyUri = origin + keyUri
        }
        let id = keyUriToId[keyUri]
        if (!id) {
          id = Object.keys(keyUriToId).length.toString()
          keyUriToId[keyUri] = id
          keyIdToUri[id] = keyUri
        }
        updatedPlayListData = updatedPlayListData.replace(originalKeyUri, `/key/${id}`)
      }
    }
  }
  return updatedPlayListData
}

export const getKeyUri = (id: string) => keyIdToUri[id]