import { createGatekeeper } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import "dotenv/config"
import { rpsCommand } from "./rps"

export const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

const gatekeeper = createGatekeeper({ name: "game-bot", debug: true })
gatekeeper.addCommand(rpsCommand)
gatekeeper.useClient(client)

export function run() {
  return client.login(process.env.RPS_BOT_TOKEN)
}
