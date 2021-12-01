import type { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { manager } from "../lavalink.old.js"

export default function addCommands(gatekeeper: Gatekeeper) {
  gatekeeper.addSlashCommand({
    name: "lavalink",
    description: "play a song with lavalink",
    options: {
      song: {
        type: "STRING",
        description:
          "The song to play. Can be a YouTube URL, or a YouTube search query.",
        required: true,
      },
    },
    async run(context) {
      const guildId = context.guild?.id
      if (!guildId) {
        context.reply(() => "You need to be in a guild to run this. Baka.")
        return
      }

      const voiceChannelId = context.member?.voice?.channel?.id
      if (!voiceChannelId) {
        context.reply(
          () => "You need to be in a voice channel to run this. Baka.",
        )
        return
      }

      context.defer()

      const results = await manager.search(
        context.options.song,
        context.user.id,
      )
      const track = results.tracks[0]
      if (!track) {
        context.reply(() => "No results found. Baka.")
        return
      }

      const player = manager.create({
        guild: guildId,
        voiceChannel: voiceChannelId,
        textChannel: context.channel!.id,
      })

      player.connect()
      player.queue.add(track)

      // Checks if the client should play the track if it's the first one added
      if (!player.playing && !player.paused && !player.queue.size) {
        await player.play()
      }

      context.reply(() => `Now playing: ${track.title}`)
    },
  })
}
