import { embedComponent, Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { VoiceChannel } from "discord.js"
import { errorEmbedOptions } from "../error-embed.js"
import { createStatusReply } from "../status.js"
import { addSongToQueue, joinVoiceChannel, setTextChannel } from "../store.js"

export default function addCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "radio",
    description: "Start a radio using YouTube related videos",
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
        joinVoiceChannel(voiceChannel)
        if (context.channel) {
          setTextChannel(context.channel)
        }

        const result = await addSongToQueue(
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
