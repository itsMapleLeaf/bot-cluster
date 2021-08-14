// @ts-check
import {
  actionRowComponent,
  applyCommands,
  buttonComponent,
} from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import "dotenv/config.js"

const isPositiveInteger = (/** @type {number} */ value) =>
  Number.isSafeInteger(value) && value > 0

/**
 * @param {number=} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

sleep()

/** @type {import("@itsmapleleaf/gatekeeper").CommandHandler[]} */
const commands = [
  // {
  //   name: "roll",
  //   description: "rolls a dice",
  //   run: async (context) => {
  //     const diceString = "1d6" // interaction.options.getString("dice") || "1d6"

  //     /**
  //      * @type {Array<{ type:'roll'|'ignored', dieString: string,rolls:number[] }>}
  //      */
  //     const results = []

  //     for (const dieString of diceString.split(/\s+/)) {
  //       const [count, size] = dieString.split("d").map(Number)

  //       const isValid = isPositiveInteger(count) && isPositiveInteger(size)
  //       if (!isValid) {
  //         results.push({
  //           type: "ignored",
  //           dieString,
  //           rolls: [],
  //         })
  //         continue
  //       }

  //       try {
  //         const rolls = Array(count)
  //           .fill(0)
  //           .map(() => Math.floor(Math.random() * size) + 1)

  //         results.push({
  //           type: "roll",
  //           dieString,
  //           rolls: rolls,
  //         })
  //       } catch (error) {
  //         results.push({
  //           type: "ignored",
  //           dieString,
  //           rolls: [],
  //         })
  //       }
  //     }

  //     const resultOutputs = results
  //       .map((result) =>
  //         result.type === "roll"
  //           ? `:game_die: **${result.dieString}** ⇒ ${result.rolls.join(", ")}`
  //           : `Ignored: ${result.dieString}`
  //       )
  //       .join("\n")

  //     const allRolls = results.flatMap((result) => result.rolls)
  //     const total = allRolls.reduce((total, value) => total + value, 0)

  //     let message = `${resultOutputs}`
  //     if (allRolls.length > 1) {
  //       message += `\n**Total:** ${total}`
  //     }
  //   },
  // },

  {
    name: "ping",
    description: "pong",
    async run(context) {
      await context.addReply("pong!")
    },
  },

  {
    name: "counter",
    description: "make a counter",
    run: async (context) => {
      try {
        const reply = await context.defer()

        let times = 0

        while (true) {
          const counterId = `counter-${Math.random()}`
          const doneId = `done-${Math.random()}`

          await reply.edit(
            `button pressed ${times} times`,
            actionRowComponent(
              buttonComponent({
                style: "PRIMARY",
                label: "press it",
                customId: counterId,
              }),
              buttonComponent({
                style: "PRIMARY",
                label: "i'm bored",
                customId: doneId,
              })
            )
          )

          const interaction = await context.waitForInteraction()

          if (interaction.customId === counterId) {
            times += 1
          }
          if (interaction.customId === doneId) {
            break
          }
        }

        await reply.edit("well fine then")
      } catch (error) {
        await context.addReply(
          "an error occurred sending the results (stop breaking the bot dammit)"
        )
        console.error(error)
      }
    },
  },
]

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

applyCommands(client, commands)

client.on("ready", () => {
  console.info("bot running ayy lmao")
})

await client.login(process.env.BOT_TOKEN).catch(console.error)
