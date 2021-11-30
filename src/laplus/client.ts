import { Client, Intents } from "discord.js"
import { textChannelPresence } from "./singletons.js"

export const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
})

client.on("interactionCreate", (interaction) => {
  if (interaction.channel) {
    textChannelPresence.setTextChannel(interaction.channel)
  }
})
