import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { embedComponent } from "@itsmapleleaf/gatekeeper"
import { logErrorStack } from "../../helpers/errors.js"
import { isPositiveInteger } from "../../helpers/is-positive-integer.js"
import { requireGuild } from "../command-guards.js"
import { errorEmbedOptions } from "../error-embed.js"
import { skip } from "../lavalink.js"

export default function addCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "skip",
    description: "Skip one or more songs.",
    options: {
      count: {
        type: "NUMBER",
        description:
          "The number of songs to skip, including the current song. One by default.",
      },
    },
    async run(context) {
      if (!requireGuild(context)) return

      const count = context.options.count ?? 1
      if (!isPositiveInteger(count)) {
        context.reply(() => "Positive whole numbers only. Baka.")
        return
      }

      try {
        await skip(context.guild.id, count)
      } catch (error) {
        context.reply(() => embedComponent(errorEmbedOptions(error)))
        logErrorStack(error)
      }
    },
  })
}
