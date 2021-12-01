import type { InteractionContext, ReplyHandle } from "@itsmapleleaf/gatekeeper"
import { embedComponent } from "@itsmapleleaf/gatekeeper"
import { observerReply } from "./observer-reply.js"
import { queueEmbed } from "./queue/queue-embed.js"
import { queue, queuePlayer } from "./singletons.js"
import { songDetailsEmbed } from "./song-details-embed.js"

let currentId: NodeJS.Timer | undefined
let reply: ReplyHandle

export function createStatusReply(context: InteractionContext, header = "") {
  if (currentId) clearInterval(currentId)
  reply?.delete()

  reply = observerReply(context, () => {
    const { state, songs } = queue.store

    if (state.status === "idle") {
      return "Nothing's playing at the moment."
    }

    const progress = Math.min(
      queuePlayer.progressSeconds / state.song.durationSeconds,
      1,
    )

    return [
      header,
      embedComponent(songDetailsEmbed(state.song, progress)),
      songs.length > 0 &&
        embedComponent(
          queueEmbed(songs, (1 - progress) * state.song.durationSeconds),
        ),
    ]
  })

  currentId = setInterval(() => {
    reply.refresh()
  }, 3000)
}
