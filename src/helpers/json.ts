import type { JsonValue } from "type-fest"

export function safeJsonParse(json: string): JsonValue | undefined {
  try {
    return JSON.parse(json)
  } catch (e) {
    return null
  }
}
