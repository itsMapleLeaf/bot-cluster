// @ts-check
import { Client, Intents } from "discord.js"
import "dotenv/config.js"

const isPositiveInteger = (/** @type {number} */ value) =>
  Number.isSafeInteger(value) && value > 0

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

client.on("ready", () => {
  for (const guild of client.guilds.cache.values()) {
    guild.commands.create({
      name: "roll",
      description: "Rolls a dice",
      options: [
        {
          name: "dice",
          description: "dice to roll, e.g. 1d6",
          type: "STRING",
          required: false,
        },
      ],
    })
  }
})

client.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand() && interaction.commandName === "roll") {
    await interaction.deferReply()

    const diceString = interaction.options.getString("dice") || "1d6"

    /**
     * @type {Array<{ type:'roll'|'ignored', dieString: string,rolls:number[] }>}
     */
    const results = []

    for (const dieString of diceString.split(/\s+/)) {
      const [count, size] = dieString.split("d").map(Number)

      const isValid = isPositiveInteger(count) && isPositiveInteger(size)
      if (!isValid) {
        results.push({
          type: "ignored",
          dieString,
          rolls: [],
        })
        continue
      }

      try {
        const rolls = Array(count)
          .fill(0)
          .map(() => Math.floor(Math.random() * size) + 1)

        results.push({
          type: "roll",
          dieString,
          rolls: rolls,
        })
      } catch (error) {
        results.push({
          type: "ignored",
          dieString,
          rolls: [],
        })
      }
    }

    const resultOutputs = results
      .map((result) =>
        result.type === "roll"
          ? `:game_die: **${result.dieString}** ⇒ ${result.rolls.join(", ")}`
          : `Ignored: ${result.dieString}`
      )
      .join("\n")

    const allRolls = results.flatMap((result) => result.rolls)
    const total = allRolls.reduce((total, value) => total + value, 0)

    let message = `${resultOutputs}`
    if (allRolls.length > 1) {
      message += `\nTotal: ${total}`
    }

    try {
      await interaction.editReply(message)
    } catch (error) {
      await interaction.editReply(
        "an error occurred sending the results (stop breaking the bot dammit)"
      )
      console.error(error)
    }
  }
})

await client.login(process.env.BOT_TOKEN).catch(console.error)
console.info("bot running ayy lmao")
