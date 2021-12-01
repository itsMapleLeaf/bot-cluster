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
} from "@lavaclient/types"
import { LoadType } from "@lavaclient/types"
import type { BaseGuildVoiceChannel, Client } from "discord.js"
import fetch from "node-fetch"
import { WebSocket } from "ws"
import { raise } from "../helpers/errors.js"

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
    console.info("[Lavalink]", message)
  })

  return new Promise((resolve, reject) => {
    socket.on("open", resolve)
    socket.on("error", reject)
  })
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

  connection.on("stateChange", (oldState, newState) => {
    console.info(`State changed: ${oldState.status} -> ${newState.status}`)
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

function handleVoiceConnectionNetworkingStateChange(
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
