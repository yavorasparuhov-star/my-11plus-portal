import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getMainCategoryCatalog } from "../../../../lib/custom-tests/catalog"
import type {
  DifficultyFilter,
  GenerateCustomTestRequest,
  MainCategory,
  NormalizedOption,
  NormalizedQuestion,
  OptionKey,
  QuestionSourceType,
} from "../../../../lib/custom-tests/types"

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"]
const MAX_QUESTION_COUNT = 60
const MIN_QUESTION_COUNT = 5
const MAX_TIME_MINUTES = 120
const MIN_TIME_MINUTES = 1
const DAILY_DOWNLOAD_LIMIT_PER_MAIN_CATEGORY = 2

type NonEnglishMainCategory = Exclude<MainCategory, "english">

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

type StandardTestRow = {
  id: number
  title: string | null
  category: string | null
  difficulty: number | null
}

type StandardQuestionRow = {
  id: number
  test_id: number | null
  question_text: string | null
  image_url?: string | null
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  option_a_image_url?: string | null
  option_b_image_url?: string | null
  option_c_image_url?: string | null
  option_d_image_url?: string | null
  correct_answer: string | null
  explanation: string | null
  question_order: number | null
}

type TopicPool = {
  topicKey: string
  questions: NormalizedQuestion[]
}

type PreviousCustomTestItemRow = {
  source_type: string | null
  source_id: number | null
}

type StandardTableConfig = {
  testsTable: string
  questionsTable: string
  questionSelect: string
  sourceType: QuestionSourceType
}

const STANDARD_TABLE_CONFIG: Record<NonEnglishMainCategory, StandardTableConfig> =
  {
    math: {
  testsTable: "math_tests",
  questionsTable: "math_questions",
  questionSelect: `
    id,
    test_id,
    question_text,
    image_url,
    option_a,
    option_b,
    option_c,
    option_d,
    option_a_image_url,
    option_b_image_url,
    option_c_image_url,
    option_d_image_url,
    correct_answer,
    explanation,
    question_order
  `,
  sourceType: "math_question",
},
    vr: {
      testsTable: "vr_tests",
      questionsTable: "vr_questions",
      questionSelect: `
      id,
      test_id,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      explanation,
      question_order
    `,
      sourceType: "vr_question",
    },
    nvr: {
      testsTable: "nvr_tests",
      questionsTable: "nvr_questions",
      questionSelect: `
      id,
      test_id,
      question_text,
      image_url,
      option_a,
      option_b,
      option_c,
      option_d,
      option_a_image_url,
      option_b_image_url,
      option_c_image_url,
      option_d_image_url,
      correct_answer,
      explanation,
      question_order
    `,
      sourceType: "nvr_question",
    },
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

function toOptionKey(value: unknown): OptionKey | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toUpperCase()
  return isOptionKey(normalized) ? normalized : null
}

type DownloadCustomTestData = {
  testSessionId: string
  attemptId: string
  config: GenerateCustomTestRequest
  questions: NormalizedQuestion[]
  createdAt: string
  dailyLimit: number
  downloadsUsedToday: number
}

type DownloadCustomTestResponse =
  | { ok: true; data: DownloadCustomTestData }
  | { ok: false; error: string }

function jsonError(error: string, status = 400) {
  return NextResponse.json<DownloadCustomTestResponse>(
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
    const groupKey = typeof row.test_id === "number" ? row.test_id : -row.id

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

function getPreviousItemGuardKey(
  sourceType: string | null,
  sourceId: number | null
): string | null {
  if (!sourceType || typeof sourceId !== "number") {
    return null
  }

  if (sourceType === "words_vocabulary" || sourceType === "words_spelling") {
    return `word:${String(sourceId)}`
  }

  return `${sourceType}:${String(sourceId)}`
}

function isQuestionPreviouslyUsed(
  question: NormalizedQuestion,
  previouslyUsedGuardKeys: Set<string>
): boolean {
  return previouslyUsedGuardKeys.has(getQuestionGuardKey(question))
}

function splitQuestionsFreshFirst(
  questions: NormalizedQuestion[],
  previouslyUsedGuardKeys: Set<string>
): NormalizedQuestion[] {
  const uniqueByGuardKey = new Map<string, NormalizedQuestion>()

  for (const question of questions) {
    const guardKey = getQuestionGuardKey(question)

    if (!uniqueByGuardKey.has(guardKey)) {
      uniqueByGuardKey.set(guardKey, question)
    }
  }

  const uniqueQuestions = Array.from(uniqueByGuardKey.values())
  const freshQuestions = uniqueQuestions.filter(
    (question) => !isQuestionPreviouslyUsed(question, previouslyUsedGuardKeys)
  )
  const reusedQuestions = uniqueQuestions.filter((question) =>
    isQuestionPreviouslyUsed(question, previouslyUsedGuardKeys)
  )

  return [...shuffleArray(freshQuestions), ...shuffleArray(reusedQuestions)]
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
    const correctAnswer = toOptionKey(row.correct_answer)

    if (!correctAnswer) {
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
      correctAnswer,
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

function normalizeCategoryValue(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
}

function getStandardTopicCategoryCandidates(
  mainCategory: NonEnglishMainCategory,
  topicKey: string
): string[] {
  const baseCandidates = [
    topicKey,
    topicKey.replace(/-/g, "_"),
    topicKey.replace(/-/g, " "),
  ]

  let extraCandidates: string[] = []

  if (mainCategory === "math") {
    switch (topicKey) {
      case "arithmetic":
        extraCandidates = []
        break
      case "fractions-decimals-percentages":
        extraCandidates = [
          "fractions",
          "decimals",
          "percentages",
          "fractions_decimals_percentages",
        ]
        break
      case "algebra-reasoning":
        extraCandidates = ["algebra", "algebra_reasoning"]
        break
      case "geometry-measurement":
        extraCandidates = ["geometry", "measurement", "geometry_measurement"]
        break
      case "ratio-proportion":
        extraCandidates = [
          "ratio",
          "proportion",
          "ratios-proportions",
          "ratios_proportions",
          "ratio_proportion",
        ]
        break
      case "word-problems":
        extraCandidates = [
          "problem-solving",
          "problem_solving",
          "word problems",
          "problem solving",
        ]
        break
    }
  }

  if (mainCategory === "vr") {
    switch (topicKey) {
      case "word-relationships":
        extraCandidates = [
          "word_relationships",
          "word relationship",
          "word_relationship",
        ]
        break
      case "codes-logic":
        extraCandidates = ["codes_logic", "codes logic"]
        break
      case "sequence-pattern":
        extraCandidates = ["sequence_pattern", "sequence pattern"]
        break
    }
  }

  if (mainCategory === "nvr") {
    switch (topicKey) {
      case "shape-patterns":
        extraCandidates = ["shape-pattern", "shape_patterns", "shape_pattern"]
        break
      case "rotations-reflections":
        extraCandidates = [
          "rotation-reflection",
          "rotation_reflection",
          "rotations_reflections",
        ]
        break
      case "codes-spatial-logic":
        extraCandidates = [
          "code-spatial-logic",
          "code_spatial_logic",
          "spatial-logic",
          "spatial_logic",
          "codes_spatial_logic",
        ]
        break
    }
  }

  return uniqueStrings([...baseCandidates, ...extraCandidates]).map(
    normalizeCategoryValue
  )
}

function getStandardTableConfig(
  mainCategory: NonEnglishMainCategory
): StandardTableConfig {
  return STANDARD_TABLE_CONFIG[mainCategory]
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

function getAuthenticatedSupabaseClient(request: NextRequest) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.")
  }

  const authorization = request.headers.get("authorization")

  if (!authorization) {
    return {
      supabase: null,
      error: "Please sign in to use custom tests.",
    }
  }

  return {
    supabase: createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    }),
    error: null,
  }
}

async function fetchWords(supabase: ReturnType<typeof getSupabaseClient>) {
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
  supabase: ReturnType<typeof getSupabaseClient>,
  topicKey: string,
  selectedSubtopics: string[]
) {
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

async function fetchEnglishPassages(
  supabase: ReturnType<typeof getSupabaseClient>,
  testIds: number[]
) {
  if (testIds.length === 0) {
    return new Map<number, string>()
  }

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

async function fetchStandardTestsForTopic(
  supabase: ReturnType<typeof getSupabaseClient>,
  mainCategory: NonEnglishMainCategory,
  topicKey: string
) {
  const config = getStandardTableConfig(mainCategory)
  const allowedCategories = new Set(
    getStandardTopicCategoryCandidates(mainCategory, topicKey)
  )

  const { data, error } = await supabase
    .from(config.testsTable)
    .select("id, title, category, difficulty")
    .range(0, 9999)

  if (error) {
    throw new Error(`Could not load ${mainCategory} tests: ${error.message}`)
  }

  const rows = (data ?? []) as StandardTestRow[]

  return rows.filter((row) =>
    allowedCategories.has(normalizeCategoryValue(row.category))
  )
}

async function fetchStandardQuestions(
  supabase: ReturnType<typeof getSupabaseClient>,
  mainCategory: NonEnglishMainCategory,
  testIds: number[]
) {
  if (testIds.length === 0) {
    return [] as StandardQuestionRow[]
  }

  const config = getStandardTableConfig(mainCategory)

  const { data, error } = await supabase
    .from(config.questionsTable)
    .select(config.questionSelect)
    .in("test_id", testIds)
    .order("test_id", { ascending: true })
    .order("question_order", { ascending: true })

  if (error) {
    throw new Error(`Could not load ${mainCategory} questions: ${error.message}`)
  }

  return (data ?? []) as unknown as StandardQuestionRow[]
}

async function fetchPreviouslyUsedQuestionGuardKeys(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  mainCategory: MainCategory
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("custom_test_attempt_items")
    .select("source_type, source_id")
    .eq("user_id", userId)
    .eq("main_category", mainCategory)
    .range(0, 9999)

  if (error) {
    console.error("Failed to fetch previous custom test questions:", error)
    return new Set<string>()
  }

  const rows = (data ?? []) as PreviousCustomTestItemRow[]
  const guardKeys = rows
    .map((row) => getPreviousItemGuardKey(row.source_type, row.source_id))
    .filter((key): key is string => typeof key === "string" && key.length > 0)

  return new Set(guardKeys)
}

function normalizeStandardQuestions(
  mainCategory: NonEnglishMainCategory,
  topicKey: string,
  rows: StandardQuestionRow[],
  testsById: Map<number, StandardTestRow>
): NormalizedQuestion[] {
  const config = getStandardTableConfig(mainCategory)

  return rows.flatMap((row) => {
    if (typeof row.test_id !== "number") {
      return []
    }

    const parentTest = testsById.get(row.test_id)
    const correctAnswer = toOptionKey(row.correct_answer)

    if (!correctAnswer) {
      return []
    }

    const options: NormalizedOption[] = [
      {
        key: "A",
        text: row.option_a,
        imageUrl: row.option_a_image_url ?? null,
      },
      {
        key: "B",
        text: row.option_b,
        imageUrl: row.option_b_image_url ?? null,
      },
      {
        key: "C",
        text: row.option_c,
        imageUrl: row.option_c_image_url ?? null,
      },
      {
        key: "D",
        text: row.option_d,
        imageUrl: row.option_d_image_url ?? null,
      },
    ]

    const hasAnyOptionContent = options.some(
      (option) =>
        (typeof option.text === "string" && option.text.trim()) ||
        (typeof option.imageUrl === "string" && option.imageUrl.trim())
    )

    if (!hasAnyOptionContent) {
      return []
    }

    const hasQuestionImage =
      typeof row.image_url === "string" && row.image_url.trim()

    const hasOptionImages = options.some(
      (option) =>
        typeof option.imageUrl === "string" && option.imageUrl.trim()
    )

    const question: NormalizedQuestion = {
      runnerId: `${config.sourceType}:${row.id}`,
      sourceType: config.sourceType,
      sourceId: row.id,
      mainCategory,
      topicKey,
      subtopicKey: null,
      prompt:
        hasQuestionImage || hasOptionImages
          ? "Study the image and choose the correct answer."
          : "Choose the correct answer.",
      questionText: row.question_text,
      passageText: null,
      imageUrl: row.image_url ?? null,
      options,
      correctAnswer,
      explanation: row.explanation,
      difficulty: parentTest?.difficulty ?? null,
      meta: {
        test_id: row.test_id,
        test_title: parentTest?.title ?? null,
        category: parentTest?.category ?? null,
        question_order: row.question_order,
      },
    }

    return [question]
  })
}

async function buildStandardTopicQuestions(
  supabase: ReturnType<typeof getSupabaseClient>,
  mainCategory: NonEnglishMainCategory,
  topicKey: string,
  selectedDifficulty: DifficultyFilter
) {
  const tests = await fetchStandardTestsForTopic(
    supabase,
    mainCategory,
    topicKey
  )

  const filteredTests = tests.filter((test) =>
    matchesDifficulty(test.difficulty, selectedDifficulty)
  )

  if (filteredTests.length === 0) {
    return [] as NormalizedQuestion[]
  }

  const testsById = new Map<number, StandardTestRow>(
    filteredTests.map((test) => [test.id, test])
  )

  const questions = await fetchStandardQuestions(
    supabase,
    mainCategory,
    filteredTests.map((test) => test.id)
  )

  return normalizeStandardQuestions(
    mainCategory,
    topicKey,
    questions,
    testsById
  )
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
  questionCount: number,
  previouslyUsedGuardKeys: Set<string>
): NormalizedQuestion[] {
  const preparedPools = topicPools.map((pool) => ({
    topicKey: pool.topicKey,
    questions: splitQuestionsFreshFirst(pool.questions, previouslyUsedGuardKeys),
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

  const leftoverItems = preparedPools.flatMap((pool, poolIndex) =>
    pool.questions
      .filter((question) => !selectedRunnerIds.has(question.runnerId))
      .map((question) => ({
        question,
        poolIndex,
      }))
  )

  const leftoverFreshItems = shuffleArray(
    leftoverItems.filter(
      (item) => !isQuestionPreviouslyUsed(item.question, previouslyUsedGuardKeys)
    )
  )
  const leftoverReusedItems = shuffleArray(
    leftoverItems.filter((item) =>
      isQuestionPreviouslyUsed(item.question, previouslyUsedGuardKeys)
    )
  )

  const leftovers = [...leftoverFreshItems, ...leftoverReusedItems]

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


function getStartOfTodayIso() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString()
}

async function countDownloadsToday(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  mainCategory: MainCategory
): Promise<number> {
  const { count, error } = await supabase
    .from("custom_test_downloads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("main_category", mainCategory)
    .gte("downloaded_at", getStartOfTodayIso())

  if (error) {
    throw new Error(`Could not check today's download limit: ${error.message}`)
  }

  return count ?? 0
}

async function createDownloadedCustomTestAttempt(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  config: GenerateCustomTestRequest,
  questions: NormalizedQuestion[]
): Promise<string> {
  const nowIso = new Date().toISOString()

  const { data: attempt, error: attemptError } = await supabase
    .from("custom_test_attempts")
    .insert({
      user_id: userId,
      main_category: config.mainCategory,
      status: "downloaded",
      config,
      question_count: questions.length,
      time_limit_seconds: config.totalTimeMinutes * 60,
      started_at: nowIso,
      completed_at: nowIso,
      time_taken_seconds: null,
      correct_answers: null,
      score_percent: null,
    })
    .select("id")
    .single()

  if (attemptError || !attempt?.id) {
    throw new Error(
      `Could not create downloaded custom test attempt: ${attemptError?.message ?? "Missing attempt id."}`
    )
  }

  const attemptId = String(attempt.id)

  const attemptItems = questions.map((question, index) => ({
    attempt_id: attemptId,
    user_id: userId,
    question_index: index + 1,
    main_category: question.mainCategory,
    source_type: question.sourceType,
    source_id: question.sourceId,
    topic_key: question.topicKey,
    subtopic_key: question.subtopicKey,
    question_snapshot: question,
    selected_answer: null,
    correct_answer: question.correctAnswer,
    is_correct: null,
  }))

  const { error: itemsError } = await supabase
    .from("custom_test_attempt_items")
    .insert(attemptItems)

  if (itemsError) {
    throw new Error(
      `Could not save downloaded custom test questions: ${itemsError.message}`
    )
  }

  const { error: downloadError } = await supabase
    .from("custom_test_downloads")
    .insert({
      user_id: userId,
      attempt_id: attemptId,
      main_category: config.mainCategory,
      question_count: questions.length,
      filters: config,
      downloaded_at: nowIso,
    })

  if (downloadError) {
    throw new Error(`Could not log custom test download: ${downloadError.message}`)
  }

  return attemptId
}

async function buildDownloadResponse(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  config: GenerateCustomTestRequest,
  finalQuestions: NormalizedQuestion[],
  downloadsUsedBeforeThisOne: number
) {
  const attemptId = await createDownloadedCustomTestAttempt(
    supabase,
    userId,
    config,
    finalQuestions
  )

  const response: DownloadCustomTestResponse = {
    ok: true,
    data: {
      testSessionId: crypto.randomUUID(),
      attemptId,
      config,
      questions: finalQuestions,
      createdAt: new Date().toISOString(),
      dailyLimit: DAILY_DOWNLOAD_LIMIT_PER_MAIN_CATEGORY,
      downloadsUsedToday: downloadsUsedBeforeThisOne + 1,
    },
  }

  return NextResponse.json(response)
}

export async function POST(request: NextRequest) {
  console.log("CUSTOM TEST DOWNLOAD ROUTE HIT")

  try {
    const authenticatedClient = getAuthenticatedSupabaseClient(request)

    if (!authenticatedClient.supabase) {
      return jsonError(authenticatedClient.error, 401)
    }

    const supabase = authenticatedClient.supabase

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return jsonError("Please sign in to use custom tests.", 401)
    }

    const { data: hasPaidAccess, error: accessError } =
      await supabase.rpc("has_paid_access")

    if (accessError) {
      return jsonError("Could not check your membership access.", 500)
    }

    if (!hasPaidAccess) {
      return jsonError(
        "Custom tests are available for monthly and annual members only.",
        403
      )
    }

    const body = await request.json()
    const validatedBody = validateRequestBody(body)

    if (!validatedBody.ok) {
      return jsonError(validatedBody.error, 400)
    }

    const config = validatedBody.data
    const selectionValidation = validateTopicSelection(config)

    if (!selectionValidation.ok) {
      return jsonError(selectionValidation.error, 400)
    }

    const uniqueTopicKeys = Array.from(new Set(config.topicKeys))
    const catalog = getMainCategoryCatalog(config.mainCategory)
    const mainCategoryLabel = catalog?.label ?? config.mainCategory.toUpperCase()
    const previouslyUsedGuardKeys = await fetchPreviouslyUsedQuestionGuardKeys(
      supabase,
      user.id,
      config.mainCategory
    )

    const downloadsUsedToday = await countDownloadsToday(
      supabase,
      user.id,
      config.mainCategory
    )

    if (downloadsUsedToday >= DAILY_DOWNLOAD_LIMIT_PER_MAIN_CATEGORY) {
      return jsonError(
        `You have reached today's download limit for ${mainCategoryLabel}. You can download up to ${DAILY_DOWNLOAD_LIMIT_PER_MAIN_CATEGORY} custom tests per subject per day.`,
        429
      )
    }

    if (config.mainCategory === "english") {
      const topicTargets = distributeCounts(
        config.questionCount,
        uniqueTopicKeys.length
      )

      const targetByTopic = new Map<string, number>(
        uniqueTopicKeys.map((topicKey, index) => [
          topicKey,
          topicTargets[index] ?? 0,
        ])
      )

      const needsWords =
        uniqueTopicKeys.includes("vocabulary") ||
        uniqueTopicKeys.includes("spelling")

      const words = needsWords
        ? (await fetchWords(supabase)).filter((row) =>
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

          const rows = (
            await fetchEnglishQuestions(supabase, topicKey, selectedSubtopics)
          ).filter((row) =>
            matchesDifficulty(row.difficulty, config.selectedDifficulty)
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
              supabase,
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

      const finalQuestions = selectFinalQuestions(
        topicPools,
        config.questionCount,
        previouslyUsedGuardKeys
      )

      if (finalQuestions.length < config.questionCount) {
        return jsonError(
          `Only ${finalQuestions.length} questions are currently available for this custom test setup. Please reduce the question count, change difficulty, or choose more topics.`,
          400
        )
      }

      return buildDownloadResponse(
        supabase,
        user.id,
        config,
        finalQuestions,
        downloadsUsedToday
      )
    }

    const nonEnglishMainCategory = config.mainCategory as NonEnglishMainCategory
    const topicPools: TopicPool[] = []

    for (const topicKey of uniqueTopicKeys) {
      const questions = await buildStandardTopicQuestions(
        supabase,
        nonEnglishMainCategory,
        topicKey,
        config.selectedDifficulty
      )

      topicPools.push({ topicKey, questions })
    }

    const totalAvailable = topicPools.reduce(
      (sum, pool) => sum + pool.questions.length,
      0
    )

    if (totalAvailable === 0) {
      return jsonError(
        `No questions were found for the selected ${mainCategoryLabel} topics.`,
        400
      )
    }

    const finalQuestions = selectFinalQuestions(
      topicPools,
      config.questionCount,
      previouslyUsedGuardKeys
    )

    if (finalQuestions.length < config.questionCount) {
      return jsonError(
        `Only ${finalQuestions.length} questions are currently available for this custom test setup. Please reduce the question count, change difficulty, or choose more topics.`,
        400
      )
    }

    return buildDownloadResponse(
      supabase,
      user.id,
      config,
      finalQuestions,
      downloadsUsedToday
    )
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