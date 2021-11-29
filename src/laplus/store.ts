import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel as createVoiceConnection,
} from "@discordjs/voice"
import { TextBasedChannels, VoiceChannel } from "discord.js"
import { autorun, observable } from "mobx"
import prettyMs from "pretty-ms"
import { relatedVideo } from "ytdl-core"
import ytdl from "ytdl-core-discord"
import { errorEmbedOptions } from "./error-embed.js"

type State = {
  readonly songQueue: Song[]
  status: PlayerStatus
}

export type Song = {
  readonly title: string
  readonly channelName: string
  readonly channelUrl?: string
  readonly channelAvatarUrl?: string
  readonly duration: string
  readonly thumbnailUrl?: string
  readonly youtubeUrl: string
  readonly requesterUserId: string
}

type PlayerStatus = { type: "idle" } | { type: "playing"; song: Song }

const player = createAudioPlayer()

const state = observable<State>({
  songQueue: [],
  status: { type: "idle" },
})

let textChannel: TextBasedChannels | undefined

player.on(AudioPlayerStatus.Idle, () => {
  state.status = { type: "idle" }
  checkQueue()
})

autorun(() => {
  const { status } = state
  if (status.type === "playing") {
    ytdl(status.song.youtubeUrl, { filter: "audioonly" }).then(
      (stream) => {
        player.play(createAudioResource(stream))
      },
      (error) => {
        console.error(error)
        textChannel?.send({ embeds: [errorEmbedOptions(error)] })
      },
    )
  }
})

function checkQueue() {
  if (state.status.type !== "idle") return
  if (state.songQueue.length === 0) return

  const song = state.songQueue.shift()
  if (!song) return

  state.status = { type: "playing", song }
}

export async function addSongToQueue(
  youtubeUrl: string,
  requesterUserId: string,
) {
  const info = await ytdl.getInfo(youtubeUrl)

  const durationSeconds = Number(info.videoDetails.lengthSeconds)
  const durationFormatted = Number.isFinite(durationSeconds)
    ? prettyMs(durationSeconds * 1000, { verbose: true })
    : "unknown duration"

  const smallestThumbnail = smallestBy(
    info.videoDetails.thumbnails,
    (t) => t.width * t.height,
  )

  const song: Song = {
    title: info.videoDetails.title,
    duration: durationFormatted,
    thumbnailUrl: smallestThumbnail?.url,
    channelName: info.videoDetails.author.name,
    channelUrl: info.videoDetails.author.channel_url,
    channelAvatarUrl: info.videoDetails.author.thumbnails?.[0]?.url,
    youtubeUrl,
    requesterUserId,
  }
  state.songQueue.push(song)

  addRelatedSongs(info.related_videos, requesterUserId)
  checkQueue()

  return { song, relatedVideoCount: info.related_videos.length }
}

function addRelatedSongs(
  relatedSongs: relatedVideo[],
  requesterUserId: string,
) {
  for (const video of relatedSongs) {
    const duration =
      video.length_seconds == null
        ? "unknown duration"
        : prettyMs(video.length_seconds * 1000, { verbose: true })

    const smallestThumbnail = smallestBy(
      video.thumbnails,
      (t) => t.width * t.height,
    )

    const channelProps =
      typeof video.author === "string"
        ? {
            channelName: video.author,
          }
        : {
            channelName: video.author.name,
            channelUrl: video.author.channel_url,
            channelAvatarUrl: video.author.thumbnails?.[0]?.url,
          }

    const relatedSong: Song = {
      ...channelProps,
      title: video.title ?? "unknown title",
      duration,
      thumbnailUrl: smallestThumbnail?.url,
      youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
      requesterUserId,
    }
    state.songQueue.push(relatedSong)
  }
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

function smallestBy<T>(
  array: T[],
  getComparator: (item: T) => number,
): T | undefined {
  if (array.length === 0) return undefined
  return array.reduce((smallest, current) => {
    if (getComparator(current) < getComparator(smallest)) return current
    return smallest
  })
}
