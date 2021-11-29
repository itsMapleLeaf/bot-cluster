import prettyMs from "pretty-ms"
import type { MoreVideoDetails, relatedVideo } from "ytdl-core"
import { z } from "zod"

export type Song = z.infer<typeof songSchema>
export const songSchema = z.object({
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

export function createSongFromVideoDetails(
  data: MoreVideoDetails,
  requesterUserId: string,
): Song {
  const durationSeconds = Number(data.lengthSeconds)
  const durationFormatted = Number.isFinite(durationSeconds)
    ? prettyMs(durationSeconds * 1000, { verbose: true })
    : "unknown duration"

  const smallestThumbnail = smallestBy(
    data.thumbnails,
    (t) => t.width * t.height,
  )

  return {
    title: data.title,
    durationSeconds,
    duration: durationFormatted,
    thumbnailUrl: smallestThumbnail?.url,
    channelName: data.author.name,
    channelUrl: data.author.channel_url,
    channelAvatarUrl: data.author.thumbnails?.[0]?.url,
    youtubeUrl: data.video_url,
    requesterUserId,
  }
}

export function createSongFromRelatedVideo(
  data: relatedVideo,
  durationSeconds: number,
  requesterUserId: string,
): Song {
  const duration = prettyMs(durationSeconds * 1000, { verbose: true })

  const smallestThumbnail = smallestBy(
    data.thumbnails,
    (t) => t.width * t.height,
  )

  const channelProps =
    typeof data.author === "string"
      ? {
          channelName: data.author,
        }
      : {
          channelName: data.author.name,
          channelUrl: data.author.channel_url,
          channelAvatarUrl: data.author.thumbnails?.[0]?.url,
        }

  return {
    ...channelProps,
    title: data.title ?? "unknown title",
    duration,
    durationSeconds,
    thumbnailUrl: smallestThumbnail?.url,
    youtubeUrl: `https://www.youtube.com/watch?v=${data.id}`,
    requesterUserId,
  }
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
