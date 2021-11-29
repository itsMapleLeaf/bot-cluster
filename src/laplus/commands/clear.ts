import { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { clear } from "../store.js"

export default function addCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "clear",
    description: "Clear the whole queue, including the currently playing song",
    async run(context) {
      clear()
      context.reply(() => "Queue cleared.")
    },
  })
}
