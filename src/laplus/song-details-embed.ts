import type { MessageEmbedOptions } from "discord.js"
import prettyMilliseconds from "pretty-ms"
import type { Song } from "./song.js"

const progressWidth = 16

export function songDetailsEmbed(
  song: Song,
  progress: number,
): MessageEmbedOptions {
  const progressFilledCount = Math.round(progress * progressWidth)

  const progressBar =
    "🟪".repeat(progressFilledCount) +
    "⬛".repeat(progressWidth - progressFilledCount)

  const durationMs = song.durationSeconds * 1000
  const progressDisplay = prettyMilliseconds(progress * durationMs, {
    colonNotation: true,
  })
  const durationDisplay = prettyMilliseconds(durationMs, {
    colonNotation: true,
  })

  return {
    title: song.title,
    url: song.youtubeUrl,
    description: `<@!${song.requesterUserId}> ∙ ${progressDisplay} / ${durationDisplay}\n\n${progressBar}`,
    author: {
      name: song.channelName,
      iconURL: song.channelAvatarUrl,
      url: song.channelUrl,
    },
    color: "#86198f",
    thumbnail: {
      url: song.thumbnailUrl,
    },
  }
}
