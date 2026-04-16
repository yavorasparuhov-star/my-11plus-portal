"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import Header from "../../../../components/Header"
import { supabase } from "../../../../lib/supabaseClient"

const MAIN_CATEGORY = "punctuation"
const SUBCATEGORY = "comma"
const REVIEW_STORAGE_KEY = "comma_review_ids"

const hoverCardStyle = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

type EnglishTest = {
  id: number
  title: string
  description: string | null
  difficulty: number | null
  created_at: string
}

type EnglishQuestion = {
  id: number
  test_id: number
}

type EnglishProgress = {
  id: number
  user_id: string
  test_id: number
  success_rate: number | null
  created_at: string | null
}

type TestWithProgress = EnglishTest & {
  score: number
  completed_at: string | null
  isCompleted: boolean
  reviewQuestionIds?: number[]
}

export default function CommaPage() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")

  const [tests, setTests] = useState<TestWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | 1 | 2 | 3>("all")
  const [reviewIds, setReviewIds] = useState<number[]>([])

  useEffect(() => {
    if (mode !== "review") {
      setReviewIds([])
      return
    }

    const raw = localStorage.getItem(REVIEW_STORAGE_KEY)
    if (!raw) {
      setReviewIds([])
      return
    }

    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setReviewIds(parsed.filter((id) => typeof id === "number"))
      } else {
        setReviewIds([])
      }
    } catch {
      setReviewIds([])
    }
  }, [mode])

  useEffect(() => {
    fetchTests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, reviewIds.join(",")])

  async function fetchTests() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: testsData, error: testsError } = await supabase
      .from("english_tests")
      .select("id, title, description, difficulty, created_at")
      .eq("main_category", MAIN_CATEGORY)
      .eq("subcategory", SUBCATEGORY)
      .order("created_at", { ascending: false })

    if (testsError) {
      console.error("Error loading comma tests:", testsError)
      setLoading(false)
      return
    }

    let allTests = (testsData || []) as EnglishTest[]
    let reviewQuestionMap = new Map<number, number[]>()

    if (mode === "review") {
      if (reviewIds.length === 0) {
        setTests([])
        setLoading(false)
        return
      }

      const { data: reviewQuestionsData, error: reviewQuestionsError } = await supabase
        .from("english_questions")
        .select("id, test_id")
        .eq("main_category", MAIN_CATEGORY)
        .eq("subcategory", SUBCATEGORY)
        .in("id", reviewIds)

      if (reviewQuestionsError) {
        console.error("Error loading comma review questions:", reviewQuestionsError)
        setLoading(false)
        return
      }

      const reviewQuestions = (reviewQuestionsData || []) as EnglishQuestion[]

      reviewQuestionMap = reviewQuestions.reduce((map, row) => {
        const existing = map.get(row.test_id) || []
        existing.push(row.id)
        map.set(row.test_id, existing)
        return map
      }, new Map<number, number[]>())

      const reviewTestIds = Array.from(reviewQuestionMap.keys())
      allTests = allTests.filter((test) => reviewTestIds.includes(test.id))
    }

    if (!user) {
      const testsWithoutProgress: TestWithProgress[] = allTests.map((test) => ({
        ...test,
        score: 0,
        completed_at: null,
        isCompleted: false,
        reviewQuestionIds: reviewQuestionMap.get(test.id) || [],
      }))

      setTests(testsWithoutProgress)
      setLoading(false)
      return
    }

    const testIds = allTests.map((test) => test.id)

    if (testIds.length === 0) {
      setTests([])
      setLoading(false)
      return
    }

    const { data: progressData, error: progressError } = await supabase
      .from("english_progress")
      .select("id, user_id, test_id, success_rate, created_at")
      .eq("user_id", user.id)
      .eq("main_category", MAIN_CATEGORY)
      .eq("subcategory", SUBCATEGORY)
      .in("test_id", testIds)

    if (progressError) {
      console.error("Error loading comma progress:", progressError)

      const testsWithoutProgress: TestWithProgress[] = allTests.map((test) => ({
        ...test,
        score: 0,
        completed_at: null,
        isCompleted: false,
        reviewQuestionIds: reviewQuestionMap.get(test.id) || [],
      }))

      setTests(testsWithoutProgress)
      setLoading(false)
      return
    }

    const progressRows = (progressData || []) as EnglishProgress[]
    const latestProgressMap = new Map<number, EnglishProgress>()

    for (const row of progressRows) {
      const existing = latestProgressMap.get(row.test_id)
      const rowDate = new Date(row.created_at || 0).getTime()
      const existingDate = existing ? new Date(existing.created_at || 0).getTime() : 0

      if (!existing || rowDate > existingDate) {
        latestProgressMap.set(row.test_id, row)
      }
    }

    const mergedTests: TestWithProgress[] = allTests.map((test) => {
      const progress = latestProgressMap.get(test.id)

      return {
        ...test,
        score: progress?.success_rate ?? 0,
        completed_at: progress?.created_at || null,
        isCompleted: !!progress,
        reviewQuestionIds: reviewQuestionMap.get(test.id) || [],
      }
    })

    setTests(mergedTests)
    setLoading(false)
  }

  function getDifficultyLabel(difficulty: number | null) {
    if (difficulty === 1) return "Easy"
    if (difficulty === 2) return "Medium"
    if (difficulty === 3) return "Hard"
    return "Not set"
  }

  function getCompletedPercentage(items: TestWithProgress[]) {
    if (items.length === 0) return 0
    const completedCount = items.filter((item) => item.isCompleted).length
    return Math.round((completedCount / items.length) * 100)
  }

  function getScorePercentage(score: number, isCompleted: boolean) {
    if (!isCompleted) return 0
    return score <= 10 ? score * 10 : score
  }

  function getScoreText(test: TestWithProgress) {
    return `${getScorePercentage(test.score, test.isCompleted)}%`
  }

  function getScoreIcon(score: number, isCompleted: boolean) {
    const percentage = getScorePercentage(score, isCompleted)

    if (!isCompleted) return "⚪"
    if (percentage >= 90) return "😄"
    if (percentage >= 70) return "🙂"
    if (percentage >= 50) return "😐"
    if (percentage >= 30) return "😕"
    return "☹️"
  }

  const easyTests = tests.filter((test) => test.difficulty === 1)
  const mediumTests = tests.filter((test) => test.difficulty === 2)
  const hardTests = tests.filter((test) => test.difficulty === 3)

  const allCompletedPercent = getCompletedPercentage(tests)
  const easyCompletedPercent = getCompletedPercentage(easyTests)
  const mediumCompletedPercent = getCompletedPercentage(mediumTests)
  const hardCompletedPercent = getCompletedPercentage(hardTests)

  const filteredTests =
    difficultyFilter === "all"
      ? tests
      : tests.filter((test) => test.difficulty === difficultyFilter)

  if (loading) {
    return (
      <>
        <Header />
        <p style={styles.message}>
          {mode === "review" ? "Loading Comma review..." : "Loading Comma tests..."}
        </p>
      </>
    )
  }

  return (
    <>
      <Header />
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.heroCard}>
            <h1 style={styles.title}>
              {mode === "review" ? "🔹 Comma Review" : "🔹 Comma Tests"}
            </h1>
            <p style={styles.subtitle}>
              {mode === "review"
                ? "Revise your saved punctuation mistakes and strengthen comma skills."
                : "Choose a Comma test and answer 10 multiple-choice questions."}
            </p>
            <div style={styles.heroActions}>
              <Link href="/english/punctuation" style={styles.backLink}>
                ← Back to Punctuation
              </Link>
            </div>
          </div>

          {tests.length === 0 ? (
            <div style={styles.emptyCard}>
              <h2>{mode === "review" ? "No Comma review items found" : "No Comma tests yet"}</h2>
              <p>
                {mode === "review"
                  ? "Try another category or make a few mistakes first so they can appear here for revision."
                  : "Add tests in Supabase and they will appear here."}
              </p>
            </div>
          ) : (
            <>
              <div style={styles.summaryCard}>
                <div style={styles.filterRow}>
                  <button
                    onClick={() => setDifficultyFilter("all")}
                    style={{
                      ...styles.filterButton,
                      backgroundColor: difficultyFilter === "all" ? "#4f46e5" : "#e5e7eb",
                      color: difficultyFilter === "all" ? "white" : "black",
                    }}
                  >
                    All ({allCompletedPercent}% Completed)
                  </button>

                  <button
                    onClick={() => setDifficultyFilter(1)}
                    style={{
                      ...styles.filterButton,
                      backgroundColor: difficultyFilter === 1 ? "#4f46e5" : "#e5e7eb",
                      color: difficultyFilter === 1 ? "white" : "black",
                    }}
                  >
                    Easy ({easyCompletedPercent}% Completed)
                  </button>

                  <button
                    onClick={() => setDifficultyFilter(2)}
                    style={{
                      ...styles.filterButton,
                      backgroundColor: difficultyFilter === 2 ? "#4f46e5" : "#e5e7eb",
                      color: difficultyFilter === 2 ? "white" : "black",
                    }}
                  >
                    Medium ({mediumCompletedPercent}% Completed)
                  </button>

                  <button
                    onClick={() => setDifficultyFilter(3)}
                    style={{
                      ...styles.filterButton,
                      backgroundColor: difficultyFilter === 3 ? "#4f46e5" : "#e5e7eb",
                      color: difficultyFilter === 3 ? "white" : "black",
                    }}
                  >
                    Hard ({hardCompletedPercent}% Completed)
                  </button>
                </div>
              </div>

              {filteredTests.length === 0 ? (
                <div style={styles.emptyCard}>
                  <h2>No tests in this difficulty</h2>
                  <p>Try another filter.</p>
                </div>
              ) : (
                <div style={styles.grid}>
                  {filteredTests.map((test) => {
                    const href =
                      mode === "review"
                        ? `/english/punctuation/comma/${test.id}?mode=review`
                        : `/english/punctuation/comma/${test.id}`

                    return (
                      <div
                        key={test.id}
                        style={{ ...styles.card, ...hoverCardStyle }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-6px)"
                          e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)"
                          e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.08)"
                        }}
                      >
                        <div style={styles.cardTop}>
                          <h2 style={styles.cardTitle}>{test.title}</h2>
                          <span style={styles.badge}>{getDifficultyLabel(test.difficulty)}</span>
                        </div>

                        <p style={styles.preview}>
                          {test.description?.trim()
                            ? test.description
                            : "Practise commas in lists, clauses, fronted adverbials, direct speech, and sentence structure in this test."}
                        </p>

                        {mode === "review" && (
                          <p style={styles.metaHalf}>
                            <strong>Review items in this test:</strong>{" "}
                            {test.reviewQuestionIds?.length || 0}
                          </p>
                        )}

                        <div style={styles.metaRow}>
                          <p style={styles.metaHalf}>
                            <strong>Completed:</strong>{" "}
                            {test.completed_at
                              ? new Date(test.completed_at).toLocaleDateString("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Not yet"}
                          </p>

                          <p style={styles.metaHalf}>
                            <strong>Score:</strong> {getScoreText(test)}{" "}
                            <span style={styles.scoreIcon}>
                              {getScoreIcon(test.score, test.isCompleted)}
                            </span>
                          </p>
                        </div>

                        <Link
                          href={href}
                          style={test.isCompleted ? styles.startButton : styles.retryButton}
                        >
                          {mode === "review"
                            ? "Open Review →"
                            : test.isCompleted
                              ? "Retry Test →"
                              : "Start Test →"}
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    padding: "24px",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  heroCard: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    marginBottom: "24px",
    textAlign: "center",
  },
  title: {
    fontSize: "36px",
    margin: "0 0 8px 0",
  },
  subtitle: {
    margin: 0,
    color: "#555",
    lineHeight: 1.6,
  },
  heroActions: {
    marginTop: "16px",
  },
  backLink: {
    display: "inline-block",
    textDecoration: "none",
    color: "#3730a3",
    fontWeight: 600,
  },
  summaryCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    marginBottom: "24px",
  },
  filterRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  filterButton: {
    padding: "8px 14px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  emptyCard: {
    background: "white",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.3,
  },
  badge: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 600,
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  preview: {
    margin: 0,
    color: "#374151",
    lineHeight: 1.6,
    flexGrow: 1,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  metaHalf: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
  },
  scoreIcon: {
    marginLeft: "6px",
    fontSize: "16px",
  },
  startButton: {
    display: "inline-block",
    padding: "12px 18px",
    borderRadius: "12px",
    background: "#d4f5d0",
    color: "#065f46",
    textDecoration: "none",
    fontWeight: 600,
    textAlign: "center",
  },
  retryButton: {
    display: "inline-block",
    padding: "12px 18px",
    borderRadius: "12px",
    background: "#e5e7eb",
    color: "#111827",
    textDecoration: "none",
    fontWeight: 600,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    marginTop: "40px",
    fontSize: "18px",
  },
}