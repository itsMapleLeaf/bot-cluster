import { persistQueue } from "./queue/queue-persistence.js"
import { createQueuePlayer } from "./queue/queue-player.js"
import { createQueue } from "./queue/queue.js"
import { createTextChannelPresence } from "./text-channel-presence.js"

export const textChannelPresence = createTextChannelPresence()

export const queue = createQueue()

export const queuePlayer = createQueuePlayer(
  queue,
  textChannelPresence.reportSongError,
)

await persistQueue(queue)
