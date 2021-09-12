import fetch from "node-fetch"

export async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url)
  return await res.json()
}
