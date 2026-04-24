"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabaseClient"
import {
  ResponsiveContainer,
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

type NVRReviewRow = {
  id: string
  user_id: string
  test_id: number | null
  question_id: number | null
  category: string | null
  question_text: string
  user_answer: string | null
  correct_answer: string | null
  created_at: string
  explanation?: string
  difficulty?: number | null
}

type NVRQuestionRow = {
  id: number
  explanation: string | null
  difficulty: number | null
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
  if (category === "shape-patterns") return "Shape Patterns"
  if (category === "rotations-reflections") return "Rotations & Reflections"
  if (category === "codes-spatial-logic") return "Codes & Spatial Logic"
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
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #e5e7eb",
        borderRadius: "24px",
        padding: "22px",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
        minHeight: "132px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: "14px", color: "#64748b", fontWeight: 600 }}>
        {title}
      </div>

      <div
        style={{
          fontSize: "34px",
          fontWeight: 800,
          color: "#0f172a",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>

      {subtitle ? (
        <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "8px" }}>
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
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #e5e7eb",
        borderRadius: "28px",
        padding: "24px",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
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

export default function NVRReviewPage() {
  const router = useRouter()

  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingData, setLoadingData] = useState(true)
  const [reviewQuestions, setReviewQuestions] = useState<NVRReviewRow[]>([])
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all")
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
        .from("nvr_review")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading NVR review:", {
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

      const reviewData = (data || []) as NVRReviewRow[]

      const questionIds = reviewData
        .map((row) => row.question_id)
        .filter((id): id is number => id !== null)

      let questionMap = new Map<
        number,
        {
          explanation: string
          difficulty: number | null
        }
      >()

      if (questionIds.length > 0) {
        const { data: questionsData, error: questionsError } = await supabase
          .from("nvr_questions")
          .select("id, explanation, difficulty")
          .in("id", questionIds)

        if (questionsError) {
          console.error("Error loading NVR explanations:", {
            message: questionsError.message,
            details: questionsError.details,
            hint: questionsError.hint,
            code: questionsError.code,
            full: questionsError,
          })
        } else {
          questionMap = new Map(
            ((questionsData || []) as NVRQuestionRow[]).map((question) => [
              question.id,
              {
                explanation: question.explanation || "",
                difficulty: question.difficulty,
              },
            ])
          )
        }
      }

      const mergedData = reviewData.map((row) => {
        const questionInfo =
          row.question_id !== null ? questionMap.get(row.question_id) : undefined

        return {
          ...row,
          explanation: questionInfo?.explanation || "",
          difficulty: row.difficulty ?? questionInfo?.difficulty ?? null,
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

  async function removeQuestion(reviewId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from("nvr_review")
      .delete()
      .eq("user_id", user.id)
      .eq("id", reviewId)

    if (error) {
      console.error("Error deleting NVR review question:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        full: error,
      })
      return
    }

    setReviewQuestions((prev) => prev.filter((row) => row.id !== reviewId))
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

    return uniqueQuestions.filter((question) => {
      const matchesDifficulty =
        difficultyFilter === "all" ||
        String(question.difficulty ?? "") === difficultyFilter

      const matchesTime = cutoff ? new Date(question.created_at) >= cutoff : true

      const matchesCategory =
        categoryFilter === "all" || (question.category ?? "") === categoryFilter

      return matchesDifficulty && matchesTime && matchesCategory
    })
  }, [uniqueQuestions, difficultyFilter, timeFilter, categoryFilter])

  function retryFilteredQuestions() {
    const reviewQuestionIds = filteredQuestions
      .map((row) => row.question_id)
      .filter((id): id is number => id !== null)

    if (reviewQuestionIds.length === 0) return

    localStorage.setItem("nvr_review_question_ids", JSON.stringify(reviewQuestionIds))
    router.push("/nvr-test?mode=review")
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
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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
      "Shape Patterns",
      "Rotations & Reflections",
      "Codes & Spatial Logic",
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
      return "No non-verbal reasoning review questions found for the selected filters."
    }

    const mostCommon = reviewStats.mostCommonCategory
      ? `${reviewStats.mostCommonCategory.category} (${reviewStats.mostCommonCategory.count})`
      : "N/A"

    return `You currently have ${reviewStats.totalQuestions} non-verbal reasoning questions to review. The biggest review category is ${mostCommon}, and ${reviewStats.withExplanation} of these questions already include an explanation to support revision.`
  }, [filteredQuestions, reviewStats])

  if (loadingUser || loadingData) {
    return (
      <div style={{ padding: "32px", color: "#334155", fontSize: "18px" }}>
        Loading NVR review...
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(16,185,129,0.10) 0%, rgba(255,255,255,1) 32%), linear-gradient(180deg, #f8fafc 0%, #ecfdf5 100%)",
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
              🔷 NVR Review
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
              Review non-verbal reasoning questions that need more practice, filter by
              category and difficulty, and jump straight into a focused retry session.
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
              value={timeFilter}
              onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}
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
          }}
        >
          <StatCard
            title="Questions to Review"
            value={String(reviewStats.totalQuestions)}
          />

          <StatCard title="Total Review Bank" value={String(reviewStats.allUnique)} />

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
            subtitle={timeOptions.find((option) => option.value === timeFilter)?.label}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <SectionCard
            title="Review Questions by Category"
            subtitle="See which NVR categories need the most revision."
          >
            <div style={{ width: "100%", height: "340px" }}>
              {reviewByCategoryData.length ? (
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={reviewByCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={questionsTooltipFormatter} />
                    <Bar dataKey="count" fill="#10b981" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={emptyStateStyle}>No data available for this filter.</div>
              )}
            </div>
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
                  {reviewStats.totalQuestions}
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                }}
              >
                <div
                  style={{
                    color: "#1d4ed8",
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
          subtitle="Your latest non-verbal reasoning questions to revisit."
        >
          {recentQuestions.length ? (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "1080px",
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
                          onClick={() => removeQuestion(row.id)}
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
            }}
          >
            {filteredQuestions.slice(0, 9).map((row) => (
              <div
                key={row.id}
                style={{
                  background: "linear-gradient(180deg, #ffffff 0%, #f7fffb 100%)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "24px",
                  padding: "20px",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    padding: "6px 10px",
                    borderRadius: "999px",
                    background: "#d1fae5",
                    color: "#065f46",
                    fontSize: "12px",
                    fontWeight: 700,
                    marginBottom: "10px",
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
                    fontWeight: 700,
                    marginBottom: "14px",
                    marginLeft: "8px",
                  }}
                >
                  {getLevelLabel(row.difficulty)}
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
                  }}
                >
                  Added: {formatDateTime(row.created_at)}
                </div>

                <button
                  onClick={() => removeQuestion(row.id)}
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
            background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
            color: "white",
            borderRadius: "28px",
            padding: "26px",
            boxShadow: "0 12px 34px rgba(6, 78, 59, 0.22)",
          }}
        >
          <div style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
            Overall Summary
          </div>

          <div style={{ color: "#d1fae5", fontSize: "16px", lineHeight: 1.7 }}>
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
  border: "1px solid #cbd5e1",
  backgroundColor: "white",
  fontSize: "14px",
  fontWeight: 600,
  color: "#0f172a",
  minWidth: "180px",
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
}

const actionButtonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: "14px",
  border: "none",
  background: "#10b981",
  color: "white",
  fontWeight: 700,
  boxShadow: "0 10px 24px rgba(16, 185, 129, 0.25)",
}

const removeButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "12px",
  border: "none",
  background: "#e11d48",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
}

const emptyStateStyle: React.CSSProperties = {
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#94a3b8",
  fontSize: "15px",
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