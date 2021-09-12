import { createGatekeeper } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import "dotenv/config"
import { rpsCommand } from "./rps.js"
import { triviaCommand } from "./trivia/command.js"

export const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

const gatekeeper = createGatekeeper({ name: "game-bot", debug: true })
gatekeeper.addCommand(rpsCommand)
gatekeeper.addCommand(triviaCommand)
gatekeeper.useClient(client)

export function run() {
  return client.login(process.env.RPS_BOT_TOKEN)
}