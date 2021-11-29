import { MessageEmbedOptions } from "discord.js"
import prettyMilliseconds from "pretty-ms"
import { Song } from "./store.js"

export function queueEmbed(
  songs: Song[],
  currentSongProgressSeconds: number,
): MessageEmbedOptions {
  let time = currentSongProgressSeconds

  return {
    color: "#86198f",
    title: "Queue",
    description: songs
      .slice(0, 5)
      .flatMap((song) => {
        const timeUntil = Math.floor(time)
        const timeUntilPretty = prettyMilliseconds(timeUntil * 1000)
        time += song.durationSeconds
        return [
          `[**${song.title}**](${song.youtubeUrl})`,
          `<@!${song.requesterUserId}> ∙ playing in ${timeUntilPretty}`,
          "",
        ]
      })
      .join("\n"),
    footer: {
      text: `${songs.length} songs`,
    },
  }
}
