import type {
  InteractionContext,
  RenderResult,
  SlashCommandInteractionContext,
  SlashCommandOptionConfigMap,
} from "@itsmapleleaf/gatekeeper"
import { embedComponent } from "@itsmapleleaf/gatekeeper"
import { raise } from "../helpers/errors.js"
import { errorEmbedOptions } from "./error-embed.js"
import { getMixPlayerForGuild } from "./mix/mix-player-manager.js"

export function requireGuild(context: InteractionContext) {
  return (
    context.guild ??
    raise(new GuardError("You can only use this in a guild. Baka."))
  )
}

export function requireVoiceChannel(context: InteractionContext) {
  return (
    context.member?.voice.channel ??
    raise(new GuardError("You need to be in a voice channel to do that. Baka."))
  )
}

export function requirePlayer(context: InteractionContext) {
  const guild = requireGuild(context)
  return getMixPlayerForGuild(guild.id)
}

export function withGuards<Options extends SlashCommandOptionConfigMap>(
  fn: (
    context: SlashCommandInteractionContext<Options>,
  ) => void | Promise<unknown>,
) {
  return async (context: SlashCommandInteractionContext<Options>) => {
    try {
      await fn(context)
    } catch (error) {
      if (error instanceof GuardError) {
        const content = error.content
        context.reply(() => content)
      } else {
        context.reply(() => embedComponent(errorEmbedOptions(error)))
      }
    }
  }
}

class GuardError extends Error {
  constructor(public readonly content: RenderResult) {
    super("An error occurred within a command guard")
    this.name = "GuardError"
  }
}