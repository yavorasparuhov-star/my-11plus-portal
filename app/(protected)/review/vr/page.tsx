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

type VRCategory = "word_relationships" | "code_logic" | "sequence_patterns"

type VRReviewDbRow = {
  id: number
  user_id: string
  question_id: number | null
  question_text: string | null
  knew_it: boolean | null
  difficulty: number | null
  created_at: string
  category: string | null
}

type VRQuestionLookupRow = {
  id: number
  explanation: string | null
  difficulty: number | null
  test_id: number | null
}

type VRTestLookupRow = {
  id: number
  category: string | null
}

type VRReviewItem = {
  id: string
  user_id: string
  question_id: number | null
  question_text: string
  difficulty: number | null
  created_at: string
  explanation: string
  category: VRCategory | "unknown"
  test_id: number | null
}

type TimeFilter = "7d" | "30d" | "90d" | "all"
type DifficultyFilter = "all" | "1" | "2" | "3"
type CategoryFilter = "all" | VRCategory

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
  { value: "word_relationships", label: "Word Relationships" },
  { value: "code_logic", label: "Code & Logic" },
  { value: "sequence_patterns", label: "Sequence Patterns" },
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

function normaliseVRCategory(category: string | null | undefined) {
  if (!category) return "unknown"

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
    return "word_relationships"
  }

  if (
    cleaned === "code logic" ||
    cleaned === "codes logic" ||
    cleaned === "code and logic" ||
    cleaned === "codes and logic" ||
    cleaned === "codelogic" ||
    cleaned === "codeslogic"
  ) {
    return "code_logic"
  }

  if (
    cleaned === "sequence pattern" ||
    cleaned === "sequence patterns" ||
    cleaned === "sequence and patterns" ||
    cleaned === "sequencepattern" ||
    cleaned === "sequencepatterns"
  ) {
    return "sequence_patterns"
  }

  return "unknown"
}

function getLevelLabel(level: number | null | undefined) {
  if (level === 1) return "Easy"
  if (level === 2) return "Medium"
  if (level === 3) return "Hard"
  return "Not set"
}

function getCategoryLabel(category: string | null | undefined) {
  if (category === "word_relationships") return "Word Relationships"
  if (category === "code_logic") return "Code & Logic"
  if (category === "sequence_patterns") return "Sequence Patterns"
  return "Not set"
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—"

  const date = new Date(value)

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function truncateText(text: string | null | undefined, maxLength = 160) {
  if (!text) return "—"
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
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

function getReviewStorageConfig(category: VRCategory | "unknown") {
  if (category === "word_relationships") {
    return {
      key: "word_relationships_review_ids",
      route: "/vr/word-relationships?mode=review",
    }
  }

  if (category === "code_logic") {
    return {
      key: "code_logic_review_ids",
      route: "/vr/code-logic?mode=review",
    }
  }

  if (category === "sequence_patterns") {
    return {
      key: "sequence_patterns_review_ids",
      route: "/vr/sequence-patterns?mode=review",
    }
  }

  return null
}

function isSameReviewItem(a: VRReviewItem, b: VRReviewItem) {
  if (a.category !== b.category) return false

  if (a.question_id !== null && b.question_id !== null) {
    return a.question_id === b.question_id
  }

  return a.question_text.toLowerCase() === b.question_text.toLowerCase()
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
  }, [height])

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
  const [reviewQuestions, setReviewQuestions] = useState<VRReviewItem[]>([])
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all")
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")

  useEffect(() => {
    let mounted = true

    async function fetchReviewQuestions() {
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

        const { data, error } = await supabase
          .from("vr_review")
          .select("*")
          .eq("user_id", user.id)
          .eq("knew_it", false)
          .order("created_at", { ascending: false })

        if (!mounted) return

        if (error) {
          console.error("Error loading VR review:", error)
          setReviewQuestions([])
          return
        }

        const reviewRows = (data ?? []) as VRReviewDbRow[]

        const questionIds = Array.from(
          new Set(
            reviewRows
              .map((row) => row.question_id)
              .filter((id): id is number => id !== null)
          )
        )

        let questionMap = new Map<
          number,
          {
            explanation: string
            difficulty: number | null
            test_id: number | null
          }
        >()

        if (questionIds.length > 0) {
          const { data: questionsData, error: questionsError } = await supabase
            .from("vr_questions")
            .select("id, explanation, difficulty, test_id")
            .in("id", questionIds)

          if (questionsError) {
            console.error("Error loading VR question lookup:", questionsError)
          } else {
            questionMap = new Map(
              ((questionsData ?? []) as VRQuestionLookupRow[]).map(
                (question) => [
                  question.id,
                  {
                    explanation: question.explanation || "",
                    difficulty: question.difficulty ?? null,
                    test_id: question.test_id ?? null,
                  },
                ]
              )
            )
          }
        }

        const testIds = Array.from(
          new Set(
            Array.from(questionMap.values())
              .map((question) => question.test_id)
              .filter((id): id is number => id !== null)
          )
        )

        let testMap = new Map<number, VRTestLookupRow>()

        if (testIds.length > 0) {
          const { data: testsData, error: testsError } = await supabase
            .from("vr_tests")
            .select("id, category")
            .in("id", testIds)

          if (testsError) {
            console.error("Error loading VR test lookup:", testsError)
          } else {
            testMap = new Map(
              ((testsData ?? []) as VRTestLookupRow[]).map((test) => [
                test.id,
                test,
              ])
            )
          }
        }

        const mergedRows: VRReviewItem[] = reviewRows.map((row) => {
          const questionInfo =
            row.question_id !== null ? questionMap.get(row.question_id) : null

          const linkedTest =
            questionInfo?.test_id !== null && questionInfo?.test_id !== undefined
              ? testMap.get(questionInfo.test_id)
              : null

          const categoryFromReview = normaliseVRCategory(row.category)
          const categoryFromTest = normaliseVRCategory(linkedTest?.category)

          return {
            id: String(row.id),
            user_id: row.user_id,
            question_id: row.question_id ?? null,
            question_text: row.question_text || "Question text unavailable.",
            created_at: row.created_at,
            explanation: questionInfo?.explanation || "",
            difficulty: row.difficulty ?? questionInfo?.difficulty ?? null,
            test_id: questionInfo?.test_id ?? null,
            category:
              categoryFromReview !== "unknown"
                ? categoryFromReview
                : categoryFromTest,
          }
        })

        if (!mounted) return

        setReviewQuestions(mergedRows)
      } finally {
        if (mounted) {
          setLoadingData(false)
        }
      }
    }

    void fetchReviewQuestions()

    return () => {
      mounted = false
    }
  }, [router])

  async function removeQuestion(item: VRReviewItem) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    let query = supabase.from("vr_review").delete().eq("user_id", user.id)

    if (item.question_id !== null) {
      query = query.eq("question_id", item.question_id)
    } else {
      query = query.ilike("question_text", item.question_text)
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting VR review question:", error)
      return
    }

    setReviewQuestions((previous) =>
      previous.filter((row) => !isSameReviewItem(row, item))
    )
  }

  const uniqueQuestions = useMemo(() => {
    return Array.from(
      new Map(
        reviewQuestions.map((item) => {
          const key =
            item.question_id !== null
              ? `${item.category}::id::${item.question_id}`
              : `${item.category}::text::${item.question_text.toLowerCase()}`

          return [key, item]
        })
      ).values()
    )
  }, [reviewQuestions])

  const filteredQuestions = useMemo(() => {
    const cutoff = getCutoffDate(timeFilter)

    return uniqueQuestions.filter((question) => {
      const matchesTime = cutoff
        ? new Date(question.created_at) >= cutoff
        : true

      const matchesDifficulty =
        difficultyFilter === "all" ||
        String(question.difficulty ?? "") === difficultyFilter

      const matchesCategory =
        categoryFilter === "all" || question.category === categoryFilter

      return matchesTime && matchesDifficulty && matchesCategory
    })
  }, [uniqueQuestions, timeFilter, difficultyFilter, categoryFilter])

  function retryFilteredQuestions() {
    const targetCategory =
      categoryFilter !== "all"
        ? categoryFilter
        : filteredQuestions.length > 0
          ? filteredQuestions[0].category
          : null

    if (!targetCategory || targetCategory === "unknown") return

    const config = getReviewStorageConfig(targetCategory)
    if (!config) return

    const ids = filteredQuestions
      .filter((row) => row.category === targetCategory)
      .map((row) => row.question_id)
      .filter((id): id is number => id !== null)

    const uniqueIds = Array.from(new Set(ids))

    if (uniqueIds.length === 0) return

    localStorage.setItem(config.key, JSON.stringify(uniqueIds))
    localStorage.setItem("vr_review_question_ids", JSON.stringify(uniqueIds))

    router.push(config.route)
  }

  const reviewStats = useMemo(() => {
    const totalItems = filteredQuestions.length
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
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )[0]
      : null

    const withExplanation = filteredQuestions.filter(
      (row) => row.explanation && row.explanation.trim() !== ""
    ).length

    return {
      totalItems,
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
      "Code & Logic",
      "Sequence Patterns",
      "Not set",
    ]

    return Object.values(grouped).sort(
      (a, b) => order.indexOf(a.category) - order.indexOf(b.category)
    )
  }, [filteredQuestions])

  const recentQuestions = useMemo(() => {
    return [...filteredQuestions]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
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

    return `You currently have ${reviewStats.totalItems} verbal reasoning questions to review. The biggest review category is ${mostCommon}, and ${reviewStats.withExplanation} of these questions already include an explanation to support revision.`
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
              Retry filtered questions
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
            title="Questions to Review"
            value={String(reviewStats.totalItems)}
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
                ? formatDateTime(reviewStats.mostRecentItem.created_at)
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
            title="Quick Insights"
            subtitle="A snapshot of current revision needs."
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
                  Review Queue
                </div>

                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {reviewStats.totalItems}
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
                  Explanations Ready
                </div>

                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  {reviewStats.withExplanation}
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
                  Main Focus
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
                  {reviewStats.mostCommonCategory
                    ? reviewStats.mostCommonCategory.category
                    : "—"}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Recent Review Items"
          subtitle="Your latest verbal reasoning questions to revisit."
        >
          {recentQuestions.length ? (
            <div style={{ overflowX: "auto", maxWidth: "100%" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "860px",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Level</th>
                    <th style={thStyle}>Question</th>
                    <th style={thStyle}>Explanation</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {recentQuestions.map((row) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <td style={tdStyle}>{formatDateTime(row.created_at)}</td>
                      <td style={tdStyle}>{getCategoryLabel(row.category)}</td>
                      <td style={tdStyle}>{getLevelLabel(row.difficulty)}</td>

                      <td style={{ ...tdStyle, maxWidth: "300px" }}>
                        {truncateText(row.question_text, 130)}
                      </td>

                      <td style={{ ...tdStyle, maxWidth: "320px" }}>
                        {row.explanation && row.explanation.trim()
                          ? truncateText(row.explanation, 140)
                          : "No explanation available."}
                      </td>

                      <td style={tdStyle}>
                        <button
                          type="button"
                          onClick={() => removeQuestion(row)}
                          style={removeButtonStyle}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={emptyStateStyle}>
              No review items found for the selected filters.
            </div>
          )}
        </SectionCard>

        {filteredQuestions.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
              gap: "18px",
              marginTop: "20px",
              minWidth: 0,
            }}
          >
            {filteredQuestions.slice(0, 9).map((row) => (
              <div
                key={row.id}
                style={{
                  background:
                    "linear-gradient(180deg, #ffffff 0%, #f7fff8 100%)",
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
                  Added: {formatDateTime(row.created_at)}
                </div>

                <button
                  type="button"
                  onClick={() => removeQuestion(row)}
                  style={removeButtonStyle}
                >
                  Remove from review
                </button>
              </div>
            ))}
          </div>
        ) : null}

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
  verticalAlign: "top",
}