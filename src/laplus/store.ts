import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel as createVoiceConnection,
} from "@discordjs/voice"
import { TextBasedChannels, VoiceChannel } from "discord.js"
import { observable } from "mobx"
import ytdl from "ytdl-core-discord"
import { errorEmbedOptions } from "./error-embed.js"

type State = {
  readonly songQueue: Song[]
  status: "idle" | "loading" | "playing"
}

type Song = {
  readonly youtubeUrl: string
}

const player = createAudioPlayer()

const state = observable<State>({
  songQueue: [],
  status: "idle",
})

let textChannel: TextBasedChannels | undefined

player.on(AudioPlayerStatus.Idle, () => {
  state.status = "idle"
  checkQueue().catch((error) => {
    textChannel?.send({ embeds: [errorEmbedOptions(error)] })
  })
})

async function checkQueue() {
  if (state.status !== "idle") return
  if (state.songQueue.length === 0) return

  const song = state.songQueue.shift()
  if (!song) return

  state.status = "loading"

  try {
    const stream = await ytdl(song.youtubeUrl, { filter: "audioonly" })
    player.play(createAudioResource(stream))
    state.status = "playing"
  } catch (error) {
    state.status = "idle"

    checkQueue().catch((error) => {
      textChannel?.send({ embeds: [errorEmbedOptions(error)] })
    })

    throw error
  }
}

export async function addSongToQueue(youtubeVideoUrl: string) {
  state.songQueue.push({ youtubeUrl: youtubeVideoUrl })
  await checkQueue()
}

export function setTextChannel(channel: TextBasedChannels) {
  textChannel = channel
}

export function joinVoiceChannel(voiceChannel: VoiceChannel) {
  const connection = getVoiceConnection(voiceChannel.guild.id)
  if (!connection || connection.joinConfig.channelId !== voiceChannel.id) {
    createVoiceConnection({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    }).subscribe(player)
  }
}

export function getState(): Readonly<State> {
  return state
}
