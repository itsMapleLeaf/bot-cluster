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

  autorun(
    createEffect(() => {
      const song = (lastSong = queue.store.currentSong)
      if (!song) {
        player.stop()
        return
      }

      const controller = new AbortController()

      ytdl(song.youtubeUrl, {
        filter: "audioonly",
        requestOptions: {
          signal: controller.signal,
        },
      }).then(
        (stream) => player.play(createAudioResource(stream)),
        (error) => onError(error, song),
      )

      return () => {
        controller.abort()
      }
    }),
  )

  player.on("error", (error) => {
    onError(error, lastSong)
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
