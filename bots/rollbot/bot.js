// @ts-check
import { CommandManager } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import "dotenv/config.js"

const isPositiveInteger = (/** @type {number} */ value) =>
  Number.isSafeInteger(value) && value > 0

/**
 * @param {string} diceString
 */
function rollDice(diceString) {
  /**
   * @type {Array<{ type:'roll'|'ignored', dieString: string,rolls:number[] }>}
   */
  const results = []

  for (const dieString of diceString.split(/\s+/)) {
    try {
      const [count, size] = dieString.split("d").map(Number)

      const isValid = isPositiveInteger(count) && isPositiveInteger(size)
      if (!isValid) {
        results.push({ type: "ignored", dieString, rolls: [] })
        continue
      }

      const rolls = Array(count)
        .fill(0)
        .map(() => Math.floor(Math.random() * size) + 1)

      results.push({ type: "roll", dieString, rolls: rolls })
    } catch (error) {
      results.push({ type: "ignored", dieString, rolls: [] })
    }
  }

  return results
}

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

CommandManager.create()
  .enableLogging()
  .addSlashCommand({
    name: "roll",
    description: "rolls a dice",
    options: {
      dice: {
        type: "STRING",
        description: "dice to roll",
      },
    },
    run: async (context) => {
      const diceString = context.options.dice || "1d6"

      const results = rollDice(diceString)

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
        message += `\n**Total:** ${total}`
      }

      await context.createReply(() => message)
    },
  })
  .useClient(client, {
    useGlobalCommands: false,
    useGuildCommands: true,
  })

await client.login(process.env.BOT_TOKEN).catch(console.error)
