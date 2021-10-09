import { createGatekeeper } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import "dotenv/config.js"
import { rollCommand } from "./roll.js"

export async function run() {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
  })

  await createGatekeeper({
    name: "rollbot",
    client,
    commands: [rollCommand],
  })

  await client.login(process.env.ROLLBOT_BOT_TOKEN)
}
