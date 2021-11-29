import fetch from "node-fetch"

// requires that the gist is already created lol
const gistId = "e5b9603ca4021de3dcc61953a2542752"
const fileName = "state.json"

export async function loadGistContent(): Promise<string> {
  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    })

    if (response.status === 404) {
    }

    if (!response.ok) {
      console.warn(
        `Failed to load gist: ${response.status} ${response.statusText}`,
      )
      return ""
    }

    const data: any = await response.json()
    return data?.files?.[fileName]?.content ?? ""
  } catch (error) {
    console.warn("Failed to load gist")
    console.warn(error)
  }
  return ""
}

export async function saveGistContent(content: string): Promise<void> {
  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      body: JSON.stringify({
        files: {
          [fileName]: {
            content,
          },
        },
      }),
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": `token ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.warn("Failed to save gist")
    console.warn(error)
  }
}
