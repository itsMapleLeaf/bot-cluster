import { createRequire } from "module"

const require = createRequire(import.meta.url)
const YouTube: typeof import("youtube.ts").default =
  require("youtube.ts").default

export const youtube = new YouTube(process.env.GOOGLE_API_KEY)
