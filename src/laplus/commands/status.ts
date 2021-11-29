import { embedComponent, Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { observerReply } from "../observer-reply.js"
import { songDetailsEmbed } from "../song-details-embed.js"
import { getState } from "../store.js"

export default function addCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "status",
    aliases: ["s", "song", "now-playing", "np"],
    description: "Get the status of the player",
    async run(context) {
      observerReply(context, () => {
        const { status } = getState()

        if (status.type === "idle") {
          return "Nothing's playing at the moment."
        }

        return ["", embedComponent(songDetailsEmbed(status.song))]
      })
    },
  })
}
