// @ts-check
import { createGatekeeper } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import "dotenv/config.js"
import { rollCommand } from "./roll"

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

const gatekeeper = createGatekeeper({ debug: true })
gatekeeper.addCommand(rollCommand)
gatekeeper.useClient(client)

export function run() {
  return client.login(process.env.ROLLBOT_BOT_TOKEN)
}
