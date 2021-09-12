import {
  buttonComponent,
  ButtonInteractionContext,
  defineSlashCommand,
  InteractionContext,
  selectMenuComponent,
} from "@itsmapleleaf/gatekeeper"
import { fetchCategories, TriviaCategory } from "./api.js"
import { commaSeparatedList } from "./commaSeparatedList.js"

export const triviaCommand = defineSlashCommand({
  name: "trivia",
  description: "Start a trivia game",
  async run(context) {
    context.defer()

    const categories = await fetchCategories()
    const categoryIds = categories.map((category) => category.id).map(String)

    const admin = context.user
    let state: "lobby" | "categorySelect" | "game" = "lobby"
    let playerIds = new Set<string>([admin.id])
    let selectedCategoryIds = categoryIds

    context.reply(() => {
      switch (state) {
        case "lobby": {
          return lobbyComponent({
            playerIds,
            onJoin: (playerId) => {
              playerIds.add(playerId)
            },
            onLeave: (playerId) => {
              if (playerId === admin.id) {
                return context.ephemeralReply(() => {
                  return "You can't leave the game you started!"
                })
              }
              playerIds.delete(playerId)
            },
            onStart: withPermission([admin.id], () => {
              state = "categorySelect"
            }),
          })
        }

        case "categorySelect": {
          return categorySelectComponent({
            categories,
            selectedCategoryIds,
            onChange: withPermission([admin.id], (_, selected) => {
              selectedCategoryIds = selected
            }),
            onConfirm: withPermission([admin.id], () => {
              state = "game"
            }),
          })
        }

        case "game": {
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
      }

      return `lol wtf this shouldn't happen oops?`
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
  onStart: (context: ButtonInteractionContext) => void
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
      onClick: onStart,
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
  onChange: (context: InteractionContext, selectedCategoryIds: string[]) => void
  onConfirm: (context: ButtonInteractionContext) => void
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
      onSelect: (context) => {
        onChange(context, context.values)
      },
    }),

    buttonComponent({
      label: "Select None",
      style: "SECONDARY",
      onClick: (context) => {
        onChange(context, [])
      },
    }),

    buttonComponent({
      label: "Select All",
      style: "SECONDARY",
      onClick: (context) => {
        onChange(context, categoryIds)
      },
    }),

    buttonComponent({
      label: "rAnDoMiZe",
      emoji: "🎲",
      style: "SECONDARY",
      onClick: (context) => {
        onChange(
          context,
          categoryIds.filter(() => Math.random() > 0.5),
        )
      },
    }),

    buttonComponent({
      label: "Confirm",
      style: "PRIMARY",
      disabled: !selectedCategoryIds.length,
      onClick: onConfirm,
    }),
  ]
}

function withPermission<
  Context extends InteractionContext,
  Args extends unknown[],
>(
  allowedUserIds: string[],
  callback: (context: Context, ...args: Args) => void,
): typeof callback {
  return (context, ...args) => {
    if (!allowedUserIds.includes(context.user.id)) {
      const allowedUserMentions = commaSeparatedList(
        allowedUserIds.map((id) => `<@${id}>`),
        "or",
      )

      context.ephemeralReply(() => {
        return `Sorry, only ${allowedUserMentions} can do that`
      })

      return
    }

    callback(context, ...args)
  }
}
