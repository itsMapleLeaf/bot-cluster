import { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import "dotenv/config"
import { rpsCommand } from "./rps.js"
import { triviaCommand } from "./trivia/command.js"

export const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

export async function run() {
  const gatekeeper = await Gatekeeper.create({
    name: "game-bot",
    client,
  })

  rpsCommand(gatekeeper)
  triviaCommand(gatekeeper)

  await client.login(process.env.RPS_BOT_TOKEN)
}
