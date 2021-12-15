import { execFileSync } from "node:child_process"
import { readFile } from "node:fs/promises"

const environment = await readFile(".env", "utf-8")

execFileSync(
  "heroku",
  ["config:set", ...environment.split(/[\n\r]+/)].filter(Boolean),
  { stdio: "inherit" },
)
