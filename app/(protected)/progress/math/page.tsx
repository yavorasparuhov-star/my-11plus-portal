"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabaseClient"
import {
  ResponsiveContainer,
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

type MathProgressRow = {
  id: number
  user_id: string
  test_id: number
  category: string
  score: number
  total_questions: number
  success_rate: number
  created_at: string
}

type TimeFilter = "7d" | "30d" | "90d" | "all"
type CategoryFilter =
  | "all"
  | "number_place_value"
  | "four_operations"
  | "fractions_decimals_percentages"
  | "shape_space"
  | "measurement"
  | "data_handling"
  | "algebra_reasoning"

const CATEGORY_LABELS: Record<string, string> = {
  number_place_value: "Number & Place Value",
  four_operations: "Four Operations",
  fractions_decimals_percentages: "Fractions, Decimals & Percentages",
  shape_space: "Shape & Space",
  measurement: "Measurement",
  data_handling: "Data Handling",
  algebra_reasoning: "Algebra & Reasoning",
}

const CATEGORY_ORDER = [
  "number_place_value",
  "four_operations",
  "fractions_decimals_percentages",
  "shape_space",
  "measurement",
  "data_handling",
  "algebra_reasoning",
]

const categoryOptions: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "number_place_value", label: "Number & Place Value" },
  { value: "four_operations", label: "Four Operations" },
  { value: "fractions_decimals_percentages", label: "Fractions, Decimals & Percentages" },
  { value: "shape_space", label: "Shape & Space" },
  { value: "measurement", label: "Measurement" },
  { value: "data_handling", label: "Data Handling" },
  { value: "algebra_reasoning", label: "Algebra & Reasoning" },
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

function successTooltipFormatter(
  value: ValueType | undefined,
  _name: NameType | undefined
): [string, string] {
  const numericValue = toNumericValue(value)
  return [`${numericValue}%`, "Success"]
}

function averageSuccessTooltipFormatter(
  value: ValueType | undefined,
  _name: NameType | undefined
): [string, string] {
  const numericValue = toNumericValue(value)
  return [`${numericValue}%`, "Average Success"]
}

function attemptsTooltipFormatter(
  value: ValueType | undefined,
  _name: NameType | undefined
): [string, string] {
  const numericValue = toNumericValue(value)
  return [`${numericValue}`, "Attempts"]
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

export default function MathProgressPage() {
  const router = useRouter()

  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingData, setLoadingData] = useState(true)
  const [rows, setRows] = useState<MathProgressRow[]>([])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")

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
        .from("math_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading math progress:", error)
        setRows([])
      } else {
        setRows((data ?? []) as MathProgressRow[])
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
      const matchesTime = cutoff ? new Date(row.created_at) >= cutoff : true
      const matchesCategory = categoryFilter === "all" || row.category === categoryFilter
      return matchesTime && matchesCategory
    })
  }, [rows, timeFilter, categoryFilter])

  const overallStats = useMemo(() => {
    const testsCompleted = filteredRows.length
    const questionsPractised = filteredRows.reduce((sum, row) => sum + row.total_questions, 0)
    const totalCorrect = filteredRows.reduce((sum, row) => sum + row.score, 0)

    const averageSuccess =
      testsCompleted > 0
        ? filteredRows.reduce((sum, row) => sum + Number(row.success_rate), 0) / testsCompleted
        : 0

    const bestScore =
      testsCompleted > 0
        ? Math.max(...filteredRows.map((row) => Number(row.success_rate)))
        : 0

    const byCategory = Object.entries(
      filteredRows.reduce((acc, row) => {
        if (!acc[row.category]) {
          acc[row.category] = { attempts: 0, totalSuccess: 0 }
        }
        acc[row.category].attempts += 1
        acc[row.category].totalSuccess += Number(row.success_rate)
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
      scoreLabel: `${row.score}/${row.total_questions}`,
      category: formatCategory(row.category),
    }))
  }, [filteredRows])

  const successByCategoryData = useMemo(() => {
    const grouped = filteredRows.reduce((acc, row) => {
      if (!acc[row.category]) {
        acc[row.category] = {
          category: row.category,
          attempts: 0,
          totalSuccess: 0,
        }
      }

      acc[row.category].attempts += 1
      acc[row.category].totalSuccess += Number(row.success_rate)
      return acc
    }, {} as Record<string, { category: string; attempts: number; totalSuccess: number }>)

    return CATEGORY_ORDER
      .filter((category) => grouped[category])
      .map((category) => ({
        category: formatCategory(category),
        avgSuccess: Number(
          (grouped[category].totalSuccess / grouped[category].attempts).toFixed(1)
        ),
      }))
  }, [filteredRows])

  const attemptsByCategoryData = useMemo(() => {
    const grouped = filteredRows.reduce((acc, row) => {
      if (!acc[row.category]) {
        acc[row.category] = {
          category: row.category,
          attempts: 0,
          questions: 0,
        }
      }

      acc[row.category].attempts += 1
      acc[row.category].questions += row.total_questions
      return acc
    }, {} as Record<string, { category: string; attempts: number; questions: number }>)

    return CATEGORY_ORDER
      .filter((category) => grouped[category])
      .map((category) => ({
        category: formatCategory(category),
        attempts: grouped[category].attempts,
        questions: grouped[category].questions,
      }))
  }, [filteredRows])

  const recentAttempts = useMemo(() => {
    return [...filteredRows]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 12)
  }, [filteredRows])

  const summaryText = useMemo(() => {
    if (!filteredRows.length) {
      return "No maths progress data yet for the selected filters."
    }

    const strongest = overallStats.strongestCategory
      ? `${formatCategory(overallStats.strongestCategory.category)} (${overallStats.strongestCategory.avgSuccess.toFixed(1)}%)`
      : "N/A"

    const weakest = overallStats.weakestCategory
      ? `${formatCategory(overallStats.weakestCategory.category)} (${overallStats.weakestCategory.avgSuccess.toFixed(1)}%)`
      : "N/A"

    return `You answered ${overallStats.totalCorrect} maths questions correctly across ${overallStats.testsCompleted} completed tests. Your strongest area is ${strongest}, while your weakest area is ${weakest}.`
  }, [filteredRows, overallStats])

  if (loadingUser || loadingData) {
    return (
      <div style={{ padding: "32px", color: "#334155", fontSize: "18px" }}>
        Loading maths progress...
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(59,130,246,0.10) 0%, rgba(255,255,255,1) 32%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
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
              📘 Maths Progress
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
              Explore maths performance across all seven categories with live filters,
              trend tracking, category insights, and recent test history.
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
          <StatCard title="Tests Completed" value={String(overallStats.testsCompleted)} />
          <StatCard title="Questions Practised" value={String(overallStats.questionsPractised)} />
          <StatCard title="Average Success" value={`${overallStats.averageSuccess.toFixed(1)}%`} />
          <StatCard title="Best Score" value={`${overallStats.bestScore.toFixed(1)}%`} />
          <StatCard
            title="Strongest Category"
            value={
              overallStats.strongestCategory
                ? formatCategory(overallStats.strongestCategory.category)
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
                ? formatCategory(overallStats.weakestCategory.category)
                : "—"
            }
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
            gridTemplateColumns: "2fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <SectionCard
            title="Performance Trend"
            subtitle="Track success rate across recent maths attempts."
          >
            <div style={{ width: "100%", height: "340px" }}>
              {performanceTrendData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceTrendData}>
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
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={emptyStateStyle}>No data available for this filter.</div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Quick Insights"
            subtitle="A snapshot of current maths performance."
          >
            <div style={{ display: "grid", gap: "14px" }}>
              <div
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                }}
              >
                <div style={{ color: "#1d4ed8", fontWeight: 700, marginBottom: "6px" }}>
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
                  Best Area
                </div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                  {overallStats.strongestCategory
                    ? formatCategory(overallStats.strongestCategory.category)
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
                <div style={{ color: "#c2410c", fontWeight: 700, marginBottom: "6px" }}>
                  Needs Focus
                </div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                  {overallStats.weakestCategory
                    ? formatCategory(overallStats.weakestCategory.category)
                    : "—"}
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "18px",
                  background: "#faf5ff",
                  border: "1px solid #e9d5ff",
                }}
              >
                <div style={{ color: "#7e22ce", fontWeight: 700, marginBottom: "6px" }}>
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
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <SectionCard
            title="Average Success by Category"
            subtitle="Compare performance across the seven maths categories."
          >
            <div style={{ width: "100%", height: "340px" }}>
              {successByCategoryData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={successByCategoryData} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={200}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={averageSuccessTooltipFormatter} />
                    <Bar dataKey="avgSuccess" fill="#10b981" radius={[0, 10, 10, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={emptyStateStyle}>No data available for this filter.</div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Practice Volume by Category"
            subtitle="See which maths areas have been practised the most."
          >
            <div style={{ width: "100%", height: "340px" }}>
              {attemptsByCategoryData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attemptsByCategoryData} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={200}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={attemptsTooltipFormatter} />
                    <Bar dataKey="attempts" fill="#8b5cf6" radius={[0, 10, 10, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={emptyStateStyle}>No data available for this filter.</div>
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Recent Attempts"
          subtitle="Your most recent maths test results for the selected filters."
        >
          {recentAttempts.length ? (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "850px",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Category</th>
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
                      <td style={tdStyle}>{formatCategory(row.category)}</td>
                      <td style={tdStyle}>{row.score}</td>
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
          <div style={{ color: "#cbd5e1", fontSize: "16px", lineHeight: 1.7 }}>
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
  minWidth: "220px",
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