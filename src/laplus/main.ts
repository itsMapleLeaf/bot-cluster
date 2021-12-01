import { Gatekeeper } from "@itsmapleleaf/gatekeeper"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { client } from "./client.js"
import { connectToLavalink } from "./lavalink.js"

export async function run() {
  await Gatekeeper.create({
    name: "laplus",
    client,
    commandFolder: join(dirname(fileURLToPath(import.meta.url)), "commands"),
  })
  await client.login(process.env.LAPLUS_TOKEN)
  await connectToLavalink(client)
}
