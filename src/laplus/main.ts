import { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { textChannelPresence } from "./singletons.js"

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MEMBERS,
  ],
})

client.on("interactionCreate", (interaction) => {
  if (interaction.channel) {
    textChannelPresence.setTextChannel(interaction.channel)
  }
})

export async function run() {
  await Gatekeeper.create({
    name: "laplus",
    client,
    commandFolder: join(dirname(fileURLToPath(import.meta.url)), "commands"),
  })
  await client.login(process.env.LAPLUS_TOKEN)
}
