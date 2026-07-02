"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabaseClient"
import { NVRIcon } from "../../../../components/icons/PortalIcons"
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

type NVRProgressRow = {
  id: string | number
  user_id: string
  test_id: number | null
  category: string | null
  total_questions: number | null
  correct_answers: number | null
  success_rate: number | null
  difficulty: number | null
  created_at: string | null
}

type NVRTestRow = {
  id: number
  title: string
  category: string | null
  difficulty: number | null
}

type NVRBenchmarkRpcRow = {
  difficulty: number
  average_success: number
}

type CustomNVRAttemptRow = {
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

type CustomNVRAttemptItemRow = {
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

type EnrichedNVRProgressRow = NVRProgressRow & {
  resolved_difficulty: number | null
  test_title: string
  resolved_category: string | null
}

type TimeFilter = "7d" | "30d" | "90d" | "all"
type DifficultyFilter = "all" | "1" | "2" | "3"

type CategoryFilter =
  | "all"
  | "shape-patterns"
  | "rotations-reflections"
  | "codes-spatial-logic"

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
  { value: "shape-patterns", label: "Shape Patterns" },
  { value: "rotations-reflections", label: "Rotations & Reflections" },
  { value: "codes-spatial-logic", label: "Codes & Spatial Logic" },
]

const MIN_BENCHMARK_ATTEMPTS = 30
const STRONG_TARGET_PERCENT = 80

function getCutoffDate(filter: TimeFilter) {
  if (filter === "all") return null

  const now = new Date()

  const daysMap: Record<Exclude<TimeFilter, "all">, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  }

  now.setDate(now.getDate() - daysMap[filter])
  return now
}

function getBenchmarkDays(filter: TimeFilter) {
  if (filter === "all") return null

  const daysMap: Record<Exclude<TimeFilter, "all">, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  }

  return daysMap[filter]
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

function getCategoryLabel(category: string | null | undefined) {
  if (category === "shape-patterns") return "Shape Patterns"
  if (category === "rotations-reflections") return "Rotations & Reflections"
  if (category === "codes-spatial-logic") return "Codes & Spatial Logic"
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

function isOptionKey(value: unknown): value is "A" | "B" | "C" | "D" {
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

    if (parsed === 1 || parsed === 2 || parsed === 3) {
      return parsed
    }
  }

  return null
}

function normaliseCustomNVRCategory(
  value: string | null | undefined
): Exclude<CategoryFilter, "all"> | null {
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

  if (normalised === "shape_patterns") return "shape-patterns"
  if (normalised === "shape_pattern") return "shape-patterns"
  if (normalised === "shape_patterns_and_series") return "shape-patterns"
  if (normalised === "shape_pattern_and_series") return "shape-patterns"

  if (normalised === "rotations_reflections") return "rotations-reflections"
  if (normalised === "rotation_reflection") return "rotations-reflections"
  if (normalised === "rotations_and_reflections") return "rotations-reflections"
  if (normalised === "rotation_and_reflection") return "rotations-reflections"

  if (normalised === "codes_spatial_logic") return "codes-spatial-logic"
  if (normalised === "code_spatial_logic") return "codes-spatial-logic"
  if (normalised === "codes_and_spatial_logic") return "codes-spatial-logic"
  if (normalised === "code_and_spatial_logic") return "codes-spatial-logic"

  return null
}

function getCustomNVRItemCategory(
  item: CustomNVRAttemptItemRow
): Exclude<CategoryFilter, "all"> | null {
  return (
    normaliseCustomNVRCategory(item.subtopic_key) ??
    normaliseCustomNVRCategory(
      getSnapshotString(item.question_snapshot, [
        "subtopicKey",
        "subtopic_key",
        "subcategory",
        "subCategory",
      ])
    ) ??
    normaliseCustomNVRCategory(item.topic_key) ??
    normaliseCustomNVRCategory(
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

function buildCustomNVRProgressRows(
  attempts: CustomNVRAttemptRow[],
  items: CustomNVRAttemptItemRow[]
): EnrichedNVRProgressRow[] {
  const itemsByAttempt = items.reduce((acc, item) => {
    if (!acc[item.attempt_id]) {
      acc[item.attempt_id] = []
    }

    acc[item.attempt_id].push(item)
    return acc
  }, {} as Record<string, CustomNVRAttemptItemRow[]>)

  return attempts.flatMap((attempt) => {
    const attemptItems = itemsByAttempt[attempt.id] ?? []
    const hasAtLeastOneEnteredAnswer = attemptItems.some((item) =>
      isOptionKey(item.selected_answer)
    )

    if (!hasAtLeastOneEnteredAnswer) return []

    const attemptDifficulty = extractAttemptDifficulty(attempt.config)

    const groups = attemptItems.reduce((acc, item) => {
      const category = getCustomNVRItemCategory(item)

      if (!category) return acc

      if (!acc[category]) {
        acc[category] = []
      }

      acc[category].push(item)
      return acc
    }, {} as Partial<Record<Exclude<CategoryFilter, "all">, CustomNVRAttemptItemRow[]>>)

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
          id: `nvr-custom-${attempt.id}-${category}`,
          user_id: "",
          test_id: null,
          category,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          success_rate: successRate,
          difficulty,
          created_at: attempt.completed_at ?? attempt.created_at,
          resolved_difficulty: difficulty,
          test_title: "NVR Custom Test",
          resolved_category: category,
        },
      ]
    })
  })
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

function toSafeNumber(value: unknown) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function toNumericValue(value: ValueType | undefined) {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  if (Array.isArray(value)) return Number(value[0])
  return 0
}

function successTooltipFormatter(
  value: ValueType | undefined,
  _name: NameType | undefined
): [string, string] {
  const numericValue = toNumericValue(value)
  return [`${toSafeNumber(numericValue).toFixed(1)}%`, "Success"]
}

function averageSuccessTooltipFormatter(
  value: ValueType | undefined,
  _name: NameType | undefined
): [string, string] {
  const numericValue = toNumericValue(value)
  return [`${toSafeNumber(numericValue).toFixed(1)}%`, "Average Success"]
}

function attemptsTooltipFormatter(
  value: ValueType | undefined,
  _name: NameType | undefined
): [string, string] {
  const numericValue = toNumericValue(value)
  return [`${toSafeNumber(numericValue)}`, "Attempts"]
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
        maxWidth: "100%",
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
            fontSize: "12px",
            color: "#64748b",
            marginTop: "6px",
            lineHeight: 1.35,
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
  children: React.ReactNode
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
        maxWidth: "100%",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: "18px" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 800,
            color: "#0f172a",
            overflowWrap: "break-word",
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
              lineHeight: 1.5,
              overflowWrap: "break-word",
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
  height = 340,
}: {
  children: (size: { width: number; height: number }) => React.ReactNode
  height?: number
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height })

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      const width = Math.max(0, Math.floor(rect.width))
      const measuredHeight = Math.max(0, Math.floor(rect.height))
      setSize({ width, height: measuredHeight })
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
        maxWidth: "100%",
        height,
        minWidth: 0,
        overflow: "hidden",
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

export default function NVRProgressPage() {
  const router = useRouter()

  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingData, setLoadingData] = useState(true)
  const [rows, setRows] = useState<EnrichedNVRProgressRow[]>([])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [benchmarkData, setBenchmarkData] = useState<NVRBenchmarkRpcRow | null>(
    null
  )
  const [benchmarkLoading, setBenchmarkLoading] = useState(false)

  useEffect(() => {
    let mounted = true

    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        router.push("/login")
        return
      }

      setLoadingUser(false)

      const { data: progressData, error: progressError } = await supabase
        .from("nvr_progress")
        .select(
          "id, user_id, test_id, category, total_questions, correct_answers, success_rate, difficulty, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (progressError) {
        console.error("Error loading NVR progress:", {
          message: progressError.message,
          details: progressError.details,
          hint: progressError.hint,
          code: progressError.code,
          full: progressError,
        })

        setRows([])

        if (mounted) {
          setLoadingData(false)
        }

        return
      }

      const progressRows = (progressData ?? []) as NVRProgressRow[]

      const testIds = Array.from(
        new Set(
          progressRows
            .map((row) => row.test_id)
            .filter((id): id is number => id !== null)
        )
      )

      let testMap = new Map<number, NVRTestRow>()

      if (testIds.length > 0) {
        const { data: testsData, error: testsError } = await supabase
          .from("nvr_tests")
          .select("id, title, category, difficulty")
          .in("id", testIds)

        if (testsError) {
          console.error("Error loading NVR tests:", {
            message: testsError.message,
            details: testsError.details,
            hint: testsError.hint,
            code: testsError.code,
            full: testsError,
          })
        } else {
          testMap = new Map(
            ((testsData ?? []) as NVRTestRow[]).map((test) => [test.id, test])
          )
        }
      }

      const mergedRows: EnrichedNVRProgressRow[] = progressRows.map((row) => {
        const linkedTest = row.test_id ? testMap.get(row.test_id) : undefined

        return {
          ...row,
          resolved_difficulty: row.difficulty ?? linkedTest?.difficulty ?? null,
          test_title: linkedTest?.title ?? "NVR Test",
          resolved_category: row.category ?? linkedTest?.category ?? null,
        }
      })

      const { data: customAttemptsData, error: customAttemptsError } =
        await supabase
          .from("custom_test_attempts")
          .select(
            "id, main_category, status, config, question_count, correct_answers, score_percent, completed_at, created_at"
          )
          .eq("user_id", user.id)
          .eq("main_category", "nvr")
          .order("created_at", { ascending: false })

      if (customAttemptsError) {
        console.error("Error loading custom NVR attempts:", {
          message: customAttemptsError.message,
          details: customAttemptsError.details,
          hint: customAttemptsError.hint,
          code: customAttemptsError.code,
          full: customAttemptsError,
        })
      }

      const customAttemptRows =
        (customAttemptsData ?? []) as CustomNVRAttemptRow[]
      const customAttemptIds = customAttemptRows.map((attempt) => attempt.id)

      let customAttemptItemRows: CustomNVRAttemptItemRow[] = []

      if (customAttemptIds.length > 0) {
        const { data: customItemData, error: customItemError } = await supabase
          .from("custom_test_attempt_items")
          .select(
            "attempt_id, question_index, main_category, topic_key, subtopic_key, selected_answer, correct_answer, is_correct, question_snapshot"
          )
          .in("attempt_id", customAttemptIds)
          .order("question_index", { ascending: true })

        if (customItemError) {
          console.error("Error loading custom NVR attempt items:", {
            message: customItemError.message,
            details: customItemError.details,
            hint: customItemError.hint,
            code: customItemError.code,
            full: customItemError,
          })
        } else {
          customAttemptItemRows =
            (customItemData ?? []) as CustomNVRAttemptItemRow[]
        }
      }

      const customProgressRows = buildCustomNVRProgressRows(
        customAttemptRows,
        customAttemptItemRows
      )

      if (mounted) {
        setRows([...mergedRows, ...customProgressRows])
        setLoadingData(false)
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
      const matchesTime =
        cutoff && row.created_at
          ? new Date(row.created_at) >= cutoff
          : cutoff
            ? false
            : true

      const matchesDifficulty =
        difficultyFilter === "all" ||
        String(row.resolved_difficulty ?? "") === difficultyFilter

      const matchesCategory =
        categoryFilter === "all" ||
        (row.resolved_category ?? "") === categoryFilter

      return matchesTime && matchesDifficulty && matchesCategory
    })
  }, [rows, timeFilter, difficultyFilter, categoryFilter])

  const benchmarkPeriodDays = getBenchmarkDays(timeFilter)
  const benchmarkPeriodLabel = getBenchmarkPeriodLabel(timeFilter)

  const benchmarkSourceRows = useMemo(() => {
    const cutoff = getCutoffDate(timeFilter)

    return rows.filter((row) => {
      if (!row.created_at) return false
      return cutoff ? new Date(row.created_at) >= cutoff : true
    })
  }, [rows, timeFilter])

  const benchmarkDifficulty = useMemo(() => {
    if (difficultyFilter !== "all") {
      return Number(difficultyFilter)
    }

    const latestRowWithDifficulty = [...benchmarkSourceRows]
      .filter((row) => typeof row.resolved_difficulty === "number")
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime()
      )[0]

    return typeof latestRowWithDifficulty?.resolved_difficulty === "number"
      ? latestRowWithDifficulty.resolved_difficulty
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
        "get_nvr_difficulty_benchmark",
        {
          p_difficulty: benchmarkDifficulty,
          p_min_attempts: MIN_BENCHMARK_ATTEMPTS,
          p_days: benchmarkPeriodDays,
        }
      )

      if (!mounted) return

      if (error) {
        console.error("Error loading NVR benchmark:", error)
        setBenchmarkData(null)
      } else {
        const benchmarkRows = (data ?? []) as NVRBenchmarkRpcRow[]
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
      .filter((row) => row.resolved_difficulty === benchmarkDifficulty)
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime()
      )
      .slice(0, 10)

    if (!recentRowsAtDifficulty.length) return null

    const totalQuestions = recentRowsAtDifficulty.reduce(
      (sum, row) => sum + toSafeNumber(row.total_questions),
      0
    )

    const totalCorrect = recentRowsAtDifficulty.reduce(
      (sum, row) => sum + toSafeNumber(row.correct_answers),
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
      (sum, row) => sum + toSafeNumber(row.total_questions),
      0
    )

    const totalCorrect = filteredRows.reduce(
      (sum, row) => sum + toSafeNumber(row.correct_answers),
      0
    )

    const averageSuccess =
      testsCompleted > 0
        ? filteredRows.reduce(
            (sum, row) => sum + toSafeNumber(row.success_rate),
            0
          ) / testsCompleted
        : 0

    const bestScore =
      testsCompleted > 0
        ? Math.max(...filteredRows.map((row) => toSafeNumber(row.success_rate)))
        : 0

    const byCategory = Object.entries(
      filteredRows.reduce(
        (acc, row) => {
          const key = getCategoryLabel(row.resolved_category)

          if (!acc[key]) {
            acc[key] = { attempts: 0, totalSuccess: 0 }
          }

          acc[key].attempts += 1
          acc[key].totalSuccess += toSafeNumber(row.success_rate)

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
        new Date(a.created_at ?? 0).getTime() -
        new Date(b.created_at ?? 0).getTime()
    )

    return sorted.map((row, index) => ({
      attempt: index + 1,
      date: row.created_at ? formatShortDate(row.created_at) : "—",
      success: toSafeNumber(row.success_rate),
      scoreLabel: `${toSafeNumber(row.correct_answers)}/${toSafeNumber(
        row.total_questions
      )}`,
      difficulty: getLevelLabel(row.resolved_difficulty),
      category: getCategoryLabel(row.resolved_category),
    }))
  }, [filteredRows])

  const successByCategoryData = useMemo(() => {
    const grouped = filteredRows.reduce(
      (acc, row) => {
        const key = getCategoryLabel(row.resolved_category)

        if (!acc[key]) {
          acc[key] = {
            category: key,
            attempts: 0,
            totalSuccess: 0,
          }
        }

        acc[key].attempts += 1
        acc[key].totalSuccess += toSafeNumber(row.success_rate)

        return acc
      },
      {} as Record<
        string,
        { category: string; attempts: number; totalSuccess: number }
      >
    )

    const order = [
      "Shape Patterns",
      "Rotations & Reflections",
      "Codes & Spatial Logic",
      "Not set",
    ]

    return Object.values(grouped)
      .map((item) => ({
        category: item.category,
        avgSuccess: Number((item.totalSuccess / item.attempts).toFixed(1)),
      }))
      .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))
  }, [filteredRows])

  const attemptsByDifficultyData = useMemo(() => {
    const grouped = filteredRows.reduce(
      (acc, row) => {
        const key = getLevelLabel(row.resolved_difficulty)

        if (!acc[key]) {
          acc[key] = {
            difficulty: key,
            attempts: 0,
            questions: 0,
          }
        }

        acc[key].attempts += 1
        acc[key].questions += toSafeNumber(row.total_questions)

        return acc
      },
      {} as Record<
        string,
        { difficulty: string; attempts: number; questions: number }
      >
    )

    const order = ["Easy", "Medium", "Hard", "Not set"]

    return Object.values(grouped)
      .map((item) => ({
        difficulty: item.difficulty,
        attempts: item.attempts,
        questions: item.questions,
      }))
      .sort((a, b) => order.indexOf(a.difficulty) - order.indexOf(b.difficulty))
  }, [filteredRows])

  const recentAttempts = useMemo(() => {
    return [...filteredRows]
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime()
      )
      .slice(0, 12)
  }, [filteredRows])

  const summaryText = useMemo(() => {
    if (!filteredRows.length) {
      return "No non-verbal reasoning progress data yet for the selected filters."
    }

    const strongest = overallStats.strongestCategory
      ? `${overallStats.strongestCategory.category} (${overallStats.strongestCategory.avgSuccess.toFixed(
          1
        )}%)`
      : "N/A"

    const weakest = overallStats.weakestCategory
      ? `${overallStats.weakestCategory.category} (${overallStats.weakestCategory.avgSuccess.toFixed(
          1
        )}%)`
      : "N/A"

    return `You answered ${overallStats.totalCorrect} non-verbal reasoning questions correctly across ${overallStats.testsCompleted} completed tests. Your strongest category is ${strongest}, while your weakest category is ${weakest}.`
  }, [filteredRows, overallStats])

  if (loadingUser || loadingData) {
    return (
      <div style={{ padding: "32px", color: "#334155", fontSize: "18px" }}>
        Loading NVR progress...
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(34,197,94,0.14) 0%, rgba(255,255,255,1) 34%), linear-gradient(180deg, #f7fff8 0%, #ecfdf5 100%)",
        padding: "28px 14px 50px",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "1320px",
          width: "100%",
          margin: "0 auto",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginBottom: "28px",
            minWidth: 0,
          }}
        >
          <div style={{ minWidth: 0 }}>
<h1
  style={{
    margin: 0,
    fontSize: "clamp(30px, 8vw, 42px)",
    fontWeight: 900,
    color: "#0f172a",
    letterSpacing: "-0.02em",
    overflowWrap: "break-word",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  }}
>
  <NVRIcon size={42} />
  NVR Progress
</h1>

            <p
              style={{
                margin: "10px 0 0 0",
                color: "#475569",
                fontSize: "17px",
                maxWidth: "760px",
                lineHeight: 1.6,
                overflowWrap: "break-word",
              }}
            >
              Explore non-verbal reasoning performance with live filters, trend
              tracking, category insights, and recent test history.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              width: "100%",
              maxWidth: "820px",
              minWidth: 0,
            }}
          >
            <select
              id="nvr-progress-category-filter"
              name="nvrProgressCategoryFilter"
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
              id="nvr-progress-difficulty-filter"
              name="nvrProgressDifficultyFilter"
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
              id="nvr-progress-time-filter"
              name="nvrProgressTimeFilter"
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
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: "18px",
            marginBottom: "24px",
            minWidth: 0,
          }}
        >
          <StatCard
            title="Tests Completed"
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
                ? `${overallStats.strongestCategory.avgSuccess.toFixed(
                    1
                  )}% average success`
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
                ? `${overallStats.weakestCategory.avgSuccess.toFixed(
                    1
                  )}% average success`
                : undefined
            }
          />
        </div>

        <div style={{ marginTop: "16px" }}>
          <SectionCard
            title="How am I doing?"
            subtitle={
              benchmarkDifficulty === null
                ? "Your NVR benchmark will appear here once there is a result with a difficulty level in the selected time period."
                : `This compares your recent ${benchmarkDifficultyLabel} NVR work from ${benchmarkPeriodLabel} with anonymous YanBo attempts at the same difficulty level and time period.`
            }
          >
            {benchmarkDifficulty === null ? (
              <div style={emptyStateStyle}>
                Your NVR benchmark will appear here once there is a result with
                a difficulty level in the selected time period.
              </div>
            ) : benchmarkLoading ? (
              <div style={emptyStateStyle}>Loading benchmark...</div>
            ) : !studentBenchmarkStats ? (
              <div style={emptyStateStyle}>
                Your NVR benchmark will appear here once there is a recent result
                at this difficulty level in the selected time period.
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
                      Your recent {benchmarkDifficultyLabel} NVR accuracy
                    </div>
                    <div style={benchmarkMetricValueStyle}>
                      {studentBenchmarkStats.accuracy.toFixed(1)}%
                    </div>
                    <div style={benchmarkMetricHintStyle}>
                      Last {studentBenchmarkStats.attempts} attempt
                      {studentBenchmarkStats.attempts === 1 ? "" : "s"} in{" "}
                      {benchmarkPeriodLabel}
                    </div>
                  </div>

                  <div style={benchmarkMetricStyle}>
                    <div style={benchmarkMetricLabelStyle}>
                      YanBo average for {benchmarkDifficultyLabel} NVR
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
            subtitle="Track success rate across recent non-verbal reasoning attempts."
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
                          ? `${point.date} • ${point.category} • ${point.difficulty} • ${point.scoreLabel}`
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
            subtitle="A snapshot of current NVR performance."
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
                    lineHeight: 1.25,
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
                    lineHeight: 1.25,
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
            subtitle="Compare performance across NVR categories."
          >
            <ChartBox>
              {({ width, height }) =>
                successByCategoryData.length ? (
                  <BarChart
                    width={width}
                    height={height}
                    data={successByCategoryData}
                    layout="vertical"
                    margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={135}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip formatter={averageSuccessTooltipFormatter} />
                    <Bar
                      dataKey="avgSuccess"
                      fill="#16a34a"
                      radius={[0, 10, 10, 0]}
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
            title="Practice Volume by Difficulty"
            subtitle="See which NVR levels have been practised the most."
          >
            <ChartBox>
              {({ width, height }) =>
                attemptsByDifficultyData.length ? (
                  <BarChart
                    width={width}
                    height={height}
                    data={attemptsByDifficultyData}
                    margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="difficulty" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={attemptsTooltipFormatter} />
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
          subtitle="Your most recent NVR test results for the selected filters."
        >
          {recentAttempts.length ? (
            <div style={{ overflowX: "auto", maxWidth: "100%" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "880px",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Test</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Level</th>
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
                      <td style={tdStyle}>
                        {row.created_at ? formatDateTime(row.created_at) : "—"}
                      </td>
                      <td style={tdStyle}>{row.test_title}</td>
                      <td style={tdStyle}>
                        {getCategoryLabel(row.resolved_category)}
                      </td>
                      <td style={tdStyle}>
                        {getLevelLabel(row.resolved_difficulty)}
                      </td>
                      <td style={tdStyle}>
                        {toSafeNumber(row.correct_answers)}
                      </td>
                      <td style={tdStyle}>
                        {toSafeNumber(row.total_questions)}
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            background:
                              toSafeNumber(row.success_rate) >= 70
                                ? "#dcfce7"
                                : toSafeNumber(row.success_rate) >= 50
                                  ? "#fef3c7"
                                  : "#fee2e2",
                            color:
                              toSafeNumber(row.success_rate) >= 70
                                ? "#166534"
                                : toSafeNumber(row.success_rate) >= 50
                                  ? "#92400e"
                                  : "#991b1b",
                            fontWeight: 700,
                            fontSize: "13px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {toSafeNumber(row.success_rate).toFixed(1)}%
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
            maxWidth: "100%",
            overflow: "hidden",
            boxSizing: "border-box",
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
              overflowWrap: "break-word",
            }}
          >
            {summaryText}
          </div>
        </div>
      </div>
    </div>
  )
}

const benchmarkMetricGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
}

const benchmarkMetricStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #dcfce7",
  borderRadius: "18px",
  padding: "14px 16px",
  minWidth: 0,
}

const benchmarkMetricLabelStyle: React.CSSProperties = {
  color: "#475569",
  fontSize: "13px",
  fontWeight: 700,
  lineHeight: 1.35,
  marginBottom: "6px",
}

const benchmarkMetricValueStyle: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "28px",
  fontWeight: 900,
  lineHeight: 1.05,
}

const benchmarkMetricHintStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: 1.35,
  marginTop: "6px",
}

const benchmarkMessageStyle: React.CSSProperties = {
  marginTop: "12px",
  padding: "12px 14px",
  borderRadius: "16px",
  background: "#ecfdf5",
  border: "1px solid #bbf7d0",
  color: "#166534",
  fontWeight: 800,
  lineHeight: 1.5,
}

const responsiveTwoColumnGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
  gap: "20px",
  marginBottom: "20px",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
}

const selectStyle: React.CSSProperties = {
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

const emptyStateStyle: React.CSSProperties = {
  height: "100%",
  minHeight: "180px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#94a3b8",
  fontSize: "15px",
  textAlign: "center",
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  fontSize: "13px",
  color: "#64748b",
  fontWeight: 700,
  whiteSpace: "nowrap",
}

const tdStyle: React.CSSProperties = {
  padding: "16px 12px",
  fontSize: "14px",
  color: "#0f172a",
  fontWeight: 500,
  whiteSpace: "nowrap",
}