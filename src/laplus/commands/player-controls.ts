import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { clamp } from "../../helpers/clamp.js"
import { requireGuild, withGuards } from "../command-guards.js"
import { getMixPlayerForGuild } from "../mix/mix-player-manager.js"

export default function addCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "pause",
    description: "Pause the current song.",
    run: withGuards((context) => {
      const guild = requireGuild(context)
      getMixPlayerForGuild(guild.id).pause()
      context.reply(() => "Paused.")
    }),
  })

  gatekeeper.addSlashCommand({
    name: "resume",
    description: "Resume playing.",
    run: withGuards((context) => {
      const guild = requireGuild(context)
      getMixPlayerForGuild(guild.id).resume()
      context.reply(() => "Resumed.")
    }),
  })

  gatekeeper.addSlashCommand({
    name: "seek",
    description: "Seek to a time in the current song.",
    options: {
      time: {
        type: "NUMBER",
        description: "Time in seconds to seek to.",
        required: true,
      },
    },
    run: withGuards((context) => {
      const guild = requireGuild(context)
      const player = getMixPlayerForGuild(guild.id)

      if (!player.currentSong) {
        context.reply(() => "No song playing. Baka.")
        return
      }

      player.seek(
        clamp(context.options.time, 0, player.currentSong.durationSeconds),
      )

      context.reply(() => `Now playing at ${context.options.time} seconds.`)
    }),
  })

  gatekeeper.addSlashCommand({
    name: "clear",
    description: "Clear the current mix",
    run: withGuards((context) => {
      const guild = requireGuild(context)
      getMixPlayerForGuild(guild.id).clear()
      context.reply(() => "Mix cleared.")
    }),
  })
}
