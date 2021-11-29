import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { embedComponent } from "@itsmapleleaf/gatekeeper"
import { VoiceChannel } from "discord.js"
import { errorEmbedOptions } from "../error-embed.js"
import { queue, queuePlayer, textChannelPresence } from "../singletons.js"
import { createStatusReply } from "../status.js"

export default function addCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "start-mix",
    aliases: ["mix", "play"],
    description: "Start a mix using YouTube related videos",
    options: {
      url: {
        type: "STRING",
        description: "YouTube video URL",
        required: true,
      },
    },
    async run(context) {
      context.defer()

      const voiceChannel = context.member?.voice.channel
      if (!(voiceChannel instanceof VoiceChannel)) {
        context.reply(() => [
          "You need to be in a voice channel to use this command. Baka.",
        ])
        return
      }

      if (!voiceChannel.joinable) {
        context.reply(() => "I can't join that voice channel. Baka.")
        return
      }

      try {
        queuePlayer.joinVoiceChannel(voiceChannel)

        if (context.channel) {
          textChannelPresence.setTextChannel(context.channel)
        }

        const result = await queue.queueWithRelated(
          context.options.url,
          context.user.id,
        )

        createStatusReply(
          context,
          `Started a radio with ${result.relatedCount} related videos (${result.skippedCount} skipped)`,
        )
      } catch (error) {
        context.reply(() =>
          embedComponent(errorEmbedOptions(error, context.options.url)),
        )
        console.error("url:", context.options.url)
        console.error((error as any)?.response?.data?.error || error)
      }
    },
  })
}
