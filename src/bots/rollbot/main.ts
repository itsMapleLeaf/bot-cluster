import { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import "dotenv/config.js"
import { rollCommand } from "./roll.js"

export async function run() {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
  })

  const gatekeeper = await Gatekeeper.create({
    name: "rollbot",
    client,
  })

  rollCommand(gatekeeper)

  await client.login(process.env.ROLLBOT_BOT_TOKEN)
}
