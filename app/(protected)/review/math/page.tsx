// app/(protected)/review/math/page.tsx
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
  ResponsiveContainer,
  Cell,
} from "recharts"

type ValueType = string | number | undefined
type NameType = string | number

type TimeFilter = "all" | "week" | "month" | "3months"

type MathTest = {
  id: string
  title: string
  category: string
  difficulty: number | null
}

type MathProgress = {
  test_id: string
  user_id: string
  created_at: string
  user_answer: string | null
  correct_answer: string | null
}

type ReviewItem = MathTest & {
  created_at: string
  user_answer: string | null
  correct_answer: string | null
}

const timeFilterOptions: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "week", label: "Past Week" },
  { value: "month", label: "Past Month" },
  { value: "3months", label: "Past 3 Months" },
]

const categoryOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "Number Place Value", label: "Number Place Value" },
  { value: "Four Operations", label: "Four Operations" },
  { value: "Mental Maths", label: "Mental Maths" },
  { value: "Algebra & Reasoning", label: "Algebra & Reasoning" },
  { value: "Fractions & Decimals", label: "Fractions & Decimals" },
  { value: "Percentages", label: "Percentages" },
  { value: "Measurement", label: "Measurement" },
]

const difficultyOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Difficulties" },
  { value: "1", label: "Easy" },
  { value: "2", label: "Medium" },
  { value: "3", label: "Hard" },
]

const CATEGORY_COLORS = ["#22c55e", "#16a34a", "#15803d", "#14532d", "#166534", "#0f766e", "#0d9488"]
const DIFFICULTY_COLORS = ["#f97316", "#ea580c", "#c2410c", "#9a3412"]

function getCutoffDate(filter: TimeFilter) {
  const now = new Date()
  switch (filter) {
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case "3months":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    default:
      return null
  }
}

function formatCategory(category: string | null | undefined) {
  return category || "Unknown"
}

function formatDifficulty(difficulty: number | null) {
  if (difficulty === 1) return "Easy"
  if (difficulty === 2) return "Medium"
  if (difficulty === 3) return "Hard"
  return "Not set"
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—"
  const date = new Date(value)
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function truncateText(text: string | null | undefined, maxLength = 120) {
  if (!text) return "—"
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function formatAnswer(answer: string | null | undefined) {
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
          fontSize: "28px",
          fontWeight: 800,
          color: "#166534",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>

      {subtitle && (
        <div
          style={{
            fontSize: "13px",
            color: "#64748b",
            marginTop: "8px",
          }}
        >
          {subtitle}
        </div>
      )}
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
        background: "white",
        borderRadius: "24px",
        padding: "24px",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
        border: "1px solid #e2e8f0",
        marginBottom: "20px",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
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
              margin: "10px 0 0 0",
              color: "#64748b",
              fontSize: "15px",
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

  const [loading, setLoading] = useState(true)
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])

  const [categoryFilter, setCategoryFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [answerFilter, setAnswerFilter] = useState("all")

  useEffect(() => {
    async function loadReviewItems() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/login")
        return
      }

      const { data: progressData, error: progressError } = await supabase
        .from("math_progress")
        .select("test_id, user_id, created_at, user_answer, correct_answer")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }) as { data: MathProgress[] | null; error: any }

      if (progressError) {
        console.error("Error loading progress:", progressError)
        setLoading(false)
        return
      }

      const testIds = [...new Set(progressData?.map((p: MathProgress) => p.test_id).filter(Boolean) || [])]

      if (testIds.length === 0) {
        setReviewItems([])
        setLoading(false)
        return
      }

      const { data: testsData, error: testsError } = await supabase
        .from("math_tests")
        .select("id, title, category, difficulty")
        .in("id", testIds) as { data: MathTest[] | null; error: any }

      if (testsError) {
        console.error("Error loading tests:", testsError)
        setLoading(false)
        return
      }

      const testMap = new Map(testsData?.map((t: MathTest) => [t.id, t]) || [])

      const items = progressData
        ?.map((p: MathProgress) => {
          const test = testMap.get(p.test_id)
          return {
            ...test,
            created_at: p.created_at,
            user_answer: p.user_answer,
            correct_answer: p.correct_answer,
          } as ReviewItem
        })
        .filter((item): item is ReviewItem => !!item && !!item.category)

      setReviewItems(items || [])
      setLoading(false)
    }

    loadReviewItems()
  }, [router])

  const filteredRows = useMemo(() => {
    let rows = [...reviewItems]

    const cutoffDate = getCutoffDate(timeFilter)
    if (cutoffDate) {
      rows = rows.filter((row) => row.created_at && new Date(row.created_at) >= cutoffDate)
    }

    if (categoryFilter !== "all") {
      rows = rows.filter((row) => row.category === categoryFilter)
    }

    if (difficultyFilter !== "all") {
      rows = rows.filter((row) => String(row.difficulty) === difficultyFilter)
    }

    return rows
  }, [reviewItems, categoryFilter, timeFilter, difficultyFilter])

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

        (acc[row.category] as number) += 1
        return acc
      }, {} as Record<string, number>)
    ).map(([category, count]) => ({ category, count }))

    const mostMissedCategory =
      byCategory.length > 0
        ? byCategory.reduce((max, current) =>
            (current.count as number) > (max.count as number) ? current : max
          )
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

      (acc[row.category].count as number) += 1
      return acc
    }, {} as Record<string, { category: string; count: number }>)

    return Object.values(grouped)
      .map((item, index) => ({
        name: formatCategory(item.category),
        mistakes: item.count,
        fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.mistakes - a.mistakes)
  }, [filteredRows])

  const mistakesByDifficultyData = useMemo(() => {
    const grouped = filteredRows.reduce((acc, row) => {
      const label = formatDifficulty(row.difficulty)

      if (!acc[label]) {
        acc[label] = 0
      }

      (acc[label] as number) += 1
      return acc
    }, {} as Record<string, number>)

    const order = ["Easy", "Medium", "Hard", "Not set"]

    return order
      .filter((difficulty) => grouped[difficulty])
      .map((difficulty, index) => ({
        name: difficulty,
        mistakes: grouped[difficulty],
        fill: DIFFICULTY_COLORS[index % DIFFICULTY_COLORS.length],
      }))
  }, [filteredRows])

  const recentMistakes = useMemo(() => {
    return [...filteredRows]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)
  }, [filteredRows])

  const summaryText = useMemo(() => {
    if (!filteredRows.length) {
      return "No review items found. Complete some maths tests to see your review data here."
    }

    const { totalQuestions, unansweredCount, wrongAnsweredCount, uniqueCategories } = reviewStats

    let text = `You have ${totalQuestions} total review items across ${uniqueCategories} categories.`

    if (unansweredCount > 0) {
      text += ` ${unansweredCount} questions were left unanswered.`
    }

    if (wrongAnsweredCount > 0) {
      text += ` ${wrongAnsweredCount} questions were answered incorrectly.`
    }

    return text
  }, [filteredRows, reviewStats])

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <p style={{ color: "#64748b", fontSize: "18px", fontWeight: 600 }}>
          Loading maths review...
        </p>
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
          <div style={{ minWidth: 0, flex: "1 1 300px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(28px, 5vw, 42px)",
                fontWeight: 900,
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              📝 Maths Review
            </h1>

            <p
              style={{
                margin: "10px 0 0 0",
                color: "#475569",
                fontSize: "clamp(14px, 2vw, 17px)",
                maxWidth: "760px",
                lineHeight: 1.6,
              }}
            >
              Review mistakes across all seven maths categories, spot common problem
              areas, and focus revision where it matters most.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              width: "100%",
            }}
          >
            <select
              id="math-review-category-filter"
              name="mathReviewCategoryFilter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{...selectStyle, flex: "1 1 140px", minWidth: "140px"}}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              id="math-review-time-filter"
              name="mathReviewTimeFilter"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              style={{...selectStyle, flex: "1 1 120px", minWidth: "120px"}}
            >
              {timeFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              id="math-review-difficulty-filter"
              name="mathReviewDifficultyFilter"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              style={{...selectStyle, flex: "1 1 130px", minWidth: "130px"}}
            >
              {difficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              id="math-review-answer-filter"
              name="mathReviewAnswerFilter"
              value={answerFilter}
              onChange={(e) => setAnswerFilter(e.target.value)}
              style={{...selectStyle, flex: "1 1 130px", minWidth: "130px"}}
            >
              <option value="all">All Answers</option>
              <option value="wrong">Incorrect Only</option>
              <option value="unanswered">Unanswered Only</option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <StatCard
            title="Total Review Items"
            value={reviewStats.totalQuestions.toString()}
            subtitle={`Across ${reviewStats.uniqueCategories} categories`}
          />

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
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <SectionCard
            title="Mistakes by Category"
            subtitle="Which maths topics need more revision?"
          >
            {mistakesByCategoryData.length > 0 ? (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mistakesByCategoryData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12, fill: "#64748b" }} 
                      angle={-45}
                      textAnchor="end"
                      interval={0}
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "white", 
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.1)"
                      }}
                    />
                    <Bar dataKey="mistakes" radius={[8, 8, 0, 0]}>
                      {mistakesByCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={emptyStateStyle}>No category data available.</div>
            )}
          </SectionCard>

          <SectionCard
            title="Mistakes by Difficulty"
            subtitle="Which difficulty level has the most mistakes?"
          >
            {mistakesByDifficultyData.length > 0 ? (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mistakesByDifficultyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "white", 
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.1)"
                      }}
                    />
                    <Bar dataKey="mistakes" radius={[8, 8, 0, 0]}>
                      {mistakesByDifficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={emptyStateStyle}>No difficulty data available.</div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Recent Review Items"
          subtitle="Your latest maths questions to revisit for the selected filters."
        >
          {recentMistakes.length ? (
            <div style={{ overflowX: "auto", margin: "0 -24px", padding: "0 24px" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "700px",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Difficulty</th>
                    <th style={thStyle}>Question</th>
                    <th style={thStyle}>Your Answer</th>
                    <th style={thStyle}>Correct Answer</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentMistakes.map((row, index) => {
                    const unanswered = !row.user_answer || !row.user_answer.trim()
                    const incorrect = row.user_answer && row.user_answer.trim() && row.user_answer !== row.correct_answer

                    return (
                      <tr
                        key={index}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        <td style={tdStyle}>
                          {formatDateTime(row.created_at)}
                        </td>
                        <td style={tdStyle}>
                          {formatCategory(row.category)}
                        </td>
                        <td style={tdStyle}>
                          {formatDifficulty(row.difficulty)}
                        </td>
                        <td style={tdStyle}>
                          {truncateText(row.title)}
                        </td>
                        <td style={tdStyle}>
                          {formatAnswer(row.user_answer)}
                        </td>
                        <td style={tdStyle}>
                          {formatAnswer(row.correct_answer)}
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              padding: "6px 10px",
                              borderRadius: "999px",
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
            background: "linear-gradient(135deg, #16a34a 0%, #065f46 100%)",
            color: "white",
            borderRadius: "28px",
            padding: "26px",
            boxShadow: "0 12px 34px rgba(6, 95, 70, 0.22)",
          }}
        >
          <div style={{ fontSize: "clamp(18px, 3vw, 22px)", fontWeight: 800, marginBottom: "8px" }}>
            Overall Summary
          </div>

          <div style={{ color: "#dcfce7", fontSize: "clamp(14px, 2vw, 16px)", lineHeight: 1.7 }}>
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