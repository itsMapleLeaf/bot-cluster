import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { embedComponent } from "@itsmapleleaf/gatekeeper"
import { Util } from "discord.js"
import { logErrorStack } from "../../helpers/errors.js"
import { errorEmbedOptions } from "../error-embed.js"
import { observerReply } from "../observer-reply.js"
import { createRelatedVideoFinder, findVideoByUserInput } from "../youtube.js"

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
        context.defer()

        const video = await findVideoByUserInput(context.options.song)
        if (!video) {
          context.reply(
            () => `Couldn't find a video for that. Try something else.`,
          )
          return
        }

        const finder = createRelatedVideoFinder(video)

        const { unsubscribe } = observerReply(context, () => [
          `Starting mix: **${Util.escapeMarkdown(video.title)}**`,
          `Found ${finder.store.videos.length} related videos...`,
          finder.store.done && "Done.",
        ])

        const relatedVideos = await finder.run()
        unsubscribe()
      } catch (error) {
        context.reply(() => embedComponent(errorEmbedOptions(error)))
        logErrorStack(error)
      }
    },
  })
}
