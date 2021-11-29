import { embedComponent, Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { isTruthy } from "../is-truthy.js"
import { observerReply } from "../observer-reply.js"
import { getState } from "../store.js"

export default function addCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "status",
    description: "Get the status of the player",
    async run(context) {
      observerReply(context, () => {
        const state = getState()
        return embedComponent({
          fields: [
            { name: "status", value: state.status },
            state.songQueue.length > 0 && {
              name: "queue",
              value: state.songQueue
                .map(({ youtubeUrl }) => youtubeUrl)
                .join("\n"),
            },
          ].filter(isTruthy),
        })
      })
    },
  })
}
