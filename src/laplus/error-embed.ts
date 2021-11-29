import { MessageEmbedOptions } from "discord.js"
import { toError } from "../helpers.js"

export function errorEmbedOptions(error: unknown): MessageEmbedOptions {
  return {
    color: "#B91C1C",
    title: "Something went wrong.",
    description: toError(error).message,
    footer: {
      text: "Do it right next time, doofus.",
    },
  }
}
