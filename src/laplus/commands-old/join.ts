import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { VoiceChannel } from "discord.js"
import { queuePlayer } from "../singletons.js"

export default function addCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "join",
    description: "Kindly ask La+ to join you in your voice channel.",
    async run(context) {
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

      queuePlayer.joinVoiceChannel(voiceChannel)
      context.reply(() => "Here I am.")
    },
  })
}
