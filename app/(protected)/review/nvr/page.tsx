// app/(protected)/review/nvr/page.tsx
"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabaseClient"
import { NVRIcon } from "../../../../components/icons/PortalIcons"
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

type NVRCategory =
  | "shape-patterns"
  | "rotations-reflections"
  | "codes-spatial-logic"

type CategoryFilter = "all" | NVRCategory

type AnswerOption = "A" | "B" | "C" | "D"

type NVRReviewDbRow = {
  id: number | string
  user_id: string
  test_id: number | null
  question_id: number | null
  category: string | null
  question_text: string | null
  user_answer: string | null
  correct_answer: string | null
  difficulty: number | null
  created_at: string
  updated_at?: string | null
  last_attempted_at?: string | null
  knew_it?: boolean | null
}

type NVRQuestionDbRow = {
  id: number
  test_id: number | null
  question_text: string | null
  image_url: string | null
  option_a: string | number | null
  option_b: string | number | null
  option_c: string | number | null
  option_d: string | number | null
  option_a_image_url: string | null
  option_b_image_url: string | null
  option_c_image_url: string | null
  option_d_image_url: string | null
  correct_answer: string | null
  explanation: string | null
  difficulty: number | null
  question_order: number | null
}

type NVRTestDbRow = {
  id: number
  category: string | null
  title?: string | null
}

type ReviewItem = {
  id: string
  user_id: string
  test_id: number | null
  question_id: number | null
  category: NVRCategory | "unknown"
  question_text: string
  question_image_url: string | null
  option_a: string | number | null
  option_b: string | number | null
  option_c: string | number | null
  option_d: string | number | null
  option_a_image_url: string | null
  option_b_image_url: string | null
  option_c_image_url: string | null
  option_d_image_url: string | null
  user_answer: string | null
  correct_answer: string | null
  explanation: string
  difficulty: number | null
  question_order: number | null
  test_title: string | null
  created_at: string
  updated_at: string | null
  last_attempted_at: string | null
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
  { value: "shape-patterns", label: "Shape Patterns" },
  { value: "rotations-reflections", label: "Rotations & Reflections" },
  { value: "codes-spatial-logic", label: "Codes & Spatial Logic" },
]

const CATEGORY_COLORS = ["#22c55e", "#16a34a", "#15803d", "#0f766e"]
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

function normaliseNVRCategory(category: string | null | undefined) {
  if (!category) return "unknown"

  const clean = category
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")

  if (
    clean === "shape-pattern" ||
    clean === "shape-patterns" ||
    clean === "shape-patterns-and-series"
  ) {
    return "shape-patterns"
  }

  if (
    clean === "rotation-reflection" ||
    clean === "rotations-reflections" ||
    clean === "rotations-and-reflections" ||
    clean === "rotation-and-reflection"
  ) {
    return "rotations-reflections"
  }

  if (
    clean === "codes-spatial-logic" ||
    clean === "code-spatial-logic" ||
    clean === "codes-and-spatial-logic" ||
    clean === "code-and-spatial-logic"
  ) {
    return "codes-spatial-logic"
  }

  return "unknown"
}

function getCategoryLabel(category: string | null | undefined) {
  if (category === "shape-patterns") return "Shape Patterns"
  if (category === "rotations-reflections") return "Rotations & Reflections"
  if (category === "codes-spatial-logic") return "Codes & Spatial Logic"
  return "Not set"
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

function truncateText(text: string | null | undefined, maxLength = 160) {
  if (!text) return "—"
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function cleanText(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null

  const text = String(value).trim()

  if (!text || text.toLowerCase() === "null" || text.toLowerCase() === "nan") {
    return null
  }

  return text
}

function isUsableImageUrl(value: string | null | undefined) {
  const text = cleanText(value)
  if (!text) return false

  return (
    text.startsWith("http://") ||
    text.startsWith("https://") ||
    text.startsWith("/") ||
    text.startsWith("data:image/")
  )
}

function normaliseAnswer(answer: string | null | undefined): AnswerOption | null {
  if (!answer) return null

  const clean = answer.trim().toUpperCase()

  if (clean === "A" || clean === "B" || clean === "C" || clean === "D") {
    return clean
  }

  return null
}

function getOptionText(item: ReviewItem, answer: string | null | undefined) {
  const option = normaliseAnswer(answer)

  if (option === "A") return cleanText(item.option_a)
  if (option === "B") return cleanText(item.option_b)
  if (option === "C") return cleanText(item.option_c)
  if (option === "D") return cleanText(item.option_d)

  return null
}

function getOptionImageUrl(item: ReviewItem, answer: string | null | undefined) {
  const option = normaliseAnswer(answer)

  if (option === "A") return isUsableImageUrl(item.option_a_image_url) ? item.option_a_image_url : null
  if (option === "B") return isUsableImageUrl(item.option_b_image_url) ? item.option_b_image_url : null
  if (option === "C") return isUsableImageUrl(item.option_c_image_url) ? item.option_c_image_url : null
  if (option === "D") return isUsableImageUrl(item.option_d_image_url) ? item.option_d_image_url : null

  return null
}

function formatAnswerLabel(item: ReviewItem, answer: string | null | undefined) {
  const option = normaliseAnswer(answer)

  if (!option) return "No answer"

  const optionText = getOptionText(item, option)

  if (optionText) return `${option} — ${optionText}`

  return option
}

function getReviewDate(item: ReviewItem) {
  return item.last_attempted_at || item.updated_at || item.created_at
}

function getReviewFilterDate(item: ReviewItem) {
  // For the time filter, avoid using updated_at as the main date.
  // Old rows can receive a fresh updated_at during database maintenance/migrations,
  // which would incorrectly make old April rows appear inside "Last 7 days".
  // last_attempted_at is the best active-review date for newly updated rows.
  // created_at is the safest fallback for older rows that existed before last_attempted_at.
  return item.last_attempted_at || item.created_at
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

function ImageBox({
  src,
  alt,
  maxHeight = 220,
}: {
  src: string | null | undefined
  alt: string
  maxHeight?: number
}) {
  if (!isUsableImageUrl(src)) return null

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "16px",
        padding: "12px",
        marginTop: "10px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <img
        src={src || ""}
        alt={alt}
        style={{
          maxWidth: "100%",
          maxHeight,
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  )
}

function AnswerBox({
  title,
  answer,
  imageUrl,
  tone,
}: {
  title: string
  answer: string
  imageUrl: string | null
  tone: "wrong" | "correct"
}) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "14px",
        background: tone === "correct" ? "#ecfdf5" : "#fff7ed",
        border: tone === "correct" ? "1px solid #bbf7d0" : "1px solid #fed7aa",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: tone === "correct" ? "#15803d" : "#c2410c",
          marginBottom: "6px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          color: "#0f172a",
          fontWeight: 800,
          overflowWrap: "anywhere",
          lineHeight: 1.4,
        }}
      >
        {answer}
      </div>

      <ImageBox src={imageUrl} alt={title} maxHeight={150} />
    </div>
  )
}

export default function NVRReviewPage() {
  const router = useRouter()

  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
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
          .from("nvr_review")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })

        if (!mounted) return

        if (error) {
          console.error("Error loading NVR review:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            full: error,
          })

          setLoadError(error.message)
          setReviewItems([])
          return
        }

        const reviewRows = (data ?? []) as NVRReviewDbRow[]

        const questionIds = Array.from(
          new Set(
            reviewRows
              .map((row) => row.question_id)
              .filter((id): id is number => typeof id === "number")
          )
        )

        let questionMap = new Map<number, NVRQuestionDbRow>()

        if (questionIds.length > 0) {
          const { data: questionData, error: questionError } = await supabase
            .from("nvr_questions")
            .select(
              "id, test_id, question_text, image_url, option_a, option_b, option_c, option_d, option_a_image_url, option_b_image_url, option_c_image_url, option_d_image_url, correct_answer, explanation, difficulty, question_order"
            )
            .in("id", questionIds)

          if (questionError) {
            console.error("Error loading NVR question details:", {
              message: questionError.message,
              details: questionError.details,
              hint: questionError.hint,
              code: questionError.code,
              full: questionError,
            })
          } else {
            questionMap = new Map(
              ((questionData ?? []) as NVRQuestionDbRow[]).map((question) => [
                question.id,
                question,
              ])
            )
          }
        }

        const testIds = Array.from(
          new Set(
            reviewRows
              .map((row) => row.test_id)
              .concat(Array.from(questionMap.values()).map((question) => question.test_id))
              .filter((id): id is number => typeof id === "number")
          )
        )

        let testMap = new Map<number, NVRTestDbRow>()

        if (testIds.length > 0) {
          const { data: testData, error: testError } = await supabase
            .from("nvr_tests")
            .select("id, category, title")
            .in("id", testIds)

          if (testError) {
            console.error("Error loading NVR test details:", {
              message: testError.message,
              details: testError.details,
              hint: testError.hint,
              code: testError.code,
              full: testError,
            })
          } else {
            testMap = new Map(
              ((testData ?? []) as NVRTestDbRow[]).map((test) => [test.id, test])
            )
          }
        }

        const items: ReviewItem[] = reviewRows.map((row) => {
          const question =
            typeof row.question_id === "number"
              ? questionMap.get(row.question_id)
              : undefined

          const testId = row.test_id ?? question?.test_id ?? null
          const test = testId !== null ? testMap.get(testId) : undefined

          const reviewCategory = normaliseNVRCategory(row.category)
          const testCategory = normaliseNVRCategory(test?.category)

          return {
            id: String(row.id),
            user_id: row.user_id,
            test_id: testId,
            question_id: row.question_id ?? null,
            category:
              reviewCategory !== "unknown"
                ? reviewCategory
                : testCategory,
            question_text:
              question?.question_text ||
              row.question_text ||
              "Question text unavailable.",
            question_image_url: question?.image_url ?? null,
            option_a: question?.option_a ?? null,
            option_b: question?.option_b ?? null,
            option_c: question?.option_c ?? null,
            option_d: question?.option_d ?? null,
            option_a_image_url: question?.option_a_image_url ?? null,
            option_b_image_url: question?.option_b_image_url ?? null,
            option_c_image_url: question?.option_c_image_url ?? null,
            option_d_image_url: question?.option_d_image_url ?? null,
            user_answer: row.user_answer ?? null,
            correct_answer: row.correct_answer ?? question?.correct_answer ?? null,
            explanation: question?.explanation || "",
            difficulty: row.difficulty ?? question?.difficulty ?? null,
            question_order: question?.question_order ?? null,
            test_title: test?.title ?? null,
            created_at: row.created_at,
            updated_at: row.updated_at ?? null,
            last_attempted_at: row.last_attempted_at ?? null,
          }
        })

        if (!mounted) return

        setLoadError(null)
        setReviewItems(items)
      } catch (error) {
        console.error("Unexpected NVR review error:", error)

        if (mounted) {
          setLoadError("Unexpected error loading NVR review.")
          setReviewItems([])
        }
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

  async function removeItem(reviewId: string) {
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
      console.error("Error deleting NVR review item:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        full: error,
      })
      return
    }

    setReviewItems((previous) => previous.filter((row) => row.id !== reviewId))
  }

  const uniqueItems = useMemo(() => {
    return Array.from(
      new Map(
        reviewItems.map((item) => {
          const key =
            item.question_id !== null
              ? `id-${item.question_id}`
              : `text-${item.question_text.toLowerCase()}`

          return [key, item]
        })
      ).values()
    )
  }, [reviewItems])

  const filteredItems = useMemo(() => {
    const cutoff = getCutoffDate(timeFilter)

    return uniqueItems.filter((item) => {
      const matchesTime = cutoff
        ? new Date(getReviewFilterDate(item)) >= cutoff
        : true

      const matchesDifficulty =
        difficultyFilter === "all" ||
        String(item.difficulty ?? "") === difficultyFilter

      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter

      return matchesTime && matchesDifficulty && matchesCategory
    })
  }, [uniqueItems, timeFilter, difficultyFilter, categoryFilter])

  function retryFilteredItems() {
    const ids = Array.from(
      new Set(
        filteredItems
          .map((row) => row.question_id)
          .filter((id): id is number => id !== null)
      )
    )

    if (ids.length === 0) return

    localStorage.setItem("nvr_review_question_ids", JSON.stringify(ids))
    router.push("/nvr-test?mode=review")
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
            new Date(getReviewDate(b)).getTime() -
            new Date(getReviewDate(a)).getTime()
        )[0]
      : null

    const withImages = filteredItems.filter(
      (row) =>
        isUsableImageUrl(row.question_image_url) ||
        isUsableImageUrl(getOptionImageUrl(row, row.user_answer)) ||
        isUsableImageUrl(getOptionImageUrl(row, row.correct_answer))
    ).length

    return {
      totalItems,
      allUnique,
      mostCommonCategory,
      mostRecentItem,
      withImages,
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
      "Shape Patterns",
      "Rotations & Reflections",
      "Codes & Spatial Logic",
      "Not set",
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
          new Date(getReviewDate(b)).getTime() -
          new Date(getReviewDate(a)).getTime()
      )
      .slice(0, 12)
  }, [filteredItems])

  const summaryText = useMemo(() => {
    if (!filteredItems.length) {
      return "No NVR review items found for the selected filters."
    }

    const mostCommon = reviewStats.mostCommonCategory
      ? `${reviewStats.mostCommonCategory.category} (${reviewStats.mostCommonCategory.count})`
      : "N/A"

    return `You currently have ${reviewStats.totalItems} NVR items to review. The biggest review category is ${mostCommon}, and ${reviewStats.withImages} of these items include images to support visual revision.`
  }, [filteredItems, reviewStats])

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
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                overflowWrap: "break-word",
              }}
            >
              <NVRIcon size={42} />
              NVR Review
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
              Review non-verbal reasoning items that need more practice, see the
              full visual question context, and retry filtered items in a focused
              review session.
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
              id="nvr-review-category-filter"
              name="nvrReviewCategoryFilter"
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
              id="nvr-review-difficulty-filter"
              name="nvrReviewDifficultyFilter"
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
              id="nvr-review-time-filter"
              name="nvrReviewTimeFilter"
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

        {loadError ? (
          <div
            style={{
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#9f1239",
              borderRadius: "18px",
              padding: "16px",
              marginBottom: "20px",
              fontWeight: 700,
            }}
          >
            Error loading NVR review: {loadError}
          </div>
        ) : null}

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
            title="With Images"
            value={String(reviewStats.withImages)}
            subtitle="Items with visual question or answer content"
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
                ? formatDateTime(getReviewDate(reviewStats.mostRecentItem))
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
            subtitle="See which NVR categories currently need the most revision."
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
                      width={150}
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
          subtitle="Your most recent NVR review items for the selected filters."
        >
          {recentItems.length ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
                gap: "18px",
                minWidth: 0,
              }}
            >
              {recentItems.map((row) => {
                const userAnswerImage = getOptionImageUrl(row, row.user_answer)
                const correctAnswerImage = getOptionImageUrl(
                  row,
                  row.correct_answer
                )

                return (
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

                      {row.test_title ? (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            background: "#f8fafc",
                            color: "#475569",
                            fontSize: "12px",
                            fontWeight: 700,
                            maxWidth: "100%",
                            overflowWrap: "break-word",
                          }}
                        >
                          {row.test_title}
                        </span>
                      ) : null}

                      {row.question_order ? (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "6px 10px",
                            borderRadius: "999px",
                            background: "#f8fafc",
                            color: "#475569",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          Question {row.question_order}
                        </span>
                      ) : null}
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

                    <ImageBox
                      src={row.question_image_url}
                      alt="NVR question image"
                    />

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
                        gap: "12px",
                        marginTop: "14px",
                        marginBottom: "14px",
                      }}
                    >
                      <AnswerBox
                        title="Your Answer"
                        answer={formatAnswerLabel(row, row.user_answer)}
                        imageUrl={userAnswerImage}
                        tone="wrong"
                      />

                      <AnswerBox
                        title="Correct Answer"
                        answer={formatAnswerLabel(row, row.correct_answer)}
                        imageUrl={correctAnswerImage}
                        tone="correct"
                      />
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
                      Last reviewed: {formatDateTime(getReviewDate(row))}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(row.id)}
                      style={removeButtonStyle}
                    >
                      Remove from review
                    </button>
                  </div>
                )
              })}
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
