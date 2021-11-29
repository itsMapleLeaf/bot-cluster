import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { Util } from "discord.js"
import { queue } from "../singletons.js"

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

      const { skippedSong } = queue.skip(count)
      if (!skippedSong) {
        context.reply(() => "Can't skip, baka.")
        return
      }

      context.reply(
        () =>
          `Skipped _${Util.escapeMarkdown(skippedSong.title)}_` +
          (count > 1 ? ` (and ${count - 1} others)` : ""),
      )
    },
  })
}
