"use client"

import React, { useEffect, useMemo, useState } from "react"
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

type ComprehensionReviewRow = {
  id: string
  user_id: string
  question_id: number | null
  question_text: string
  created_at: string
}

type ComprehensionQuestionRow = {
  id: number
  explanation: string | null
  difficulty: number | null
}

type PrimaryWordClassesReviewRow = {
  id: string
  user_id: string
  question_id: number | null
  question_text: string
  correct_answer: string
  user_answer: string | null
  difficulty: number | null
  created_at: string
}

type PrimaryWordClassesQuestionRow = {
  id: number
  explanation: string | null
  difficulty: number | null
}

type SentenceStructureSyntaxReviewRow = {
  id: string
  user_id: string
  question_id: number | null
  question_text: string
  correct_answer: string
  user_answer: string | null
  difficulty: number | null
  created_at: string
}

type SentenceStructureSyntaxQuestionRow = {
  id: number
  explanation: string | null
  difficulty: number | null
}

type EnglishReviewRow = {
  id: string
  category:
    | "vocabulary"
    | "spelling"
    | "comprehension"
    | "primary_word_classes"
    | "sentence_structure_syntax"
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
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        router.push("/login")
        return
      }

      setLoadingUser(false)

      const [
        vocabularyResult,
        spellingResult,
        comprehensionResult,
        primaryWordClassesResult,
        sentenceStructureSyntaxResult,
      ] = await Promise.all([
        supabase
          .from("vocabulary_review")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("spelling_review")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("comprehension_review")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("grammar_primary_word_classes_review")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("grammar_sentence_structure_syntax_review")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ])

      if (vocabularyResult.error) {
        console.error("Error loading vocabulary review:", vocabularyResult.error)
      }
      if (spellingResult.error) {
        console.error("Error loading spelling review:", spellingResult.error)
      }
      if (comprehensionResult.error) {
        console.error("Error loading comprehension review:", comprehensionResult.error)
      }
      if (primaryWordClassesResult.error) {
        console.error(
          "Error loading primary word classes review:",
          primaryWordClassesResult.error
        )
      }
      if (sentenceStructureSyntaxResult.error) {
        console.error(
          "Error loading sentence structure syntax review:",
          sentenceStructureSyntaxResult.error
        )
      }

      const vocabularyRows = (vocabularyResult.data ?? []) as VocabularyReviewRow[]
      const spellingRows = (spellingResult.data ?? []) as SpellingReviewRow[]
      const comprehensionRows = (comprehensionResult.data ?? []) as ComprehensionReviewRow[]
      const primaryWordClassesRows =
        (primaryWordClassesResult.data ?? []) as PrimaryWordClassesReviewRow[]
      const sentenceStructureSyntaxRows =
        (sentenceStructureSyntaxResult.data ?? []) as SentenceStructureSyntaxReviewRow[]

      const comprehensionQuestionIds = Array.from(
        new Set(
          comprehensionRows
            .map((row) => row.question_id)
            .filter((id): id is number => id !== null)
        )
      )

      const primaryWordClassesQuestionIds = Array.from(
        new Set(
          primaryWordClassesRows
            .map((row) => row.question_id)
            .filter((id): id is number => id !== null)
        )
      )

      const sentenceStructureSyntaxQuestionIds = Array.from(
        new Set(
          sentenceStructureSyntaxRows
            .map((row) => row.question_id)
            .filter((id): id is number => id !== null)
        )
      )

      let comprehensionMap = new Map<number, { explanation: string; difficulty: number | null }>()
      let primaryWordClassesMap = new Map<
        number,
        { explanation: string; difficulty: number | null }
      >()
      let sentenceStructureSyntaxMap = new Map<
        number,
        { explanation: string; difficulty: number | null }
      >()

      if (comprehensionQuestionIds.length > 0) {
        const { data: comprehensionQuestionsData, error: comprehensionQuestionsError } =
          await supabase
            .from("comprehension_questions")
            .select("id, explanation, difficulty")
            .in("id", comprehensionQuestionIds)

        if (comprehensionQuestionsError) {
          console.error("Error loading comprehension explanations:", comprehensionQuestionsError)
        } else {
          comprehensionMap = new Map(
            ((comprehensionQuestionsData ?? []) as ComprehensionQuestionRow[]).map((question) => [
              question.id,
              {
                explanation: question.explanation || "",
                difficulty: question.difficulty,
              },
            ])
          )
        }
      }

      if (primaryWordClassesQuestionIds.length > 0) {
        const {
          data: primaryWordClassesQuestionsData,
          error: primaryWordClassesQuestionsError,
        } = await supabase
          .from("grammar_primary_word_classes_questions")
          .select("id, explanation, difficulty")
          .in("id", primaryWordClassesQuestionIds)

        if (primaryWordClassesQuestionsError) {
          console.error(
            "Error loading primary word classes explanations:",
            primaryWordClassesQuestionsError
          )
        } else {
          primaryWordClassesMap = new Map(
            ((primaryWordClassesQuestionsData ?? []) as PrimaryWordClassesQuestionRow[]).map(
              (question) => [
                question.id,
                {
                  explanation: question.explanation || "",
                  difficulty: question.difficulty,
                },
              ]
            )
          )
        }
      }

      if (sentenceStructureSyntaxQuestionIds.length > 0) {
        const {
          data: sentenceStructureSyntaxQuestionsData,
          error: sentenceStructureSyntaxQuestionsError,
        } = await supabase
          .from("grammar_sentence_structure_syntax_questions")
          .select("id, explanation, difficulty")
          .in("id", sentenceStructureSyntaxQuestionIds)

        if (sentenceStructureSyntaxQuestionsError) {
          console.error(
            "Error loading sentence structure syntax explanations:",
            sentenceStructureSyntaxQuestionsError
          )
        } else {
          sentenceStructureSyntaxMap = new Map(
            ((sentenceStructureSyntaxQuestionsData ?? []) as SentenceStructureSyntaxQuestionRow[]).map(
              (question) => [
                question.id,
                {
                  explanation: question.explanation || "",
                  difficulty: question.difficulty,
                },
              ]
            )
          )
        }
      }

      const mergedRows: EnglishReviewRow[] = [
        ...vocabularyRows.map((row) => ({
          id: `vocabulary-${row.id}`,
          category: "vocabulary" as const,
          item_id: row.word_id,
          item_text: row.word,
          difficulty: row.difficulty,
          created_at: row.created_at,
          explanation: "",
        })),
        ...spellingRows.map((row) => ({
          id: `spelling-${row.id}`,
          category: "spelling" as const,
          item_id: row.word_id,
          item_text: row.word,
          difficulty: row.difficulty,
          created_at: row.created_at,
          explanation: "",
        })),
        ...comprehensionRows.map((row) => ({
          id: `comprehension-${row.id}`,
          category: "comprehension" as const,
          item_id: row.question_id,
          item_text: row.question_text,
          difficulty:
            row.question_id !== null
              ? comprehensionMap.get(row.question_id)?.difficulty ?? null
              : null,
          created_at: row.created_at,
          explanation:
            row.question_id !== null
              ? comprehensionMap.get(row.question_id)?.explanation || ""
              : "",
        })),
        ...primaryWordClassesRows.map((row) => ({
          id: `primary-word-classes-${row.id}`,
          category: "primary_word_classes" as const,
          item_id: row.question_id,
          item_text: row.question_text,
          difficulty:
            row.question_id !== null
              ? primaryWordClassesMap.get(row.question_id)?.difficulty ?? row.difficulty ?? null
              : row.difficulty ?? null,
          created_at: row.created_at,
          explanation:
            row.question_id !== null
              ? primaryWordClassesMap.get(row.question_id)?.explanation || ""
              : "",
        })),
        ...sentenceStructureSyntaxRows.map((row) => ({
          id: `sentence-structure-syntax-${row.id}`,
          category: "sentence_structure_syntax" as const,
          item_id: row.question_id,
          item_text: row.question_text,
          difficulty:
            row.question_id !== null
              ? sentenceStructureSyntaxMap.get(row.question_id)?.difficulty ?? row.difficulty ?? null
              : row.difficulty ?? null,
          created_at: row.created_at,
          explanation:
            row.question_id !== null
              ? sentenceStructureSyntaxMap.get(row.question_id)?.explanation || ""
              : "",
        })),
      ]

      if (mounted) {
        setReviewItems(mergedRows)
        setLoadingData(false)
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [router])

  async function removeItem(item: EnglishReviewRow) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    let error = null

    if (item.category === "vocabulary") {
      const result = await supabase
        .from("vocabulary_review")
        .delete()
        .eq("user_id", user.id)
        .ilike("word", item.item_text)

      error = result.error
    } else if (item.category === "spelling") {
      const result = await supabase
        .from("spelling_review")
        .delete()
        .eq("user_id", user.id)
        .ilike("word", item.item_text)

      error = result.error
    } else if (item.category === "comprehension") {
      const result = await supabase
        .from("comprehension_review")
        .delete()
        .eq("user_id", user.id)
        .ilike("question_text", item.item_text)

      error = result.error
    } else if (item.category === "primary_word_classes") {
      const result = await supabase
        .from("grammar_primary_word_classes_review")
        .delete()
        .eq("user_id", user.id)
        .ilike("question_text", item.item_text)

      error = result.error
    } else if (item.category === "sentence_structure_syntax") {
      const result = await supabase
        .from("grammar_sentence_structure_syntax_review")
        .delete()
        .eq("user_id", user.id)
        .ilike("question_text", item.item_text)

      error = result.error
    }

    if (error) {
      console.error("Error deleting English review item:", error)
      return
    }

    setReviewItems((prev) =>
      prev.filter(
        (row) =>
          !(
            row.category === item.category &&
            row.item_text.toLowerCase() === item.item_text.toLowerCase()
          )
      )
    )
  }

  const uniqueItems = useMemo(() => {
    return Array.from(
      new Map(
        reviewItems.map((item) => [`${item.category}::${item.item_text.toLowerCase()}`, item])
      ).values()
    )
  }, [reviewItems])

  const filteredItems = useMemo(() => {
    const cutoff = getCutoffDate(timeFilter)

    return uniqueItems.filter((item) => {
      const matchesTime = cutoff ? new Date(item.created_at) >= cutoff : true
      const matchesDifficulty =
        difficultyFilter === "all" || String(item.difficulty ?? "") === difficultyFilter
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter

      return matchesTime && matchesDifficulty && matchesCategory
    })
  }, [uniqueItems, timeFilter, difficultyFilter, categoryFilter])

  function retryFilteredItems() {
    const vocabularyIds = filteredItems
      .filter((row) => row.category === "vocabulary")
      .map((row) => row.item_id)
      .filter((id): id is number => id !== null)

    const spellingIds = filteredItems
      .filter((row) => row.category === "spelling")
      .map((row) => row.item_id)
      .filter((id): id is number => id !== null)

    const comprehensionIds = filteredItems
      .filter((row) => row.category === "comprehension")
      .map((row) => row.item_id)
      .filter((id): id is number => id !== null)

    const primaryWordClassesIds = filteredItems
      .filter((row) => row.category === "primary_word_classes")
      .map((row) => row.item_id)
      .filter((id): id is number => id !== null)

    const sentenceStructureSyntaxIds = filteredItems
      .filter((row) => row.category === "sentence_structure_syntax")
      .map((row) => row.item_id)
      .filter((id): id is number => id !== null)

    if (categoryFilter === "vocabulary" && vocabularyIds.length > 0) {
      localStorage.setItem("vocabulary_review_ids", JSON.stringify(vocabularyIds))
      router.push("/english/vocabulary?mode=review")
      return
    }

    if (categoryFilter === "spelling" && spellingIds.length > 0) {
      localStorage.setItem("spelling_review_ids", JSON.stringify(spellingIds))
      router.push("/english/spelling?mode=review")
      return
    }

    if (categoryFilter === "comprehension" && comprehensionIds.length > 0) {
      localStorage.setItem("comprehension_review_ids", JSON.stringify(comprehensionIds))
      router.push("/english/comprehension?mode=review")
      return
    }

    if (categoryFilter === "primary_word_classes" && primaryWordClassesIds.length > 0) {
      localStorage.setItem(
        "primary_word_classes_review_ids",
        JSON.stringify(primaryWordClassesIds)
      )
      router.push("/english/grammar/primary-word-classes?mode=review")
      return
    }

    if (categoryFilter === "sentence_structure_syntax" && sentenceStructureSyntaxIds.length > 0) {
      localStorage.setItem(
        "sentence_structure_syntax_review_ids",
        JSON.stringify(sentenceStructureSyntaxIds)
      )
      router.push("/english/grammar/sentence-structure-syntax?mode=review")
      return
    }

    if (filteredItems.length > 0) {
      const firstCategory = filteredItems[0].category

      if (firstCategory === "vocabulary" && vocabularyIds.length > 0) {
        localStorage.setItem("vocabulary_review_ids", JSON.stringify(vocabularyIds))
        router.push("/english/vocabulary?mode=review")
        return
      }

      if (firstCategory === "spelling" && spellingIds.length > 0) {
        localStorage.setItem("spelling_review_ids", JSON.stringify(spellingIds))
        router.push("/english/spelling?mode=review")
        return
      }

      if (firstCategory === "comprehension" && comprehensionIds.length > 0) {
        localStorage.setItem("comprehension_review_ids", JSON.stringify(comprehensionIds))
        router.push("/english/comprehension?mode=review")
        return
      }

      if (firstCategory === "primary_word_classes" && primaryWordClassesIds.length > 0) {
        localStorage.setItem(
          "primary_word_classes_review_ids",
          JSON.stringify(primaryWordClassesIds)
        )
        router.push("/english/grammar/primary-word-classes?mode=review")
        return
      }

      if (firstCategory === "sentence_structure_syntax" && sentenceStructureSyntaxIds.length > 0) {
        localStorage.setItem(
          "sentence_structure_syntax_review_ids",
          JSON.stringify(sentenceStructureSyntaxIds)
        )
        router.push("/english/grammar/sentence-structure-syntax?mode=review")
      }
    }
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
          "radial-gradient(circle at top, rgba(59,130,246,0.10) 0%, rgba(255,255,255,1) 32%), linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)",
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
              Review English items across vocabulary, spelling, comprehension, and grammar
              with live filters, category insights, and quick retry access.
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
            gridTemplateColumns: "2fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <SectionCard
            title="Review Items by Category"
            subtitle="See which English categories currently need the most revision."
          >
            <div style={{ width: "100%", height: "340px" }}>
              {reviewByCategoryData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reviewByCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={questionsTooltipFormatter} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={emptyStateStyle}>No data available for this filter.</div>
              )}
            </div>
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
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                }}
              >
                <div style={{ color: "#1d4ed8", fontWeight: 700, marginBottom: "6px" }}>
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
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
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
                  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
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
                    background: "#dbeafe",
                    color: "#1d4ed8",
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
                    background: "#eff6ff",
                    color: "#1e40af",
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
            background: "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)",
            color: "white",
            borderRadius: "28px",
            padding: "26px",
            boxShadow: "0 12px 34px rgba(30, 58, 138, 0.22)",
          }}
        >
          <div style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>
            Overall Summary
          </div>
          <div style={{ color: "#dbeafe", fontSize: "16px", lineHeight: 1.7 }}>
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
  background: "#3b82f6",
  color: "white",
  fontWeight: 700,
  boxShadow: "0 10px 24px rgba(59, 130, 246, 0.25)",
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