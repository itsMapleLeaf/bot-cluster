import type { Message, PartialMessage } from "discord.js"
import { Client, Intents } from "discord.js"
import { execa } from "execa"
import { Logger } from "../helpers/logger.js"

const denoPath = process.env.DENO_PATH || "deno"

const allowedUserIds = new Set(["91634403746275328", "109677308410875904"])

const successMessages = [
  "Nice, you did it.",
  "Good job!",
  "Here's what I've got.",
  "Nailed it.",
  "Damn, you're real good at this!",
  "That's some good shit right there, if I do say so myself.",
  "You're a real pro at this.",
  "Woah, sick.",
]

const errorMessages = [
  "Oops, try again.",
  "That's not right.",
  "Damn, so close.",
  "Oof, you'll get it next time. I believe in you!",
  "I sure hope you're not trying to do anythin' malicious...",
  "Is it late? You should probably get some sleep.",
  "It's probably just a typo. Or a cosmic ray from space or somethin'",
  "Deno didn't like that, I guess.",
]

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
})

const console = new Logger("[scout]")

export async function run() {
  client.on("messageCreate", handleMessage)
  client.on("messageUpdate", handleMessage)

  await client.login(process.env.SCOUT_BOT_TOKEN)

  console.info("ready")
}

async function handleMessage(message: Message | PartialMessage) {
  try {
    const isAllowed = allowedUserIds.has(message.author?.id!)
    if (!isAllowed) return

    const isMentioned = message.mentions.has(client.user?.id!)
    if (!isMentioned) return

    const code = message.content?.match(/(```|`)(?:js)?([^]*)(\1)/)?.[2]
    if (!code) return

    await message.reply(await runCode(code))
  } catch (error: any) {
    const errorMessage = error?.stack || error?.message || String(error)
    await message.reply(createResponse(randomItem(errorMessages), errorMessage))
    console.error(error)
  }
}

async function runCode(code: string) {
  const safeCode = /* js */ `
    const perms = ['run', 'read', 'write', 'net', 'env', 'ffi', 'hrtime']
    await Promise.all(perms.map(perm => Deno.permissions.revoke({name:perm})))

    const result = await (async () => {
      ${code}
    })()
    console.log(result)
  `

  const result = await execa(denoPath, ["eval", "--no-check", safeCode], {
    env: { NO_COLOR: "1" },
    reject: false,
    timeout: 3000,
  })

  if (result.timedOut) {
    return createResponse(randomItem(errorMessages), "Script took too long.")
  }

  if (result.failed || result.exitCode !== 0) {
    return createResponse(randomItem(errorMessages), result.stderr)
  }

  return createResponse(
    randomItem(successMessages),
    result.stdout || "(no output)",
  )
}

function randomItem<T>(array: T[]): T {
  const item = array[Math.floor(Math.random() * array.length)]
  if (item === undefined) {
    throw new Error("Array is empty")
  }
  return item
}

function createResponse(message: string, body: string) {
  return `${message}\n\`\`\`\n${body.slice(0, 3500)}\`\`\``
}
