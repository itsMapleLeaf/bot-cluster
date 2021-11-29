import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel as createVoiceConnection,
} from "@discordjs/voice"
import { TextBasedChannels, VoiceChannel } from "discord.js"
import { autorun, observable, toJS } from "mobx"
import prettyMs from "pretty-ms"
import { relatedVideo } from "ytdl-core"
import ytdl from "ytdl-core-discord"
import { z } from "zod"
import { errorEmbedOptions } from "./error-embed.js"
import { loadGistContent, saveGistContent } from "./gist.js"
import { safeJsonParse } from "./json.js"

const songSchema = z.object({
  title: z.string(),
  channelName: z.string(),
  channelUrl: z.string().optional(),
  channelAvatarUrl: z.string().optional(),
  duration: z.string(),
  durationSeconds: z.number(),
  thumbnailUrl: z.string().optional(),
  youtubeUrl: z.string(),
  requesterUserId: z.string(),
})
export type Song = z.infer<typeof songSchema>

const playerStatusSchema = z.union([
  z.object({ type: z.literal("idle") }),
  z.object({
    type: z.literal("playing"),
    song: songSchema,
    startTimeSeconds: z.number(),
  }),
])
type PlayerStatus = z.infer<typeof playerStatusSchema>

const playerStateSchema = z.object({
  songQueue: z.array(songSchema),
  status: playerStatusSchema,
})
type PlayerState = z.infer<typeof playerStateSchema>

const savedPlayerStateSchema = z.object({
  state: playerStateSchema,
  savedTimeSeconds: z.number(),
})
type SavedPlayerState = z.infer<typeof savedPlayerStateSchema>

const savedState = savedPlayerStateSchema.safeParse(
  safeJsonParse(await loadGistContent()),
)
if (!savedState.success) {
  console.warn(savedState.error.format())
}

const defaultState: PlayerState = {
  songQueue: [],
  status: { type: "idle" },
}

const player = createAudioPlayer()

const state = observable(
  savedState.success ? savedState.data.state : defaultState,
)

const lengthLimitSeconds = 60 * 10
let textChannel: TextBasedChannels | undefined

checkQueue()

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
        logError(error, status.song.youtubeUrl)
      },
    )
  }
})

setInterval(async () => {
  try {
    const savedState: SavedPlayerState = {
      state: toJS(state),
      savedTimeSeconds: Date.now() / 1000,
    }

    await saveGistContent(JSON.stringify(savedState, null, 2))
  } catch (error) {
    console.warn("Failed to save state")
    console.warn(error)
  }
}, 30000)

player.on("error", (error) => {
  const url =
    state.status.type === "playing" ? state.status.song.youtubeUrl : undefined

  logError(error, url)
})

function logError(error: unknown, url?: string) {
  console.error("url:", url)
  console.error(error)
  textChannel?.send({ embeds: [errorEmbedOptions(error)] })
}

function checkQueue() {
  if (state.status.type !== "idle") return

  // we should be idle, and the queue is empty, so the player should stop
  if (state.songQueue.length === 0) {
    player.stop()
    return
  }

  const song = state.songQueue.shift()
  if (!song) return

  state.status = {
    type: "playing",
    song,
    startTimeSeconds: Date.now() / 1000,
  }
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
    durationSeconds,
    duration: durationFormatted,
    thumbnailUrl: smallestThumbnail?.url,
    channelName: info.videoDetails.author.name,
    channelUrl: info.videoDetails.author.channel_url,
    channelAvatarUrl: info.videoDetails.author.thumbnails?.[0]?.url,
    youtubeUrl,
    requesterUserId,
  }
  state.songQueue.push(song)

  const relatedVideos = info.related_videos.filter(
    (video) => (video.length_seconds ?? Infinity) <= lengthLimitSeconds,
  )

  addRelatedSongs(relatedVideos, requesterUserId)
  checkQueue()

  return {
    song,
    relatedCount: relatedVideos.length,
    skippedCount: info.related_videos.length - relatedVideos.length,
  }
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
      durationSeconds: video.length_seconds ?? 1,
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

export function skip(count: number) {
  if (state.status.type === "idle") return
  const { song } = state.status
  state.status = { type: "idle" }
  state.songQueue.splice(0, count - 1)
  checkQueue()
  return { song }
}

export function clear() {
  state.songQueue = []
  state.status = { type: "idle" }
  checkQueue()
}

export function getState(): Readonly<PlayerState> {
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
