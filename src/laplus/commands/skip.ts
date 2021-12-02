import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { embedComponent } from "@itsmapleleaf/gatekeeper"
import { logErrorStack } from "../../helpers/errors.js"
import { isPositiveInteger } from "../../helpers/is-positive-integer.js"
import { requireGuild, withGuards } from "../command-guards.js"
import { errorEmbedOptions } from "../error-embed.js"
import { getMixPlayerForGuild } from "../mix/mix-player-manager.js"

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
    run: withGuards(async (context) => {
      const guild = requireGuild(context)

      const count = context.options.count ?? 1
      if (!isPositiveInteger(count)) {
        context.reply(() => "Positive whole numbers only. Baka.")
        return
      }

      try {
        await getMixPlayerForGuild(guild.id).skip(count)
      } catch (error) {
        context.reply(() => embedComponent(errorEmbedOptions(error)))
        logErrorStack(error)
      }
    }),
  })
}
