// app/(protected)/review/math/page.tsx
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

type MathReviewRow = {
  id: number
  user_id: string
  test_id: number
  question_id: number
  category: string
  question_text: string
  correct_answer: string
  user_answer: string | null
  created_at: string
}

type TimeFilter = "7d" | "30d" | "90d" | "all"

const CATEGORY_LABELS: Record<string, string> = {
  number_place_value: "Number Place Value",
  four_operations: "Four Operations",
  fractions_decimals_percentages: "Fractions, Decimals & Percentages",
  shape_space: "Shape & Space",
  measurement: "Measurement",
  data_handling: "Data Handling",
  algebra_reasoning: "Algebra Reasoning",
}

const categoryOptions = [
  { value: "all", label: "All Categories" },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
]

const timeOptions: { value: TimeFilter; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
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

function formatCategory(category: string) {
  return CATEGORY_LABELS[category] ?? category
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

function truncateText(text: string, maxLength = 120) {
  if (!text) return "—"
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function formatAnswer(answer: string | null) {
  return answer && answer.trim() ? answer : "No answer"
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
      <div style={{ fontSize: "14px", color: "#64748b", fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: "34px", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
        {value}
      </div>
      {subtitle ? (
        <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "8px" }}>{subtitle}</div>
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

export default function MathReviewPage() {
  const router = useRouter()

  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingData, setLoadingData] = useState(true)
  const [rows, setRows] = useState<MathReviewRow[]>([])
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")
  const [answerFilter, setAnswerFilter] = useState<"all" | "wrong" | "unanswered">("all")

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

      const { data, error } = await supabase
        .from("math_review")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading math review:", error)
        setRows([])
      } else {
        setRows((data ?? []) as MathReviewRow[])
      }

      if (mounted) {
        setLoadingData(false)
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [router])

  const filteredRows = useMemo(() => {
    const cutoff = getCutoffDate(timeFilter)

    return rows.filter((row) => {
      const matchesCategory = categoryFilter === "all" || row.category === categoryFilter
      const matchesTime = cutoff ? new Date(row.created_at) >= cutoff : true

      const isUnanswered = !row.user_answer || !row.user_answer.trim()
      const isWrong = !isUnanswered && row.user_answer !== row.correct_answer

      const matchesAnswerType =
        answerFilter === "all" ||
        (answerFilter === "wrong" && isWrong) ||
        (answerFilter === "unanswered" && isUnanswered)

      return matchesCategory && matchesTime && matchesAnswerType
    })
  }, [rows, categoryFilter, timeFilter, answerFilter])

  const reviewStats = useMemo(() => {
    const totalQuestions = filteredRows.length

    const unansweredCount = filteredRows.filter(
      (row) => !row.user_answer || !row.user_answer.trim()
    ).length

    const wrongAnsweredCount = filteredRows.filter(
      (row) => row.user_answer && row.user_answer.trim() && row.user_answer !== row.correct_answer
    ).length

    const uniqueCategories = new Set(filteredRows.map((row) => row.category)).size

    const byCategory = Object.entries(
      filteredRows.reduce((acc, row) => {
        if (!acc[row.category]) {
          acc[row.category] = 0
        }
        acc[row.category] += 1
        return acc
      }, {} as Record<string, number>)
    ).map(([category, count]) => ({ category, count }))

    const mostMissedCategory =
      byCategory.length > 0
        ? byCategory.reduce((max, current) => (current.count > max.count ? current : max))
        : null

    const mostRecentMistake = filteredRows.length
      ? [...filteredRows].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
      : null

    return {
      totalQuestions,
      unansweredCount,
      wrongAnsweredCount,
      uniqueCategories,
      mostMissedCategory,
      mostRecentMistake,
    }
  }, [filteredRows])

  const mistakesByCategoryData = useMemo(() => {
    const grouped = filteredRows.reduce((acc, row) => {
      if (!acc[row.category]) {
        acc[row.category] = {
          category: row.category,
          count: 0,
        }
      }

      acc[row.category].count += 1
      return acc
    }, {} as Record<string, { category: string; count: number }>)

    return Object.values(grouped)
      .map((item) => ({
        category: formatCategory(item.category),
        mistakes: item.count,
      }))
      .sort((a, b) => b.mistakes - a.mistakes)
  }, [filteredRows])

  const recentMistakes = useMemo(() => {
    return [...filteredRows]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)
  }, [filteredRows])

  const summaryText = useMemo(() => {
    if (!filteredRows.length) {
      return "No maths review data yet for the selected filters."
    }

    const mostMissed = reviewStats.mostMissedCategory
      ? `${formatCategory(reviewStats.mostMissedCategory.category)} (${reviewStats.mostMissedCategory.count})`
      : "N/A"

    return `You currently have ${reviewStats.totalQuestions} maths questions to review across ${reviewStats.uniqueCategories} categories. ${reviewStats.unansweredCount} were unanswered, ${reviewStats.wrongAnsweredCount} were answered incorrectly, and the area needing the most attention is ${mostMissed}.`
  }, [filteredRows, reviewStats])

  if (loadingUser || loadingData) {
    return (
      <div style={{ padding: "32px", color: "#334155", fontSize: "18px" }}>
        Loading math review...
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(16,185,129,0.10) 0%, rgba(255,255,255,1) 32%), linear-gradient(180deg, #f8fafc 0%, #ecfeff 100%)",
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
              📝 Math Review
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
              Review mistakes across all seven maths categories, spot common problem areas,
              and focus revision where it matters most.
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
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={selectStyle}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
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

            <select
              value={answerFilter}
              onChange={(e) =>
                setAnswerFilter(e.target.value as "all" | "wrong" | "unanswered")
              }
              style={selectStyle}
            >
              <option value="all">All Review Items</option>
              <option value="wrong">Wrong Answers</option>
              <option value="unanswered">Unanswered</option>
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
          <StatCard title="Questions to Review" value={String(reviewStats.totalQuestions)} />
          <StatCard title="Wrong Answers" value={String(reviewStats.wrongAnsweredCount)} />
          <StatCard title="Unanswered" value={String(reviewStats.unansweredCount)} />
          <StatCard title="Categories with Mistakes" value={String(reviewStats.uniqueCategories)} />
          <StatCard
            title="Most Missed Category"
            value={
              reviewStats.mostMissedCategory
                ? formatCategory(reviewStats.mostMissedCategory.category)
                : "—"
            }
            subtitle={
              reviewStats.mostMissedCategory
                ? `${reviewStats.mostMissedCategory.count} review items`
                : undefined
            }
          />
          <StatCard
            title="Most Recent Mistake"
            value={
              reviewStats.mostRecentMistake
                ? formatCategory(reviewStats.mostRecentMistake.category)
                : "—"
            }
            subtitle={
              reviewStats.mostRecentMistake
                ? formatDateTime(reviewStats.mostRecentMistake.created_at)
                : undefined
            }
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
            title="Mistakes by Category"
            subtitle="See which maths topics are producing the most review items."
          >
            <div style={{ width: "100%", height: "360px" }}>
              {mistakesByCategoryData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mistakesByCategoryData} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={170}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={(value: number) => [value, "Review Items"]} />
                    <Bar dataKey="mistakes" fill="#f97316" radius={[0, 10, 10, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={emptyStateStyle}>No data available for this filter.</div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Quick Insights"
            subtitle="A fast view of what needs attention."
          >
            <div style={{ display: "grid", gap: "14px" }}>
              <div
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                }}
              >
                <div style={{ color: "#c2410c", fontWeight: 700, marginBottom: "6px" }}>
                  Review Queue
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>
                  {reviewStats.totalQuestions}
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                }}
              >
                <div style={{ color: "#b91c1c", fontWeight: 700, marginBottom: "6px" }}>
                  Wrong Answers
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>
                  {reviewStats.wrongAnsweredCount}
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  background: "#fef3c7",
                  border: "1px solid #fde68a",
                }}
              >
                <div style={{ color: "#a16207", fontWeight: 700, marginBottom: "6px" }}>
                  Unanswered
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>
                  {reviewStats.unansweredCount}
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  background: "#ecfeff",
                  border: "1px solid #a5f3fc",
                }}
              >
                <div style={{ color: "#0f766e", fontWeight: 700, marginBottom: "6px" }}>
                  Main Focus
                </div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                  {reviewStats.mostMissedCategory
                    ? formatCategory(reviewStats.mostMissedCategory.category)
                    : "—"}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Recent Review Items"
          subtitle="Your latest maths questions to revisit for the selected filters."
        >
          {recentMistakes.length ? (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "1100px",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Question</th>
                    <th style={thStyle}>Your Answer</th>
                    <th style={thStyle}>Correct Answer</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMistakes.map((row) => {
                    const unanswered = !row.user_answer || !row.user_answer.trim()

                    return (
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        <td style={tdStyle}>{formatDateTime(row.created_at)}</td>
                        <td style={tdStyle}>{formatCategory(row.category)}</td>
                        <td style={{ ...tdStyle, maxWidth: "420px" }}>
                          {truncateText(row.question_text, 160)}
                        </td>
                        <td style={tdStyle}>{formatAnswer(row.user_answer)}</td>
                        <td style={tdStyle}>{row.correct_answer}</td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "6px 10px",
                              borderRadius: "999px",
                              background: unanswered ? "#fef3c7" : "#fee2e2",
                              color: unanswered ? "#92400e" : "#991b1b",
                              fontWeight: 700,
                              fontSize: "13px",
                            }}
                          >
                            {unanswered ? "Unanswered" : "Incorrect"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={emptyStateStyle}>No review items found for the selected filters.</div>
          )}
        </SectionCard>

        <div
          style={{
            marginTop: "20px",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "white",
            borderRadius: "28px",
            padding: "26px",
            boxShadow: "0 12px 34px rgba(15, 23, 42, 0.22)",
          }}
        >
          <div style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
            Overall Summary
          </div>
          <div style={{ color: "#cbd5e1", fontSize: "16px", lineHeight: 1.7 }}>{summaryText}</div>
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