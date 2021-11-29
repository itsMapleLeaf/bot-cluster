import { MessageEmbedOptions } from "discord.js"
import { Song } from "./store.js"

export function queueEmbed(songs: Song[]): MessageEmbedOptions {
  return {
    title: "Queue",
    description: songs
      .slice(0, 5)
      .flatMap((song) => [
        `[**${song.title}**](${song.youtubeUrl})`,
        `${song.duration} ∙ <@!${song.requesterUserId}>`,
        "",
      ])
      .join("\n"),
    footer: {
      text: `${songs.length} songs`,
    },
  }
}
