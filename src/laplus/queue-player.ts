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
  let lastSong: Song | undefined // store the last song for error reporting
  let progressSeconds = 0

  function handleError(error: any, song: Song | undefined) {
    if (error?.message === "aborted") return
    if (error?.constructor.name === "AbortError") return
    onError(error, song)
  }

  function joinVoiceChannel(voiceChannel: VoiceChannel) {
    const connection = getVoiceConnection(voiceChannel.guild.id)
    if (connection?.joinConfig.channelId !== voiceChannel.id) {
      createVoiceConnection({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      }).subscribe(player)
    }
  }

  autorun(
    createEffect(() => {
      progressSeconds = 0

      const song = (lastSong = queue.store.currentSong)
      if (!song) {
        console.info("No song to play, stopping")
        player.stop()
        return
      }

      console.info(`Playing ${song.title} from ${song.youtubeUrl}`)

      let cancelled = false

      ytdl(song.youtubeUrl, { filter: "audioonly" }).then(
        (stream) => {
          if (cancelled) return
          stream.on("readable", () =>
            console.info(song.title, "- Stream is readable"),
          )
          stream.on("pause", () => console.info(song.title, "- Stream paused"))
          stream.on("resume", () =>
            console.info(song.title, "- Stream resumed"),
          )
          stream.on("close", () => console.info(song.title, "- Stream closed"))
          stream.on("end", () => console.info(song.title, "- Stream ended"))
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

  player.on("stateChange", (oldState, newState) => {
    console.info(`Stage change: ${oldState.status} -> ${newState.status}`)
  })

  player.on(
    AudioPlayerStatus.Idle,
    createEffect(() => {
      // playback might've just stalled for a little bit,
      // so wait and check again to see if we're actually done
      let id = setTimeout(() => {
        if (player.state.status === AudioPlayerStatus.Idle) {
          queue.advance()
        }
      }, 5000)
      return () => clearTimeout(id)
    }),
  )

  setInterval(() => {
    if (player.state.status === AudioPlayerStatus.Playing) {
      progressSeconds += 1
    }
  }, 1000)

  return {
    get progressSeconds() {
      return progressSeconds
    },
    joinVoiceChannel,
  }
}
