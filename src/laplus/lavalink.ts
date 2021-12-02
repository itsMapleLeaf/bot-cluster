import type { VoiceConnectionReadyState } from "@discordjs/voice"
import * as discordVoice from "@discordjs/voice"
import type * as lavaclient from "@lavaclient/types"
import type { PlayerEvent, PlayerUpdateState } from "@lavaclient/types"
import { LoadType } from "@lavaclient/types"
import type { BaseGuildVoiceChannel, Client } from "discord.js"
import { observable } from "mobx"
import fetch from "node-fetch"
import { WebSocket } from "ws"
import { raise } from "../helpers/errors.js"

const lavalinkHost = "localhost:2333"
const lavalinkPassword = "youshallnotpass"

let socket: WebSocket
let stats: lavaclient.StatsData | undefined

function send(message: lavaclient.OutgoingMessage) {
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
    const message: lavaclient.IncomingMessage = JSON.parse(String(data))
    if (message.op === "stats") {
      console.info(`Lavalink stats`, message)
      stats = message
    }
  })

  return new Promise((resolve, reject) => {
    socket.on("open", resolve)
    socket.on("error", reject)
  })
}

export function createLavalinkPlayer(
  guildId: string,
  onEvent: (event: PlayerEvent) => void,
) {
  const state = observable.box<PlayerUpdateState>({
    connected: false,
    time: 0,
    position: 0,
  })

  socket.on("message", (data) => {
    const message: lavaclient.IncomingMessage = JSON.parse(String(data))

    if (message.op === "playerUpdate") {
      console.info("Lavalink player update", message)
      state.set(message.state)
    }

    if (message.op === "event") {
      console.info("Lavalink event", message)
      onEvent(message)
    }
  })

  function handleVoiceConnectionNetworkingStateChange(
    state: VoiceConnectionReadyState["networking"]["state"],
  ) {
    if ("connectionOptions" in state) {
      const { sessionId, token, endpoint } = state.connectionOptions
      send({
        op: "voiceUpdate",
        guildId,
        sessionId,
        event: { token, endpoint },
      })
    }
  }

  return {
    get state(): Readonly<PlayerUpdateState> {
      return state.get()
    },

    connectToVoiceChannel(channel: BaseGuildVoiceChannel) {
      if (discordVoice.getVoiceConnection(guildId)) {
        return Promise.resolve()
      }

      const connection = discordVoice.joinVoiceChannel({
        guildId,
        channelId: channel.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: true,
      })

      return new Promise<void>((resolve, reject) => {
        connection.on(discordVoice.VoiceConnectionStatus.Ready, (_, state) => {
          resolve()
          handleVoiceConnectionNetworkingStateChange(state.networking.state)
          state.networking.on("stateChange", (_, state) => {
            handleVoiceConnectionNetworkingStateChange(state)
          })
        })
        connection.on("error", reject)
      })
    },

    play(track: string) {
      send({ op: "play", guildId, track })
    },

    stop() {
      send({ op: "stop", guildId })
    },

    pause() {
      send({ op: "pause", guildId, pause: true })
    },

    resume() {
      send({ op: "pause", guildId, pause: false })
    },

    seek(seconds: number) {
      send({ op: "seek", guildId, position: seconds * 1000 })
    },
  }
}

export async function loadLavalinkTrack(
  identifier: string,
): Promise<string | undefined> {
  const response = await fetch(
    `http://${lavalinkHost}/loadtracks?identifier=${identifier}`,
    {
      headers: { Authorization: lavalinkPassword },
    },
  )

  const result = (await response.json()) as lavaclient.LoadTracksResponse

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
