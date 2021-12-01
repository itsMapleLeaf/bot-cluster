import { action, observable, toJS } from "mobx"
import youtubei from "youtubei"
import { firstResolved, retryCount } from "../helpers/async.js"

const youtube = new youtubei.Client()

export type YoutubeVideo = youtubei.Video | youtubei.LiveVideo

export type RelatedResult = youtubei.VideoCompact | youtubei.PlaylistCompact

export async function findVideoByUserInput(
  input: string,
): Promise<YoutubeVideo | undefined> {
  return await firstResolved([
    () => youtube.getVideo(input),
    () => findVideoBySearchQuery(input),
  ])
}

async function findVideoBySearchQuery(query: string) {
  const partialVideo = await youtube.findOne(query, {
    type: "video",
  })

  return await (partialVideo as youtubei.VideoCompact)?.getVideo()
}

export function createRelatedVideoFinder(video: YoutubeVideo) {
  const store = observable(
    {
      videos: [] as youtubei.VideoCompact[],
      done: false,
    },
    { videos: observable.shallow },
  )

  const addVideos = action(function addVideos(results: RelatedResult[]) {
    for (const result of results) {
      if (result instanceof youtubei.VideoCompact) {
        store.videos.push(result)
      }
    }
  })

  return {
    store,
    async run() {
      addVideos(video.related)
      for await (const videos of findRelated(video)) {
        addVideos(videos)
      }
      store.done = true
      return toJS(store.videos)
    },
  }
}

async function* findRelated(
  video: YoutubeVideo,
): AsyncGenerator<RelatedResult[]> {
  let results
  while ((results = await tryGetNextRelated(video)).length > 0) {
    yield results
  }
}

async function tryGetNextRelated(
  video: YoutubeVideo,
): Promise<RelatedResult[]> {
  try {
    return await retryCount(3, () => video.nextRelated())
  } catch (error) {
    console.warn("Failed to load related videos:", error)
    return []
  }
}
