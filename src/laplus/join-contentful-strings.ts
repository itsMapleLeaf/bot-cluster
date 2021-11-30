import type { Falsy } from "./types.js"

export function joinContentfulStrings(
  strings: Array<string | Falsy>,
  separator: string,
) {
  return strings.filter(Boolean).join(separator)
}
