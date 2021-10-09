type BotModule = {
  run: () => void
}

const bots: BotModule[] = await Promise.all([
  import("./bots/rollbot/main.js"),
  import("./bots/game-bot/main.js"),
])

await Promise.all(bots.map((bot) => bot.run()))

export {}
