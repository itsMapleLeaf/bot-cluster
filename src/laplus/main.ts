import {
  EmbedComponent,
  embedComponent,
  Gatekeeper,
  InteractionContext,
  ReplyHandle,
} from "@itsmapleleaf/gatekeeper"
import { Client, Intents, VoiceChannel } from "discord.js"
import { autorun } from "mobx"
import { errorEmbedOptions } from "./error-embed.js"
import {
  addSongToQueue,
  getState,
  joinVoiceChannel,
  setTextChannel,
} from "./store.js"

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
        context.reply(() => [
          "You need to be in a voice channel to use this command. Baka.",
        ])
        return
      }

      if (!voiceChannel.joinable) {
        context.reply(() => "I can't join that voice channel. Baka.")
        return
      }

      try {
        await addSongToQueue(context.options.url)

        if (context.channel) {
          joinVoiceChannel(voiceChannel)
          setTextChannel(context.channel)
        }

        context.reply(() => "Done!")
      } catch (error) {
        context.reply(() => embedComponent(errorEmbedOptions(error)))
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
  let reply: ReplyHandle | undefined

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

    if (reply) {
      reply.refresh()
    } else {
      reply = context.reply(() => embed)
    }
  })
}

function codeBlock(code: string) {
  return ["```", code, "```"].join("\n")
}

type Falsy = false | undefined | null | "" | 0

function isTruthy<T>(value: T | Falsy): value is T {
  return Boolean(value)
}
