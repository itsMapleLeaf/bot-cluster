import { action, observable } from "mobx"
import type { RelatedResult, YoutubeVideo } from "./youtube.js"
import { findRelated, isLiveVideo, isPlaylist } from "./youtube.js"

const maxDurationSeconds = 60 * 15

export type Mix = ReturnType<typeof createMix>

export type MixStatus = "idle" | "collectingSongs"

export type MixSong = {
  title: string
  durationSeconds: number
  thumbnailUrl?: string
  channelName?: string
  channelUrl?: string
  channelAvatarUrl?: string
  youtubeId: string
}

export function createMix() {
  const store = observable(
    {
      status: "idle" as MixStatus,
      songs: [] as MixSong[],
      ignoredLiveCount: 0,
      ignoredPlaylistCount: 0,
      ignoredLengthyCount: 0,
    },
    {
      songs: observable.shallow,
    },
  )

  const addSongs = action(function addSongs(
    results: Array<YoutubeVideo | RelatedResult>,
  ) {
    for (const result of results) {
      if (isLiveVideo(result)) {
        store.ignoredLiveCount += 1
        continue
      }

      if (isPlaylist(result)) {
        store.ignoredPlaylistCount += 1
        continue
      }

      const durationSeconds = result.duration ?? Infinity
      if (durationSeconds > maxDurationSeconds) {
        store.ignoredLengthyCount += 1
        continue
      }

      store.songs.push({
        title: result.title,
        durationSeconds,
        thumbnailUrl: result.thumbnails.min,
        channelName: result.channel?.name,
        channelUrl: result.channel?.url,
        channelAvatarUrl: result.channel?.thumbnails?.min,
        youtubeId: result.id,
      })
    }
  })

  return {
    store,

    get isEmpty() {
      return store.songs.length === 0
    },

    get isCollectingSongs() {
      return store.status === "collectingSongs"
    },

    async collectSongs(video: YoutubeVideo) {
      if (store.status !== "idle") {
        throw new Error("Must be in idle state.")
      }

      try {
        store.songs = []
        store.ignoredLiveCount = 0
        store.ignoredPlaylistCount = 0
        store.status = "collectingSongs"

        addSongs([video, ...video.related])
        for await (const videos of findRelated(video)) {
          addSongs(videos)
        }
      } finally {
        store.status = "idle"
      }
    },
  }
}
