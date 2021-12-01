import { makeAutoObservable, observable } from "mobx"
import ytdl from "ytdl-core-discord"
import type { Song } from "../song.js"
import {
  createSongFromRelatedVideo,
  createSongFromVideoDetails,
} from "../song.js"

type QueueState = { status: "idle" } | { status: "playing"; song: Song }

class QueueStore {
  state: QueueState = { status: "idle" }
  songs: Song[] = []

  get currentSong() {
    return this.state.status === "playing" ? this.state.song : undefined
  }

  constructor() {
    makeAutoObservable(this, {
      state: observable.ref,
      songs: observable.shallow,
    })
  }
}

const lengthLimitSeconds = 60 * 15

export type Queue = ReturnType<typeof createQueue>

export function createQueue() {
  const store = new QueueStore()

  function advance() {
    if (store.songs.length > 0) {
      store.state = { status: "playing", song: store.songs.shift()! }
    } else {
      store.state = { status: "idle" }
    }
  }

  async function queueWithRelated(youtubeUrl: string, requesterUserId: string) {
    const info = await ytdl.getInfo(youtubeUrl)

    const song = createSongFromVideoDetails(info.videoDetails, requesterUserId)

    const relatedVideos = info.related_videos.flatMap((related) => {
      if (related.length_seconds == null) return []
      if (related.length_seconds > lengthLimitSeconds) return []
      return createSongFromRelatedVideo(
        related,
        related.length_seconds,
        requesterUserId,
      )
    })

    store.songs.push(song, ...relatedVideos)

    if (store.state.status === "idle") {
      advance()
    }

    return {
      song,
      relatedCount: relatedVideos.length,
      skippedCount: info.related_videos.length - relatedVideos.length,
    }
  }

  function skip(count: number) {
    count = Math.max(count, 1) // prevent negative skipping

    const skippedSong = store.currentSong

    store.songs.splice(0, count - 1)
    advance()

    return { skippedSong, skippedCount: count }
  }

  function clear() {
    store.songs = []
    advance()
  }

  return {
    store,
    queueWithRelated,
    advance,
    skip,
    clear,
  }
}
