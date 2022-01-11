import { Button, ReacordDiscordJs } from "reacord"
import React from "react"
import { Command } from "../helpers/commands.js"
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

    const rolls = Array.from({ length: Math.min(count, 9_999_999) })
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

export const rollCommand = (reacord: ReacordDiscordJs): Command => ({
  name: "roll",
  description: "rolls a dice",
  options: [
    {
      name: "dice",
      description: "dice to roll",
      type: "STRING",
      required: true,
    },
  ],
  run(interaction) {
    const diceString = interaction.options.getString("dice") || "1d6"

    const reply = reacord.reply(
      interaction,
      <RollView
        diceString={diceString}
        userId={interaction.user.id}
        isReroll={false}
        onDelete={() => reply.destroy()}
      />,
    )
  },
})

function RollView({
  diceString,
  userId,
  isReroll,
  onDelete,
}: {
  diceString: string
  userId: string
  isReroll: boolean
  onDelete: () => void
}) {
  const results = rollDice(diceString)
  const allRolls = results.flatMap((result) => result.rolls)

  if (allRolls.length > maxDice) {
    return <>You're rolling too many dice! (max {maxDice})</>
  }

  const total = allRolls.reduce((total, value) => total + value, 0)

  return (
    <>
      {[
        isReroll && `(rerolled by <@${userId}>)`,
        "",
        ...formatRollResults(results),
        allRolls.length > 1 && `**Total:** ${total}`,
      ]
        .filter(Boolean)
        .join("\n")}

      <Button
        emoji="🎲"
        style="primary"
        onClick={(event) => {
          const reply = event.reply(
            <RollView
              diceString={diceString}
              userId={event.user.id}
              isReroll
              onDelete={() => reply.destroy()}
            />,
          )
        }}
      />
      <Button
        emoji="❌"
        style="secondary"
        onClick={(event) => {
          if (event.user.id === userId) {
            onDelete()
          } else {
            event
              .ephemeralReply(
                `Sorry, only the owner of the roll can delete this!`,
              )
              .deactivate()
          }
        }}
      />
    </>
  )
}
