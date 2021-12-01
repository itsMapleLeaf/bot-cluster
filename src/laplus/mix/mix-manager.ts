import type { MixPlayer } from "./mix-player.js"
import { createMixPlayer } from "./mix-player.js"
import type { Mix } from "./mix.js"
import { createMix } from "./mix.js"

const mixes: Record<string, Mix> = {}
const players: Record<string, MixPlayer> = {}

export function getMixForGuild(guildId: string): Mix {
  return (mixes[guildId] ??= createMix())
}

export function getMixPlayerForGuild(guildId: string): MixPlayer {
  return (players[guildId] ??= createMixPlayer(
    guildId,
    getMixForGuild(guildId),
  ))
}
