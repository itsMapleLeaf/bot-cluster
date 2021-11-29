import { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { skip } from "../store.js"

export default function addCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "skip",
    description: "Skip a playing song",
    options: {
      count: {
        type: "NUMBER",
        description: "Number of songs to skip (1 by default)",
      },
    },
    async run(context) {
      const count = context.options.count ?? 1
      if (count <= 0) {
        context.reply(() => "You can't skip backwards. Baka.")
        return
      }

      const result = skip(count)
      if (!result) {
        context.reply(() => "Can't skip, baka.")
        return
      }

      const otherSkippedCount = count > 1 ? ` (and ${count - 1} others)` : ""
      context.reply(() => `Skipped "${result.song.title}"${otherSkippedCount}.`)
    },
  })
}