import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { createStatusReply } from "../status.js"

export default function addCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "status",
    aliases: ["song", "now-playing", "np"],
    description: "Get currently playing and upcoming songs",
    async run(context) {
      createStatusReply(context)
    },
  })
}
