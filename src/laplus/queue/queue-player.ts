import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel as createVoiceConnection,
  StreamType,
} from "@discordjs/voice"
import type { VoiceChannel } from "discord.js"
import { autorun } from "mobx"
import ytdl from "ytdl-core-discord"
import type { Song } from "../song.js"
import type { Queue } from "./queue.js"

type QueuePlayerErrorCallback = (error: unknown, song: Song | undefined) => void

export function createQueuePlayer(
  queue: Queue,
  onError: QueuePlayerErrorCallback,
) {
  const player = createAudioPlayer()
  let progressSeconds = 0
  let lastSong: Song | undefined // store the last song for error handling

  autorun(() => {
    const song = (lastSong = queue.store.currentSong)
    progressSeconds = 0
    if (song) {
      playSong(song).catch((error) => {
        Error.captureStackTrace(error as object)
        onError(error, lastSong)
      })
    } else {
      player.stop()
    }
  })

  setInterval(() => {
    if (player.state.status === AudioPlayerStatus.Playing) {
      progressSeconds += 1
    }
  }, 1000)

  let trackFailed = false

  player.on("error", (error) => {
    Error.captureStackTrace(error)
    onError(error, lastSong)
    trackFailed = true
    progressSeconds = 0

    // something went wrong, try playing it again
    if (queue.store.currentSong) {
      playSong(queue.store.currentSong).catch((error) => {
        Error.captureStackTrace(error as object)
        onError(error, lastSong)
      })
    }
  })

  player.on("stateChange", (oldState, newState) => {
    console.info(`State change: ${oldState.status} -> ${newState.status}`)

    if (trackFailed) {
      trackFailed = false
      return
    }

    if (newState.status === AudioPlayerStatus.Idle) {
      queue.advance()
    }
  })

  async function playSong(song: Song) {
    const chunkSizeMb = 5

    const stream = await ytdl(song.youtubeUrl, {
      filter: "audioonly",
      quality: "highestaudio",
      dlChunkSize: 1024 * 1024 * chunkSizeMb, // smaller chunk sizes can help prevent getting aborted
    })

    player.play(createAudioResource(stream, { inputType: StreamType.Opus }))
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

  return {
    get progressSeconds() {
      return progressSeconds
    },
    joinVoiceChannel,
  }
}
