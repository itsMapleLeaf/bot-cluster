import { execFileSync } from "node:child_process"
import { readFile } from "node:fs/promises"

const env = await readFile(".env", "utf-8")

execFileSync(
  "heroku",
  ["config:set", ...env.split(/[\r\n]+/)].filter(Boolean),
  { stdio: "inherit" },
)
