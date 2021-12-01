import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { embedComponent } from "@itsmapleleaf/gatekeeper"
import { Util } from "discord.js"
import { logErrorStack } from "../../helpers/errors.js"
import { errorEmbedOptions } from "../error-embed.js"
import { connectToVoiceChannel } from "../lavalink.js"
import { getMixForGuild, getMixPlayerForGuild } from "../mix/mix-manager.js"
import { observerReply } from "../observer-reply.js"
import { findVideoByUserInput } from "../youtube.js"
import { confirm } from "./confirm.js"

export default function addCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "mix",
    description: "Start a mix",
    options: {
      song: {
        type: "STRING",
        description:
          "The song to play. Can be a YouTube URL, or a YouTube search query.",
        required: true,
      },
    },

    async run(context) {
      try {
        const voiceChannel = context.member?.voice.channel
        if (!voiceChannel) {
          return context.reply(
            () => "You need to be in a voice channel to do that. Baka.",
          )
        }

        await connectToVoiceChannel(voiceChannel)

        const mix = getMixForGuild(voiceChannel.guildId)
        if (mix.isCollectingSongs) {
          context.reply(() => "This mix is busy. Try again later.")
          return
        }

        if (!mix.isEmpty) {
          const shouldContinue = await confirm({
            context,
            query: [
              "This mix already has stuff in it.",
              "Do you want to clear this mix and start a new one?",
            ],
            confirmLabel: "Start a new mix",
            confirmStyle: "DANGER",
            postChoiceContent: (shouldContinue) => {
              if (shouldContinue) {
                return "Starting a new mix. You can delete this message."
              }
              return "Alright, carry on. You can delete this message."
            },
          })

          if (!shouldContinue) return
        }

        const video = await findVideoByUserInput(context.options.song)
        if (!video) {
          context.reply(
            () => `Couldn't find a video for that. Try something else.`,
          )
          return
        }

        const { unsubscribe } = observerReply(context, () => [
          embedComponent({
            title: `**${Util.escapeMarkdown(video.title)}**`,
            url: `https://www.youtube.com/watch?v=${video.id}`,
            thumbnail: { url: video.thumbnails.min },
            description: [
              `Found **${mix.store.songs.length}** song(s)`,
              `Ignored **${mix.store.ignoredLiveCount}** stream(s)`,
              `Ignored **${mix.store.ignoredPlaylistCount}** playlist(s)`,
              `Ignored **${mix.store.ignoredLengthyCount}** long video(s)`,
            ].join("\n"),
            footer: {
              text: "Tip: In case you aren't finding many songs, individual songs work best to start with.",
            },
          }),
        ])

        await mix.collectSongs(video)
        unsubscribe()

        const player = getMixPlayerForGuild(voiceChannel.guildId)
        await player.playNext()

        // show status message
      } catch (error) {
        context.reply(() => embedComponent(errorEmbedOptions(error)))
        logErrorStack(error)
      }
    },
  })
}
