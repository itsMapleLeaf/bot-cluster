import { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MEMBERS,
  ],
})

export async function run() {
  await Gatekeeper.create({
    name: "laplus",
    client,
    commandFolder: join(dirname(fileURLToPath(import.meta.url)), "commands"),
  })
  await client.login(process.env.LAPLUS_TOKEN)
}
