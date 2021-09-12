import { z } from "zod"
import { fetchJson } from "./fetchJson.js"

const multipleChoiceSchema = z
  .object({
    category: z.string(),
    type: z.literal("multiple"),
    difficulty: z.union([
      z.literal("easy"),
      z.literal("medium"),
      z.literal("hard"),
    ]),
    question: z.string(),
    correct_answer: z.string(),
    incorrect_answers: z.array(z.string()),
  })
  .passthrough()

const trueFalseSchema = z
  .object({
    category: z.string(),
    type: z.literal("boolean"),
    difficulty: z.union([
      z.literal("easy"),
      z.literal("medium"),
      z.literal("hard"),
    ]),
    question: z.string(),
    correct_answer: z.string(),
  })
  .passthrough()

export type TriviaQuestion = z.TypeOf<typeof questionSchema>
const questionSchema = z.union([multipleChoiceSchema, trueFalseSchema])

const questionListResponseSchema = z
  .object({ results: z.array(questionSchema) })
  .passthrough()

export type TriviaCategory = z.TypeOf<typeof categorySchema>
const categorySchema = z
  .object({
    id: z.number(),
    name: z.string(),
  })
  .passthrough()

const categoryListResponseSchema = z
  .object({
    trivia_categories: z.array(categorySchema),
  })
  .passthrough()

export async function fetchQuestions() {
  return questionListResponseSchema.parse(
    await fetchJson("https://opentdb.com/api.php?amount=5&encode=url3986"),
  )
}

export async function fetchCategories() {
  const result = categoryListResponseSchema.parse(
    await fetchJson("https://opentdb.com/api_category.php"),
  )
  return result.trivia_categories
}
