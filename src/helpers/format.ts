export function codeBlock(code: string) {
  return ["```", code, "```"].join("\n")
}

import type { Falsy } from "./types.js"

export function joinContentfulStrings(
  strings: Array<string | Falsy>,
  separator: string,
) {
  return strings.filter(Boolean).join(separator)
}
