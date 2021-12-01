import type { Mix } from "./mix.js"
import { createMix } from "./mix.js"

const mixes: Record<string, Mix> = {}

export function getMixForGuild(guildId: string): Mix {
  return (mixes[guildId] ??= createMix())
}
