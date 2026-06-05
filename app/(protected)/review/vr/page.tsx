// app/(protected)/review/vr/page.tsx
"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabaseClient"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent"

type VRReviewRow = {
  id: string
  user_id: string
  test_id: number | null
  question_id: number | null
  category: string | null
  question_text: string
  user_answer: string | null
  correct_answer: string | null
  created_at: string
  updated_at?: string | null
  last_attempted_at?: string | null
  explanation?: string
  difficulty?: number | null
  option_a?: string | null
  option_b?: string | null
  option_c?: string | null
  option_d?: string | null
  user_answer_text?: string | null
  correct_answer_text?: string | null
}

type VRQuestionRow = {
  id: number
  question_text: string
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  correct_answer: string | null
  explanation: string | null
  difficulty: number | null
}

type TimeFilter = "7d" | "30d" | "90d" | "all"
type DifficultyFilter = "all" | "1" | "2" | "3"

type CategoryFilter =
  | "all"
  | "word-relationships"
  | "code-logic"
  | "sequence-pattern"

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
  { value: "word-relationships", label: "Word Relationships" },
  { value: "code-logic", label: "Codes & Logic" },
  { value: "sequence-pattern", label: "Sequence Patterns" },
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

function normaliseCategory(category: string | null | undefined) {
  if (!category) return null

  const cleaned = category
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")

  if (
    cleaned === "word relationship" ||
    cleaned === "word relationships" ||
    cleaned === "wordrelationship" ||
    cleaned === "wordrelationships"
  ) {
    return "word-relationships"
  }

  if (
    cleaned === "code logic" ||
    cleaned === "codes logic" ||
    cleaned === "code and logic" ||
    cleaned === "codes and logic" ||
    cleaned === "codelogic" ||
    cleaned === "codeslogic"
  ) {
    return "code-logic"
  }

  if (
    cleaned === "sequence pattern" ||
    cleaned === "sequence patterns" ||
    cleaned === "sequence and patterns" ||
    cleaned === "sequencepattern" ||
    cleaned === "sequencepatterns"
  ) {
    return "sequence-pattern"
  }

  return category
}

function getLevelLabel(level: number | null | undefined) {
  if (level === 1) return "Easy"
  if (level === 2) return "Medium"
  if (level === 3) return "Hard"
  return "Not set"
}

function getCategoryLabel(category: string | null | undefined) {
  const normalised = normaliseCategory(category)

  if (normalised === "word-relationships") return "Word Relationships"
  if (normalised === "code-logic") return "Codes & Logic"
  if (normalised === "sequence-pattern") return "Sequence Patterns"

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

function cleanText(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null

  const text = String(value).trim()

  if (!text || text.toLowerCase() === "null" || text.toLowerCase() === "nan") {
    return null
  }

  return text
}

function normaliseAnswer(answer: string | null | undefined): "A" | "B" | "C" | "D" | null {
  if (!answer) return null

  const clean = answer.trim().toUpperCase()

  if (clean === "A" || clean === "B" || clean === "C" || clean === "D") {
    return clean
  }

  return null
}

function getOptionText(item: VRReviewRow, answer: string | null | undefined) {
  const option = normaliseAnswer(answer)

  if (option === "A") return cleanText(item.option_a)
  if (option === "B") return cleanText(item.option_b)
  if (option === "C") return cleanText(item.option_c)
  if (option === "D") return cleanText(item.option_d)

  return null
}

function getReviewDisplayDate(item: VRReviewRow) {
  return item.last_attempted_at || item.updated_at || item.created_at
}

function getReviewFilterDate(item: VRReviewRow) {
  // For the time filter, avoid using updated_at as the main date.
  // Old rows can receive a fresh updated_at during database maintenance/migrations,
  // which would incorrectly make old rows appear inside "Last 7 days".
  return item.last_attempted_at || item.created_at
}

function toNumericValue(value: ValueType | undefined) {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value)
  if (Array.isArray(value)) return Number(value[0])
  return 0
}

function questionsTooltipFormatter(
  value: ValueType | undefined,
  _name: NameType | undefined
): [number, string] {
  const numericValue = toNumericValue(value)
  return [numericValue, "Questions"]
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
        maxWidth: "100%",
        overflow: "hidden",
        boxSizing: "border-box",
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

export default function VRReviewPage() {
  const router = useRouter()

  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingData, setLoadingData] = useState(true)
  const [reviewQuestions, setReviewQuestions] = useState<VRReviewRow[]>([])
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all")
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")

  useEffect(() => {
    let mounted = true

    async function fetchReviewQuestions() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        router.push("/login")
        return
      }

      setLoadingUser(false)

      const { data, error } = await supabase
        .from("vr_review")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })

      if (!mounted) return

      if (error) {
        console.error("Error loading VR review:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          full: error,
        })

        setReviewQuestions([])
        setLoadingData(false)
        return
      }

      const reviewData = (data || []) as VRReviewRow[]

      const questionIds = reviewData
        .map((row) => row.question_id)
        .filter((id): id is number => id !== null)

      let questionMap = new Map<number, VRQuestionRow>()

      if (questionIds.length > 0) {
        const { data: questionsData, error: questionsError } = await supabase
          .from("vr_questions")
          .select("id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty")
          .in("id", questionIds)

        if (questionsError) {
          console.error("Error loading VR explanations:", {
            message: questionsError.message,
            details: questionsError.details,
            hint: questionsError.hint,
            code: questionsError.code,
            full: questionsError,
          })
        } else {
          questionMap = new Map(
            ((questionsData || []) as VRQuestionRow[]).map((question) => [
              question.id,
              question,
            ])
          )
        }
      }

      const mergedData = reviewData.map((row) => {
        const questionInfo =
          row.question_id !== null ? questionMap.get(row.question_id) : undefined

        const mergedRow: VRReviewRow = {
          ...row,
          id: String(row.id),
          category: normaliseCategory(row.category),
          question_text: questionInfo?.question_text || row.question_text,
          correct_answer: row.correct_answer || questionInfo?.correct_answer || null,
          explanation: questionInfo?.explanation || row.explanation || "",
          difficulty: row.difficulty ?? questionInfo?.difficulty ?? null,
          option_a: questionInfo?.option_a || null,
          option_b: questionInfo?.option_b || null,
          option_c: questionInfo?.option_c || null,
          option_d: questionInfo?.option_d || null,
        }

        return {
          ...mergedRow,
          user_answer_text: getOptionText(mergedRow, mergedRow.user_answer),
          correct_answer_text: getOptionText(mergedRow, mergedRow.correct_answer),
        }
      })

      if (mounted) {
        setReviewQuestions(mergedData)
        setLoadingData(false)
      }
    }

    void fetchReviewQuestions()

    return () => {
      mounted = false
    }
  }, [router])

  async function removeQuestion(reviewId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from("vr_review")
      .delete()
      .eq("user_id", user.id)
      .eq("id", reviewId)

    if (error) {
      console.error("Error deleting VR review question:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        full: error,
      })
      return
    }

    setReviewQuestions((previous) =>
      previous.filter((row) => row.id !== reviewId)
    )
  }

  const uniqueQuestions = useMemo(() => {
    return Array.from(
      new Map(
        reviewQuestions.map((item) => [
          `${item.question_id ?? "text"}-${item.question_text.toLowerCase()}`,
          item,
        ])
      ).values()
    )
  }, [reviewQuestions])

  const filteredQuestions = useMemo(() => {
    const cutoff = getCutoffDate(timeFilter)

    return uniqueQuestions.filter((question) => {
      const matchesDifficulty =
        difficultyFilter === "all" ||
        String(question.difficulty ?? "") === difficultyFilter

      const matchesTime = cutoff
        ? new Date(getReviewFilterDate(question)) >= cutoff
        : true

      const matchesCategory =
        categoryFilter === "all" ||
        normaliseCategory(question.category) === categoryFilter

      return matchesDifficulty && matchesTime && matchesCategory
    })
  }, [uniqueQuestions, difficultyFilter, timeFilter, categoryFilter])

  function retryFilteredQuestions() {
    const reviewQuestionIds = filteredQuestions
      .map((row) => row.question_id)
      .filter((id): id is number => id !== null)

    if (reviewQuestionIds.length === 0) return

    localStorage.setItem(
      "vr_review_question_ids",
      JSON.stringify(reviewQuestionIds)
    )

    router.push("/vr-test?mode=review")
  }

  const reviewStats = useMemo(() => {
    const totalQuestions = filteredQuestions.length
    const allUnique = uniqueQuestions.length

    const byCategory = Object.entries(
      filteredQuestions.reduce((acc, row) => {
        const key = getCategoryLabel(row.category)

        if (!acc[key]) {
          acc[key] = 0
        }

        acc[key] += 1
        return acc
      }, {} as Record<string, number>)
    ).map(([category, count]) => ({
      category,
      count,
    }))

    const mostCommonCategory =
      byCategory.length > 0
        ? byCategory.reduce((max, current) =>
            current.count > max.count ? current : max
          )
        : null

    const mostRecentItem = filteredQuestions.length
      ? [...filteredQuestions].sort(
          (a, b) =>
            new Date(getReviewDisplayDate(b)).getTime() -
            new Date(getReviewDisplayDate(a)).getTime()
        )[0]
      : null

    const withExplanation = filteredQuestions.filter(
      (row) => row.explanation && row.explanation.trim() !== ""
    ).length

    return {
      totalQuestions,
      allUnique,
      mostCommonCategory,
      mostRecentItem,
      withExplanation,
    }
  }, [filteredQuestions, uniqueQuestions])

  const reviewByCategoryData = useMemo(() => {
    const grouped = filteredQuestions.reduce((acc, row) => {
      const key = getCategoryLabel(row.category)

      if (!acc[key]) {
        acc[key] = {
          category: key,
          count: 0,
        }
      }

      acc[key].count += 1
      return acc
    }, {} as Record<string, { category: string; count: number }>)

    const order = [
      "Word Relationships",
      "Codes & Logic",
      "Sequence Patterns",
      "Not set",
    ]

    return Object.values(grouped).sort(
      (a, b) => order.indexOf(a.category) - order.indexOf(b.category)
    )
  }, [filteredQuestions])

  const reviewByDifficultyData = useMemo(() => {
    const grouped = filteredQuestions.reduce((acc, row) => {
      const key = getLevelLabel(row.difficulty)

      if (!acc[key]) {
        acc[key] = 0
      }

      acc[key] += 1
      return acc
    }, {} as Record<string, number>)

    const order = ["Easy", "Medium", "Hard", "Not set"]

    return order
      .filter((difficulty) => grouped[difficulty])
      .map((difficulty) => ({
        name: difficulty,
        count: grouped[difficulty],
      }))
  }, [filteredQuestions])

  const recentQuestions = useMemo(() => {
    return [...filteredQuestions]
      .sort(
        (a, b) =>
          new Date(getReviewDisplayDate(b)).getTime() -
          new Date(getReviewDisplayDate(a)).getTime()
      )
      .slice(0, 12)
  }, [filteredQuestions])

  const summaryText = useMemo(() => {
    if (!filteredQuestions.length) {
      return "No verbal reasoning review questions found for the selected filters."
    }

    const mostCommon = reviewStats.mostCommonCategory
      ? `${reviewStats.mostCommonCategory.category} (${reviewStats.mostCommonCategory.count})`
      : "N/A"

    return `You currently have ${reviewStats.totalQuestions} verbal reasoning questions to review. The biggest review category is ${mostCommon}, and ${reviewStats.withExplanation} of these questions already include an explanation to support revision.`
  }, [filteredQuestions, reviewStats])

  if (loadingUser || loadingData) {
    return (
      <div style={{ padding: "32px", color: "#334155", fontSize: "18px" }}>
        Loading VR review...
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
              }}
            >
              🧠 VR Review
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
              Review verbal reasoning questions that need more practice, filter
              by category and difficulty, and jump straight into a focused retry
              session.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              width: "100%",
              maxWidth: "1100px",
              minWidth: 0,
            }}
          >
            <select
              id="vr-review-category-filter"
              name="vrReviewCategoryFilter"
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
              id="vr-review-difficulty-filter"
              name="vrReviewDifficultyFilter"
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
              id="vr-review-time-filter"
              name="vrReviewTimeFilter"
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

            <button
              type="button"
              onClick={retryFilteredQuestions}
              disabled={filteredQuestions.length === 0}
              style={{
                ...actionButtonStyle,
                opacity: filteredQuestions.length === 0 ? 0.5 : 1,
                cursor:
                  filteredQuestions.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              Retry filtered items
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: "18px",
            marginBottom: "24px",
            minWidth: 0,
          }}
        >
          <StatCard
            title="Items to Review"
            value={String(reviewStats.totalQuestions)}
          />

          <StatCard
            title="Total Review Bank"
            value={String(reviewStats.allUnique)}
          />

          <StatCard
            title="With Explanations"
            value={String(reviewStats.withExplanation)}
          />

          <StatCard
            title="Most Common Category"
            value={
              reviewStats.mostCommonCategory
                ? reviewStats.mostCommonCategory.category
                : "—"
            }
            subtitle={
              reviewStats.mostCommonCategory
                ? `${reviewStats.mostCommonCategory.count} questions`
                : undefined
            }
          />

          <StatCard
            title="Most Recent Item"
            value={
              reviewStats.mostRecentItem
                ? getCategoryLabel(reviewStats.mostRecentItem.category)
                : "—"
            }
            subtitle={
              reviewStats.mostRecentItem
                ? formatDateTime(getReviewDisplayDate(reviewStats.mostRecentItem))
                : undefined
            }
          />

          <StatCard
            title="Current Filter"
            value={
              categoryFilter === "all"
                ? "All Categories"
                : getCategoryLabel(categoryFilter)
            }
            subtitle={
              timeOptions.find((option) => option.value === timeFilter)?.label
            }
          />
        </div>

        <div style={responsiveTwoColumnGridStyle}>
          <SectionCard
            title="Review Questions by Category"
            subtitle="See which VR categories need the most revision."
          >
            <ChartBox>
              {({ width, height }) =>
                reviewByCategoryData.length ? (
                  <BarChart
                    width={width}
                    height={height}
                    data={reviewByCategoryData}
                    layout="vertical"
                    margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={135}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip formatter={questionsTooltipFormatter} />
                    <Bar
                      dataKey="count"
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
            title="Review Items by Difficulty"
            subtitle="See which difficulty level currently needs the most revision."
          >
            <ChartBox>
              {({ width, height }) =>
                reviewByDifficultyData.length ? (
                  <BarChart
                    width={width}
                    height={height}
                    data={reviewByDifficultyData}
                    margin={{ top: 20, right: 12, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={questionsTooltipFormatter} />
                    <Bar dataKey="count" fill="#f97316" radius={[8, 8, 0, 0]} />
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
          title="Recent Review Items"
          subtitle="Your most recent VR review items for the selected filters."
        >
          {recentQuestions.length ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
                gap: "18px",
                minWidth: 0,
              }}
            >
              {recentQuestions.map((row) => (
                <div
                  key={row.id}
                  style={{
                    background: "linear-gradient(180deg, #ffffff 0%, #f7fff8 100%)",
                    border: "1px solid #dcfce7",
                    borderRadius: "24px",
                    padding: "20px",
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                    minWidth: 0,
                    maxWidth: "100%",
                    overflow: "hidden",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginBottom: "14px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        background: "#dcfce7",
                        color: "#166534",
                        fontSize: "12px",
                        fontWeight: 700,
                        maxWidth: "100%",
                        overflowWrap: "break-word",
                      }}
                    >
                      {getCategoryLabel(row.category)}
                    </span>

                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        background: "#ecfdf5",
                        color: "#15803d",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {getLevelLabel(row.difficulty)}
                    </span>
                  </div>

                  <h3
                    style={{
                      margin: "0 0 10px 0",
                      color: "#0f172a",
                      fontSize: "18px",
                      fontWeight: 800,
                    }}
                  >
                    Question
                  </h3>

                  <p
                    style={{
                      margin: "0 0 14px 0",
                      color: "#0f172a",
                      lineHeight: 1.6,
                      fontWeight: 500,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {row.question_text}
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "12px",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px",
                        borderRadius: "14px",
                        background: "#fff7ed",
                        border: "1px solid #fed7aa",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 800,
                          color: "#9a3412",
                          marginBottom: "5px",
                        }}
                      >
                        Your answer
                      </div>
                      <div
                        style={{
                          color: "#7c2d12",
                          fontWeight: 700,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {row.user_answer || "—"}
                        {row.user_answer_text ? ` — ${row.user_answer_text}` : ""}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "12px",
                        borderRadius: "14px",
                        background: "#ecfdf5",
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 800,
                          color: "#166534",
                          marginBottom: "5px",
                        }}
                      >
                        Correct answer
                      </div>
                      <div
                        style={{
                          color: "#14532d",
                          fontWeight: 700,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {row.correct_answer || "—"}
                        {row.correct_answer_text ? ` — ${row.correct_answer_text}` : ""}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "14px",
                      borderRadius: "16px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      marginBottom: "14px",
                      maxWidth: "100%",
                      overflow: "hidden",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#475569",
                        marginBottom: "6px",
                      }}
                    >
                      Explanation
                    </div>

                    <div
                      style={{
                        color: "#334155",
                        lineHeight: 1.6,
                        fontSize: "14px",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {row.explanation && row.explanation.trim()
                        ? row.explanation
                        : "No explanation available."}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "13px",
                      color: "#64748b",
                      marginBottom: "14px",
                      overflowWrap: "break-word",
                    }}
                  >
                    Last attempted: {formatDateTime(getReviewDisplayDate(row))}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeQuestion(row.id)}
                    style={removeButtonStyle}
                  >
                    Remove from review
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={emptyStateStyle}>
              No review items found for the selected filters.
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

const actionButtonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: "14px",
  border: "none",
  background: "#16a34a",
  color: "white",
  fontWeight: 700,
  boxShadow: "0 10px 24px rgba(22, 163, 74, 0.25)",
  width: "100%",
  maxWidth: "260px",
  flex: "1 1 220px",
  boxSizing: "border-box",
}

const removeButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "12px",
  border: "none",
  background: "#e11d48",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
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
