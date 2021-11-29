import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel as createVoiceConnection,
} from "@discordjs/voice"
import type { VoiceChannel } from "discord.js"
import { autorun } from "mobx"
import ytdl from "ytdl-core-discord"
import { createEffect } from "./effect.js"
import type { Queue } from "./queue.js"
import type { Song } from "./song.js"

export function createQueuePlayer(
  queue: Queue,
  onError: (error: unknown, song: Song | undefined) => void,
) {
  const player = createAudioPlayer()

  // store the last song for error reporting
  let lastSong: Song | undefined

  const handleError = (error: any, song: Song | undefined) => {
    if (error?.message === "aborted") return
    if (error?.constructor.name === "AbortError") return
    onError(error, song)
  }

  autorun(
    createEffect(() => {
      const song = (lastSong = queue.store.currentSong)
      if (!song) {
        player.stop()
        return
      }

      let cancelled = false

      ytdl(song.youtubeUrl, {
        filter: "audioonly",
      }).then(
        (stream) => {
          if (cancelled) return
          stream.on("error", (error) => handleError(error, song))
          player.play(createAudioResource(stream))
        },
        (error) => handleError(error, song),
      )

      return () => {
        cancelled = true
      }
    }),
  )

  player.on("error", (error) => {
    handleError(error, lastSong)
  })

  player.on(AudioPlayerStatus.Idle, () => {
    queue.advance()
  })

  function joinVoiceChannel(voiceChannel: VoiceChannel) {
    const connection = getVoiceConnection(voiceChannel.guild.id)
    if (!connection || connection.joinConfig.channelId !== voiceChannel.id) {
      createVoiceConnection({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      }).subscribe(player)
    }
  }

  return {
    joinVoiceChannel,
  }
}
