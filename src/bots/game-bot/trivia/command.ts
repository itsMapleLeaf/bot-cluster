import {
  buttonComponent,
  defineSlashCommand,
  selectMenuComponent,
} from "@itsmapleleaf/gatekeeper"
import { fetchCategories, TriviaCategory } from "./api.js"

export const triviaCommand = defineSlashCommand({
  name: "trivia",
  description: "Start a trivia game",
  async run(context) {
    context.defer()

    const categories = await fetchCategories()
    const categoryIds = categories.map((category) => category.id).map(String)

    let state: "lobby" | "categorySelect" | "game" = "lobby"
    let playerIds = new Set<string>()
    let selectedCategoryIds = categoryIds

    context.reply(() => {
      switch (state) {
        case "lobby":
          return lobbyComponent({
            playerIds,
            onJoin: (playerId) => {
              playerIds.add(playerId)
            },
            onLeave: (playerId) => {
              playerIds.delete(playerId)
            },
            onStart: () => {
              state = "categorySelect"
            },
          })

        case "categorySelect":
          return categorySelectComponent({
            categories,
            selectedCategoryIds,
            onChange: (selection) => {
              selectedCategoryIds = selection
            },
            onConfirm: () => {
              state = "game"
            },
          })

        case "game":
          return [
            `players:`,
            [...playerIds].map((id) => `<@${id}>`),
            `selected categories`,
            selectedCategoryIds
              .map(Number)
              .map((id) => categories.find((c) => c.id === id)?.name)
              .filter(Boolean),
          ]
      }
    })
  },
})

function lobbyComponent({
  playerIds,
  onJoin,
  onLeave,
  onStart,
}: {
  playerIds: Iterable<string>
  onJoin: (playerId: string) => void
  onLeave: (playerId: string) => void
  onStart: () => void
}) {
  return [
    `players: ${[...playerIds].map((id) => `<@${id}>`)}`,
    buttonComponent({
      label: "Join",
      style: "SECONDARY",
      onClick: (buttonContext) => {
        onJoin(buttonContext.user.id)
      },
    }),
    buttonComponent({
      label: "Leave",
      style: "SECONDARY",
      onClick: (buttonContext) => {
        onLeave(buttonContext.user.id)
      },
    }),
    buttonComponent({
      label: "Start",
      style: "PRIMARY",
      onClick: (buttonContext) => {
        onStart()
      },
    }),
  ]
}

function categorySelectComponent({
  categories,
  selectedCategoryIds,
  onChange,
  onConfirm,
}: {
  categories: TriviaCategory[]
  selectedCategoryIds: string[]
  onChange: (selectedCategoryIds: string[]) => void
  onConfirm: () => void
}) {
  const categoryIds = categories.map((category) => category.id).map(String)

  return [
    selectMenuComponent({
      options: categories.map((category) => ({
        label: category.name,
        value: String(category.id),
      })),
      selected: selectedCategoryIds,
      minValues: 1,
      onSelect: ({ values }) => {
        onChange(values)
      },
    }),

    buttonComponent({
      label: "Select None",
      style: "SECONDARY",
      onClick: (context) => {
        onChange([])
      },
    }),

    buttonComponent({
      label: "Select All",
      style: "SECONDARY",
      onClick: (context) => {
        onChange(categoryIds)
      },
    }),

    buttonComponent({
      label: "rAnDoMiZe",
      emoji: "🎲",
      style: "SECONDARY",
      onClick: (context) => {
        onChange(categoryIds.filter(() => Math.random() > 0.5))
      },
    }),

    buttonComponent({
      label: "Confirm",
      style: "PRIMARY",
      disabled: !selectedCategoryIds.length,
      onClick: (context) => {
        onConfirm()
      },
    }),
  ]
}
