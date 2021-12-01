import { loadTrack, playTrack } from "../lavalink.js"
import { textChannelPresence } from "../singletons.js"
import type { Mix, MixSong } from "./mix.js"

export type MixPlayer = ReturnType<typeof createMixPlayer>

export function createMixPlayer(guildId: string, mix: Mix) {
  let nowPlaying: MixSong | undefined

  return {
    async playNext(): Promise<void> {
      const song = mix.next()
      if (!song) return

      const track = await loadTrack(song.youtubeId)
      if (!track) {
        textChannelPresence.reportError(
          `Failed to load track **${song.title}**, skipping.`,
        )
        return this.playNext()
      }

      playTrack(guildId, track)
      nowPlaying = song
    },
  }
}
