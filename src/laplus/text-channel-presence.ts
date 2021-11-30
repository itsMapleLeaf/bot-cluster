import type { TextBasedChannels } from "discord.js"
import { errorEmbedOptions } from "./error-embed.js"
import { logErrorStack } from "./log-error-stack.js"
import type { Song } from "./song.js"

export function createTextChannelPresence() {
  let textChannel: TextBasedChannels | undefined

  function setTextChannel(channel: TextBasedChannels) {
    textChannel = channel
  }

  function reportSongError(error: unknown, song: Song | undefined) {
    logErrorStack(error)

    textChannel
      ?.send({ embeds: [errorEmbedOptions(error, song?.youtubeUrl)] })
      .catch((error) => {
        console.warn("Failed to send message to text channel:", error)
      })
  }

  return {
    setTextChannel,
    reportSongError,
  }
}
