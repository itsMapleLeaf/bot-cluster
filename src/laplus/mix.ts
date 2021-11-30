import { findVideoByUserInput } from "./youtube.js"

export async function createMix(seedInput: string) {
  // fetch the seed video + related videos
  const seedVideo = await findVideoByUserInput(seedInput)
  return seedVideo
}
