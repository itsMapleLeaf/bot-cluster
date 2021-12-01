import type { InteractionContext } from "@itsmapleleaf/gatekeeper"
import type { Guild } from "discord.js"

export function requireGuild(
  context: InteractionContext,
): context is InteractionContext & { readonly guild: Guild } {
  if (context.guild) return true
  context.reply(() => "You can only use this in a guild. Baka.")
  return false
}
