import { MessageEmbedOptions } from "discord.js"
import { Song } from "./store.js"

const progressWidth = 16

export function songDetailsEmbed(
  song: Song,
  progress: number,
): MessageEmbedOptions {
  const progressFilledCount = Math.floor(progress * progressWidth)

  const progressBar =
    "🟪".repeat(progressFilledCount) +
    "⬛".repeat(progressWidth - progressFilledCount)

  return {
    title: song.title,
    url: song.youtubeUrl,
    description: `<@!${song.requesterUserId}> ∙ ${song.duration}\n\n${progressBar}`,
    author: {
      name: song.channelName,
      iconURL: song.channelAvatarUrl,
      url: song.channelUrl,
    },
    color: "#86198f",
    thumbnail: {
      url: song.thumbnailUrl,
    },
    // using a very wide 1px tall image for a consistent width
    // image: {
    //   url: `https://cdn.discordapp.com/attachments/855734996424458250/882782767442710578/Invisible_embed.png`,
    // },
  }
}
