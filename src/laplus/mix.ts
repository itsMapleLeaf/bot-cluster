import { action, observable, toJS } from "mobx"
import type { RelatedResult, YoutubeVideo } from "./youtube.js"
import { findRelated, isNonLiveVideo } from "./youtube.js"

type MixSong = {
  title: string
  durationSeconds: number
  thumbnailUrl?: string
  channelName?: string
  channelUrl?: string
  channelAvatarUrl?: string
  youtubeId: string
}

const maxDurationSeconds = 60 * 15

export function createMixEntryCollector(video: YoutubeVideo) {
  const store = observable(
    { songs: [] as MixSong[] },
    { songs: observable.shallow },
  )

  const addSongs = action(function addSongs(
    results: Array<YoutubeVideo | RelatedResult>,
  ) {
    for (const result of results) {
      if (!isNonLiveVideo(result)) continue

      const durationSeconds = result.duration ?? Infinity
      if (durationSeconds > maxDurationSeconds) continue

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
    async run() {
      addSongs([video, ...video.related])
      for await (const videos of findRelated(video)) {
        addSongs(videos)
      }
      return toJS(store.songs)
    },
  }
}

export async function createMix() {}
