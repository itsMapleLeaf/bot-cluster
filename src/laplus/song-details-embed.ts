import { MessageEmbedOptions } from "discord.js"
import { Song } from "./store.js"

export function songDetailsEmbed(song: Song): MessageEmbedOptions {
  return {
    title: song.title,
    url: song.youtubeUrl,
    description: `${song.duration} ∙ <@!${song.requesterUserId}>`,
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
