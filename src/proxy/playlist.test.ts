import { processPlaylist } from './playlist'
import { getUriFromId, resetMappings } from './uri-mapper'

const { resetUUIDs } = require('../../__mocks__/uuid')

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

describe('playlist.ts', () => {
  beforeEach(() => {
    resetMappings()
    resetUUIDs()
  })

  it('should replace the URIs from the provided m3u8 playlist (same keys)', () => {
    const updatedPlaylist = processPlaylist(mockM3U8same, 'http://localhost:8089/index.m3u8')
    expect(updatedPlaylist).toMatchInlineSnapshot(`
"#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:5
#EXT-X-KEY:METHOD=AES-128,URI="/key/2d4aa74c-34f4-454a-9196-a6db4a3f528a",IV=0x30303030303030303030303066B8992E,KEYFORMAT="identity"
#EXTINF:4.8,
/ts/1b261666-d0c5-46e9-94c1-efca58a654d1
#EXTINF:4.8,
/ts/4d35648a-da81-4a25-bb73-631ee0daf1ee"
`)
    expect(getUriFromId('2d4aa74c-34f4-454a-9196-a6db4a3f528a')).toBe('http://localhost:8089/wmsxx.php?name=premium80&number=1')
    expect(getUriFromId('1b261666-d0c5-46e9-94c1-efca58a654d1')).toBe('http://localhost:8089/2024/08/11/13/23/33-04800.ts')
    expect(getUriFromId('4d35648a-da81-4a25-bb73-631ee0daf1ee')).toBe('http://localhost:8089/2024/08/11/13/23/38-04800.ts')
  })

  it('should replace the URIs from the provided m3u8 playlist (same keys)', () => {
    const updatedPlaylist = processPlaylist(mockM3U8diff, 'http://localhost:8089/index.m3u8')
    expect(updatedPlaylist).toMatchInlineSnapshot(`
"#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:5
#EXT-X-KEY:METHOD=AES-128,URI="/key/2d4aa74c-34f4-454a-9196-a6db4a3f528a",IV=0x30303030303030303030303066B8992E,KEYFORMAT="identity"
#EXTINF:4.8,
/ts/1b261666-d0c5-46e9-94c1-efca58a654d1
#EXT-X-KEY:METHOD=AES-128,URI="/key/4d35648a-da81-4a25-bb73-631ee0daf1ee",IV=0x30303030303030303030303066B8992E,KEYFORMAT="identity"
#EXTINF:4.8,
/ts/a9e2d9d1-84c8-41ea-9090-f36a8cadacaa"
`)
    expect(getUriFromId('2d4aa74c-34f4-454a-9196-a6db4a3f528a')).toBe('http://localhost:8089/wmsxx.php?name=premium80&number=1')
    expect(getUriFromId('4d35648a-da81-4a25-bb73-631ee0daf1ee')).toBe('http://localhost:8089/wmsxx.php?name=premium80&number=5')
    expect(getUriFromId('1b261666-d0c5-46e9-94c1-efca58a654d1')).toBe('http://localhost:8089/2024/08/11/13/23/33-04800.ts')
    expect(getUriFromId('a9e2d9d1-84c8-41ea-9090-f36a8cadacaa')).toBe('http://localhost:8089/2024/08/11/13/23/38-04800.ts')
  })
})