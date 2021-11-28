import { embedComponent, Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { Client, Intents } from "discord.js"
import { createRequire } from "module"
import { toError } from "../helpers.js"

const require = createRequire(import.meta.url)
const YouTube: typeof import("youtube.ts").default =
  require("youtube.ts").default

const youtube = new YouTube(process.env.GOOGLE_API_KEY)

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
})

export async function run() {
  const gatekeeper = await Gatekeeper.create({
    name: "laplus",
    client,
  })

  gatekeeper.addSlashCommand({
    name: "radio",
    description: "Start a radio using YouTube related videos",
    options: {
      url: {
        type: "STRING",
        description: "YouTube video URL",
        required: true,
      },
    },
    async run(context) {
      try {
        const video = await youtube.videos.get(context.options.url)

        context.reply(() =>
          codeBlock(JSON.stringify(video, null, 2).slice(0, 1900)),
        )
      } catch (error) {
        context.reply(() =>
          embedComponent({
            description: toError(error).message,
            color: "DARK_RED",
          }),
        )
        console.error((error as any)?.response?.data?.error || error)
      }
    },
  })

  await client.login(process.env.LAPLUS_TOKEN)
}

function codeBlock(code: string) {
  return ["```", code, "```"].join("\n")
}
