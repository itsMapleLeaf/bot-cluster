import { Client, Intents } from "discord.js"
import { ReacordDiscordJs } from "reacord"
import { useCommands } from "../helpers/commands.js"
import { Logger } from "../helpers/logger.js"
import { rollCommand } from "./roll.js"

export async function run() {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
  })

  client.on("ready", () => new Logger("[rollbot]").info("ready"))

  const reacord = new ReacordDiscordJs(client)

  useCommands(client, [rollCommand(reacord)])

  await client.login(process.env.ROLLBOT_BOT_TOKEN)
}
