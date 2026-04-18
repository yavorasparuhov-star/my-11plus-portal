import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getMainCategoryCatalog } from "../../../../lib/custom-tests/catalog"
import type {
  DifficultyFilter,
  GenerateCustomTestRequest,
  GenerateCustomTestResponse,
  MainCategory,
  NormalizedOption,
  NormalizedQuestion,
  OptionKey,
} from "../../../../lib/custom-tests/types"

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"]
const MAX_QUESTION_COUNT = 60
const MIN_QUESTION_COUNT = 5
const MAX_TIME_MINUTES = 120
const MIN_TIME_MINUTES = 1

type WordRow = {
  id: number
  word: string | null
  definition: string | null
  difficulty: number | null
  wrong_words: unknown
}

type EnglishQuestionRow = {
  id: number
  test_id: number | null
  main_category: string | null
  subcategory: string | null
  question_text: string | null
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  correct_answer: string | null
  explanation: string | null
  difficulty: number | null
}

type EnglishTestRow = {
  id: number
  passage: string | null
}

type TopicPool = {
  topicKey: string
  questions: NormalizedQuestion[]
}

function isMainCategory(value: unknown): value is MainCategory {
  return (
    value === "english" ||
    value === "math" ||
    value === "vr" ||
    value === "nvr"
  )
}

function isOptionKey(value: unknown): value is OptionKey {
  return value === "A" || value === "B" || value === "C" || value === "D"
}

function jsonError(error: string, status = 400) {
  return NextResponse.json<GenerateCustomTestResponse>(
    { ok: false, error },
    { status }
  )
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items]

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }

  return copy
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    if (typeof value !== "string") continue

    const trimmed = value.trim()
    if (!trimmed) continue

    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    result.push(trimmed)
  }

  return result
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return uniqueStrings(
      value.map((item) => (typeof item === "string" ? item : null))
    )
  }

  if (typeof value === "string") {
    const trimmed = value.trim()

    if (!trimmed) {
      return []
    }

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed)

        if (Array.isArray(parsed)) {
          return uniqueStrings(
            parsed.map((item) => (typeof item === "string" ? item : null))
          )
        }
      } catch {
        // fall through
      }
    }

    return uniqueStrings([trimmed])
  }

  return []
}

function distributeCounts(total: number, bucketCount: number): number[] {
  if (bucketCount <= 0) return []

  const base = Math.floor(total / bucketCount)
  const remainder = total % bucketCount

  return Array.from({ length: bucketCount }, (_, index) =>
    base + (index < remainder ? 1 : 0)
  )
}

function matchesDifficulty(
  difficulty: number | null,
  selectedDifficulty: DifficultyFilter
) {
  if (selectedDifficulty === "all") {
    return true
  }

  return difficulty === selectedDifficulty
}

function selectComprehensionRowsByPassage(
  rows: EnglishQuestionRow[],
  requestedCount: number
): EnglishQuestionRow[] {
  const grouped = new Map<number, EnglishQuestionRow[]>()

  for (const row of rows) {
    const groupKey =
      typeof row.test_id === "number" ? row.test_id : -row.id

    const existing = grouped.get(groupKey) ?? []
    existing.push(row)
    grouped.set(groupKey, existing)
  }

  const groupedEntries = shuffleArray([...grouped.entries()])
  const selected: EnglishQuestionRow[] = []

  for (const [, groupRows] of groupedEntries) {
    if (selected.length >= requestedCount) break

    const remaining = requestedCount - selected.length
    const shuffledGroupRows = shuffleArray(groupRows)
    const takeCount = Math.min(10, remaining, shuffledGroupRows.length)

    selected.push(...shuffledGroupRows.slice(0, takeCount))
  }

  return selected
}

function getQuestionGuardKey(question: NormalizedQuestion): string {
  if (
    question.sourceType === "words_vocabulary" ||
    question.sourceType === "words_spelling"
  ) {
    return `word:${String(question.sourceId)}`
  }

  return `${question.sourceType}:${String(question.sourceId)}`
}

function buildShuffledTextOptions(
  correctText: string,
  distractors: string[]
): { options: NormalizedOption[]; correctAnswer: OptionKey } | null {
  const cleanedCorrect = correctText.trim()
  if (!cleanedCorrect) return null

  const cleanedDistractors = uniqueStrings(distractors).filter(
    (item) => item.toLowerCase() !== cleanedCorrect.toLowerCase()
  )

  if (cleanedDistractors.length < 3) {
    return null
  }

  const chosenDistractors = shuffleArray(cleanedDistractors).slice(0, 3)
  const optionTexts = shuffleArray([cleanedCorrect, ...chosenDistractors]).slice(
    0,
    4
  )

  const options: NormalizedOption[] = optionTexts.map((text, index) => ({
    key: OPTION_KEYS[index],
    text,
    imageUrl: null,
  }))

  const correctOption = options.find(
    (option) => option.text?.toLowerCase() === cleanedCorrect.toLowerCase()
  )

  if (!correctOption) return null

  return {
    options,
    correctAnswer: correctOption.key,
  }
}

function normalizeVocabularyQuestions(words: WordRow[]): NormalizedQuestion[] {
  const usableWords = words.filter(
    (row) =>
      typeof row.word === "string" &&
      row.word.trim() &&
      typeof row.definition === "string" &&
      row.definition.trim()
  )

  return usableWords.flatMap((row) => {
    const word = row.word!.trim()
    const definition = row.definition!.trim()

    const distractorDefinitions = usableWords
      .filter((candidate) => candidate.id !== row.id)
      .map((candidate) => candidate.definition)

    const builtOptions = buildShuffledTextOptions(
      definition,
      uniqueStrings(distractorDefinitions)
    )

    if (!builtOptions) return []

    const question: NormalizedQuestion = {
      runnerId: `words_vocabulary:${row.id}`,
      sourceType: "words_vocabulary",
      sourceId: row.id,
      mainCategory: "english",
      topicKey: "vocabulary",
      subtopicKey: null,
      prompt: "Choose the correct definition for the word.",
      questionText: word,
      passageText: null,
      imageUrl: null,
      options: builtOptions.options,
      correctAnswer: builtOptions.correctAnswer,
      explanation: null,
      difficulty: row.difficulty,
      meta: {
        word,
      },
    }

    return [question]
  })
}

function normalizeSpellingQuestions(words: WordRow[]): NormalizedQuestion[] {
  const usableWords = words.filter(
    (row) =>
      typeof row.word === "string" &&
      row.word.trim() &&
      toStringArray(row.wrong_words).length >= 3
  )

  return usableWords.flatMap((row) => {
    const word = row.word!.trim()

    const rowWrongWords = toStringArray(row.wrong_words).filter(
      (item) => item.toLowerCase() !== word.toLowerCase()
    )

    const uniqueWrongWords = uniqueStrings(rowWrongWords).filter(
      (item) => item.toLowerCase() !== word.toLowerCase()
    )

    if (uniqueWrongWords.length < 3) {
      return []
    }

    const builtOptions = buildShuffledTextOptions(word, uniqueWrongWords)

    if (!builtOptions) return []

    const question: NormalizedQuestion = {
      runnerId: `words_spelling:${row.id}`,
      sourceType: "words_spelling",
      sourceId: row.id,
      mainCategory: "english",
      topicKey: "spelling",
      subtopicKey: null,
      prompt: "Choose the correct spelling.",
      questionText: null,
      passageText: null,
      imageUrl: null,
      options: builtOptions.options,
      correctAnswer: builtOptions.correctAnswer,
      explanation: null,
      difficulty: row.difficulty,
      meta: {
        word,
        wrongWords: uniqueWrongWords,
      },
    }

    return [question]
  })
}

function normalizeEnglishQuestions(
  rows: EnglishQuestionRow[],
  topicKey: string,
  passagesByTestId: Map<number, string>
): NormalizedQuestion[] {
  return rows.flatMap((row) => {
    if (!isOptionKey(row.correct_answer)) {
      return []
    }

    const options: NormalizedOption[] = [
      { key: "A", text: row.option_a, imageUrl: null },
      { key: "B", text: row.option_b, imageUrl: null },
      { key: "C", text: row.option_c, imageUrl: null },
      { key: "D", text: row.option_d, imageUrl: null },
    ]

    const hasAnyOptionContent = options.some(
      (option) => typeof option.text === "string" && option.text.trim()
    )

    if (!hasAnyOptionContent) {
      return []
    }

    const passageText =
      topicKey === "comprehension" && typeof row.test_id === "number"
        ? passagesByTestId.get(row.test_id) ?? null
        : null

    const question: NormalizedQuestion = {
      runnerId: `english_question:${row.id}`,
      sourceType: "english_question",
      sourceId: row.id,
      mainCategory: "english",
      topicKey,
      subtopicKey: row.subcategory,
      prompt:
        topicKey === "comprehension"
          ? "Read the passage and choose the correct answer."
          : "Choose the correct answer.",
      questionText: row.question_text,
      passageText,
      imageUrl: null,
      options,
      correctAnswer: row.correct_answer,
      explanation: row.explanation,
      difficulty: row.difficulty,
      meta: {
        main_category: row.main_category,
        subcategory: row.subcategory,
        test_id: row.test_id,
      },
    }

    return [question]
  })
}

function getSupabaseClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.")
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

async function fetchWords() {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("words")
    .select("id, word, definition, difficulty, wrong_words")
    .range(0, 9999)

  if (error) {
    throw new Error(`Could not load words: ${error.message}`)
  }

  return (data ?? []) as WordRow[]
}

async function fetchEnglishQuestions(
  topicKey: string,
  selectedSubtopics: string[]
) {
  const supabase = getSupabaseClient()

  let query = supabase
    .from("english_questions")
    .select(
      `
      id,
      test_id,
      main_category,
      subcategory,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      explanation,
      difficulty
      `
    )
    .eq("main_category", topicKey)
    .range(0, 9999)

  if (
    (topicKey === "grammar" || topicKey === "punctuation") &&
    selectedSubtopics.length > 0
  ) {
    query = query.in("subcategory", selectedSubtopics)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(
      `Could not load english_questions for ${topicKey}: ${error.message}`
    )
  }

  return (data ?? []) as EnglishQuestionRow[]
}

async function fetchEnglishPassages(testIds: number[]) {
  if (testIds.length === 0) {
    return new Map<number, string>()
  }

  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("english_tests")
    .select("id, passage")
    .in("id", testIds)

  if (error) {
    throw new Error(`Could not load english passages: ${error.message}`)
  }

  const rows = (data ?? []) as EnglishTestRow[]
  const map = new Map<number, string>()

  for (const row of rows) {
    if (
      typeof row.id === "number" &&
      typeof row.passage === "string" &&
      row.passage.trim()
    ) {
      map.set(row.id, row.passage)
    }
  }

  return map
}

function validateRequestBody(
  body: unknown
): { ok: true; data: GenerateCustomTestRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." }
  }

  const request = body as Partial<GenerateCustomTestRequest>

  if (!isMainCategory(request.mainCategory)) {
    return { ok: false, error: "Invalid main category." }
  }

  if (!Array.isArray(request.topicKeys) || request.topicKeys.length === 0) {
    return { ok: false, error: "Please select at least one topic." }
  }

  if (
    typeof request.questionCount !== "number" ||
    request.questionCount < MIN_QUESTION_COUNT ||
    request.questionCount > MAX_QUESTION_COUNT
  ) {
    return {
      ok: false,
      error: `Question count must be between ${MIN_QUESTION_COUNT} and ${MAX_QUESTION_COUNT}.`,
    }
  }

  if (
    typeof request.totalTimeMinutes !== "number" ||
    request.totalTimeMinutes < MIN_TIME_MINUTES ||
    request.totalTimeMinutes > MAX_TIME_MINUTES
  ) {
    return {
      ok: false,
      error: `Total time must be between ${MIN_TIME_MINUTES} and ${MAX_TIME_MINUTES} minutes.`,
    }
  }

  const selectedDifficulty: DifficultyFilter =
    request.selectedDifficulty === 1 ||
    request.selectedDifficulty === 2 ||
    request.selectedDifficulty === 3
      ? request.selectedDifficulty
      : "all"

  return {
    ok: true,
    data: {
      mainCategory: request.mainCategory,
      topicKeys: request.topicKeys,
      subtopicMap:
        request.subtopicMap && typeof request.subtopicMap === "object"
          ? request.subtopicMap
          : {},
      questionCount: request.questionCount,
      totalTimeMinutes: request.totalTimeMinutes,
      selectedDifficulty,
    },
  }
}

function validateTopicSelection(
  request: GenerateCustomTestRequest
): { ok: true } | { ok: false; error: string } {
  const catalog = getMainCategoryCatalog(request.mainCategory)

  if (!catalog || !catalog.enabled) {
    return { ok: false, error: "This main category is not enabled." }
  }

  const uniqueTopicKeys = Array.from(new Set(request.topicKeys))

  for (const topicKey of uniqueTopicKeys) {
    const topic = catalog.topics.find((item) => item.key === topicKey)

    if (!topic || topic.enabled === false) {
      return { ok: false, error: `Invalid topic selected: ${topicKey}` }
    }

    const rawSubtopics = request.subtopicMap[topicKey]
    const selectedSubtopics = Array.isArray(rawSubtopics)
      ? rawSubtopics.filter((value): value is string => typeof value === "string")
      : []

    if (!topic.childSubtopics || topic.childSubtopics.length === 0) {
      if (selectedSubtopics.length > 0) {
        return {
          ok: false,
          error: `Topic "${topic.label}" does not support subtopic filtering.`,
        }
      }

      continue
    }

    const allowedSubtopicKeys = new Set(
      topic.childSubtopics.map((subtopic) => subtopic.key)
    )

    for (const subtopicKey of selectedSubtopics) {
      if (!allowedSubtopicKeys.has(subtopicKey)) {
        return {
          ok: false,
          error: `Invalid subtopic "${subtopicKey}" for topic "${topic.label}".`,
        }
      }
    }
  }

  return { ok: true }
}

function selectFinalQuestions(
  topicPools: TopicPool[],
  questionCount: number
): NormalizedQuestion[] {
  const preparedPools = topicPools.map((pool) => ({
    topicKey: pool.topicKey,
    questions:
      pool.topicKey === "comprehension"
        ? [...pool.questions]
        : shuffleArray(pool.questions),
  }))

  const perTopicTargets = distributeCounts(questionCount, preparedPools.length)
  const selectedBuckets: NormalizedQuestion[][] = preparedPools.map(() => [])

  const selectedRunnerIds = new Set<string>()
  const selectedGuardKeys = new Set<string>()

  preparedPools.forEach((pool, poolIndex) => {
    const target = perTopicTargets[poolIndex] ?? 0
    let pickedForThisTopic = 0

    for (const question of pool.questions) {
      if (pickedForThisTopic >= target) break

      const guardKey = getQuestionGuardKey(question)

      if (
        selectedRunnerIds.has(question.runnerId) ||
        selectedGuardKeys.has(guardKey)
      ) {
        continue
      }

      selectedBuckets[poolIndex].push(question)
      selectedRunnerIds.add(question.runnerId)
      selectedGuardKeys.add(guardKey)
      pickedForThisTopic += 1
    }
  })

  const leftovers = shuffleArray(
    preparedPools.flatMap((pool, poolIndex) =>
      pool.questions
        .filter((question) => !selectedRunnerIds.has(question.runnerId))
        .map((question) => ({
          question,
          poolIndex,
        }))
    )
  )

  for (const item of leftovers) {
    if (selectedRunnerIds.size >= questionCount) break

    const guardKey = getQuestionGuardKey(item.question)

    if (
      selectedRunnerIds.has(item.question.runnerId) ||
      selectedGuardKeys.has(guardKey)
    ) {
      continue
    }

    selectedBuckets[item.poolIndex].push(item.question)
    selectedRunnerIds.add(item.question.runnerId)
    selectedGuardKeys.add(guardKey)
  }

  return selectedBuckets.flat()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedBody = validateRequestBody(body)

    if (!validatedBody.ok) {
      return jsonError(validatedBody.error, 400)
    }

    const config = validatedBody.data

    if (config.mainCategory !== "english") {
      return jsonError(
        "Only English custom tests are enabled in this first MVP.",
        400
      )
    }

    const selectionValidation = validateTopicSelection(config)

    if (!selectionValidation.ok) {
      return jsonError(selectionValidation.error, 400)
    }

    const uniqueTopicKeys = Array.from(new Set(config.topicKeys))
    const topicTargets = distributeCounts(config.questionCount, uniqueTopicKeys.length)
    const targetByTopic = new Map<string, number>(
      uniqueTopicKeys.map((topicKey, index) => [topicKey, topicTargets[index] ?? 0])
    )

    const needsWords =
      uniqueTopicKeys.includes("vocabulary") ||
      uniqueTopicKeys.includes("spelling")

    const words = needsWords
      ? (await fetchWords()).filter((row) =>
          matchesDifficulty(row.difficulty, config.selectedDifficulty)
        )
      : []

    const topicPools: TopicPool[] = []

    for (const topicKey of uniqueTopicKeys) {
      if (topicKey === "vocabulary") {
        const questions = normalizeVocabularyQuestions(words)
        topicPools.push({ topicKey, questions })
        continue
      }

      if (topicKey === "spelling") {
        const questions = normalizeSpellingQuestions(words)
        topicPools.push({ topicKey, questions })
        continue
      }

      if (
        topicKey === "comprehension" ||
        topicKey === "grammar" ||
        topicKey === "punctuation"
      ) {
        const selectedSubtopics = Array.isArray(config.subtopicMap[topicKey])
          ? config.subtopicMap[topicKey].filter(
              (value): value is string => typeof value === "string"
            )
          : []

        const rows = (await fetchEnglishQuestions(topicKey, selectedSubtopics)).filter(
          (row) => matchesDifficulty(row.difficulty, config.selectedDifficulty)
        )

        if (topicKey === "comprehension") {
          const requestedForComprehension =
            targetByTopic.get(topicKey) ?? config.questionCount

          const comprehensionPoolSize = Math.min(
            rows.length,
            requestedForComprehension + 10
          )

          const selectedRows = selectComprehensionRowsByPassage(
            rows,
            comprehensionPoolSize
          )

          const passagesByTestId = await fetchEnglishPassages(
            Array.from(
              new Set(
                selectedRows
                  .map((row) => row.test_id)
                  .filter((id): id is number => typeof id === "number")
              )
            )
          )

          const questions = normalizeEnglishQuestions(
            selectedRows,
            topicKey,
            passagesByTestId
          )

          topicPools.push({ topicKey, questions })
          continue
        }

        const questions = normalizeEnglishQuestions(
          rows,
          topicKey,
          new Map<number, string>()
        )

        topicPools.push({ topicKey, questions })
        continue
      }

      return jsonError(`Topic "${topicKey}" is not supported yet.`, 400)
    }

    const totalAvailable = topicPools.reduce(
      (sum, pool) => sum + pool.questions.length,
      0
    )

    if (totalAvailable === 0) {
      return jsonError(
        "No questions were found for the selected English topics.",
        400
      )
    }

    const finalQuestions = selectFinalQuestions(topicPools, config.questionCount)

    if (finalQuestions.length < config.questionCount) {
      return jsonError(
        `Only ${finalQuestions.length} questions are currently available for this custom test setup. Please reduce the question count, change difficulty, or choose more topics.`,
        400
      )
    }

    const response: GenerateCustomTestResponse = {
      ok: true,
      data: {
        testSessionId: crypto.randomUUID(),
        config,
        questions: finalQuestions,
        createdAt: new Date().toISOString(),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error while generating custom test."

    return jsonError(message, 500)
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "Method not allowed. Use POST.",
    },
    { status: 405 }
  )
}