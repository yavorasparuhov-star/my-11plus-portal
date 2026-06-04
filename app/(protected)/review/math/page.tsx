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

type TimeFilter = "7d" | "30d" | "90d" | "all"
type DifficultyFilter = "all" | "1" | "2" | "3"

type MathCategory =
  | "number_place_value"
  | "four_operations"
  | "fractions_decimals_percentages"
  | "shape_space"
  | "measurement"
  | "data_handling"
  | "algebra_reasoning"

type CategoryFilter = "all" | MathCategory

type MathReviewDbRow = {
  id: number
  user_id: string
  test_id: number | null
  question_id: number | null
  category: string | null
  question_text: string | null
  correct_answer: string | null
  user_answer: string | null
  created_at: string
  difficulty: number | null
}

type ReviewItem = {
  id: string
  test_id: number | null
  question_id: number | null
  category: MathCategory | "unknown"
  question_text: string
  user_answer: string | null
  correct_answer: string | null
  difficulty: number | null
  created_at: string
}

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
  { value: "number_place_value", label: "Number & Place Value" },
  { value: "four_operations", label: "Four Operations" },
  {
    value: "fractions_decimals_percentages",
    label: "Fractions, Decimals & Percentages",
  },
  { value: "shape_space", label: "Shape & Space" },
  { value: "measurement", label: "Measurement" },
  { value: "data_handling", label: "Data Handling" },
  { value: "algebra_reasoning", label: "Algebra & Reasoning" },
]

const CATEGORY_COLORS = [
  "#22c55e",
  "#16a34a",
  "#15803d",
  "#14532d",
  "#166534",
  "#0f766e",
  "#0d9488",
]

const DIFFICULTY_COLORS = ["#f97316", "#ea580c", "#c2410c", "#9a3412"]

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

function normaliseMathCategory(category: string | null | undefined) {
  if (!category) return "unknown"

  const clean = category.trim()

  if (clean === "number_place_value") return "number_place_value"
  if (clean === "four_operations") return "four_operations"
  if (clean === "fractions_decimals_percentages") {
    return "fractions_decimals_percentages"
  }
  if (clean === "shape_space") return "shape_space"
  if (clean === "measurement") return "measurement"
  if (clean === "data_handling") return "data_handling"
  if (clean === "algebra_reasoning") return "algebra_reasoning"

  if (clean === "Number Place Value") return "number_place_value"
  if (clean === "Four Operations") return "four_operations"
  if (clean === "Fractions & Decimals") {
    return "fractions_decimals_percentages"
  }
  if (clean === "Percentages") return "fractions_decimals_percentages"
  if (clean === "Shape & Space") return "shape_space"
  if (clean === "Measurement") return "measurement"
  if (clean === "Data Handling") return "data_handling"
  if (clean === "Algebra & Reasoning") return "algebra_reasoning"

  return "unknown"
}

function getCategoryLabel(category: string | null | undefined) {
  if (!category) return "Unknown"

  if (category === "number_place_value") return "Number & Place Value"
  if (category === "four_operations") return "Four Operations"
  if (category === "fractions_decimals_percentages") {
    return "Fractions, Decimals & Percentages"
  }
  if (category === "shape_space") return "Shape & Space"
  if (category === "measurement") return "Measurement"
  if (category === "data_handling") return "Data Handling"
  if (category === "algebra_reasoning") return "Algebra & Reasoning"

  return "Unknown"
}

function getLevelLabel(level: number | null | undefined) {
  if (level === 1) return "Easy"
  if (level === 2) return "Medium"
  if (level === 3) return "Hard"
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

function truncateText(text: string | null | undefined, maxLength = 120) {
  if (!text) return "—"
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function formatAnswer(answer: string | null | undefined) {
  return answer && answer.trim() ? answer : "No answer"
}

function isUnanswered(row: ReviewItem) {
  return !row.user_answer || !row.user_answer.trim()
}

function isIncorrect(row: ReviewItem) {
  return (
    row.user_answer !== null &&
    row.user_answer.trim() !== "" &&
    row.correct_answer !== null &&
    row.user_answer.trim() !== row.correct_answer.trim()
  )
}

function getStatusLabel(row: ReviewItem) {
  if (isUnanswered(row)) return "Unanswered"
  if (isIncorrect(row)) return "Incorrect"
  return "Review"
}

function getReviewStorageConfig(category: MathCategory | "unknown") {
  if (category === "number_place_value") {
    return {
      key: "number_place_value_review_ids",
      route: "/math/number-place-value?mode=review",
    }
  }

  if (category === "four_operations") {
    return {
      key: "four_operations_review_ids",
      route: "/math/four-operations?mode=review",
    }
  }

  if (category === "fractions_decimals_percentages") {
    return {
      key: "fractions_decimals_percentages_review_ids",
      route: "/math/fractions-decimals-percentages?mode=review",
    }
  }

  if (category === "shape_space") {
    return {
      key: "shape_space_review_ids",
      route: "/math/shape-space?mode=review",
    }
  }

  if (category === "measurement") {
    return {
      key: "measurement_review_ids",
      route: "/math/measurement?mode=review",
    }
  }

  if (category === "data_handling") {
    return {
      key: "data_handling_review_ids",
      route: "/math/data-handling?mode=review",
    }
  }

  if (category === "algebra_reasoning") {
    return {
      key: "algebra_reasoning_review_ids",
      route: "/math/algebra-reasoning?mode=review",
    }
  }

  return null
}

function isSameReviewItem(a: ReviewItem, b: ReviewItem) {
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
        marginBottom: "20px",
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

export default function MathReviewPage() {
  const router = useRouter()

  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingData, setLoadingData] = useState(true)
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all")
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")

  useEffect(() => {
    let mounted = true

    async function loadReviewItems() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!mounted) return

        if (!user) {
          router.replace("/login")
          return
        }

        setLoadingUser(false)

        const { data, error } = await supabase
          .from("math_review")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (!mounted) return

        if (error) {
          console.error("Error loading maths review:", error)
          setReviewItems([])
          return
        }

        const rows = (data ?? []) as MathReviewDbRow[]

        const items: ReviewItem[] = rows.map((row) => ({
          id: String(row.id),
          test_id: row.test_id ?? null,
          question_id: row.question_id ?? null,
          category: normaliseMathCategory(row.category),
          question_text: row.question_text || "Question text unavailable.",
          user_answer: row.user_answer,
          correct_answer: row.correct_answer,
          difficulty: row.difficulty ?? null,
          created_at: row.created_at,
        }))

        setReviewItems(items)
      } finally {
        if (mounted) {
          setLoadingData(false)
        }
      }
    }

    void loadReviewItems()

    return () => {
      mounted = false
    }
  }, [router])

  async function removeItem(item: ReviewItem) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    let query = supabase.from("math_review").delete().eq("user_id", user.id)

    if (item.question_id !== null) {
      query = query.eq("question_id", item.question_id)
    } else {
      query = query.ilike("question_text", item.question_text)
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting maths review item:", error)
      return
    }

    setReviewItems((previous) =>
      previous.filter((row) => !isSameReviewItem(row, item))
    )
  }

  const uniqueItems = useMemo(() => {
    return Array.from(
      new Map(
        reviewItems.map((item) => {
          const key =
            item.question_id !== null
              ? `${item.category}::id::${item.question_id}`
              : `${item.category}::text::${item.question_text.toLowerCase()}`

          return [key, item]
        })
      ).values()
    )
  }, [reviewItems])

  const filteredItems = useMemo(() => {
    const cutoff = getCutoffDate(timeFilter)

    return uniqueItems.filter((item) => {
      const matchesTime = cutoff ? new Date(item.created_at) >= cutoff : true

      const matchesDifficulty =
        difficultyFilter === "all" ||
        String(item.difficulty ?? "") === difficultyFilter

      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter

      return matchesTime && matchesDifficulty && matchesCategory
    })
  }, [uniqueItems, timeFilter, difficultyFilter, categoryFilter])

  function retryFilteredItems() {
    const targetCategory =
      categoryFilter !== "all"
        ? categoryFilter
        : filteredItems.length > 0
          ? filteredItems[0].category
          : null

    if (!targetCategory || targetCategory === "unknown") return

    const config = getReviewStorageConfig(targetCategory)
    if (!config) return

    const ids = filteredItems
      .filter((row) => row.category === targetCategory)
      .map((row) => row.question_id)
      .filter((id): id is number => id !== null)

    const uniqueIds = Array.from(new Set(ids))

    if (uniqueIds.length === 0) return

    localStorage.setItem(config.key, JSON.stringify(uniqueIds))
    router.push(config.route)
  }

  const reviewStats = useMemo(() => {
    const totalItems = filteredItems.length
    const allUnique = uniqueItems.length

    const byCategory = Object.entries(
      filteredItems.reduce((acc, row) => {
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

    const mostRecentItem = filteredItems.length
      ? [...filteredItems].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )[0]
      : null

    const unansweredCount = filteredItems.filter((row) =>
      isUnanswered(row)
    ).length

    const wrongAnsweredCount = filteredItems.filter((row) =>
      isIncorrect(row)
    ).length

    return {
      totalItems,
      allUnique,
      mostCommonCategory,
      mostRecentItem,
      unansweredCount,
      wrongAnsweredCount,
    }
  }, [filteredItems, uniqueItems])

  const reviewByCategoryData = useMemo(() => {
    const grouped = filteredItems.reduce((acc, row) => {
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
      "Number & Place Value",
      "Four Operations",
      "Fractions, Decimals & Percentages",
      "Shape & Space",
      "Measurement",
      "Data Handling",
      "Algebra & Reasoning",
      "Unknown",
    ]

    return Object.values(grouped)
      .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))
      .map((item, index) => ({
        category: item.category,
        count: item.count,
        fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
  }, [filteredItems])

  const reviewByDifficultyData = useMemo(() => {
    const grouped = filteredItems.reduce((acc, row) => {
      const label = getLevelLabel(row.difficulty)

      if (!acc[label]) {
        acc[label] = 0
      }

      acc[label] += 1
      return acc
    }, {} as Record<string, number>)

    const order = ["Easy", "Medium", "Hard", "Not set"]

    return order
      .filter((difficulty) => grouped[difficulty])
      .map((difficulty, index) => ({
        name: difficulty,
        count: grouped[difficulty],
        fill: DIFFICULTY_COLORS[index % DIFFICULTY_COLORS.length],
      }))
  }, [filteredItems])

  const recentItems = useMemo(() => {
    return [...filteredItems]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 12)
  }, [filteredItems])

  const summaryText = useMemo(() => {
    if (!filteredItems.length) {
      return "No maths review items found for the selected filters."
    }

    const mostCommon = reviewStats.mostCommonCategory
      ? `${reviewStats.mostCommonCategory.category} (${reviewStats.mostCommonCategory.count})`
      : "N/A"

    let text = `You currently have ${reviewStats.totalItems} maths items to review. The biggest review category is ${mostCommon}.`

    if (reviewStats.unansweredCount > 0) {
      text += ` ${reviewStats.unansweredCount} questions were left unanswered.`
    }

    if (reviewStats.wrongAnsweredCount > 0) {
      text += ` ${reviewStats.wrongAnsweredCount} questions were answered incorrectly.`
    }

    return text
  }, [filteredItems, reviewStats])

  if (loadingUser || loadingData) {
    return (
      <div style={{ padding: "32px", color: "#334155", fontSize: "18px" }}>
        Loading maths review...
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
              🧮 Maths Review
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
              Review maths items across number, operations, fractions,
              shape, measurement, data handling, and algebra with live filters,
              category insights, and quick retry access.
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
              id="math-review-category-filter"
              name="mathReviewCategoryFilter"
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
              id="math-review-difficulty-filter"
              name="mathReviewDifficultyFilter"
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
              id="math-review-time-filter"
              name="mathReviewTimeFilter"
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
              onClick={retryFilteredItems}
              disabled={filteredItems.length === 0}
              style={{
                ...actionButtonStyle,
                opacity: filteredItems.length === 0 ? 0.5 : 1,
                cursor: filteredItems.length === 0 ? "not-allowed" : "pointer",
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
            value={String(reviewStats.totalItems)}
          />

          <StatCard
            title="Total Review Bank"
            value={String(reviewStats.allUnique)}
          />

          <StatCard
            title="Incorrect"
            value={String(reviewStats.wrongAnsweredCount)}
            subtitle="Questions answered incorrectly"
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
                ? `${reviewStats.mostCommonCategory.count} items`
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
            title="Review Items by Category"
            subtitle="See which maths categories currently need the most revision."
          >
            {reviewByCategoryData.length ? (
              <div style={chartWrapperStyle}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reviewByCategoryData}
                    layout="vertical"
                    margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis
                      type="category"
                      dataKey="category"
                      width={155}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <Tooltip />
                    <Bar dataKey="count" radius={[0, 10, 10, 0]}>
                      {reviewByCategoryData.map((entry, index) => (
                        <Cell
                          key={`category-cell-${index}`}
                          fill={entry.fill}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={emptyStateStyle}>
                No data available for this filter.
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Review Items by Difficulty"
            subtitle="See which difficulty level currently needs the most revision."
          >
            {reviewByDifficultyData.length ? (
              <div style={chartWrapperStyle}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reviewByDifficultyData}
                    margin={{ top: 20, right: 12, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "#64748b" }}
                    />
                    <Tooltip />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {reviewByDifficultyData.map((entry, index) => (
                        <Cell
                          key={`difficulty-cell-${index}`}
                          fill={entry.fill}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={emptyStateStyle}>
                No data available for this filter.
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Recent Review Items"
          subtitle="Your most recent maths review items for the selected filters."
        >
          {recentItems.length ? (
            <div style={{ overflowX: "auto", maxWidth: "100%" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "960px",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Level</th>
                    <th style={thStyle}>Question</th>
                    <th style={thStyle}>Your Answer</th>
                    <th style={thStyle}>Correct Answer</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {recentItems.map((row) => {
                    const status = getStatusLabel(row)
                    const unanswered = status === "Unanswered"

                    return (
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
                          {truncateText(row.question_text, 140)}
                        </td>
                        <td style={{ ...tdStyle, maxWidth: "180px" }}>
                          {formatAnswer(row.user_answer)}
                        </td>
                        <td style={{ ...tdStyle, maxWidth: "180px" }}>
                          {formatAnswer(row.correct_answer)}
                        </td>
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
                              whiteSpace: "nowrap",
                            }}
                          >
                            {status}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <button
                            type="button"
                            onClick={() => removeItem(row)}
                            style={removeButtonStyle}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={emptyStateStyle}>
              No review items found for the selected filters.
            </div>
          )}
        </SectionCard>

        {filteredItems.length > 0 ? (
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
            {filteredItems.slice(0, 9).map((row) => (
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
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
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
                        fontWeight: 700,
                        color: "#c2410c",
                        marginBottom: "6px",
                      }}
                    >
                      Your Answer
                    </div>

                    <div
                      style={{
                        color: "#0f172a",
                        fontWeight: 700,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {formatAnswer(row.user_answer)}
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
                        fontWeight: 700,
                        color: "#15803d",
                        marginBottom: "6px",
                      }}
                    >
                      Correct Answer
                    </div>

                    <div
                      style={{
                        color: "#0f172a",
                        fontWeight: 700,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {formatAnswer(row.correct_answer)}
                    </div>
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
                  onClick={() => removeItem(row)}
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
              fontSize: "clamp(18px, 3vw, 22px)",
              fontWeight: 800,
              marginBottom: "8px",
            }}
          >
            Overall Summary
          </div>

          <div
            style={{
              color: "#dcfce7",
              fontSize: "clamp(14px, 2vw, 16px)",
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

const chartWrapperStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  height: 340,
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
  background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
  color: "white",
  fontSize: "14px",
  fontWeight: 800,
  boxShadow: "0 8px 20px rgba(22, 163, 74, 0.22)",
  width: "100%",
  maxWidth: "260px",
  flex: "1 1 220px",
  boxSizing: "border-box",
}

const removeButtonStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: "12px",
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#be123c",
  fontSize: "13px",
  fontWeight: 800,
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
  padding: "20px",
  boxSizing: "border-box",
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