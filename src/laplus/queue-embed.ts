import type { MessageEmbedOptions } from "discord.js"
import prettyMilliseconds from "pretty-ms"
import { joinContentfulStrings } from "./join-contentful-strings.js"
import type { Song } from "./song.js"

export function queueEmbed(
  songs: Song[],
  currentSongProgressSeconds: number,
): MessageEmbedOptions {
  let time = currentSongProgressSeconds

  const totalDurationSeconds = songs.reduce(
    (total, song) => total + song.durationSeconds,
    0,
  )

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
      text: joinContentfulStrings(
        [
          songs.length > 5 && `+${songs.length - 5} songs`,
          `${prettyMilliseconds(totalDurationSeconds * 1000)} total`,
        ],
        " ∙ ",
      ),
    },
  }
}
