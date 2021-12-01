import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { requireGuild } from "../command-guards.js"
import { showNowPlaying } from "../now-playing-message.js"

export default function addCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "now-playing",
    aliases: ["np"],
    description: "Show the currently playing song and the queue.",
    run(context) {
      if (!requireGuild(context)) return
      showNowPlaying(context, context.guild.id)
    },
  })
}
