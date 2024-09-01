import { processPlaylistAndReplaceKey, getKeyUri } from './key'

const mockM3U8same =
  `#EXTM3U
#EXT-X-TARGETDURATION:5
#EXT-X-VERSION:3
#EXT-X-KEY:METHOD=AES-128,IV=0x30303030303030303030303066b8992e,URI="/wmsxx.php?name=premium80&number=1",KEYFORMAT="identity"
#EXTINF:4.800,
2024/08/11/13/23/33-04800.ts
#EXT-X-KEY:METHOD=AES-128,IV=0x30303030303030303030303066b8992e,URI="/wmsxx.php?name=premium80&number=1",KEYFORMAT="identity"
#EXTINF:4.800,
2024/08/11/13/23/38-04800.ts
`

const mockM3U8diff =
  `#EXTM3U
#EXT-X-TARGETDURATION:5
#EXT-X-VERSION:3
#EXT-X-KEY:METHOD=AES-128,IV=0x30303030303030303030303066b8992e,URI="/wmsxx.php?name=premium80&number=1",KEYFORMAT="identity"
#EXTINF:4.800,
2024/08/11/13/23/33-04800.ts
#EXT-X-KEY:METHOD=AES-128,IV=0x30303030303030303030303066b8992e,URI="/wmsxx.php?name=premium80&number=5",KEYFORMAT="identity"
#EXTINF:4.800,
2024/08/11/13/23/38-04800.ts
`

describe('keys.ts', () => {
  it('should replace the given keys from a provided m3u8 playlist (same keys)', () => {
    const updatedPlaylist = processPlaylistAndReplaceKey(mockM3U8same, { streamURL: 'http://localhost:8089/index.m3u8' })
    expect(updatedPlaylist).toMatchInlineSnapshot(`
"#EXTM3U
#EXT-X-TARGETDURATION:5
#EXT-X-VERSION:3
#EXT-X-KEY:METHOD=AES-128,IV=0x30303030303030303030303066b8992e,URI="/key/0",KEYFORMAT="identity"
#EXTINF:4.800,
2024/08/11/13/23/33-04800.ts
#EXT-X-KEY:METHOD=AES-128,IV=0x30303030303030303030303066b8992e,URI="/key/0",KEYFORMAT="identity"
#EXTINF:4.800,
2024/08/11/13/23/38-04800.ts
"
`)
    expect(getKeyUri('0')).toBe('http://localhost:8089/wmsxx.php?name=premium80&number=1')
  })

  it('should replace the given keys from a provided m3u8 playlist (same keys)', () => {
    const updatedPlaylist = processPlaylistAndReplaceKey(mockM3U8diff, { streamURL: 'http://localhost:8089/index.m3u8' })
    expect(updatedPlaylist).toMatchInlineSnapshot(`
"#EXTM3U
#EXT-X-TARGETDURATION:5
#EXT-X-VERSION:3
#EXT-X-KEY:METHOD=AES-128,IV=0x30303030303030303030303066b8992e,URI="/key/0",KEYFORMAT="identity"
#EXTINF:4.800,
2024/08/11/13/23/33-04800.ts
#EXT-X-KEY:METHOD=AES-128,IV=0x30303030303030303030303066b8992e,URI="/key/1",KEYFORMAT="identity"
#EXTINF:4.800,
2024/08/11/13/23/38-04800.ts
"
`)
    expect(getKeyUri('0')).toBe('http://localhost:8089/wmsxx.php?name=premium80&number=1')
    expect(getKeyUri('1')).toBe('http://localhost:8089/wmsxx.php?name=premium80&number=5')
  })
})