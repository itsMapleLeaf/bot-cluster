import type { VoiceConnectionReadyState } from "@discordjs/voice"
import {
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from "@discordjs/voice"
import type {
  IncomingMessage,
  LoadTracksResponse,
  OutgoingMessage,
  PlayerEvent,
} from "@lavaclient/types"
import { LoadType } from "@lavaclient/types"
import type { BaseGuildVoiceChannel, Client } from "discord.js"
import { Util } from "discord.js"
import fetch from "node-fetch"
import { WebSocket } from "ws"
import { raise } from "../helpers/errors.js"
import type { PositiveInteger } from "../helpers/is-positive-integer.js"
import { getMixPlayerForGuild } from "./mix/mix-manager.js"
import { textChannelPresence } from "./singletons.js"

const lavalinkHost = "localhost:2333"
const lavalinkPassword = "youshallnotpass"

let socket: WebSocket

function send(message: OutgoingMessage) {
  socket?.send(JSON.stringify(message))
}

export function connectToLavalink(client: Client) {
  socket = new WebSocket(`ws://${lavalinkHost}`, {
    headers: {
      "Authorization": lavalinkPassword,
      "User-Id": client.user?.id ?? raise("Bot user not found"),
      "Client-Name": "La+",
    },
  })

  socket.on("message", (data) => {
    const message: IncomingMessage = JSON.parse(String(data))

    if (message.op === "event") {
      console.info("Lavalink event", message)
      handleLavalinkEvent(message)
    }

    if (message.op === "playerUpdate") {
      console.info("Lavalink player update", message)
      const player = getMixPlayerForGuild(message.guildId)
      player.setProgressSeconds((message.state.position ?? 0) / 1000)
    }
    // if (message.op === "stats") {
    //   console.info(`Lavalink stats`, message)
    // }
  })

  return new Promise((resolve, reject) => {
    socket.on("open", resolve)
    socket.on("error", reject)
  })
}

function handleLavalinkEvent(event: PlayerEvent) {
  const player = getMixPlayerForGuild(event.guildId)
  const currentSong = player.state.currentSong
  const currentSongTitle = Util.escapeMarkdown(currentSong?.title ?? "")

  if (event.type === "TrackEndEvent") {
    player.playNext().catch(textChannelPresence.reportError)
  }

  if (event.type === "TrackStuckEvent") {
    textChannelPresence.send(`Track "${currentSongTitle}" got stuck, skipping.`)
    console.warn(
      `Track "${currentSongTitle}" got stuck, skipping. ID:`,
      currentSong?.youtubeId,
    )
    player.playNext().catch(textChannelPresence.reportError)
  }

  if (event.type === "TrackExceptionEvent") {
    textChannelPresence.send(
      `An error occurred loading "${currentSongTitle}", skipping.`,
    )
    console.warn(
      `An error occurred loading "${currentSongTitle}", skipping.`,
      currentSong?.youtubeId,
    )
    player.playNext().catch(textChannelPresence.reportError)
  }
}

export function connectToVoiceChannel(channel: BaseGuildVoiceChannel) {
  if (getVoiceConnection(channel.guild.id)) {
    return Promise.resolve()
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    selfDeaf: true,
    adapterCreator: channel.guild.voiceAdapterCreator,
  })

  return new Promise<void>((resolve, reject) => {
    connection.on(VoiceConnectionStatus.Ready, (_, state) => {
      resolve()
      handleVoiceConnectionNetworkingStateChange(
        state.networking.state,
        channel,
      )
      state.networking.on("stateChange", (_, state) => {
        handleVoiceConnectionNetworkingStateChange(state, channel)
      })
    })
    connection.on("error", reject)
  })
}

async function handleVoiceConnectionNetworkingStateChange(
  state: VoiceConnectionReadyState["networking"]["state"],
  channel: BaseGuildVoiceChannel,
) {
  if ("connectionOptions" in state) {
    const { sessionId, token, endpoint } = state.connectionOptions
    send({
      op: "voiceUpdate",
      guildId: channel.guild.id,
      sessionId,
      event: { token, endpoint },
    })
  }
}

export function playTrack(guildId: string, track: string) {
  send({ op: "play", guildId, track })
}

export async function skip(guildId: string, count = 1 as PositiveInteger) {
  send({ op: "stop", guildId })
  await getMixPlayerForGuild(guildId).playNext()
}

export function pause(guildId: string) {
  send({ op: "pause", guildId, pause: true })
}

export function resume(guildId: string) {
  send({ op: "pause", guildId, pause: false })
}

export function seek(guildId: string, seconds: number) {
  send({ op: "seek", guildId, position: seconds * 1000 })
}

export async function loadTrack(
  identifier: string,
): Promise<string | undefined> {
  const response = await fetch(
    `http://${lavalinkHost}/loadtracks?identifier=${identifier}`,
    {
      headers: { Authorization: lavalinkPassword },
    },
  )

  const result = (await response.json()) as LoadTracksResponse

  switch (result.loadType) {
    case LoadType.TrackLoaded:
    case LoadType.PlaylistLoaded:
    case LoadType.SearchResult:
      return result.tracks[0]?.track

    case LoadType.NoMatches:
      return undefined

    case LoadType.LoadFailed:
      throw new Error(result.exception.message)
  }
}
