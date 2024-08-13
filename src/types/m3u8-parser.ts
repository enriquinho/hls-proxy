declare module "m3u8-parser" {
  export class Parser {
    push(playlistData: string): void
    end(): void

    manifest: {
      playlists: Array<{ uri:string }>
      segments: Array<{ key: { uri: string }}>
    }
  }
}