import {
  embedComponent,
  InteractionContext,
  ReplyHandle,
} from "@itsmapleleaf/gatekeeper"
import { observerReply } from "./observer-reply.js"
import { queueEmbed } from "./queue-embed.js"
import { songDetailsEmbed } from "./song-details-embed.js"
import { getState } from "./store.js"

let currentId: NodeJS.Timer | undefined
let reply: ReplyHandle

export function createStatusReply(context: InteractionContext, header = "") {
  if (currentId) clearInterval(currentId)
  reply?.delete()

  reply = observerReply(context, () => {
    const { status, songQueue } = getState()

    if (status.type === "idle") {
      return "Nothing's playing at the moment."
    }

    const progress =
      (Date.now() / 1000 - status.startTimeSeconds) /
      status.song.durationSeconds

    return [
      header,
      embedComponent(songDetailsEmbed(status.song, progress)),
      embedComponent(
        queueEmbed(songQueue, (1 - progress) * status.song.durationSeconds),
      ),
    ]
  })

  currentId = setInterval(() => {
    reply.refresh()
  }, 3000)
}
