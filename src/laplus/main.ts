import { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { raise } from "../helpers/errors.js"
import { client } from "./client.js"
import { connectToLavalink, connectToVoiceChannel } from "./lavalink.js"

export async function run() {
  await Gatekeeper.create({
    name: "laplus",
    client,
    commandFolder: join(dirname(fileURLToPath(import.meta.url)), "commands"),
  })
  await client.login(process.env.LAPLUS_TOKEN)

  await connectToLavalink(client)
  console.info("Connected to Lavalink")

  const channel =
    (await client.channels.fetch("671126209643544591")) ??
    raise("Channel not found")

  if (!channel.isVoice()) {
    raise("Channel is not a voice channel")
  }

  await connectToVoiceChannel(channel)

  // const track = await loadTrack("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
  // if (!track) raise("Track not found")

  // playTrack(channel.guildId, track)
}
