"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabaseClient"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
  updated_at?: string | null
  last_attempted_at?: string | null
}

type SpellingReviewRow = {
  id: string
  user_id: string
  word_id: number | null
  word: string
  knew_it: boolean | null
  difficulty: number | null
  created_at: string
  updated_at?: string | null
  last_attempted_at?: string | null
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
  updated_at?: string | null
  last_attempted_at?: string | null
}

type WordLookupRow = {
  id: number
  word?: string | null
  definition: string | null
  difficulty: number | null
}

type EnglishQuestionLookupRow = {
  id: number
  test_id: number | null
  question_text: string
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  correct_answer: string | null
  explanation: string | null
  difficulty: number | null
  question_order: number | null
}

type EnglishTestLookupRow = {
  id: number
  title: string | null
  main_category: string | null
  subcategory: string | null
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

type ReviewSource = "english_review" | "vocabulary_review" | "spelling_review"

type EnglishReviewItem = {
  id: string
  source: ReviewSource
  category: EnglishReviewCategory
  item_id: number | null
  test_id: number | null
  test_title: string | null
  question_order: number | null
  item_text: string
  user_answer: string | null
  user_answer_text: string | null
  correct_answer: string | null
  correct_answer_text: string | null
  difficulty: number | null
  explanation: string
  created_at: string
  updated_at: string | null
  last_attempted_at: string | null
}

type TimeFilter = "7d" | "30d" | "90d" | "all"
type DifficultyFilter = "all" | "1" | "2" | "3"
type CategoryFilter = "all" | EnglishReviewCategory

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

function getRelevantDate(item: {
  last_attempted_at?: string | null
  updated_at?: string | null
  created_at: string
}) {
  return item.last_attempted_at || item.updated_at || item.created_at
}

function getFilterDate(item: {
  last_attempted_at?: string | null
  created_at: string
}) {
  return item.last_attempted_at || item.created_at
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

function truncateText(value: string, maxLength = 160) {
  if (!value) return "—"
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
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

function getOptionText(
  question: EnglishQuestionLookupRow | undefined,
  answer: string | null | undefined
) {
  if (!answer) return "—"

  const normalized = answer.trim().toUpperCase()

  if (normalized === "A") return question?.option_a || "A"
  if (normalized === "B") return question?.option_b || "B"
  if (normalized === "C") return question?.option_c || "C"
  if (normalized === "D") return question?.option_d || "D"

  return answer
}

function mapSharedReviewCategory(
  row: EnglishSharedReviewRow
): Exclude<EnglishReviewCategory, "vocabulary" | "spelling"> | null {
  if (row.main_category === "comprehension") {
    return "comprehension"
  }

  if (row.main_category === "grammar") {
    if (row.subcategory === "primary_word_classes") return "primary_word_classes"
    if (row.subcategory === "sentence_structure_syntax") {
      return "sentence_structure_syntax"
    }
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
    return { main_category: "comprehension", subcategory: "comprehension" }
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
    return {
      main_category: "punctuation",
      subcategory: "direct_speech_punctuation",
    }
  }

  if (category === "sentence_punctuation") {
    return { main_category: "punctuation", subcategory: "sentence_punctuation" }
  }

  return null
}

function getReviewStorageConfig(
  category: EnglishReviewCategory,
  item?: EnglishReviewItem
) {
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
    if (!item?.test_id) return null

    return {
      key: "comprehension_review_ids",
      route: `/english/comprehension/${item.test_id}?mode=review`,
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

function isSameReviewItem(a: EnglishReviewItem, b: EnglishReviewItem) {
  if (a.source !== b.source) return false
  if (a.category !== b.category) return false

  if (a.item_id !== null && b.item_id !== null) {
    return a.item_id === b.item_id
  }

  return a.item_text.toLowerCase() === b.item_text.toLowerCase()
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
        background: "rgba(255,255,255,0.96)",
        border: "1px solid rgba(226,232,240,0.9)",
        borderRadius: "28px",
        padding: "24px",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
        minWidth: 0,
      }}
    >
      <div style={{ marginBottom: "18px" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "22px",
            lineHeight: 1.2,
            color: "#0f172a",
          }}
        >
          {title}
        </h2>

        {subtitle ? (
          <p
            style={{
              margin: "8px 0 0",
              color: "#64748b",
              fontSize: "14px",
              lineHeight: 1.6,
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

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  fontSize: "13px",
  color: "#475569",
  fontWeight: 800,
  whiteSpace: "nowrap",
}

const tdStyle: React.CSSProperties = {
  padding: "12px",
  fontSize: "14px",
  color: "#334155",
  verticalAlign: "top",
  lineHeight: 1.45,
}

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: "#0f172a",
  fontWeight: 700,
}

const removeButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "999px",
  background: "#fee2e2",
  color: "#991b1b",
  padding: "9px 13px",
  fontWeight: 800,
  cursor: "pointer",
}

const retryButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  color: "#ffffff",
  padding: "12px 18px",
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(34, 197, 94, 0.25)",
}

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: "999px",
  background: "#ffffff",
  color: "#0f172a",
  padding: "12px 18px",
  fontWeight: 900,
  cursor: "pointer",
}

const emptyStateStyle: React.CSSProperties = {
  border: "1px dashed #cbd5e1",
  borderRadius: "20px",
  padding: "24px",
  color: "#64748b",
  background: "#f8fafc",
  textAlign: "center",
}

export default function EnglishReviewPage() {
  const router = useRouter()

  const [reviewItems, setReviewItems] = useState<EnglishReviewItem[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [noticeMessage, setNoticeMessage] = useState("")
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("30d")
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")

  useEffect(() => {
    let mounted = true

    async function loadData() {
      setLoadingData(true)
      setErrorMessage("")
      setNoticeMessage("")

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push("/login")
          return
        }

        const [vocabularyResult, spellingResult, englishReviewResult] =
          await Promise.all([
            supabase
              .from("vocabulary_review")
              .select("*")
              .eq("user_id", user.id)
              .eq("knew_it", false),
            supabase
              .from("spelling_review")
              .select("*")
              .eq("user_id", user.id)
              .eq("knew_it", false),
            supabase
              .from("english_review")
              .select("*")
              .eq("user_id", user.id)
              .in("main_category", ["comprehension", "grammar", "punctuation"]),
          ])

        const errors = [
          vocabularyResult.error
            ? `Vocabulary review: ${vocabularyResult.error.message}`
            : "",
          spellingResult.error
            ? `Spelling review: ${spellingResult.error.message}`
            : "",
          englishReviewResult.error
            ? `English review: ${englishReviewResult.error.message}`
            : "",
        ].filter(Boolean)

        if (errors.length > 0) {
          setErrorMessage(errors.join(" | "))
        }

        const vocabularyRows =
          (vocabularyResult.data ?? []) as VocabularyReviewRow[]

        const spellingRows =
          (spellingResult.data ?? []) as SpellingReviewRow[]

        const englishRows =
          (englishReviewResult.data ?? []) as EnglishSharedReviewRow[]

        const wordIds = Array.from(
          new Set(
            [...vocabularyRows, ...spellingRows]
              .map((row) => row.word_id)
              .filter((id): id is number => id !== null)
          )
        )

        const questionIds = Array.from(
          new Set(
            englishRows
              .map((row) => row.question_id)
              .filter((id): id is number => id !== null)
          )
        )

        let wordLookupMap = new Map<
          number,
          { word: string; definition: string; difficulty: number | null }
        >()

        let questionLookupMap = new Map<number, EnglishQuestionLookupRow>()
        let testLookupMap = new Map<number, EnglishTestLookupRow>()

        if (wordIds.length > 0) {
          const { data, error } = await supabase
            .from("words")
            .select("id, word, definition, difficulty")
            .in("id", wordIds)

          if (error) {
            setErrorMessage((previous) =>
              previous
                ? `${previous} | Words lookup: ${error.message}`
                : `Words lookup: ${error.message}`
            )
          } else {
            wordLookupMap = new Map(
              ((data ?? []) as WordLookupRow[]).map((word) => [
                word.id,
                {
                  word: word.word || "",
                  definition: word.definition || "",
                  difficulty: word.difficulty ?? null,
                },
              ])
            )
          }
        }

        if (questionIds.length > 0) {
          const { data, error } = await supabase
            .from("english_questions")
            .select(
              "id, test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, question_order"
            )
            .in("id", questionIds)

          if (error) {
            setErrorMessage((previous) =>
              previous
                ? `${previous} | English question lookup: ${error.message}`
                : `English question lookup: ${error.message}`
            )
          } else {
            const questions = (data ?? []) as EnglishQuestionLookupRow[]
            questionLookupMap = new Map(
              questions.map((question) => [question.id, question])
            )

            const testIds = Array.from(
              new Set(
                questions
                  .map((question) => question.test_id)
                  .filter((id): id is number => id !== null)
              )
            )

            if (testIds.length > 0) {
              const testResult = await supabase
                .from("english_tests")
                .select("id, title, main_category, subcategory")
                .in("id", testIds)

              if (testResult.error) {
                setErrorMessage((previous) =>
                  previous
                    ? `${previous} | English test lookup: ${testResult.error.message}`
                    : `English test lookup: ${testResult.error.message}`
                )
              } else {
                testLookupMap = new Map(
                  ((testResult.data ?? []) as EnglishTestLookupRow[]).map(
                    (test) => [test.id, test]
                  )
                )
              }
            }
          }
        }

        const mergedRows: EnglishReviewItem[] = [
          ...vocabularyRows.map((row) => {
            const lookup =
              row.word_id !== null ? wordLookupMap.get(row.word_id) : undefined

            return {
              id: `vocabulary-${row.id}`,
              source: "vocabulary_review" as const,
              category: "vocabulary" as const,
              item_id: row.word_id,
              test_id: null,
              test_title: null,
              question_order: null,
              item_text: lookup?.word || row.word,
              user_answer: "Needs review",
              user_answer_text: "Answered incorrectly",
              correct_answer: lookup?.word || row.word,
              correct_answer_text: lookup?.word || row.word,
              difficulty: lookup?.difficulty ?? row.difficulty ?? null,
              explanation: lookup?.definition || "",
              created_at: row.created_at,
              updated_at: row.updated_at ?? null,
              last_attempted_at: row.last_attempted_at ?? null,
            }
          }),
          ...spellingRows.map((row) => {
            const lookup =
              row.word_id !== null ? wordLookupMap.get(row.word_id) : undefined

            return {
              id: `spelling-${row.id}`,
              source: "spelling_review" as const,
              category: "spelling" as const,
              item_id: row.word_id,
              test_id: null,
              test_title: null,
              question_order: null,
              item_text: lookup?.word || row.word,
              user_answer: "Needs review",
              user_answer_text: "Spelt incorrectly",
              correct_answer: lookup?.word || row.word,
              correct_answer_text: lookup?.word || row.word,
              difficulty: lookup?.difficulty ?? row.difficulty ?? null,
              explanation: lookup?.definition || "",
              created_at: row.created_at,
              updated_at: row.updated_at ?? null,
              last_attempted_at: row.last_attempted_at ?? null,
            }
          }),
          ...englishRows.flatMap((row) => {
            const mappedCategory = mapSharedReviewCategory(row)
            if (!mappedCategory) return []

            const question =
              row.question_id !== null
                ? questionLookupMap.get(row.question_id)
                : undefined

            const test =
              question?.test_id !== null && question?.test_id !== undefined
                ? testLookupMap.get(question.test_id)
                : row.test_id !== null
                  ? testLookupMap.get(row.test_id)
                  : undefined

            return [
              {
                id: `english-${row.id}`,
                source: "english_review" as const,
                category: mappedCategory,
                item_id: row.question_id,
                test_id: question?.test_id ?? row.test_id ?? null,
                test_title: test?.title || null,
                question_order: question?.question_order ?? null,
                item_text: question?.question_text || row.question_text,
                user_answer: row.user_answer,
                user_answer_text: getOptionText(question, row.user_answer),
                correct_answer: row.correct_answer,
                correct_answer_text: getOptionText(question, row.correct_answer),
                difficulty: question?.difficulty ?? row.difficulty ?? null,
                explanation: question?.explanation || "",
                created_at: row.created_at,
                updated_at: row.updated_at ?? null,
                last_attempted_at: row.last_attempted_at ?? null,
              },
            ]
          }),
        ].sort(
          (a, b) =>
            new Date(getRelevantDate(b)).getTime() -
            new Date(getRelevantDate(a)).getTime()
        )

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

  async function removeItem(item: EnglishReviewItem) {
    setNoticeMessage("")
    setErrorMessage("")

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

      query = query.eq("subcategory", sharedMeta.subcategory)

      const result =
        item.item_id !== null
          ? await query.eq("question_id", item.item_id)
          : await query.ilike("question_text", item.item_text)

      error = result.error
    }

    if (error) {
      setErrorMessage(`Could not remove review item: ${error.message}`)
      return
    }

    setReviewItems((previous) =>
      previous.filter((row) => !isSameReviewItem(row, item))
    )
    setNoticeMessage("Review item removed.")
  }

  function retryItem(item: EnglishReviewItem) {
    if (item.item_id === null) return

    const config = getReviewStorageConfig(item.category, item)
    if (!config) {
      setErrorMessage("This item cannot be retried from here yet.")
      return
    }

    localStorage.setItem(config.key, JSON.stringify([item.item_id]))
    router.push(config.route)
  }

  function retryFilteredItems() {
    setErrorMessage("")
    setNoticeMessage("")

    if (filteredItems.length === 0) return

    const targetCategory =
      categoryFilter !== "all"
        ? (categoryFilter as EnglishReviewCategory)
        : filteredItems[0].category

    const targetItems = filteredItems.filter(
      (item) => item.category === targetCategory && item.item_id !== null
    )

    if (targetItems.length === 0) return

    const firstItem = targetItems[0]
    const config = getReviewStorageConfig(targetCategory, firstItem)

    if (!config) {
      setErrorMessage(
        "Please choose a specific category before retrying these items."
      )
      return
    }

    let ids = targetItems
      .map((item) => item.item_id)
      .filter((id): id is number => id !== null)

    if (targetCategory === "comprehension") {
      const testId = firstItem.test_id
      const sameTestItems = targetItems.filter((item) => item.test_id === testId)

      ids = sameTestItems
        .map((item) => item.item_id)
        .filter((id): id is number => id !== null)

      if (sameTestItems.length !== targetItems.length) {
        setNoticeMessage(
          "Comprehension review opens one passage at a time. I have opened the most recent passage group."
        )
      }
    } else if (categoryFilter === "all") {
      setNoticeMessage(
        `Opening ${getCategoryLabel(targetCategory)} review first. Use the category filter to retry a different group.`
      )
    }

    localStorage.setItem(config.key, JSON.stringify(Array.from(new Set(ids))))
    router.push(config.route)
  }

  const uniqueItems = useMemo(() => {
    return Array.from(
      new Map(
        reviewItems.map((item) => {
          const key =
            item.item_id !== null
              ? `${item.source}::${item.category}::id::${item.item_id}`
              : `${item.source}::${item.category}::text::${item.item_text.toLowerCase()}`

          return [key, item]
        })
      ).values()
    )
  }, [reviewItems])

  const filteredItems = useMemo(() => {
    const cutoff = getCutoffDate(timeFilter)

    return uniqueItems.filter((item) => {
      const matchesTime = cutoff ? new Date(getFilterDate(item)) >= cutoff : true

      const matchesDifficulty =
        difficultyFilter === "all" ||
        String(item.difficulty ?? "") === difficultyFilter

      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter

      return matchesTime && matchesDifficulty && matchesCategory
    })
  }, [uniqueItems, timeFilter, difficultyFilter, categoryFilter])

  const recentItems = useMemo(() => {
    return [...filteredItems]
      .sort(
        (a, b) =>
          new Date(getRelevantDate(b)).getTime() -
          new Date(getRelevantDate(a)).getTime()
      )
      .slice(0, 20)
  }, [filteredItems])

  const reviewStats = useMemo(() => {
    const totalItems = filteredItems.length
    const allUnique = uniqueItems.length

    const byCategory = Object.entries(
      filteredItems.reduce(
        (acc, row) => {
          const key = getCategoryLabel(row.category)
          acc[key] = (acc[key] ?? 0) + 1
          return acc
        },
        {} as Record<string, number>
      )
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
            new Date(getRelevantDate(b)).getTime() -
            new Date(getRelevantDate(a)).getTime()
        )[0]
      : null

    return {
      totalItems,
      allUnique,
      byCategory,
      mostCommonCategory,
      mostRecentItem,
    }
  }, [filteredItems, uniqueItems])

  const reviewByCategoryData = useMemo(() => {
    return reviewStats.byCategory.sort((a, b) => b.count - a.count)
  }, [reviewStats.byCategory])

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #ecfdf5 0%, #f8fafc 48%, #eff6ff 100%)",
        padding: "32px 16px 56px",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <button
          type="button"
          onClick={() => router.push("/english")}
          style={{
            border: "none",
            background: "transparent",
            color: "#166534",
            fontWeight: 900,
            cursor: "pointer",
            marginBottom: "18px",
          }}
        >
          ← Back to English
        </button>

        <section
          style={{
            background: "linear-gradient(135deg, #14532d 0%, #166534 100%)",
            borderRadius: "32px",
            padding: "28px",
            color: "#ffffff",
            boxShadow: "0 24px 60px rgba(20, 83, 45, 0.28)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "18px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  color: "#bbf7d0",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontSize: "12px",
                }}
              >
                English Review
              </p>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(30px, 5vw, 48px)",
                  lineHeight: 1.05,
                }}
              >
                Active Review Queue
              </h1>

              <p
                style={{
                  margin: "12px 0 0",
                  color: "#dcfce7",
                  maxWidth: "760px",
                  lineHeight: 1.7,
                  fontSize: "16px",
                }}
              >
                Review all active English weak spots in one place: grammar,
                punctuation, comprehension, vocabulary and spelling. Items stay
                here until they are answered correctly or removed.
              </p>
            </div>

            <button
              type="button"
              onClick={retryFilteredItems}
              disabled={filteredItems.length === 0}
              style={{
                ...retryButtonStyle,
                opacity: filteredItems.length === 0 ? 0.55 : 1,
                cursor: filteredItems.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              Retry filtered items
            </button>
          </div>
        </section>

        {errorMessage ? (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              borderRadius: "18px",
              padding: "14px 16px",
              marginBottom: "18px",
              fontWeight: 700,
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        {noticeMessage ? (
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1e40af",
              borderRadius: "18px",
              padding: "14px 16px",
              marginBottom: "18px",
              fontWeight: 700,
            }}
          >
            {noticeMessage}
          </div>
        ) : null}

        <SectionCard
          title="Filters"
          subtitle="Use these filters before retrying a focused group of review items."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "14px",
            }}
          >
            <label>
              <div style={{ fontWeight: 900, marginBottom: "8px" }}>Time</div>
              <select
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
            </label>

            <label>
              <div style={{ fontWeight: 900, marginBottom: "8px" }}>
                Difficulty
              </div>
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
            </label>

            <label>
              <div style={{ fontWeight: 900, marginBottom: "8px" }}>
                Category
              </div>
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
            </label>
          </div>
        </SectionCard>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
            gap: "20px",
            marginTop: "20px",
            marginBottom: "20px",
          }}
        >
          <SectionCard
            title="Review Summary"
            subtitle="Current active review items for the selected filters."
          >
            {loadingData ? (
              <div style={emptyStateStyle}>Loading English review items...</div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "18px",
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  <div
                    style={{
                      color: "#166534",
                      fontWeight: 800,
                      marginBottom: "6px",
                    }}
                  >
                    Items to Review
                  </div>

                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: 900,
                      color: "#14532d",
                    }}
                  >
                    {reviewStats.totalItems}
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
                  <div
                    style={{
                      color: "#475569",
                      fontWeight: 800,
                      marginBottom: "6px",
                    }}
                  >
                    Total Review Bank
                  </div>

                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: 900,
                      color: "#0f172a",
                    }}
                  >
                    {reviewStats.allUnique}
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
                      fontWeight: 800,
                      marginBottom: "6px",
                    }}
                  >
                    Main Focus
                  </div>

                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 900,
                      color: "#1e3a8a",
                    }}
                  >
                    {reviewStats.mostCommonCategory
                      ? reviewStats.mostCommonCategory.category
                      : "—"}
                  </div>
                </div>

                <div
                  style={{
                    padding: "16px",
                    borderRadius: "18px",
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                  }}
                >
                  <div
                    style={{
                      color: "#92400e",
                      fontWeight: 800,
                      marginBottom: "6px",
                    }}
                  >
                    Most Recent
                  </div>

                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "#78350f",
                      lineHeight: 1.5,
                    }}
                  >
                    {reviewStats.mostRecentItem
                      ? formatDateTime(getRelevantDate(reviewStats.mostRecentItem))
                      : "—"}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="By Category"
            subtitle="Where the current review queue is concentrated."
          >
            {reviewByCategoryData.length ? (
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reviewByCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="category"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={questionsTooltipFormatter} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={emptyStateStyle}>No category data yet.</div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Recent Review Items"
          subtitle="The table shows the newest active items first. The detailed cards underneath show answer text and explanations where available."
        >
          {recentItems.length ? (
            <div style={{ overflowX: "auto", maxWidth: "100%" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "980px",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <th style={thStyle}>Last Attempt</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Test</th>
                    <th style={thStyle}>Level</th>
                    <th style={thStyle}>Item</th>
                    <th style={thStyle}>Correct Answer</th>
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
                      <td style={tdStyle}>{formatDateTime(getRelevantDate(row))}</td>
                      <td style={tdStyle}>{getCategoryLabel(row.category)}</td>
                      <td style={tdStyle}>
                        {row.test_title
                          ? row.question_order
                            ? `${row.test_title} · Q${row.question_order}`
                            : row.test_title
                          : "—"}
                      </td>
                      <td style={tdStyle}>{getLevelLabel(row.difficulty)}</td>
                      <td style={{ ...tdStyle, maxWidth: "300px" }}>
                        {truncateText(row.item_text, 110)}
                      </td>
                      <td style={{ ...tdStyle, maxWidth: "240px" }}>
                        {truncateText(row.correct_answer_text || "—", 90)}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => retryItem(row)}
                            style={secondaryButtonStyle}
                          >
                            Retry
                          </button>

                          <button
                            type="button"
                            onClick={() => removeItem(row)}
                            style={removeButtonStyle}
                          >
                            Remove
                          </button>
                        </div>
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

        {filteredItems.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 330px), 1fr))",
              gap: "18px",
              marginTop: "20px",
            }}
          >
            {filteredItems.slice(0, 12).map((row) => (
              <article
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
                      fontWeight: 900,
                    }}
                  >
                    {getCategoryLabel(row.category)}
                  </span>

                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background: "#e0f2fe",
                      color: "#075985",
                      fontSize: "12px",
                      fontWeight: 900,
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
                        background: "#fef3c7",
                        color: "#92400e",
                        fontSize: "12px",
                        fontWeight: 900,
                      }}
                    >
                      {row.question_order
                        ? `${row.test_title} · Q${row.question_order}`
                        : row.test_title}
                    </span>
                  ) : null}
                </div>

                <div
                  style={{
                    color: "#64748b",
                    fontSize: "13px",
                    fontWeight: 800,
                    marginBottom: "8px",
                  }}
                >
                  Last attempted: {formatDateTime(getRelevantDate(row))}
                </div>

                <h3
                  style={{
                    margin: "0 0 14px",
                    color: "#0f172a",
                    fontSize: "18px",
                    lineHeight: 1.35,
                    overflowWrap: "break-word",
                  }}
                >
                  {row.item_text}
                </h3>

                <div
                  style={{
                    display: "grid",
                    gap: "10px",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "16px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                    }}
                  >
                    <div
                      style={{
                        color: "#991b1b",
                        fontWeight: 900,
                        fontSize: "13px",
                        marginBottom: "4px",
                      }}
                    >
                      Child's answer
                    </div>
                    <div style={{ color: "#7f1d1d", lineHeight: 1.5 }}>
                      {row.user_answer
                        ? `${row.user_answer}: ${row.user_answer_text || "—"}`
                        : row.user_answer_text || "Not answered"}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "16px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    <div
                      style={{
                        color: "#166534",
                        fontWeight: 900,
                        fontSize: "13px",
                        marginBottom: "4px",
                      }}
                    >
                      Correct answer
                    </div>
                    <div style={{ color: "#14532d", lineHeight: 1.5 }}>
                      {row.correct_answer
                        ? `${row.correct_answer}: ${row.correct_answer_text || "—"}`
                        : row.correct_answer_text || "—"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: "12px",
                    borderRadius: "16px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#334155",
                    lineHeight: 1.6,
                    marginBottom: "16px",
                  }}
                >
                  <strong>Explanation: </strong>
                  {row.explanation && row.explanation.trim()
                    ? row.explanation
                    : "No explanation available yet."}
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => retryItem(row)}
                    style={secondaryButtonStyle}
                  >
                    Retry item
                  </button>

                  <button
                    type="button"
                    onClick={() => removeItem(row)}
                    style={removeButtonStyle}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  )
}
