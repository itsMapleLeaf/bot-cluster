import { embedComponent, InteractionContext } from "@itsmapleleaf/gatekeeper"
import { observerReply } from "./observer-reply.js"
import { queueEmbed } from "./queue-embed.js"
import { songDetailsEmbed } from "./song-details-embed.js"
import { getState } from "./store.js"

export function createStatusReply(context: InteractionContext, header = "") {
  observerReply(context, () => {
    const { status, songQueue } = getState()

    if (status.type === "idle") {
      return "Nothing's playing at the moment."
    }

    return [
      header,
      embedComponent(songDetailsEmbed(status.song)),
      embedComponent(queueEmbed(songQueue)),
    ]
  })
}
