import "dotenv/config.js"
import { configure } from "mobx"

configure({
  enforceActions: "never",
})

type BotModule = {
  run: () => void
}

const bots: BotModule[] = await Promise.all([
  import("./rollbot/main.js"),
  import("./game-bot/main.js"),
  import("./scout/main.js"),
])

await Promise.all(bots.map((bot) => bot.run()))
