"use client"

import type { CSSProperties, ReactNode } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabaseClient"
import { EnglishIcon } from "../../../../components/icons/PortalIcons"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts"
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent"

type VocabularyProgressRow = {
  id: string | number
  user_id: string
  total_words_practiced: number
  correct_answers: number
  success_rate: number
  difficulty: number | null
  created_at: string
}

type SpellingProgressRow = {
  id: string | number
  user_id: string
  total_words_practiced: number
  correct_answers: number
  success_rate: number
  difficulty: number | null
  created_at: string
}

type EnglishSharedProgressRow = {
  id: string | number
  user_id: string
  test_id: number | null
  main_category: string
  subcategory: string | null
  total_questions: number
  correct_answers: number
  success_rate: number
  difficulty: number | null
  created_at: string
}

type CustomEnglishAttemptRow = {
  id: string
  main_category: string | null
  status: string | null
  config: unknown
  question_count: number | null
  correct_answers: number | null
  score_percent: number | null
  completed_at: string | null
  created_at: string
}

type CustomEnglishAttemptItemRow = {
  attempt_id: string
  question_index: number
  main_category: string | null
  topic_key: string | null
  subtopic_key: string | null
  selected_answer: string | null
  correct_answer: string | null
  is_correct: boolean | null
  question_snapshot: unknown
}

type EnglishBenchmarkRpcRow = {
  difficulty: number
  average_success: number
}

type EnglishProgressCategory =
  | "vocabulary"
  | "spelling"
  | "comprehension"
  | "primary_word_classes"
  | "sentence_structure_syntax"
  | "advanced_punctuation"
  | "apostrophes"
  | "comma"
  | "direct_speech_punctuation"
  | "sentence_punctuation"

type EnglishProgressRow = {
  id: string
  category: EnglishProgressCategory
  total_questions: number
  correct_answers: number
  success_rate: number
  difficulty: number | null
  created_at: string
}

type TimeFilter = "7d" | "30d" | "90d" | "all"
type DifficultyFilter = "all" | "1" | "2" | "3"

type CategoryFilter =
  | "all"
  | "vocabulary"
  | "spelling"
  | "comprehension"
  | "primary_word_classes"
  | "sentence_structure_syntax"
  | "advanced_punctuation"
  | "apostrophes"
  | "comma"
  | "direct_speech_punctuation"
  | "sentence_punctuation"

const MIN_BENCHMARK_ATTEMPTS = 30
const STRONG_TARGET_PERCENT = 80
const TIME_FILTER_DAYS: Record<Exclude<TimeFilter, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
}

const timeOptions: { value: TimeFilter; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
]

const difficultyOptions: { value: DifficultyFilter; label: string }[] = [
  { value: "all", label: "All Levels" },
  { value: "1", label: "Easy" },
  { value: "2", label: "Medium" },
  { value: "3", label: "Hard" },
]

const categoryOptions: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "spelling", label: "Spelling" },
  { value: "comprehension", label: "Comprehension" },
  { value: "primary_word_classes", label: "Primary Word Classes" },
  { value: "sentence_structure_syntax", label: "Sentence Structure & Syntax" },
  { value: "advanced_punctuation", label: "Advanced Punctuation" },
  { value: "apostrophes", label: "Apostrophes" },
  { value: "comma", label: "Comma" },
  { value: "direct_speech_punctuation", label: "Direct Speech Punctuation" },
  { value: "sentence_punctuation", label: "Sentence Punctuation" },
]

function getCutoffDate(filter: TimeFilter) {
  if (filter === "all") return null

  const now = new Date()

  now.setDate(now.getDate() - TIME_FILTER_DAYS[filter])
  return now
}

function getBenchmarkDays(filter: TimeFilter) {
  if (filter === "all") return null
  return TIME_FILTER_DAYS[filter]
}

function getBenchmarkPeriodLabel(filter: TimeFilter) {
  if (filter === "7d") return "last 7 days"
  if (filter === "30d") return "last 30 days"
  if (filter === "90d") return "last 90 days"
  return "all time"
}

function getLevelLabel(level: number | null | undefined) {
  if (level === 1) return "Easy"
  if (level === 2) return "Medium"
  if (level === 3) return "Hard"
  return "Not set"
}

function getCategoryLabel(category: string) {
  if (category === "vocabulary") return "Vocabulary"
  if (category === "spelling") return "Spelling"
  if (category === "comprehension") return "Comprehension"
  if (category === "primary_word_classes") return "Primary Word Classes"
  if (category === "sentence_structure_syntax") return "Sentence Structure & Syntax"
  if (category === "advanced_punctuation") return "Advanced Punctuation"
  if (category === "apostrophes") return "Apostrophes"
  if (category === "comma") return "Comma"
  if (category === "direct_speech_punctuation") return "Direct Speech Punctuation"
  if (category === "sentence_punctuation") return "Sentence Punctuation"
  return "Not set"
}

function getBenchmarkStatus(accuracy: number) {
  if (accuracy >= 90) {
    return "Excellent work — keep challenging yourself."
  }

  if (accuracy >= STRONG_TARGET_PERCENT) {
    return "Strong progress — keep going."
  }

  if (accuracy >= 65) {
    return "You are on track. Keep practising to reach the strong target."
  }

  if (accuracy >= 50) {
    return "You are building confidence. A little more practice will help."
  }

  return "This area needs more practice. Keep going step by step."
}

function formatDateTime(value: string) {
  const date = new Date(value)

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatShortDate(value: string) {
  const date = new Date(value)

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })
}

function toNumericValue(value: ValueType | undefined) {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  if (Array.isArray(value)) return Number(value[0])
  return 0
}

function createTooltipFormatter(label: string, suffix = "") {
  return (
    value: ValueType | undefined,
    _name: NameType | undefined
  ): [string, string] => {
    const numericValue = toNumericValue(value)
    return [`${numericValue}${suffix}`, label]
  }
}

const successTooltipFormatter = createTooltipFormatter("Success", "%")
const averageSuccessTooltipFormatter = createTooltipFormatter(
  "Average Success",
  "%"
)

function mapSharedProgressCategory(
  row: EnglishSharedProgressRow
): Exclude<EnglishProgressCategory, "vocabulary" | "spelling"> | null {
  if (row.main_category === "comprehension") {
    return "comprehension"
  }

  if (row.main_category === "grammar") {
    if (row.subcategory === "primary_word_classes") return "primary_word_classes"
    if (row.subcategory === "sentence_structure_syntax") return "sentence_structure_syntax"
  }

  if (row.main_category === "punctuation") {
    if (row.subcategory === "advanced_punctuation") return "advanced_punctuation"
    if (row.subcategory === "apostrophes") return "apostrophes"
    if (row.subcategory === "comma") return "comma"
    if (row.subcategory === "direct_speech_punctuation") return "direct_speech_punctuation"
    if (row.subcategory === "sentence_punctuation") return "sentence_punctuation"
  }

  return null
}

function isOptionKey(value: unknown) {
  return value === "A" || value === "B" || value === "C" || value === "D"
}

function getSnapshotString(snapshot: unknown, keys: string[]) {
  if (!snapshot || typeof snapshot !== "object") return null

  const raw = snapshot as Record<string, unknown>

  for (const key of keys) {
    const value = raw[key]

    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function getSnapshotNumber(snapshot: unknown, keys: string[]) {
  if (!snapshot || typeof snapshot !== "object") return null

  const raw = snapshot as Record<string, unknown>

  for (const key of keys) {
    const value = raw[key]

    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}

function extractAttemptDifficulty(config: unknown) {
  if (!config || typeof config !== "object") return null

  const raw = config as Record<string, unknown>
  const value = raw.selectedDifficulty

  if (value === 1 || value === 2 || value === 3) return value

  if (typeof value === "string") {
    const parsed = Number(value)
    if (parsed === 1 || parsed === 2 || parsed === 3) return parsed
  }

  return null
}

function normaliseCustomEnglishCategory(
  value: string | null | undefined
): EnglishProgressCategory | null {
  if (!value) return null

  const normalised = value
    .trim()
    .toLowerCase()
    .replaceAll("&", "and")
    .replaceAll("/", " ")
    .replaceAll("-", "_")
    .replaceAll("–", "_")
    .replaceAll("—", "_")
    .replace(/[^a-z0-9_ ]+/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")

  if (normalised === "vocabulary") return "vocabulary"
  if (normalised === "spelling") return "spelling"
  if (normalised === "comprehension") return "comprehension"

  if (normalised === "primary_word_classes") return "primary_word_classes"
  if (normalised === "word_classes") return "primary_word_classes"

  if (normalised === "sentence_structure_syntax") {
    return "sentence_structure_syntax"
  }
  if (normalised === "sentence_structure_and_syntax") {
    return "sentence_structure_syntax"
  }
  if (normalised === "syntax") return "sentence_structure_syntax"

  if (normalised === "advanced_punctuation") return "advanced_punctuation"
  if (normalised === "apostrophes") return "apostrophes"
  if (normalised === "apostrophe") return "apostrophes"
  if (normalised === "comma") return "comma"
  if (normalised === "commas") return "comma"

  if (normalised === "direct_speech_punctuation") {
    return "direct_speech_punctuation"
  }
  if (normalised === "direct_speech") return "direct_speech_punctuation"

  if (normalised === "sentence_punctuation") return "sentence_punctuation"
  if (normalised === "punctuation_sentence") return "sentence_punctuation"
  if (normalised === "sentence") return "sentence_punctuation"

  return null
}

function getCustomEnglishItemCategory(
  item: CustomEnglishAttemptItemRow
): EnglishProgressCategory | null {
  return (
    normaliseCustomEnglishCategory(item.subtopic_key) ??
    normaliseCustomEnglishCategory(
      getSnapshotString(item.question_snapshot, [
        "subtopicKey",
        "subtopic_key",
        "subcategory",
        "subCategory",
      ])
    ) ??
    normaliseCustomEnglishCategory(item.topic_key) ??
    normaliseCustomEnglishCategory(
      getSnapshotString(item.question_snapshot, [
        "topicKey",
        "topic_key",
        "category",
        "mainCategory",
        "main_category",
      ])
    )
  )
}

function buildCustomEnglishProgressRows(
  attempts: CustomEnglishAttemptRow[],
  items: CustomEnglishAttemptItemRow[]
): EnglishProgressRow[] {
  const itemsByAttempt = items.reduce((acc, item) => {
    if (!acc[item.attempt_id]) {
      acc[item.attempt_id] = []
    }

    acc[item.attempt_id].push(item)
    return acc
  }, {} as Record<string, CustomEnglishAttemptItemRow[]>)

  return attempts.flatMap((attempt) => {
    const attemptItems = itemsByAttempt[attempt.id] ?? []
    const hasAtLeastOneEnteredAnswer = attemptItems.some((item) =>
      isOptionKey(item.selected_answer)
    )

    if (!hasAtLeastOneEnteredAnswer) return []

    const attemptDifficulty = extractAttemptDifficulty(attempt.config)

    const groups = attemptItems.reduce((acc, item) => {
      const category = getCustomEnglishItemCategory(item)

      if (!category) return acc

      if (!acc[category]) {
        acc[category] = []
      }

      acc[category].push(item)
      return acc
    }, {} as Partial<Record<EnglishProgressCategory, CustomEnglishAttemptItemRow[]>>)

    return Object.entries(groups).flatMap(([category, groupedItems]) => {
      if (!groupedItems || groupedItems.length === 0) return []

      const totalQuestions = groupedItems.length
      const correctAnswers = groupedItems.filter(
        (item) => item.is_correct === true
      ).length
      const successRate = Number(
        ((correctAnswers / totalQuestions) * 100).toFixed(2)
      )
      const firstItem = groupedItems[0]
      const difficulty =
        attemptDifficulty ??
        getSnapshotNumber(firstItem.question_snapshot, ["difficulty"]) ??
        null

      return [
        {
          id: `english-custom-${attempt.id}-${category}`,
          category: category as EnglishProgressCategory,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          success_rate: successRate,
          difficulty,
          created_at: attempt.completed_at ?? attempt.created_at,
        },
      ]
    })
  })
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string
  subtitle?: string
}) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f7fff8 100%)",
        border: "1px solid #d9f99d",
        borderRadius: "20px",
        padding: "16px 18px",
        boxShadow: "0 8px 22px rgba(15, 23, 42, 0.05)",
        minHeight: "104px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          color: "#64748b",
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: value.length > 18 ? "19px" : "28px",
          fontWeight: 850,
          color: "#0f172a",
          lineHeight: 1.15,
          overflowWrap: "break-word",
          wordBreak: "normal",
          whiteSpace: "normal",
          maxWidth: "100%",
        }}
      >
        {value}
      </div>

      {subtitle ? (
        <div
          style={{
            fontSize: "13px",
            color: "#64748b",
            marginTop: "8px",
            lineHeight: 1.45,
            overflowWrap: "break-word",
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  )
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f7fff8 100%)",
        border: "1px solid #dcfce7",
        borderRadius: "28px",
        padding: "24px",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
        minWidth: 0,
      }}
    >
      <div style={{ marginBottom: "18px" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          {title}
        </h2>

        {subtitle ? (
          <p
            style={{
              margin: "8px 0 0 0",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {children}
    </section>
  )
}

function ChartBox({
  children,
}: {
  children: (size: { width: number; height: number }) => ReactNode
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 340 })

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      const width = Math.max(0, Math.floor(rect.width))
      const height = Math.max(0, Math.floor(rect.height))
      setSize({ width, height })
    }

    updateSize()

    const observer = new ResizeObserver(() => {
      updateSize()
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "340px",
        minWidth: 0,
      }}
    >
      {size.width > 0 && size.height > 0 ? (
        children(size)
      ) : (
        <div style={emptyStateStyle}>Loading chart...</div>
      )}
    </div>
  )
}

export default function EnglishProgressPage() {
  const router = useRouter()

  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingData, setLoadingData] = useState(true)
  const [rows, setRows] = useState<EnglishProgressRow[]>([])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [benchmarkData, setBenchmarkData] =
    useState<EnglishBenchmarkRpcRow | null>(null)
  const [benchmarkLoading, setBenchmarkLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!mounted) return

        if (!user) {
          router.push("/login")
          return
        }

        setLoadingUser(false)

        const [
          vocabularyResult,
          spellingResult,
          englishSharedProgressResult,
          customAttemptsResult,
        ] = await Promise.all([
          supabase
            .from("vocabulary_progress")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("spelling_progress")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("english_progress")
            .select("*")
            .eq("user_id", user.id)
            .in("main_category", ["comprehension", "grammar", "punctuation"])
            .order("created_at", { ascending: false }),
          supabase
            .from("custom_test_attempts")
            .select(
              "id, main_category, status, config, question_count, correct_answers, score_percent, completed_at, created_at"
            )
            .eq("user_id", user.id)
            .eq("main_category", "english")
            .order("created_at", { ascending: false }),
        ])

        if (vocabularyResult.error) {
          console.error("Error loading vocabulary progress:", vocabularyResult.error)
        }

        if (spellingResult.error) {
          console.error("Error loading spelling progress:", spellingResult.error)
        }

        if (englishSharedProgressResult.error) {
          console.error(
            "Error loading shared English progress:",
            englishSharedProgressResult.error
          )
        }

        if (customAttemptsResult.error) {
          console.error(
            "Error loading custom English attempts:",
            customAttemptsResult.error
          )
        }

        const vocabularyRows =
          (vocabularyResult.data ?? []) as VocabularyProgressRow[]

        const spellingRows =
          (spellingResult.data ?? []) as SpellingProgressRow[]

        const englishSharedRows =
          (englishSharedProgressResult.data ?? []) as EnglishSharedProgressRow[]

        const customAttemptRows =
          (customAttemptsResult.data ?? []) as CustomEnglishAttemptRow[]

        const customAttemptIds = customAttemptRows.map((attempt) => attempt.id)

        let customAttemptItemRows: CustomEnglishAttemptItemRow[] = []

        if (customAttemptIds.length > 0) {
          const { data: customItemData, error: customItemError } = await supabase
            .from("custom_test_attempt_items")
            .select(
              "attempt_id, question_index, main_category, topic_key, subtopic_key, selected_answer, correct_answer, is_correct, question_snapshot"
            )
            .in("attempt_id", customAttemptIds)
            .order("question_index", { ascending: true })

          if (customItemError) {
            console.error(
              "Error loading custom English attempt items:",
              customItemError
            )
          } else {
            customAttemptItemRows =
              (customItemData ?? []) as CustomEnglishAttemptItemRow[]
          }
        }

        const customProgressRows = buildCustomEnglishProgressRows(
          customAttemptRows,
          customAttemptItemRows
        )

        const mergedRows: EnglishProgressRow[] = [
          ...vocabularyRows.map((row) => ({
            id: `vocabulary-${row.id}`,
            category: "vocabulary" as const,
            total_questions: row.total_words_practiced,
            correct_answers: row.correct_answers,
            success_rate: Number(row.success_rate),
            difficulty: row.difficulty ?? null,
            created_at: row.created_at,
          })),
          ...spellingRows.map((row) => ({
            id: `spelling-${row.id}`,
            category: "spelling" as const,
            total_questions: row.total_words_practiced,
            correct_answers: row.correct_answers,
            success_rate: Number(row.success_rate),
            difficulty: row.difficulty ?? null,
            created_at: row.created_at,
          })),
          ...englishSharedRows.flatMap((row) => {
            const mappedCategory = mapSharedProgressCategory(row)

            if (!mappedCategory) return []

            return [
              {
                id: `english-shared-${row.id}`,
                category: mappedCategory,
                total_questions: row.total_questions,
                correct_answers: row.correct_answers,
                success_rate: Number(row.success_rate),
                difficulty: row.difficulty ?? null,
                created_at: row.created_at,
              },
            ]
          }),
          ...customProgressRows,
        ]

        if (!mounted) return

        setRows(mergedRows)
      } finally {
        if (mounted) {
          setLoadingData(false)
        }
      }
    }

    void loadData()

    return () => {
      mounted = false
    }
  }, [router])

  const filteredRows = useMemo(() => {
    const cutoff = getCutoffDate(timeFilter)

    return rows.filter((row) => {
      const matchesTime = cutoff ? new Date(row.created_at) >= cutoff : true

      const matchesDifficulty =
        difficultyFilter === "all" ||
        String(row.difficulty ?? "") === difficultyFilter

      const matchesCategory =
        categoryFilter === "all" || row.category === categoryFilter

      return matchesTime && matchesDifficulty && matchesCategory
    })
  }, [rows, timeFilter, difficultyFilter, categoryFilter])

  const benchmarkPeriodDays = getBenchmarkDays(timeFilter)
  const benchmarkPeriodLabel = getBenchmarkPeriodLabel(timeFilter)

  const benchmarkSourceRows = useMemo(() => {
    const cutoff = getCutoffDate(timeFilter)

    return rows.filter((row) =>
      cutoff ? new Date(row.created_at) >= cutoff : true
    )
  }, [rows, timeFilter])

  const benchmarkDifficulty = useMemo(() => {
    if (difficultyFilter !== "all") {
      return Number(difficultyFilter)
    }

    const latestRowWithDifficulty = [...benchmarkSourceRows]
      .filter((row) => typeof row.difficulty === "number")
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

    return typeof latestRowWithDifficulty?.difficulty === "number"
      ? latestRowWithDifficulty.difficulty
      : null
  }, [benchmarkSourceRows, difficultyFilter])

  useEffect(() => {
    let mounted = true

    async function loadBenchmark() {
      if (benchmarkDifficulty === null) {
        setBenchmarkData(null)
        setBenchmarkLoading(false)
        return
      }

      setBenchmarkLoading(true)

      const { data, error } = await supabase.rpc(
        "get_english_difficulty_benchmark",
        {
          p_difficulty: benchmarkDifficulty,
          p_min_attempts: MIN_BENCHMARK_ATTEMPTS,
          p_days: benchmarkPeriodDays,
        }
      )

      if (!mounted) return

      if (error) {
        console.error("Error loading English benchmark:", error)
        setBenchmarkData(null)
      } else {
        const benchmarkRows = (data ?? []) as EnglishBenchmarkRpcRow[]
        setBenchmarkData(benchmarkRows[0] ?? null)
      }

      setBenchmarkLoading(false)
    }

    void loadBenchmark()

    return () => {
      mounted = false
    }
  }, [benchmarkDifficulty, benchmarkPeriodDays])

  const studentBenchmarkStats = useMemo(() => {
    if (benchmarkDifficulty === null) return null

    const recentRowsAtDifficulty = [...benchmarkSourceRows]
      .filter((row) => row.difficulty === benchmarkDifficulty)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 10)

    if (!recentRowsAtDifficulty.length) return null

    const totalQuestions = recentRowsAtDifficulty.reduce(
      (sum, row) => sum + row.total_questions,
      0
    )

    const totalCorrect = recentRowsAtDifficulty.reduce(
      (sum, row) => sum + row.correct_answers,
      0
    )

    const accuracy =
      totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0

    return {
      attempts: recentRowsAtDifficulty.length,
      accuracy,
    }
  }, [benchmarkSourceRows, benchmarkDifficulty])

  const benchmarkDifficultyLabel = getLevelLabel(benchmarkDifficulty)

  const overallStats = useMemo(() => {
    const testsCompleted = filteredRows.length

    const questionsPractised = filteredRows.reduce(
      (sum, row) => sum + row.total_questions,
      0
    )

    const totalCorrect = filteredRows.reduce(
      (sum, row) => sum + row.correct_answers,
      0
    )

    const averageSuccess =
      testsCompleted > 0
        ? filteredRows.reduce((sum, row) => sum + Number(row.success_rate), 0) /
          testsCompleted
        : 0

    const bestScore =
      testsCompleted > 0
        ? Math.max(...filteredRows.map((row) => Number(row.success_rate)))
        : 0

    const byCategory = Object.entries(
      filteredRows.reduce(
        (acc, row) => {
          const key = getCategoryLabel(row.category)

          if (!acc[key]) {
            acc[key] = { attempts: 0, totalSuccess: 0 }
          }

          acc[key].attempts += 1
          acc[key].totalSuccess += Number(row.success_rate)

          return acc
        },
        {} as Record<string, { attempts: number; totalSuccess: number }>
      )
    ).map(([category, data]) => ({
      category,
      avgSuccess: data.attempts ? data.totalSuccess / data.attempts : 0,
    }))

    const strongestCategory =
      byCategory.length > 0
        ? byCategory.reduce((best, current) =>
            current.avgSuccess > best.avgSuccess ? current : best
          )
        : null

    const weakestCategory =
      byCategory.length > 0
        ? byCategory.reduce((worst, current) =>
            current.avgSuccess < worst.avgSuccess ? current : worst
          )
        : null

    return {
      testsCompleted,
      questionsPractised,
      totalCorrect,
      averageSuccess,
      bestScore,
      strongestCategory,
      weakestCategory,
    }
  }, [filteredRows])

  const performanceTrendData = useMemo(() => {
    const sorted = [...filteredRows].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    return sorted.map((row, index) => ({
      attempt: index + 1,
      date: formatShortDate(row.created_at),
      success: Number(row.success_rate),
      scoreLabel: `${row.correct_answers}/${row.total_questions}`,
      difficulty: getLevelLabel(row.difficulty),
      category: getCategoryLabel(row.category),
    }))
  }, [filteredRows])

  const successByCategoryData = useMemo(() => {
    const grouped = filteredRows.reduce(
      (acc, row) => {
        const key = getCategoryLabel(row.category)

        if (!acc[key]) {
          acc[key] = {
            category: key,
            attempts: 0,
            totalSuccess: 0,
          }
        }

        acc[key].attempts += 1
        acc[key].totalSuccess += Number(row.success_rate)

        return acc
      },
      {} as Record<
        string,
        { category: string; attempts: number; totalSuccess: number }
      >
    )

    const order = [
      "Vocabulary",
      "Spelling",
      "Comprehension",
      "Primary Word Classes",
      "Sentence Structure & Syntax",
      "Advanced Punctuation",
      "Apostrophes",
      "Comma",
      "Direct Speech Punctuation",
      "Sentence Punctuation",
      "Not set",
    ]

    return Object.values(grouped)
      .map((item) => ({
        category: item.category,
        avgSuccess: Number((item.totalSuccess / item.attempts).toFixed(1)),
      }))
      .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))
  }, [filteredRows])

  const attemptsByCategoryData = useMemo(() => {
    const grouped = filteredRows.reduce(
      (acc, row) => {
        const key = getCategoryLabel(row.category)

        if (!acc[key]) {
          acc[key] = {
            category: key,
            attempts: 0,
            questions: 0,
          }
        }

        acc[key].attempts += 1
        acc[key].questions += row.total_questions

        return acc
      },
      {} as Record<
        string,
        { category: string; attempts: number; questions: number }
      >
    )

    const order = [
      "Vocabulary",
      "Spelling",
      "Comprehension",
      "Primary Word Classes",
      "Sentence Structure & Syntax",
      "Advanced Punctuation",
      "Apostrophes",
      "Comma",
      "Direct Speech Punctuation",
      "Sentence Punctuation",
      "Not set",
    ]

    return Object.values(grouped)
      .map((item) => ({
        category: item.category,
        attempts: item.attempts,
        questions: item.questions,
      }))
      .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))
  }, [filteredRows])

  const recentAttempts = useMemo(() => {
    return [...filteredRows]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 12)
  }, [filteredRows])

  const summaryText = useMemo(() => {
    if (!filteredRows.length) {
      return "No English progress data yet for the selected filters."
    }

    const strongest = overallStats.strongestCategory
      ? `${overallStats.strongestCategory.category} (${overallStats.strongestCategory.avgSuccess.toFixed(1)}%)`
      : "N/A"

    const weakest = overallStats.weakestCategory
      ? `${overallStats.weakestCategory.category} (${overallStats.weakestCategory.avgSuccess.toFixed(1)}%)`
      : "N/A"

    return `You answered ${overallStats.totalCorrect} English questions correctly across ${overallStats.testsCompleted} completed attempts. Your strongest category is ${strongest}, while your weakest category is ${weakest}.`
  }, [filteredRows, overallStats])

  if (loadingUser || loadingData) {
    return (
      <div style={{ padding: "32px", color: "#334155", fontSize: "18px" }}>
        Loading English progress...
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(34,197,94,0.14) 0%, rgba(255,255,255,1) 34%), linear-gradient(180deg, #f7fff8 0%, #ecfdf5 100%)",
        padding: "28px 20px 50px",
      }}
    >
      <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "42px",
                fontWeight: 900,
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              <EnglishIcon size={42} />
              English Progress
            </h1>

            <p
              style={{
                margin: "10px 0 0 0",
                color: "#475569",
                fontSize: "17px",
                maxWidth: "760px",
                lineHeight: 1.6,
              }}
            >
              Explore English performance with live filters, trend tracking,
              and category insights.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <select
              id="english-progress-category-filter"
              name="englishProgressCategoryFilter"
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as CategoryFilter)
              }
              style={selectStyle}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              id="english-progress-difficulty-filter"
              name="englishProgressDifficultyFilter"
              value={difficultyFilter}
              onChange={(event) =>
                setDifficultyFilter(event.target.value as DifficultyFilter)
              }
              style={selectStyle}
            >
              {difficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              id="english-progress-time-filter"
              name="englishProgressTimeFilter"
              value={timeFilter}
              onChange={(event) =>
                setTimeFilter(event.target.value as TimeFilter)
              }
              style={selectStyle}
            >
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 175px), 1fr))",
            gap: "12px",
            marginBottom: "18px",
            minWidth: 0,
          }}
        >
          <StatCard
            title="Attempts Completed"
            value={String(overallStats.testsCompleted)}
          />
          <StatCard
            title="Questions Practised"
            value={String(overallStats.questionsPractised)}
          />
          <StatCard
            title="Average Success"
            value={`${overallStats.averageSuccess.toFixed(1)}%`}
          />
          <StatCard
            title="Best Score"
            value={`${overallStats.bestScore.toFixed(1)}%`}
          />
          <StatCard
            title="Strongest Category"
            value={
              overallStats.strongestCategory
                ? overallStats.strongestCategory.category
                : "—"
            }
            subtitle={
              overallStats.strongestCategory
                ? `${overallStats.strongestCategory.avgSuccess.toFixed(1)}% average success`
                : undefined
            }
          />
          <StatCard
            title="Weakest Category"
            value={
              overallStats.weakestCategory
                ? overallStats.weakestCategory.category
                : "—"
            }
            subtitle={
              overallStats.weakestCategory
                ? `${overallStats.weakestCategory.avgSuccess.toFixed(1)}% average success`
                : undefined
            }
          />
        </div>

        <div style={{ marginTop: "16px" }}>
          <SectionCard
            title="How am I doing?"
            subtitle={
              benchmarkDifficulty === null
                ? "Your English benchmark will appear here once there is a result with a difficulty level in the selected time period."
                : `This compares your recent ${benchmarkDifficultyLabel} English work from ${benchmarkPeriodLabel} with anonymous YanBo attempts at the same difficulty level and time period.`
            }
          >
            {benchmarkDifficulty === null ? (
              <div style={emptyStateStyle}>
                Your English benchmark will appear here once there is a result
                with a difficulty level in the selected time period.
              </div>
            ) : benchmarkLoading ? (
              <div style={emptyStateStyle}>Loading benchmark...</div>
            ) : !studentBenchmarkStats ? (
              <div style={emptyStateStyle}>
                Your English benchmark will appear here once there is a recent
                result at this difficulty level in the selected time period.
              </div>
            ) : !benchmarkData ? (
              <div style={emptyStateStyle}>
                We are still collecting enough data for this benchmark.
              </div>
            ) : (
              <div>
                <div style={benchmarkMetricGridStyle}>
                  <div style={benchmarkMetricStyle}>
                    <div style={benchmarkMetricLabelStyle}>
                      Your recent {benchmarkDifficultyLabel} English accuracy
                    </div>
                    <div style={benchmarkMetricValueStyle}>
                      {studentBenchmarkStats.accuracy.toFixed(1)}%
                    </div>
                    <div style={benchmarkMetricHintStyle}>
                      Last {studentBenchmarkStats.attempts} attempt
                      {studentBenchmarkStats.attempts === 1 ? "" : "s"} in {benchmarkPeriodLabel}
                    </div>
                  </div>

                  <div style={benchmarkMetricStyle}>
                    <div style={benchmarkMetricLabelStyle}>
                      YanBo average for {benchmarkDifficultyLabel} English
                    </div>
                    <div style={benchmarkMetricValueStyle}>
                      {Number(benchmarkData.average_success).toFixed(1)}%
                    </div>
                    <div style={benchmarkMetricHintStyle}>
                      Anonymous average in {benchmarkPeriodLabel}
                    </div>
                  </div>

                  <div style={benchmarkMetricStyle}>
                    <div style={benchmarkMetricLabelStyle}>Strong target</div>
                    <div style={benchmarkMetricValueStyle}>
                      {STRONG_TARGET_PERCENT}%+
                    </div>
                    <div style={benchmarkMetricHintStyle}>
                      YanBo recommended target
                    </div>
                  </div>
                </div>

                <div style={benchmarkMessageStyle}>
                  {getBenchmarkStatus(studentBenchmarkStats.accuracy)}
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        <div style={responsiveTwoColumnGridStyle}>
          <SectionCard
            title="Performance Trend"
            subtitle="Track success rate across recent English attempts."
          >
            <ChartBox>
              {({ width, height }) =>
                performanceTrendData.length ? (
                  <LineChart
                    width={width}
                    height={height}
                    data={performanceTrendData}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={successTooltipFormatter}
                      labelFormatter={(label, payload) => {
                        const point = payload?.[0]?.payload

                        return point
                          ? `${point.date} • ${point.category} • ${point.scoreLabel}`
                          : label
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="success"
                      stroke="#16a34a"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                ) : (
                  <div style={emptyStateStyle}>
                    No data available for this filter.
                  </div>
                )
              }
            </ChartBox>
          </SectionCard>

          <SectionCard
            title="Quick Insights"
            subtitle="A snapshot of current English performance."
          >
            <div style={{ display: "grid", gap: "14px" }}>
              <div
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  background: "#ecfdf5",
                  border: "1px solid #bbf7d0",
                }}
              >
                <div
                  style={{
                    color: "#15803d",
                    fontWeight: 700,
                    marginBottom: "6px",
                  }}
                >
                  Accuracy
                </div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {overallStats.averageSuccess.toFixed(1)}%
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                }}
              >
                <div
                  style={{
                    color: "#15803d",
                    fontWeight: 700,
                    marginBottom: "6px",
                  }}
                >
                  Best Category
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#0f172a",
                    overflowWrap: "break-word",
                  }}
                >
                  {overallStats.strongestCategory
                    ? overallStats.strongestCategory.category
                    : "—"}
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                }}
              >
                <div
                  style={{
                    color: "#c2410c",
                    fontWeight: 700,
                    marginBottom: "6px",
                  }}
                >
                  Needs Focus
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#0f172a",
                    overflowWrap: "break-word",
                  }}
                >
                  {overallStats.weakestCategory
                    ? overallStats.weakestCategory.category
                    : "—"}
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    color: "#475569",
                    fontWeight: 700,
                    marginBottom: "6px",
                  }}
                >
                  Questions Correct
                </div>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {overallStats.totalCorrect}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div style={responsiveTwoColumnGridStyle}>
          <SectionCard
            title="Average Success by Category"
            subtitle="Compare performance across English categories."
          >
            <ChartBox>
              {({ width, height }) =>
                successByCategoryData.length ? (
                  <BarChart
                    width={width}
                    height={height}
                    data={successByCategoryData}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={averageSuccessTooltipFormatter} />
                    <Bar
                      dataKey="avgSuccess"
                      fill="#16a34a"
                      radius={[10, 10, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <div style={emptyStateStyle}>
                    No data available for this filter.
                  </div>
                )
              }
            </ChartBox>
          </SectionCard>

          <SectionCard
            title="Practice Volume by Category"
            subtitle="See which English areas have been practised the most."
          >
            <ChartBox>
              {({ width, height }) =>
                attemptsByCategoryData.length ? (
                  <BarChart
                    width={width}
                    height={height}
                    data={attemptsByCategoryData}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="attempts"
                      fill="#10b981"
                      radius={[10, 10, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <div style={emptyStateStyle}>
                    No data available for this filter.
                  </div>
                )
              }
            </ChartBox>
          </SectionCard>
        </div>

        <SectionCard
          title="Recent Attempts"
          subtitle="Your most recent English results for the selected filters."
        >
          {recentAttempts.length ? (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "980px",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Difficulty</th>
                    <th style={thStyle}>Correct</th>
                    <th style={thStyle}>Questions</th>
                    <th style={thStyle}>Success</th>
                  </tr>
                </thead>

                <tbody>
                  {recentAttempts.map((row) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <td style={tdStyle}>{formatDateTime(row.created_at)}</td>
                      <td style={tdStyle}>{getCategoryLabel(row.category)}</td>
                      <td style={tdStyle}>{getLevelLabel(row.difficulty)}</td>
                      <td style={tdStyle}>{row.correct_answers}</td>
                      <td style={tdStyle}>{row.total_questions}</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            background:
                              Number(row.success_rate) >= 70
                                ? "#dcfce7"
                                : Number(row.success_rate) >= 50
                                  ? "#fef3c7"
                                  : "#fee2e2",
                            color:
                              Number(row.success_rate) >= 70
                                ? "#166534"
                                : Number(row.success_rate) >= 50
                                  ? "#92400e"
                                  : "#991b1b",
                            fontWeight: 700,
                            fontSize: "13px",
                          }}
                        >
                          {Number(row.success_rate).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={emptyStateStyle}>
              No recent attempts found for the selected filters.
            </div>
          )}
        </SectionCard>

        <div
          style={{
            marginTop: "20px",
            background: "linear-gradient(135deg, #16a34a 0%, #065f46 100%)",
            color: "white",
            borderRadius: "28px",
            padding: "26px",
            boxShadow: "0 12px 34px rgba(6, 95, 70, 0.22)",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: 800,
              marginBottom: "8px",
            }}
          >
            Overall Summary
          </div>

          <div
            style={{
              color: "#dcfce7",
              fontSize: "16px",
              lineHeight: 1.7,
            }}
          >
            {summaryText}
          </div>
        </div>
      </div>
    </div>
  )
}

const benchmarkMetricGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
}

const benchmarkMetricStyle: CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #dcfce7",
  borderRadius: "18px",
  padding: "14px 16px",
  minWidth: 0,
}

const benchmarkMetricLabelStyle: CSSProperties = {
  color: "#475569",
  fontSize: "13px",
  fontWeight: 700,
  lineHeight: 1.35,
  marginBottom: "6px",
}

const benchmarkMetricValueStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "28px",
  fontWeight: 900,
  lineHeight: 1.05,
}

const benchmarkMetricHintStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: 1.35,
  marginTop: "6px",
}

const benchmarkMessageStyle: CSSProperties = {
  marginTop: "12px",
  padding: "12px 14px",
  borderRadius: "16px",
  background: "#ecfdf5",
  border: "1px solid #bbf7d0",
  color: "#166534",
  fontWeight: 800,
  lineHeight: 1.5,
}

const responsiveTwoColumnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
  gap: "20px",
  marginBottom: "20px",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
}

const selectStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid #bbf7d0",
  backgroundColor: "white",
  fontSize: "14px",
  fontWeight: 600,
  color: "#0f172a",
  width: "100%",
  maxWidth: "260px",
  flex: "1 1 220px",
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
  boxSizing: "border-box",
}

const emptyStateStyle: CSSProperties = {
  height: "100%",
  minHeight: "180px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#94a3b8",
  fontSize: "15px",
  textAlign: "center",
}

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  fontSize: "13px",
  color: "#64748b",
  fontWeight: 700,
  whiteSpace: "nowrap",
}

const tdStyle: CSSProperties = {
  padding: "16px 12px",
  fontSize: "14px",
  color: "#0f172a",
  fontWeight: 500,
  whiteSpace: "nowrap",
}
