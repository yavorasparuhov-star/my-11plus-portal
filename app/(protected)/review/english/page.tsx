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

type VocabularyReviewRow = {
  id: string
  user_id: string
  word_id: number | null
  word: string
  knew_it: boolean | null
  difficulty: number | null
  created_at: string
}

type SpellingReviewRow = {
  id: string
  user_id: string
  word_id: number | null
  word: string
  knew_it: boolean | null
  difficulty: number | null
  created_at: string
}

type EnglishSharedReviewRow = {
  id: string
  user_id: string
  test_id: number | null
  question_id: number | null
  main_category: string
  subcategory: string | null
  question_text: string
  user_answer: string | null
  correct_answer: string
  difficulty: number | null
  created_at: string
}

type EnglishQuestionLookupRow = {
  id: number
  explanation: string | null
  difficulty: number | null
}

type WordLookupRow = {
  id: number
  definition: string | null
  difficulty: number | null
}

type EnglishReviewCategory =
  | "vocabulary"
  | "spelling"
  | "comprehension"
  | "primary_word_classes"
  | "sentence_structure_syntax"
  | "advanced_punctuation"
  | "apostrophes"
  | "comma"
  | "direct_speech_punctuation"
  | "sentence_punctuation"

type EnglishReviewRow = {
  id: string
  category: EnglishReviewCategory
  item_id: number | null
  item_text: string
  difficulty: number | null
  created_at: string
  explanation?: string
}

type TimeFilter = "7d" | "30d" | "90d" | "all"
type DifficultyFilter = "all" | "1" | "2" | "3"
type CategoryFilter =
  | "all"
  | "vocabulary"
  | "spelling"
  | "comprehension"
  | "primary_word_classes"
  | "sentence_structure_syntax"
  | "advanced_punctuation"
  | "apostrophes"
  | "comma"
  | "direct_speech_punctuation"
  | "sentence_punctuation"

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
  { value: "vocabulary", label: "Vocabulary" },
  { value: "spelling", label: "Spelling" },
  { value: "comprehension", label: "Comprehension" },
  { value: "primary_word_classes", label: "Primary Word Classes" },
  { value: "sentence_structure_syntax", label: "Sentence Structure & Syntax" },
  { value: "advanced_punctuation", label: "Advanced Punctuation" },
  { value: "apostrophes", label: "Apostrophes" },
  { value: "comma", label: "Comma" },
  { value: "direct_speech_punctuation", label: "Direct Speech Punctuation" },
  { value: "sentence_punctuation", label: "Sentence Punctuation" },
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

function getCategoryLabel(category: string) {
  if (category === "vocabulary") return "Vocabulary"
  if (category === "spelling") return "Spelling"
  if (category === "comprehension") return "Comprehension"
  if (category === "primary_word_classes") return "Primary Word Classes"
  if (category === "sentence_structure_syntax") return "Sentence Structure & Syntax"
  if (category === "advanced_punctuation") return "Advanced Punctuation"
  if (category === "apostrophes") return "Apostrophes"
  if (category === "comma") return "Comma"
  if (category === "direct_speech_punctuation") return "Direct Speech Punctuation"
  if (category === "sentence_punctuation") return "Sentence Punctuation"
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

function questionsTooltipFormatter(
  value: ValueType | undefined,
  _name: NameType | undefined
): [number, string] {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Array.isArray(value)
          ? Number(value[0])
          : 0

  return [numericValue, "Items"]
}

function mapSharedReviewCategory(
  row: EnglishSharedReviewRow
): Exclude<EnglishReviewCategory, "vocabulary" | "spelling"> | null {
  if (row.main_category === "comprehension") {
    return "comprehension"
  }

  if (row.main_category === "grammar") {
    if (row.subcategory === "primary_word_classes") return "primary_word_classes"
    if (row.subcategory === "sentence_structure_syntax") return "sentence_structure_syntax"
  }

  if (row.main_category === "punctuation") {
    if (row.subcategory === "advanced_punctuation") return "advanced_punctuation"
    if (row.subcategory === "apostrophes") return "apostrophes"
    if (row.subcategory === "comma") return "comma"
    if (row.subcategory === "direct_speech_punctuation") {
      return "direct_speech_punctuation"
    }
    if (row.subcategory === "sentence_punctuation") return "sentence_punctuation"
  }

  return null
}

function getSharedReviewMeta(category: EnglishReviewCategory) {
  if (category === "comprehension") {
    return { main_category: "comprehension", subcategory: null as string | null }
  }
  if (category === "primary_word_classes") {
    return { main_category: "grammar", subcategory: "primary_word_classes" }
  }
  if (category === "sentence_structure_syntax") {
    return { main_category: "grammar", subcategory: "sentence_structure_syntax" }
  }
  if (category === "advanced_punctuation") {
    return { main_category: "punctuation", subcategory: "advanced_punctuation" }
  }
  if (category === "apostrophes") {
    return { main_category: "punctuation", subcategory: "apostrophes" }
  }
  if (category === "comma") {
    return { main_category: "punctuation", subcategory: "comma" }
  }
  if (category === "direct_speech_punctuation") {
    return { main_category: "punctuation", subcategory: "direct_speech_punctuation" }
  }
  if (category === "sentence_punctuation") {
    return { main_category: "punctuation", subcategory: "sentence_punctuation" }
  }
  return null
}

function getReviewStorageConfig(category: EnglishReviewCategory) {
  if (category === "vocabulary") {
    return {
      key: "vocabulary_review_ids",
      route: "/english/vocabulary?mode=review",
    }
  }
  if (category === "spelling") {
    return {
      key: "spelling_review_ids",
      route: "/english/spelling?mode=review",
    }
  }
  if (category === "comprehension") {
    return {
      key: "comprehension_review_ids",
      route: "/english/comprehension?mode=review",
    }
  }
  if (category === "primary_word_classes") {
    return {
      key: "primary_word_classes_review_ids",
      route: "/english/grammar/primary-word-classes?mode=review",
    }
  }
  if (category === "sentence_structure_syntax") {
    return {
      key: "sentence_structure_syntax_review_ids",
      route: "/english/grammar/sentence-structure-syntax?mode=review",
    }
  }
  if (category === "advanced_punctuation") {
    return {
      key: "advanced_punctuation_review_ids",
      route: "/english/punctuation/advanced-punctuation?mode=review",
    }
  }
  if (category === "apostrophes") {
    return {
      key: "apostrophes_review_ids",
      route: "/english/punctuation/apostrophes?mode=review",
    }
  }
  if (category === "comma") {
    return {
      key: "comma_review_ids",
      route: "/english/punctuation/comma?mode=review",
    }
  }
  if (category === "direct_speech_punctuation") {
    return {
      key: "direct_speech_punctuation_review_ids",
      route: "/english/punctuation/direct-speech-punctuation?mode=review",
    }
  }
  if (category === "sentence_punctuation") {
    return {
      key: "sentence_punctuation_review_ids",
      route: "/english/punctuation/sentence?mode=review",
    }
  }
  return null
}

function isSameReviewItem(a: EnglishReviewRow, b: EnglishReviewRow) {
  if (a.category !== b.category) return false

  if (a.item_id !== null && b.item_id !== null) {
    return a.item_id === b.item_id
  }

  return a.item_text.toLowerCase() === b.item_text.toLowerCase()
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

function ChartBox({
  children,
}: {
  children: (size: { width: number; height: number }) => React.ReactNode
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 0, height: 340 })

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      const width = Math.max(0, Math.floor(rect.width))
      const height = Math.max(0, Math.floor(rect.height))
      setSize({ width, height })
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
        height: "340px",
        minWidth: 0,
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

export default function EnglishReviewPage() {
  const router = useRouter()

  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingData, setLoadingData] = useState(true)
  const [reviewItems, setReviewItems] = useState<EnglishReviewRow[]>([])
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")

  useEffect(() => {
    let mounted = true

    async function loadData() {
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

        const [vocabularyResult, spellingResult, englishSharedReviewResult] =
          await Promise.all([
            supabase
              .from("vocabulary_review")
              .select("*")
              .eq("user_id", user.id)
              .eq("knew_it", false)
              .order("created_at", { ascending: false }),
            supabase
              .from("spelling_review")
              .select("*")
              .eq("user_id", user.id)
              .eq("knew_it", false)
              .order("created_at", { ascending: false }),
            supabase
              .from("english_review")
              .select("*")
              .eq("user_id", user.id)
              .in("main_category", ["comprehension", "grammar", "punctuation"])
              .order("created_at", { ascending: false }),
          ])

        if (vocabularyResult.error) {
          console.error("Error loading vocabulary review:", vocabularyResult.error)
        }

        if (spellingResult.error) {
          console.error("Error loading spelling review:", spellingResult.error)
        }

        if (englishSharedReviewResult.error) {
          console.error("Error loading shared English review:", englishSharedReviewResult.error)
        }

        const vocabularyRows = (vocabularyResult.data ?? []) as VocabularyReviewRow[]
        const spellingRows = (spellingResult.data ?? []) as SpellingReviewRow[]
        const englishSharedRows =
          (englishSharedReviewResult.data ?? []) as EnglishSharedReviewRow[]

        const vocabularyAndSpellingWordIds = Array.from(
          new Set(
            [...vocabularyRows, ...spellingRows]
              .map((row) => row.word_id)
              .filter((id): id is number => id !== null)
          )
        )

        const englishSharedQuestionIds = Array.from(
          new Set(
            englishSharedRows
              .map((row) => row.question_id)
              .filter((id): id is number => id !== null)
          )
        )

        let wordLookupMap = new Map<number, { definition: string; difficulty: number | null }>()
        let englishSharedQuestionMap = new Map<
          number,
          { explanation: string; difficulty: number | null }
        >()

        if (vocabularyAndSpellingWordIds.length > 0) {
          const { data: wordLookupData, error: wordLookupError } = await supabase
            .from("words")
            .select("id, definition, difficulty")
            .in("id", vocabularyAndSpellingWordIds)

          if (wordLookupError) {
            console.error("Error loading vocabulary/spelling definitions:", wordLookupError)
          } else {
            wordLookupMap = new Map(
              ((wordLookupData ?? []) as WordLookupRow[]).map((word) => [
                word.id,
                {
                  definition: word.definition || "",
                  difficulty: word.difficulty ?? null,
                },
              ])
            )
          }
        }

        if (englishSharedQuestionIds.length > 0) {
          const { data: englishQuestionsData, error: englishQuestionsError } = await supabase
            .from("english_questions")
            .select("id, explanation, difficulty")
            .in("id", englishSharedQuestionIds)

          if (englishQuestionsError) {
            console.error("Error loading shared English explanations:", englishQuestionsError)
          } else {
            englishSharedQuestionMap = new Map(
              ((englishQuestionsData ?? []) as EnglishQuestionLookupRow[]).map((question) => [
                question.id,
                {
                  explanation: question.explanation || "",
                  difficulty: question.difficulty ?? null,
                },
              ])
            )
          }
        }

        const mergedRows: EnglishReviewRow[] = [
          ...vocabularyRows.map((row) => ({
            id: `vocabulary-${row.id}`,
            category: "vocabulary" as const,
            item_id: row.word_id,
            item_text: row.word,
            difficulty:
              row.word_id !== null
                ? wordLookupMap.get(row.word_id)?.difficulty ?? row.difficulty ?? null
                : row.difficulty ?? null,
            created_at: row.created_at,
            explanation:
              row.word_id !== null ? wordLookupMap.get(row.word_id)?.definition || "" : "",
          })),
          ...spellingRows.map((row) => ({
            id: `spelling-${row.id}`,
            category: "spelling" as const,
            item_id: row.word_id,
            item_text: row.word,
            difficulty:
              row.word_id !== null
                ? wordLookupMap.get(row.word_id)?.difficulty ?? row.difficulty ?? null
                : row.difficulty ?? null,
            created_at: row.created_at,
            explanation:
              row.word_id !== null ? wordLookupMap.get(row.word_id)?.definition || "" : "",
          })),
          ...englishSharedRows.flatMap((row) => {
            const mappedCategory = mapSharedReviewCategory(row)
            if (!mappedCategory) return []

            return [
              {
                id: `english-shared-${row.id}`,
                category: mappedCategory,
                item_id: row.question_id,
                item_text: row.question_text,
                difficulty:
                  row.question_id !== null
                    ? englishSharedQuestionMap.get(row.question_id)?.difficulty ??
                      row.difficulty ??
                      null
                    : row.difficulty ?? null,
                created_at: row.created_at,
                explanation:
                  row.question_id !== null
                    ? englishSharedQuestionMap.get(row.question_id)?.explanation || ""
                    : "",
              },
            ]
          }),
        ]

        if (!mounted) return

        setReviewItems(mergedRows)
      } finally {
        if (mounted) {
          setLoadingData(false)
        }
      }
    }

    void loadData()

    return () => {
      mounted = false
    }
  }, [router])

  async function removeItem(item: EnglishReviewRow) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    let error: { message?: string } | null = null

    if (item.category === "vocabulary") {
      const query = supabase
        .from("vocabulary_review")
        .delete()
        .eq("user_id", user.id)
        .eq("knew_it", false)

      const result =
        item.item_id !== null
          ? await query.eq("word_id", item.item_id)
          : await query.ilike("word", item.item_text)

      error = result.error
    } else if (item.category === "spelling") {
      const query = supabase
        .from("spelling_review")
        .delete()
        .eq("user_id", user.id)
        .eq("knew_it", false)

      const result =
        item.item_id !== null
          ? await query.eq("word_id", item.item_id)
          : await query.ilike("word", item.item_text)

      error = result.error
    } else {
      const sharedMeta = getSharedReviewMeta(item.category)

      if (!sharedMeta) return

      let query = supabase
        .from("english_review")
        .delete()
        .eq("user_id", user.id)
        .eq("main_category", sharedMeta.main_category)

      if (sharedMeta.subcategory === null) {
        query = query.is("subcategory", null)
      } else {
        query = query.eq("subcategory", sharedMeta.subcategory)
      }

      const result =
        item.item_id !== null
          ? await query.eq("question_id", item.item_id)
          : await query.ilike("question_text", item.item_text)

      error = result.error
    }

    if (error) {
      console.error("Error deleting English review item:", error)
      return
    }

    setReviewItems((prev) => prev.filter((row) => !isSameReviewItem(row, item)))
  }

  const uniqueItems = useMemo(() => {
    return Array.from(
      new Map(
        reviewItems.map((item) => {
          const key =
            item.item_id !== null
              ? `${item.category}::id::${item.item_id}`
              : `${item.category}::text::${item.item_text.toLowerCase()}`

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
        difficultyFilter === "all" || String(item.difficulty ?? "") === difficultyFilter
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter

      return matchesTime && matchesDifficulty && matchesCategory
    })
  }, [uniqueItems, timeFilter, difficultyFilter, categoryFilter])

  function retryFilteredItems() {
    const groupedIds = filteredItems.reduce((acc, row) => {
      const itemId = row.item_id
      if (itemId === null) return acc

      const category = row.category
      const existing = acc[category] ?? []
      acc[category] = existing.includes(itemId) ? existing : [...existing, itemId]

      return acc
    }, {} as Partial<Record<EnglishReviewCategory, number[]>>)

    const targetCategory =
      categoryFilter !== "all"
        ? (categoryFilter as EnglishReviewCategory)
        : filteredItems.length > 0
          ? filteredItems[0].category
          : null

    if (!targetCategory) return

    const config = getReviewStorageConfig(targetCategory)
    const ids = groupedIds[targetCategory] ?? []

    if (!config || ids.length === 0) return

    localStorage.setItem(config.key, JSON.stringify(ids))
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
        ? byCategory.reduce((max, current) => (current.count > max.count ? current : max))
        : null

    const mostRecentItem = filteredItems.length
      ? [...filteredItems].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
      : null

    const withExplanation = filteredItems.filter(
      (row) => row.explanation && row.explanation.trim() !== ""
    ).length

    return {
      totalItems,
      allUnique,
      mostCommonCategory,
      mostRecentItem,
      withExplanation,
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
      "Vocabulary",
      "Spelling",
      "Comprehension",
      "Primary Word Classes",
      "Sentence Structure & Syntax",
      "Advanced Punctuation",
      "Apostrophes",
      "Comma",
      "Direct Speech Punctuation",
      "Sentence Punctuation",
      "Not set",
    ]

    return Object.values(grouped).sort(
      (a, b) => order.indexOf(a.category) - order.indexOf(b.category)
    )
  }, [filteredItems])

  const recentItems = useMemo(() => {
    return [...filteredItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 12)
  }, [filteredItems])

  const summaryText = useMemo(() => {
    if (!filteredItems.length) {
      return "No English review items found for the selected filters."
    }

    const mostCommon = reviewStats.mostCommonCategory
      ? `${reviewStats.mostCommonCategory.category} (${reviewStats.mostCommonCategory.count})`
      : "N/A"

    return `You currently have ${reviewStats.totalItems} English items to review. The biggest review category is ${mostCommon}, and ${reviewStats.withExplanation} of these items already include an explanation to support revision.`
  }, [filteredItems, reviewStats])

  if (loadingUser || loadingData) {
    return (
      <div style={{ padding: "32px", color: "#334155", fontSize: "18px" }}>
        Loading English review...
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
              📘 English Review
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
              Review English items across vocabulary, spelling, comprehension, grammar, and
              punctuation with live filters, category insights, and quick retry access.
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
              id="english-review-category-filter"
              name="englishReviewCategoryFilter"
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
              id="english-review-difficulty-filter"
              name="englishReviewDifficultyFilter"
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
              id="english-review-time-filter"
              name="englishReviewTimeFilter"
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
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          <StatCard title="Items to Review" value={String(reviewStats.totalItems)} />
          <StatCard title="Total Review Bank" value={String(reviewStats.allUnique)} />
          <StatCard title="With Explanations" value={String(reviewStats.withExplanation)} />
          <StatCard
            title="Most Common Category"
            value={reviewStats.mostCommonCategory ? reviewStats.mostCommonCategory.category : "—"}
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
            value={categoryFilter === "all" ? "All Categories" : getCategoryLabel(categoryFilter)}
            subtitle={timeOptions.find((option) => option.value === timeFilter)?.label}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <SectionCard
            title="Review Items by Category"
            subtitle="See which English categories currently need the most revision."
          >
            <ChartBox>
              {({ width, height }) =>
                reviewByCategoryData.length ? (
                  <BarChart
                    width={width}
                    height={height}
                    data={reviewByCategoryData}
                    margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={questionsTooltipFormatter} />
                    <Bar dataKey="count" fill="#16a34a" radius={[10, 10, 0, 0]} />
                  </BarChart>
                ) : (
                  <div style={emptyStateStyle}>No data available for this filter.</div>
                )
              }
            </ChartBox>
          </SectionCard>

          <SectionCard
            title="Quick Insights"
            subtitle="A snapshot of current English revision needs."
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
                <div style={{ color: "#15803d", fontWeight: 700, marginBottom: "6px" }}>
                  Review Queue
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>
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
                <div style={{ color: "#15803d", fontWeight: 700, marginBottom: "6px" }}>
                  Explanations Ready
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>
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
                <div style={{ color: "#c2410c", fontWeight: 700, marginBottom: "6px" }}>
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
                  {reviewStats.mostCommonCategory ? reviewStats.mostCommonCategory.category : "—"}
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
                  Total Review Bank
                </div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a" }}>
                  {reviewStats.allUnique}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Recent Review Items"
          subtitle="Your most recent English review items for the selected filters."
        >
          {recentItems.length ? (
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
                    <th style={thStyle}>Item</th>
                    <th style={thStyle}>Explanation</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentItems.map((row) => (
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
                        {truncateText(row.item_text, 130)}
                      </td>
                      <td style={{ ...tdStyle, maxWidth: "340px" }}>
                        {row.explanation && row.explanation.trim()
                          ? truncateText(row.explanation, 140)
                          : "No explanation available."}
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => removeItem(row)} style={removeButtonStyle}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={emptyStateStyle}>No review items found for the selected filters.</div>
          )}
        </SectionCard>

        {filteredItems.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "18px",
              marginTop: "20px",
            }}
          >
            {filteredItems.slice(0, 9).map((row) => (
              <div
                key={row.id}
                style={{
                  background: "linear-gradient(180deg, #ffffff 0%, #f7fff8 100%)",
                  border: "1px solid #dcfce7",
                  borderRadius: "24px",
                  padding: "20px",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                  minWidth: 0,
                  overflow: "hidden",
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
                    fontWeight: 700,
                    marginBottom: "10px",
                    maxWidth: "100%",
                    overflowWrap: "break-word",
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
                    color: "#15803d",
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
                  Item
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
                  {row.item_text}
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
                  }}
                >
                  Added: {formatDateTime(row.created_at)}
                </div>

                <button onClick={() => removeItem(row)} style={removeButtonStyle}>
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
          }}
        >
          <div style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
            Overall Summary
          </div>
          <div style={{ color: "#dcfce7", fontSize: "16px", lineHeight: 1.7 }}>
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

const actionButtonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: "14px",
  border: "none",
  background: "#16a34a",
  color: "white",
  fontWeight: 700,
  boxShadow: "0 10px 24px rgba(22, 163, 74, 0.25)",
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