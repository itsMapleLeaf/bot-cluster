import { Manager } from "erela.js"
import { client } from "./client.js"

export const manager = new Manager({
  send: (id, payload) => {
    client.guilds.cache.get(id)?.shard.send(payload)
  },
})

// Emitted whenever a node connects
manager.on("nodeConnect", (node) => {
  console.log(`Node "${node.options.identifier}" connected.`)
})

// Emitted whenever a node encountered an error
manager.on("nodeError", (node, error) => {
  console.log(
    `Node "${node.options.identifier}" encountered an error: ${error.message}.`,
  )
})

client.once("ready", () => {
  manager.init(client.user?.id)
})

// THIS IS REQUIRED. Send raw events to Erela.js
client.on("raw", (d) => manager.updateVoiceState(d))
