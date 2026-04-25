// app/(protected)/review/vr/page.tsx
"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
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
  question_id: number | null
  question_text: string
  difficulty: number | null
  created_at: string
  explanation?: string
  category?: string | null
  test_id?: number | null
}

type VRQuestionRow = {
  id: number
  explanation: string | null
  difficulty: number | null
  test_id: number | null
}

type VRTestRow = {
  id: number
  category: string | null
}

type TimeFilter = "7d" | "30d" | "90d" | "all"
type DifficultyFilter = "all" | "1" | "2" | "3"
type CategoryFilter =
  | "all"
  | "word-relationships"
  | "codes-logic"
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
  { value: "codes-logic", label: "Codes & Logic" },
  { value: "sequence-pattern", label: "Sequence & Patterns" },
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

function getCategoryLabel(category: string | null | undefined) {
  if (category === "word-relationships") return "Word Relationships"
  if (category === "codes-logic") return "Codes & Logic"
  if (category === "sequence-pattern") return "Sequence & Patterns"
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

function truncateText(text: string, maxLength = 160) {
  if (!text) return "—"
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function toSafeNumber(value: unknown) {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
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
  return [toSafeNumber(numericValue), "Questions"]
}

function ChartBox({
  children,
}: {
  children: (size: { width: number; height: number }) => React.ReactNode
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = containerRef.current

    if (!element) return

    function updateSize() {
      if (!element) return

      const rect = element.getBoundingClientRect()

      setSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      })
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
    <div ref={containerRef} style={chartContainerStyle}>
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  )
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
  const valueFontSize = value.length > 18 ? "22px" : "34px"

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f7fff8 100%)",
        border: "1px solid #dcfce7",
        borderRadius: "24px",
        padding: "22px",
        boxShadow: "0 10px 30px rgba(22, 163, 74, 0.08)",
        minHeight: "132px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minWidth: 0,
        overflow: "hidden",
        overflowWrap: "break-word",
        whiteSpace: "normal",
      }}
    >
      <div
        style={{
          fontSize: "14px",
          color: "#15803d",
          fontWeight: 700,
          overflowWrap: "break-word",
          lineHeight: 1.25,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: valueFontSize,
          fontWeight: 900,
          color: "#064e3b",
          lineHeight: 1.1,
          overflowWrap: "break-word",
          whiteSpace: "normal",
          minWidth: 0,
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
            overflowWrap: "break-word",
            lineHeight: 1.35,
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
        boxShadow: "0 10px 30px rgba(22, 163, 74, 0.08)",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div style={{ marginBottom: "18px", minWidth: 0 }}>
        <h2
          style={{
            margin: 0,
            fontSize: "22px",
            fontWeight: 900,
            color: "#064e3b",
            overflowWrap: "break-word",
            lineHeight: 1.2,
          }}
        >
          {title}
        </h2>

        {subtitle ? (
          <p
            style={{
              margin: "8px 0 0 0",
              color: "#475569",
              fontSize: "14px",
              overflowWrap: "break-word",
              lineHeight: 1.5,
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
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading VR review:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          full: error,
        })

        setReviewQuestions([])

        if (mounted) {
          setLoadingData(false)
        }

        return
      }

      const reviewData = (data || []) as VRReviewRow[]

      const questionIds = reviewData
        .map((row) => row.question_id)
        .filter((id): id is number => id !== null)

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
          console.error("Error loading VR explanations/questions:", {
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
              {
                explanation: question.explanation || "",
                difficulty: question.difficulty,
                test_id: question.test_id,
              },
            ])
          )
        }
      }

      const testIds = Array.from(
        new Set(
          Array.from(questionMap.values())
            .map((item) => item.test_id)
            .filter((id): id is number => id !== null)
        )
      )

      let testMap = new Map<number, VRTestRow>()

      if (testIds.length > 0) {
        const { data: testsData, error: testsError } = await supabase
          .from("vr_tests")
          .select("id, category")
          .in("id", testIds)

        if (testsError) {
          console.error("Error loading VR test categories:", {
            message: testsError.message,
            details: testsError.details,
            hint: testsError.hint,
            code: testsError.code,
            full: testsError,
          })
        } else {
          testMap = new Map(
            ((testsData || []) as VRTestRow[]).map((test) => [test.id, test])
          )
        }
      }

      const mergedData = reviewData.map((row) => {
        const questionInfo =
          row.question_id !== null ? questionMap.get(row.question_id) : undefined

        const linkedTest =
          questionInfo?.test_id !== null && questionInfo?.test_id !== undefined
            ? testMap.get(questionInfo.test_id)
            : undefined

        return {
          ...row,
          explanation: questionInfo?.explanation || "",
          difficulty: row.difficulty ?? questionInfo?.difficulty ?? null,
          test_id: questionInfo?.test_id ?? null,
          category: linkedTest?.category ?? null,
        }
      })

      if (mounted) {
        setReviewQuestions(mergedData)
        setLoadingData(false)
      }
    }

    fetchReviewQuestions()

    return () => {
      mounted = false
    }
  }, [router])

  async function removeQuestion(questionText: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from("vr_review")
      .delete()
      .eq("user_id", user.id)
      .ilike("question_text", questionText)

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

    setReviewQuestions((prev) =>
      prev.filter(
        (row) => row.question_text.toLowerCase() !== questionText.toLowerCase()
      )
    )
  }

  const uniqueQuestions = useMemo(() => {
    return Array.from(
      new Map(
        reviewQuestions.map((item) => [item.question_text.toLowerCase(), item])
      ).values()
    )
  }, [reviewQuestions])

  const filteredQuestions = useMemo(() => {
    const cutoff = getCutoffDate(timeFilter)

    return uniqueQuestions.filter((q) => {
      const matchesDifficulty =
        difficultyFilter === "all" ||
        String(q.difficulty ?? "") === difficultyFilter

      const matchesTime = cutoff ? new Date(q.created_at) >= cutoff : true

      const matchesCategory =
        categoryFilter === "all" || (q.category ?? "") === categoryFilter

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
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
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
      "Sequence & Patterns",
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
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
      <div
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, rgba(34,197,94,0.14) 0%, rgba(255,255,255,1) 34%), linear-gradient(180deg, #f7fff8 0%, #ecfdf5 100%)",
          padding: "32px",
          color: "#064e3b",
          fontSize: "18px",
          fontWeight: 700,
        }}
      >
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
        padding: "28px 20px 50px",
      }}
    >
      <div style={{ maxWidth: "1320px", margin: "0 auto", minWidth: 0 }}>
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
                fontSize: "42px",
                fontWeight: 900,
                color: "#064e3b",
                letterSpacing: "-0.02em",
                overflowWrap: "break-word",
                lineHeight: 1.1,
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
              minWidth: 0,
            }}
          >
            <select
              id="vr-review-category-filter"
              name="vrReviewCategoryFilter"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as CategoryFilter)
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
              onChange={(e) =>
                setDifficultyFilter(e.target.value as DifficultyFilter)
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
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              style={selectStyle}
            >
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
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
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
            minWidth: 0,
          }}
        >
          <StatCard
            title="Questions to Review"
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
            marginBottom: "20px",
            alignItems: "stretch",
            minWidth: 0,
          }}
        >
          <SectionCard
            title="Review Questions by Category"
            subtitle="See which VR categories need the most revision."
          >
            {reviewByCategoryData.length ? (
              <ChartBox>
                {({ width, height }) => (
                  <BarChart
                    width={width}
                    height={height}
                    data={reviewByCategoryData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 44 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#dcfce7" />
                    <XAxis
                      dataKey="category"
                      tick={{ fill: "#475569", fontSize: 12 }}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis allowDecimals={false} tick={{ fill: "#475569" }} />
                    <Tooltip formatter={questionsTooltipFormatter} />
                    <Bar
                      dataKey="count"
                      fill="#16a34a"
                      radius={[10, 10, 0, 0]}
                    />
                  </BarChart>
                )}
              </ChartBox>
            ) : (
              <div style={emptyStateStyle}>No data available for this filter.</div>
            )}
          </SectionCard>

          <SectionCard
            title="Quick Insights"
            subtitle="A snapshot of current revision needs."
          >
            <div style={{ display: "grid", gap: "14px", minWidth: 0 }}>
              <div style={insightCardStyle}>
                <div style={insightLabelStyle}>Review Queue</div>
                <div style={insightBigValueStyle}>
                  {reviewStats.totalQuestions}
                </div>
              </div>

              <div style={insightCardStyle}>
                <div style={insightLabelStyle}>Explanations Ready</div>
                <div style={insightBigValueStyle}>
                  {reviewStats.withExplanation}
                </div>
              </div>

              <div style={insightCardStyle}>
                <div style={insightLabelStyle}>Main Focus</div>
                <div style={insightTextValueStyle}>
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
            <div style={{ overflowX: "auto", minWidth: 0 }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "1080px",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #dcfce7" }}>
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
                      style={{ borderBottom: "1px solid #ecfdf5" }}
                    >
                      <td style={tdStyle}>{formatDateTime(row.created_at)}</td>
                      <td style={tdStyle}>{getCategoryLabel(row.category)}</td>
                      <td style={tdStyle}>{getLevelLabel(row.difficulty)}</td>
                      <td style={{ ...tdStyle, maxWidth: "320px" }}>
                        {truncateText(row.question_text, 130)}
                      </td>
                      <td style={{ ...tdStyle, maxWidth: "340px" }}>
                        {row.explanation && row.explanation.trim()
                          ? truncateText(row.explanation, 140)
                          : "No explanation available."}
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => removeQuestion(row.question_text)}
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
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "18px",
              marginTop: "20px",
              minWidth: 0,
            }}
          >
            {filteredQuestions.slice(0, 9).map((row) => (
              <div
                key={row.id}
                style={{
                  background: "linear-gradient(180deg, #ffffff 0%, #f7fff8 100%)",
                  border: "1px solid #dcfce7",
                  borderRadius: "24px",
                  padding: "20px",
                  boxShadow: "0 10px 30px rgba(22, 163, 74, 0.08)",
                  minWidth: 0,
                  overflow: "hidden",
                  overflowWrap: "break-word",
                  whiteSpace: "normal",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    padding: "6px 10px",
                    borderRadius: "999px",
                    background: "#dcfce7",
                    color: "#166534",
                    fontSize: "12px",
                    fontWeight: 800,
                    marginBottom: "10px",
                    overflowWrap: "break-word",
                    lineHeight: 1.25,
                  }}
                >
                  {getCategoryLabel(row.category)}
                </div>

                <div
                  style={{
                    display: "inline-block",
                    padding: "6px 10px",
                    borderRadius: "999px",
                    background: "#ecfdf5",
                    color: "#047857",
                    fontSize: "12px",
                    fontWeight: 800,
                    marginBottom: "14px",
                    marginLeft: "8px",
                    overflowWrap: "break-word",
                    lineHeight: 1.25,
                  }}
                >
                  {getLevelLabel(row.difficulty)}
                </div>

                <h3
                  style={{
                    margin: "0 0 10px 0",
                    color: "#064e3b",
                    fontSize: "18px",
                    fontWeight: 900,
                    overflowWrap: "break-word",
                    lineHeight: 1.25,
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
                    overflowWrap: "break-word",
                  }}
                >
                  {row.question_text}
                </p>

                <div
                  style={{
                    padding: "14px",
                    borderRadius: "16px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    marginBottom: "14px",
                    minWidth: 0,
                    overflow: "hidden",
                    overflowWrap: "break-word",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#15803d",
                      marginBottom: "6px",
                      overflowWrap: "break-word",
                    }}
                  >
                    Explanation
                  </div>

                  <div
                    style={{
                      color: "#334155",
                      lineHeight: 1.6,
                      fontSize: "14px",
                      overflowWrap: "break-word",
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
                    lineHeight: 1.35,
                  }}
                >
                  Added: {formatDateTime(row.created_at)}
                </div>

                <button
                  onClick={() => removeQuestion(row.question_text)}
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
            boxShadow: "0 12px 34px rgba(22, 163, 74, 0.22)",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: 900,
              marginBottom: "8px",
              overflowWrap: "break-word",
              lineHeight: 1.25,
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

const chartContainerStyle: React.CSSProperties = {
  width: "100%",
  height: "340px",
  minWidth: 0,
  minHeight: "340px",
}

const selectStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid #bbf7d0",
  backgroundColor: "white",
  fontSize: "14px",
  fontWeight: 700,
  color: "#064e3b",
  minWidth: "180px",
  boxShadow: "0 4px 14px rgba(22, 163, 74, 0.08)",
}

const actionButtonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: "14px",
  border: "none",
  background: "#16a34a",
  color: "white",
  fontWeight: 800,
  boxShadow: "0 10px 24px rgba(22, 163, 74, 0.25)",
}

const removeButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "12px",
  border: "none",
  background: "#e11d48",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  overflowWrap: "break-word",
}

const emptyStateStyle: React.CSSProperties = {
  minHeight: "240px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  fontSize: "15px",
  background: "#f7fff8",
  border: "1px dashed #bbf7d0",
  borderRadius: "18px",
  textAlign: "center",
  padding: "20px",
}

const insightCardStyle: React.CSSProperties = {
  padding: "16px",
  borderRadius: "18px",
  background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)",
  border: "1px solid #bbf7d0",
  minWidth: 0,
  overflow: "hidden",
  overflowWrap: "break-word",
  whiteSpace: "normal",
}

const insightLabelStyle: React.CSSProperties = {
  color: "#15803d",
  fontWeight: 800,
  marginBottom: "6px",
  overflowWrap: "break-word",
  lineHeight: 1.25,
}

const insightBigValueStyle: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 900,
  color: "#064e3b",
  overflowWrap: "break-word",
  lineHeight: 1.15,
}

const insightTextValueStyle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 900,
  color: "#064e3b",
  overflowWrap: "break-word",
  lineHeight: 1.25,
  minWidth: 0,
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  fontSize: "13px",
  color: "#15803d",
  fontWeight: 800,
  whiteSpace: "nowrap",
}

const tdStyle: React.CSSProperties = {
  padding: "16px 12px",
  fontSize: "14px",
  color: "#0f172a",
  fontWeight: 500,
  overflowWrap: "break-word",
  lineHeight: 1.35,
}