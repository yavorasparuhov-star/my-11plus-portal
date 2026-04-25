"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabaseClient"
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
  const daysMap: Record<Exclude<TimeFilter, "all">, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
  }

  now.setDate(now.getDate() - daysMap[filter])
  return now
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

function successTooltipFormatter(
  value: ValueType | undefined,
  _name: NameType | undefined
): [string, string] {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Array.isArray(value)
          ? Number(value[0])
          : 0

  return [`${numericValue}%`, "Success"]
}

function averageSuccessTooltipFormatter(
  value: ValueType | undefined,
  _name: NameType | undefined
): [string, string] {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Array.isArray(value)
          ? Number(value[0])
          : 0

  return [`${numericValue}%`, "Average Success"]
}

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
        borderRadius: "24px",
        padding: "22px",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
        minHeight: "132px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontSize: "14px",
          color: "#64748b",
          fontWeight: 600,
          marginBottom: "10px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: value.length > 18 ? "22px" : "34px",
          fontWeight: 800,
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
  children: (size: { width: number; height: number }) => React.ReactNode
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
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

        const [vocabularyResult, spellingResult, englishSharedProgressResult] = await Promise.all([
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
        ])

        if (vocabularyResult.error) {
          console.error("Error loading vocabulary progress:", vocabularyResult.error)
        }

        if (spellingResult.error) {
          console.error("Error loading spelling progress:", spellingResult.error)
        }

        if (englishSharedProgressResult.error) {
          console.error("Error loading shared English progress:", englishSharedProgressResult.error)
        }

        const vocabularyRows = (vocabularyResult.data ?? []) as VocabularyProgressRow[]
        const spellingRows = (spellingResult.data ?? []) as SpellingProgressRow[]
        const englishSharedRows =
          (englishSharedProgressResult.data ?? []) as EnglishSharedProgressRow[]

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
        difficultyFilter === "all" || String(row.difficulty ?? "") === difficultyFilter
      const matchesCategory = categoryFilter === "all" || row.category === categoryFilter

      return matchesTime && matchesDifficulty && matchesCategory
    })
  }, [rows, timeFilter, difficultyFilter, categoryFilter])

  const overallStats = useMemo(() => {
    const testsCompleted = filteredRows.length
    const questionsPractised = filteredRows.reduce((sum, row) => sum + row.total_questions, 0)
    const totalCorrect = filteredRows.reduce((sum, row) => sum + row.correct_answers, 0)

    const averageSuccess =
      testsCompleted > 0
        ? filteredRows.reduce((sum, row) => sum + Number(row.success_rate), 0) / testsCompleted
        : 0

    const bestScore =
      testsCompleted > 0 ? Math.max(...filteredRows.map((row) => Number(row.success_rate))) : 0

    const byCategory = Object.entries(
      filteredRows.reduce((acc, row) => {
        const key = getCategoryLabel(row.category)

        if (!acc[key]) {
          acc[key] = { attempts: 0, totalSuccess: 0 }
        }

        acc[key].attempts += 1
        acc[key].totalSuccess += Number(row.success_rate)
        return acc
      }, {} as Record<string, { attempts: number; totalSuccess: number }>)
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
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
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
    const grouped = filteredRows.reduce((acc, row) => {
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
    }, {} as Record<string, { category: string; attempts: number; totalSuccess: number }>)

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
    const grouped = filteredRows.reduce((acc, row) => {
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
    }, {} as Record<string, { category: string; attempts: number; questions: number }>)

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
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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
                fontSize: "42px",
                fontWeight: 900,
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              📘 English Progress
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
              Explore English performance across vocabulary, spelling, comprehension,
              grammar, and punctuation with live filters, trend tracking, and category
              insights.
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
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
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
              onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
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
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
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
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          <StatCard title="Attempts Completed" value={String(overallStats.testsCompleted)} />
          <StatCard title="Questions Practised" value={String(overallStats.questionsPractised)} />
          <StatCard title="Average Success" value={`${overallStats.averageSuccess.toFixed(1)}%`} />
          <StatCard title="Best Score" value={`${overallStats.bestScore.toFixed(1)}%`} />
          <StatCard
            title="Strongest Category"
            value={overallStats.strongestCategory ? overallStats.strongestCategory.category : "—"}
            subtitle={
              overallStats.strongestCategory
                ? `${overallStats.strongestCategory.avgSuccess.toFixed(1)}% average success`
                : undefined
            }
          />
          <StatCard
            title="Weakest Category"
            value={overallStats.weakestCategory ? overallStats.weakestCategory.category : "—"}
            subtitle={
              overallStats.weakestCategory
                ? `${overallStats.weakestCategory.avgSuccess.toFixed(1)}% average success`
                : undefined
            }
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <SectionCard
            title="Performance Trend"
            subtitle="Track success rate across recent English attempts."
          >
            <ChartBox>
              {({ width, height }) =>
                performanceTrendData.length ? (
                  <LineChart width={width} height={height} data={performanceTrendData}>
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
                  <div style={emptyStateStyle}>No data available for this filter.</div>
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
                <div style={{ color: "#15803d", fontWeight: 700, marginBottom: "6px" }}>
                  Accuracy
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>
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
                <div style={{ color: "#15803d", fontWeight: 700, marginBottom: "6px" }}>
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
                  {overallStats.strongestCategory ? overallStats.strongestCategory.category : "—"}
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
                <div style={{ color: "#c2410c", fontWeight: 700, marginBottom: "6px" }}>
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
                  {overallStats.weakestCategory ? overallStats.weakestCategory.category : "—"}
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
                <div style={{ color: "#475569", fontWeight: 700, marginBottom: "6px" }}>
                  Questions Correct
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>
                  {overallStats.totalCorrect}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <SectionCard
            title="Average Success by Category"
            subtitle="Compare performance across English categories."
          >
            <ChartBox>
              {({ width, height }) =>
                successByCategoryData.length ? (
                  <BarChart width={width} height={height} data={successByCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={averageSuccessTooltipFormatter} />
                    <Bar dataKey="avgSuccess" fill="#16a34a" radius={[10, 10, 0, 0]} />
                  </BarChart>
                ) : (
                  <div style={emptyStateStyle}>No data available for this filter.</div>
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
                  <BarChart width={width} height={height} data={attemptsByCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="attempts" fill="#10b981" radius={[10, 10, 0, 0]} />
                  </BarChart>
                ) : (
                  <div style={emptyStateStyle}>No data available for this filter.</div>
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
          <div style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
            Overall Summary
          </div>
          <div style={{ color: "#dcfce7", fontSize: "16px", lineHeight: 1.7 }}>
            {summaryText}
          </div>
        </div>
      </div>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid #bbf7d0",
  backgroundColor: "white",
  fontSize: "14px",
  fontWeight: 600,
  color: "#0f172a",
  minWidth: "180px",
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
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
}

const tdStyle: React.CSSProperties = {
  padding: "16px 12px",
  fontSize: "14px",
  color: "#0f172a",
  fontWeight: 500,
}