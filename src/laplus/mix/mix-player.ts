import chalk from "chalk"
import { observable } from "mobx"
import type { PositiveInteger } from "../../helpers/is-positive-integer.js"
import { loadTrack, playTrack } from "../lavalink.js"
import { textChannelPresence } from "../singletons.js"
import type { Mix, MixSong } from "./mix.js"

export type MixPlayer = ReturnType<typeof createMixPlayer>

export function createMixPlayer(guildId: string, mix: Mix) {
  const state = observable(
    {
      currentSong: undefined as MixSong | undefined,
      progressSeconds: 0,
    },
    {
      currentSong: observable.ref,
    },
  )

  return {
    get state(): Readonly<typeof state> {
      return state
    },

    async playNext(advanceCount = 1 as PositiveInteger): Promise<void> {
      const song = mix.next(advanceCount)
      if (!song) return

      const track = await loadTrack(song.youtubeId)
      if (!track) {
        textChannelPresence.reportError(
          `Failed to load track **${song.title}**, skipping.`,
        )
        return this.playNext()
      }

      playTrack(guildId, track)
      state.currentSong = song
      state.progressSeconds = 0

      console.info("Now playing:", chalk.bold(song.title))
    },

    setProgressSeconds(progressSeconds: number) {
      state.progressSeconds = progressSeconds
    },
  }
}
