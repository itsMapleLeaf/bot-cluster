import { toError } from "../helpers.js"

export function logErrorStack(error: unknown) {
  const { stack, message } = toError(error)
  console.error(stack || message)
}
