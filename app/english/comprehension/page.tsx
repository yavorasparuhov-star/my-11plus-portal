"use client"

import type { CSSProperties, MouseEvent } from "react"
import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import Header from "../../../components/Header"
import { supabase } from "../../../lib/supabaseClient"

type DifficultyFilter = "all" | 1 | 2 | 3

const restShadow = "0 10px 30px rgba(0,0,0,0.08)"
const hoverShadow = "0 20px 40px rgba(0,0,0,0.12)"

const hoverCardStyle = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin"

type EnglishComprehensionTest = {
  id: number
  title: string
  passage: string | null
  difficulty: number | null
  created_at: string
  is_free: boolean
}

type EnglishComprehensionQuestion = {
  id: number
  test_id: number
}

type LatestTestResult = {
  id: number
  user_id: string
  subject: string
  category: string
  subcategory: string
  subcategory_two: string
  subcategory_three: string
  test_id: number
  test_title: string
  total_questions: number
  correct_answers: number
  success_rate: number
  difficulty: number | null
  completed_at: string | null
  updated_at: string | null
}

type TestWithProgress = EnglishComprehensionTest & {
  score: number
  completed_at: string | null
  isCompleted: boolean
  reviewQuestionIds?: number[]
}

function hasFullAccess(plan: UserPlan) {
  return plan === "monthly" || plan === "annual" || plan === "admin"
}

function sortFreeTestsFirst(items: TestWithProgress[]) {
  return [...items].sort((a, b) => {
    if (a.is_free && !b.is_free) return -1
    if (!a.is_free && b.is_free) return 1

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export default function ComprehensionTestsPage() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <p style={styles.message}>Loading comprehension tests...</p>
        </>
      }
    >
      <ComprehensionTestsContent />
    </Suspense>
  )
}

function ComprehensionTestsContent() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")

  const [tests, setTests] = useState<TestWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all")
  const [reviewIds, setReviewIds] = useState<number[]>([])
  const [plan, setPlan] = useState<UserPlan>("guest")

  useEffect(() => {
    async function loadReviewIds() {
      if (mode !== "review") {
        setReviewIds([])
        return
      }

      const raw = localStorage.getItem("comprehension_review_ids")

      if (!raw) {
        setReviewIds([])
        return
      }

      try {
        const parsed = JSON.parse(raw)

        if (!Array.isArray(parsed)) {
          setReviewIds([])
          return
        }

        const rawIds = parsed.filter((id) => typeof id === "number") as number[]

        if (rawIds.length === 0) {
          setReviewIds([])
          return
        }

        const { data: directRows, error: directRowsError } = await supabase
          .from("english_questions")
          .select("id")
          .in("id", rawIds)
          .eq("main_category", "comprehension")
          .eq("subcategory", "comprehension")

        if (directRowsError) {
          console.error("Error loading comprehension review IDs:", directRowsError)
          setReviewIds([])
          return
        }

        const directIds = (directRows ?? []).map((row) => row.id)

        setReviewIds(Array.from(new Set(directIds)))
      } catch {
        setReviewIds([])
      }
    }

    loadReviewIds()
  }, [mode])

  useEffect(() => {
    fetchTests()
  }, [mode, reviewIds.join(",")])

  async function loadCurrentUserAndPlan() {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error getting auth session:", sessionError)
    }

    const sessionUser = session?.user ?? null

    if (!sessionUser) {
      return {
        userId: null,
        plan: "guest" as UserPlan,
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", sessionUser.id)
      .maybeSingle()

    if (profileError) {
      console.error("Error loading profile plan:", profileError)
    }

    const dbPlan = profile?.plan

    const safePlan: UserPlan =
      dbPlan === "monthly" ||
      dbPlan === "annual" ||
      dbPlan === "admin" ||
      dbPlan === "free"
        ? dbPlan
        : "free"

    return {
      userId: sessionUser.id,
      plan: safePlan,
    }
  }

  async function fetchTests() {
    setLoading(true)

    const currentAccess = await loadCurrentUserAndPlan()
    setPlan(currentAccess.plan)

    const { data: testsData, error: testsError } = await supabase
      .from("english_tests")
      .select("id, title, passage, difficulty, created_at, is_free")
      .eq("main_category", "comprehension")
      .eq("subcategory", "comprehension")
      .order("created_at", { ascending: false })

    if (testsError) {
      console.error("Error loading comprehension tests:", testsError)
      setLoading(false)
      return
    }

    let allTests = (testsData || []) as EnglishComprehensionTest[]
    let reviewQuestionMap = new Map<number, number[]>()

    if (mode === "review") {
      if (reviewIds.length === 0) {
        setTests([])
        setLoading(false)
        return
      }

      const { data: reviewQuestionsData, error: reviewQuestionsError } =
        await supabase
          .from("english_questions")
          .select("id, test_id")
          .eq("main_category", "comprehension")
          .eq("subcategory", "comprehension")
          .in("id", reviewIds)

      if (reviewQuestionsError) {
        console.error(
          "Error loading comprehension review questions:",
          reviewQuestionsError
        )
        setLoading(false)
        return
      }

      const reviewQuestions =
        (reviewQuestionsData || []) as EnglishComprehensionQuestion[]

      reviewQuestionMap = reviewQuestions.reduce((map, row) => {
        const existing = map.get(row.test_id) || []
        existing.push(row.id)
        map.set(row.test_id, existing)
        return map
      }, new Map<number, number[]>())

      const reviewTestIds = Array.from(reviewQuestionMap.keys())
      allTests = allTests.filter((test) => reviewTestIds.includes(test.id))
    }

    if (!currentAccess.userId) {
      const testsWithoutProgress: TestWithProgress[] = allTests.map((test) => ({
        ...test,
        score: 0,
        completed_at: null,
        isCompleted: false,
        reviewQuestionIds: reviewQuestionMap.get(test.id) || [],
      }))

      setTests(sortFreeTestsFirst(testsWithoutProgress))
      setLoading(false)
      return
    }

    const testIds = allTests.map((test) => test.id)

    if (testIds.length === 0) {
      setTests([])
      setLoading(false)
      return
    }

    const { data: resultData, error: resultError } = await supabase
      .from("latest_test_results")
      .select(
        "id, user_id, subject, category, subcategory, subcategory_two, subcategory_three, test_id, test_title, total_questions, correct_answers, success_rate, difficulty, completed_at, updated_at"
      )
      .eq("user_id", currentAccess.userId)
      .eq("subject", "english")
      .eq("category", "comprehension")
      .eq("subcategory", "")
      .eq("subcategory_two", "")
      .eq("subcategory_three", "")
      .in("test_id", testIds)

    if (resultError) {
      console.error("Error loading latest comprehension test results:", resultError)

      const testsWithoutProgress: TestWithProgress[] = allTests.map((test) => ({
        ...test,
        score: 0,
        completed_at: null,
        isCompleted: false,
        reviewQuestionIds: reviewQuestionMap.get(test.id) || [],
      }))

      setTests(sortFreeTestsFirst(testsWithoutProgress))
      setLoading(false)
      return
    }

    const resultRows = (resultData || []) as LatestTestResult[]
    const latestResultMap = new Map<number, LatestTestResult>()

    for (const row of resultRows) {
      latestResultMap.set(row.test_id, row)
    }

    const mergedTests: TestWithProgress[] = allTests.map((test) => {
      const result = latestResultMap.get(test.id)

      return {
        ...test,
        score: result?.success_rate ?? 0,
        completed_at: result?.completed_at || null,
        isCompleted: !!result,
        reviewQuestionIds: reviewQuestionMap.get(test.id) || [],
      }
    })

    setTests(sortFreeTestsFirst(mergedTests))
    setLoading(false)
  }

  function getDifficultyLabel(difficulty: number | null) {
    if (difficulty === 1) return "Easy"
    if (difficulty === 2) return "Medium"
    if (difficulty === 3) return "Hard"
    return "Not set"
  }

  function getPreviewText(passage: string | null) {
    const safePassage = passage ?? ""
    if (safePassage.length <= 180) return safePassage || "No passage available."
    return safePassage.slice(0, 180).trim() + "..."
  }

  function getCompletedPercentage(items: TestWithProgress[]) {
    if (items.length === 0) return 0
    const completedCount = items.filter((item) => item.isCompleted).length
    return Math.round((completedCount / items.length) * 100)
  }

  function getScorePercentage(score: number, isCompleted: boolean) {
    if (!isCompleted) return 0
    return Math.max(0, Math.min(100, Math.round(score)))
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

  function getCompletedDateContent(test: TestWithProgress) {
    if (!test.completed_at) {
      return "Not yet"
    }

    const completedDate = new Date(test.completed_at).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })

    return (
      <Link
        href={`/results/english/comprehension/${test.id}`}
        style={styles.completedResultLink}
        title="View full test result"
      >
        {completedDate}
      </Link>
    )
  }

  function canStartTest(test: TestWithProgress) {
    if (hasFullAccess(plan)) return true
    if (plan === "free" && test.is_free) return true
    return false
  }

  function getTestAccessLabel(test: TestWithProgress) {
    if (hasFullAccess(plan)) return "Full access"
    if (test.is_free) return "Free test"
    return "Members only"
  }

  function getTestButton(test: TestWithProgress, href: string) {
    if (plan === "guest") {
      return (
        <Link href="/login" style={styles.signInButton}>
          Sign in to start →
        </Link>
      )
    }

    if (!canStartTest(test)) {
      return (
        <Link href="/profile" style={styles.upgradeButton}>
          Upgrade to unlock →
        </Link>
      )
    }

    return (
      <Link
        href={href}
        style={test.isCompleted ? styles.startButton : styles.retryButton}
      >
        {mode === "review"
          ? "Open Review →"
          : test.isCompleted
            ? "Retry Test →"
            : test.is_free && plan === "free"
              ? "Start Free Test →"
              : "Start Test →"}
      </Link>
    )
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

  function getFilterButtonStyle(value: DifficultyFilter): CSSProperties {
    const selected = difficultyFilter === value

    return {
      ...styles.filterButton,
      backgroundColor: selected ? "#4f46e5" : "#e5e7eb",
      color: selected ? "white" : "black",
    }
  }

  function liftCard(event: MouseEvent<HTMLDivElement>) {
    event.currentTarget.style.transform = "translateY(-6px)"
    event.currentTarget.style.boxShadow = hoverShadow
  }

  function settleCard(event: MouseEvent<HTMLDivElement>) {
    event.currentTarget.style.transform = "translateY(0)"
    event.currentTarget.style.boxShadow = restShadow
  }

  if (loading) {
    return (
      <>
        <Header />
        <p style={styles.message}>
          {mode === "review"
            ? "Loading comprehension review..."
            : "Loading comprehension tests..."}
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
              {mode === "review" ? "📖 Comprehension Review" : "📖 Comprehension Tests"}
            </h1>
          </div>

          {tests.length === 0 ? (
            <div style={styles.emptyCard}>
              <h2>
                {mode === "review"
                  ? "No comprehension review items found"
                  : "No comprehension tests yet"}
              </h2>

              <p>
                {mode === "review"
                  ? "Try another category or make a few mistakes first so they can appear here for revision."
                  : "Add a test in Supabase and it will appear here."}
              </p>
            </div>
          ) : (
            <>
              <div style={styles.summaryCard}>
                <div style={styles.filterRow}>
                  <button
                    onClick={() => setDifficultyFilter("all")}
                    style={getFilterButtonStyle("all")}
                  >
                    All ({allCompletedPercent}% Completed)
                  </button>

                  <button
                    onClick={() => setDifficultyFilter(1)}
                    style={getFilterButtonStyle(1)}
                  >
                    Easy ({easyCompletedPercent}% Completed)
                  </button>

                  <button
                    onClick={() => setDifficultyFilter(2)}
                    style={getFilterButtonStyle(2)}
                  >
                    Medium ({mediumCompletedPercent}% Completed)
                  </button>

                  <button
                    onClick={() => setDifficultyFilter(3)}
                    style={getFilterButtonStyle(3)}
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
                        ? `/english/comprehension/${test.id}?mode=review`
                        : `/english/comprehension/${test.id}`

                    return (
                      <div
                        key={test.id}
                        style={{ ...styles.card, ...hoverCardStyle }}
                        onMouseEnter={liftCard}
                        onMouseLeave={settleCard}
                      >
                        <div style={styles.cardTop}>
                          <h2 style={styles.cardTitle}>{test.title}</h2>

                          <div style={styles.badgeStack}>
                            <span style={styles.badge}>
                              {getDifficultyLabel(test.difficulty)}
                            </span>

                            <span
                              style={{
                                ...styles.accessBadge,
                                ...(test.is_free
                                  ? styles.freeBadge
                                  : styles.lockedBadge),
                              }}
                            >
                              {getTestAccessLabel(test)}
                            </span>
                          </div>
                        </div>

                        <p style={styles.preview}>{getPreviewText(test.passage)}</p>

                        {mode === "review" && (
                          <p style={styles.metaHalf}>
                            <strong>Review items in this test:</strong>{" "}
                            {test.reviewQuestionIds?.length || 0}
                          </p>
                        )}

                        <div style={styles.metaRow}>
                          <p style={styles.metaHalf}>
                            <strong>Completed:</strong>{" "}
                            {getCompletedDateContent(test)}
                          </p>

                          <p style={styles.metaHalf}>
                            <strong>Score:</strong> {getScoreText(test)}{" "}
                            <span style={styles.scoreIcon}>
                              {getScoreIcon(test.score, test.isCompleted)}
                            </span>
                          </p>
                        </div>

                        {getTestButton(test, href)}
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

const styles: { [key: string]: CSSProperties } = {
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

  scoreIcon: {
    marginLeft: "6px",
    fontSize: "16px",
  },

  title: {
    fontSize: "36px",
    margin: "0 0 8px 0",
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

  badgeStack: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "flex-end",
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

  accessBadge: {
    padding: "7px 10px",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "12px",
    whiteSpace: "nowrap",
  },

  freeBadge: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
  },

  lockedBadge: {
    background: "#fff7ed",
    color: "#9a3412",
    border: "1px solid #fed7aa",
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

  completedResultLink: {
    color: "#3730a3",
    fontWeight: 700,
    textDecoration: "underline",
    textUnderlineOffset: "3px",
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

  signInButton: {
    display: "inline-block",
    padding: "12px 18px",
    borderRadius: "12px",
    background: "#eef2ff",
    color: "#3730a3",
    textDecoration: "none",
    fontWeight: 700,
    textAlign: "center",
    border: "1px solid #c7d2fe",
  },

  upgradeButton: {
    display: "inline-block",
    padding: "12px 18px",
    borderRadius: "12px",
    background: "#fff7ed",
    color: "#9a3412",
    textDecoration: "none",
    fontWeight: 700,
    textAlign: "center",
    border: "1px solid #fed7aa",
  },

  message: {
    textAlign: "center",
    marginTop: "40px",
    fontSize: "18px",
  },
}
