import { autorun, toJS } from "mobx"
import type { JsonValue } from "type-fest"
import { z } from "zod"
import { debounce } from "../../helpers/async.js"
import { isTruthy } from "../../helpers/is-truthy.js"
import { createJsonGist } from "../json-gist.js"
import { songSchema } from "../song.js"
import type { Queue } from "./queue.js"

type SavedQueue = z.infer<typeof savedQueueSchema>
const savedQueueSchema = z.object({
  songs: z.array(songSchema),
  currentSong: songSchema.optional(),
})

const gist = createJsonGist(process.env.GITHUB_GIST_ID!, "state.json")

export async function persistQueue(queue: Queue) {
  const json: JsonValue | undefined = await gist.load().catch((error) => {
    console.error("Failed to load gist content:", error)
    return undefined
  })

  const result = savedQueueSchema.safeParse(json)
  if (result.success) {
    const { songs, currentSong } = result.data
    queue.store.songs = [currentSong, ...songs].filter(isTruthy)
    queue.advance()
  }

  const saveDebounced = debounce(500, (data: SavedQueue) => {
    gist.save(data).catch((error) => {
      console.error("Failed to save gist content:", error)
    })
  })

  autorun(() => {
    saveDebounced(
      toJS({
        songs: queue.store.songs,
        currentSong: queue.store.currentSong,
      }),
    )
  })
}
