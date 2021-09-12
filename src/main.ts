type Bot = {
  run: () => void
}

async function main() {
  const bots: Bot[] = await Promise.all([
    import("./bots/rollbot/main"),
    import("./bots/game-bot/main"),
  ])

  await Promise.all(bots.map((bot) => bot.run()))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

export {}
