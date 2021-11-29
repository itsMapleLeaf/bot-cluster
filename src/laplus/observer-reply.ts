import type {
  InteractionContext,
  RenderReplyFn,
  RenderResult,
  ReplyHandle,
} from "@itsmapleleaf/gatekeeper"
import { autorun } from "mobx"

export function observerReply(
  context: InteractionContext,
  renderFn: RenderReplyFn,
) {
  let reply: ReplyHandle | undefined
  let content: RenderResult

  const cleanup = autorun(() => {
    content = renderFn()
    if (!reply) {
      reply = context.reply(() => content)
    } else {
      reply.refresh()
    }
  })

  return {
    get message() {
      return reply?.message
    },
    refresh: () => {
      content = renderFn()
      reply?.refresh()
    },
    delete: () => {
      reply?.delete()
      cleanup()
    },
  }
}
