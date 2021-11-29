import {
  EmbedComponent,
  embedComponent,
  Gatekeeper,
  InteractionContext,
} from "@itsmapleleaf/gatekeeper"
import { Client, Intents, VoiceChannel } from "discord.js"
import { autorun } from "mobx"
import { toError } from "../helpers.js"
import { addSongToQueue, getState, joinVoiceChannel } from "./store.js"

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MEMBERS,
  ],
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
      context.defer()

      const voiceChannel = context.member?.voice.channel
      if (!(voiceChannel instanceof VoiceChannel)) {
        return context.reply(
          () => "You need to be in a voice channel to use this command. Baka.",
        )
      }

      if (!voiceChannel.joinable) {
        return context.reply(() => "I can't join that voice channel. Baka.")
      }

      try {
        joinVoiceChannel(voiceChannel)
        addSongToQueue(context.options.url)
        context.reply(() => "Done!")
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

  gatekeeper.addSlashCommand({
    name: "status",
    description: "Get the status of the player",
    async run(context) {
      createStatusReply(context)
    },
  })

  await client.login(process.env.LAPLUS_TOKEN)
}

function createStatusReply(context: InteractionContext) {
  let embed: EmbedComponent | undefined

  const reply = context.reply(() => [embed || "..."])

  autorun(() => {
    const state = getState()
    embed = embedComponent({
      fields: [
        { name: "status", value: state.status },
        state.songQueue.length > 0 && {
          name: "queue",
          value: state.songQueue.map(({ youtubeUrl }) => youtubeUrl).join("\n"),
        },
      ].filter(isTruthy),
    })
    reply.refresh()
  })
}

function codeBlock(code: string) {
  return ["```", code, "```"].join("\n")
}

type Falsy = false | undefined | null | "" | 0

function isTruthy<T>(value: T | Falsy): value is T {
  return Boolean(value)
}
