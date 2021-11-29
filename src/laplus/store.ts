import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel as createVoiceConnection,
} from "@discordjs/voice"
import { VoiceChannel } from "discord.js"
import { observable } from "mobx"
import ytdl from "ytdl-core-discord"

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

function checkQueue() {
  if (state.status !== "idle") return
  if (state.songQueue.length === 0) return

  const song = state.songQueue.shift()
  if (!song) return

  state.status = "loading"

  ytdl(song.youtubeUrl, { filter: "audioonly" }).then((stream) => {
    player.play(createAudioResource(stream))
    state.status = "playing"
  }, console.error)
}

player.on(AudioPlayerStatus.Idle, () => {
  state.status = "idle"
  checkQueue()
})

export function addSongToQueue(youtubeVideoUrl: string) {
  state.songQueue.push({ youtubeUrl: youtubeVideoUrl })
  checkQueue()
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
