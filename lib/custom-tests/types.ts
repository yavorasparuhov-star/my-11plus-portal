export type MainCategory = "english" | "math" | "vr" | "nvr"

export type OptionKey = "A" | "B" | "C" | "D"

export type QuestionSourceType =
  | "words_vocabulary"
  | "words_spelling"
  | "english_question"
  | "math_question"
  | "vr_question"
  | "nvr_question"

export type TopicSourceKind =
  | "words_vocabulary"
  | "words_spelling"
  | "english_questions"
  | "math"
  | "vr"
  | "nvr"

export type DifficultyFilter = "all" | 1 | 2 | 3

export type TopicSubcategory = {
  key: string
  label: string
}

export type TopicCatalogItem = {
  key: string
  label: string
  mainCategory: MainCategory
  sourceKind: TopicSourceKind
  description?: string
  childSubtopics?: TopicSubcategory[]
  enabled?: boolean
}

export type MainCategoryCatalog = {
  key: MainCategory
  label: string
  enabled: boolean
  topics: TopicCatalogItem[]
}

export type BuilderSubtopicMap = Record<string, string[]>

export type CustomTestBuilderConfig = {
  mainCategory: MainCategory
  topicKeys: string[]
  subtopicMap: BuilderSubtopicMap
  questionCount: number
  totalTimeMinutes: number
  selectedDifficulty: DifficultyFilter
}

export type NormalizedOption = {
  key: OptionKey
  text?: string | null
  imageUrl?: string | null
}

export type NormalizedQuestion = {
  runnerId: string
  sourceType: QuestionSourceType
  sourceId: number | string

  mainCategory: MainCategory
  topicKey: string
  subtopicKey?: string | null

  prompt: string
  questionText?: string | null
  passageText?: string | null
  imageUrl?: string | null

  options: NormalizedOption[]
  correctAnswer: OptionKey
  explanation?: string | null

  difficulty?: number | null
  meta?: Record<string, unknown>
}

export type GeneratedCustomTest = {
  testSessionId: string
  config: CustomTestBuilderConfig
  questions: NormalizedQuestion[]
  createdAt: string
}

export type GenerateCustomTestRequest = CustomTestBuilderConfig

export type GenerateCustomTestResponse =
  | {
      ok: true
      data: GeneratedCustomTest
    }
  | {
      ok: false
      error: string
    }

export type CustomTestAttemptSummary = {
  id: string
  user_id: string
  main_category: MainCategory
  status: "in_progress" | "completed" | "abandoned"
  config: CustomTestBuilderConfig
  question_count: number
  time_limit_seconds: number
  time_taken_seconds: number | null
  correct_answers: number
  score_percent: number
  started_at: string
  completed_at: string | null
  created_at: string
}

export type CustomTestAttemptItem = {
  id: string
  attempt_id: string
  user_id: string
  question_index: number
  main_category: MainCategory
  source_type: string
  source_id: string
  topic_key: string
  subtopic_key: string | null
  question_snapshot: NormalizedQuestion
  selected_answer: OptionKey | null
  correct_answer: OptionKey
  is_correct: boolean
  created_at: string
}