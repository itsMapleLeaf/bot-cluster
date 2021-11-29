import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { queue } from "../singletons.js"

export default function addCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "clear",
    description: "Clear the whole queue, including the currently playing song",
    async run(context) {
      queue.clear()
      context.reply(() => "Queue cleared.")
    },
  })
}
