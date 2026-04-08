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

type NVRProgressRow = {
  id: number
  user_id: string
  test_id: number | null
  category: string | null
  score: number
  total_questions: number
  success_rate: number
  created_at: string
}

type NVRTestRow = {
  id: number
  title: string
  category: string | null
  difficulty: number | null
}

type EnrichedNVRProgressRow = NVRProgressRow & {
  difficulty: number | null
  test_title: string
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

export default function NVRProgressPage() {
  const router = useRouter()

  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingData, setLoadingData] = useState(true)
  const [rows, setRows] = useState<EnrichedNVRProgressRow[]>([])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all")
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

      const { data: progressData, error: progressError } = await supabase
        .from("nvr_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (progressError) {
        console.error("Error loading NVR progress:", progressError)
        setRows([])
        if (mounted) setLoadingData(false)
        return
      }

      const progressRows = (progressData ?? []) as NVRProgressRow[]
      const testIds = Array.from(
        new Set(progressRows.map((row) => row.test_id).filter((id): id is number => id !== null))
      )

      let testMap = new Map<number, NVRTestRow>()

      if (testIds.length > 0) {
        const { data: testsData, error: testsError } = await supabase
          .from("nvr_tests")
          .select("id, title, category, difficulty")
          .in("id", testIds)

        if (testsError) {
          console.error("Error loading NVR tests:", testsError)
        } else {
          testMap = new Map(((testsData ?? []) as NVRTestRow[]).map((test) => [test.id, test]))
        }
      }

      const mergedRows: EnrichedNVRProgressRow[] = progressRows.map((row) => {
        const linkedTest = row.test_id ? testMap.get(row.test_id) : undefined

        return {
          ...row,
          difficulty: linkedTest?.difficulty ?? null,
          test_title: linkedTest?.title ?? "NVR Test",
          category: row.category ?? linkedTest?.category ?? null,
        }
      })

      setRows(mergedRows)

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
      const matchesDifficulty =
        difficultyFilter === "all" || String(row.difficulty ?? "") === difficultyFilter
      const matchesCategory =
        categoryFilter === "all" || (row.category ?? "") === categoryFilter

      return matchesTime && matchesDifficulty && matchesCategory
    })
  }, [rows, timeFilter, difficultyFilter, categoryFilter])

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
      scoreLabel: `${row.score}/${row.total_questions}`,
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

    const order = ["Shape Patterns", "Rotations & Reflections", "Codes & Spatial Logic", "Not set"]

    return Object.values(grouped)
      .map((item) => ({
        category: item.category,
        avgSuccess: Number((item.totalSuccess / item.attempts).toFixed(1)),
      }))
      .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))
  }, [filteredRows])

  const attemptsByDifficultyData = useMemo(() => {
    const grouped = filteredRows.reduce((acc, row) => {
      const key = getLevelLabel(row.difficulty)

      if (!acc[key]) {
        acc[key] = {
          difficulty: key,
          attempts: 0,
          questions: 0,
        }
      }

      acc[key].attempts += 1
      acc[key].questions += row.total_questions
      return acc
    }, {} as Record<string, { difficulty: string; attempts: number; questions: number }>)

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
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 12)
  }, [filteredRows])

  const summaryText = useMemo(() => {
    if (!filteredRows.length) {
      return "No non-verbal reasoning progress data yet for the selected filters."
    }

    const strongest = overallStats.strongestCategory
      ? `${overallStats.strongestCategory.category} (${overallStats.strongestCategory.avgSuccess.toFixed(1)}%)`
      : "N/A"

    const weakest = overallStats.weakestCategory
      ? `${overallStats.weakestCategory.category} (${overallStats.weakestCategory.avgSuccess.toFixed(1)}%)`
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
              🔷 Non-Verbal Reasoning Progress
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
              Explore non-verbal reasoning performance with live filters, trend tracking,
              category insights, and recent test history.
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
            gridTemplateColumns: "2fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <SectionCard
            title="Performance Trend"
            subtitle="Track success rate across recent non-verbal reasoning attempts."
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
                          ? `${point.date} • ${point.category} • ${point.difficulty} • ${point.scoreLabel}`
                          : label
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="success"
                      stroke="#10b981"
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

          <SectionCard title="Quick Insights" subtitle="A snapshot of current NVR performance.">
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
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                }}
              >
                <div style={{ color: "#1d4ed8", fontWeight: 700, marginBottom: "6px" }}>
                  Best Category
                </div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
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
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
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
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <SectionCard
            title="Average Success by Category"
            subtitle="Compare performance across NVR categories."
          >
            <div style={{ width: "100%", height: "340px" }}>
              {successByCategoryData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={successByCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={averageSuccessTooltipFormatter} />
                    <Bar dataKey="avgSuccess" fill="#10b981" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={emptyStateStyle}>No data available for this filter.</div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Practice Volume by Difficulty"
            subtitle="See which NVR levels have been practised the most."
          >
            <div style={{ width: "100%", height: "340px" }}>
              {attemptsByDifficultyData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attemptsByDifficultyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="difficulty" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="attempts" fill="#3b82f6" radius={[10, 10, 0, 0]} />
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
          subtitle="Your most recent NVR test results for the selected filters."
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
                      <td style={tdStyle}>{formatDateTime(row.created_at)}</td>
                      <td style={tdStyle}>{row.test_title}</td>
                      <td style={tdStyle}>{getCategoryLabel(row.category)}</td>
                      <td style={tdStyle}>{getLevelLabel(row.difficulty)}</td>
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