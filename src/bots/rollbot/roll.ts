import { buttonComponent, Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { isPositiveInteger } from "./helpers.js"

type RollResult = {
  input: string
  interpreted: string
  rolls: number[]
}

const maxDice = 100

function rollDice(diceString: string) {
  const results: RollResult[] = []

  for (const input of diceString.split(/\s+/)) {
    const [countInput, sizeInput] = input.split("d").map(Number)
    const count = isPositiveInteger(countInput) ? countInput : 1
    const size = isPositiveInteger(sizeInput) ? sizeInput : 6
    const interpreted = `${count}d${size}`

    const rolls = Array(Math.min(count, 9999999))
      .fill(0)
      .map(() => Math.floor(Math.random() * size) + 1)

    results.push({ input, interpreted, rolls })
  }

  return results
}

function formatRollResults(results: RollResult[]) {
  return results.map((result) =>
    [
      `:game_die: **${result.input}** `,
      result.interpreted !== result.input ? `(${result.interpreted}) ` : "",
      `⇒ ${result.rolls.join(", ")}`,
    ].join(""),
  )
}

export const rollCommand = (gatekeeper: Gatekeeper) =>
  gatekeeper.addSlashCommand({
    name: "roll",
    description: "rolls a dice",
    options: {
      dice: {
        type: "STRING",
        description: "dice to roll",
      },
    },
    run(context) {
      const diceString = context.options.dice || "1d6"

      createRollReply(undefined)

      function createRollReply(rerollingUserId: string | undefined) {
        const results = rollDice(diceString)
        const allRolls = results.flatMap((result) => result.rolls)

        if (allRolls.length > maxDice) {
          return context.ephemeralReply(
            () => `You're rolling too many dice! (max ${maxDice})`,
          )
        }

        const total = allRolls.reduce((total, value) => total + value, 0)

        const reply = context.reply(() => [
          rerollingUserId && `(rerolled by <@${rerollingUserId}>)\n`,
          formatRollResults(results),
          allRolls.length > 1 && `**Total:** ${total}`,
          buttonComponent({
            label: "",
            emoji: "🎲",
            style: "PRIMARY",
            onClick: (context) => createRollReply(context.user.id),
          }),
          buttonComponent({
            label: "",
            emoji: "❌",
            style: "SECONDARY",
            onClick: (event) => {
              if (event.user.id === (rerollingUserId || context.user.id)) {
                reply.delete()
              } else {
                event.ephemeralReply(
                  () => `sorry, only the owner of the roll can delete this!`,
                )
              }
            },
          }),
        ])
      }
    },
  })
