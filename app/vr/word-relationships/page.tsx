"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Header from "../../../components/Header"
import { supabase } from "../../../lib/supabaseClient"

const hoverCardStyle = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin"

type VRTestRow = {
  id: number
  title: string
  category: string | null
  difficulty: number | null
  access_level: string | null
  created_at: string
  is_free: boolean
}

type VRProgressRow = {
  id: string
  user_id: string
  test_id: number | null
  success_rate: number | null
  created_at: string | null
}

type TestWithProgress = VRTestRow & {
  score: number
  completed_at: string | null
  isCompleted: boolean
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
export default function VRWordRelationshipsPage() {
  const [tests, setTests] = useState<TestWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | 1 | 2 | 3>("all")
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState<UserPlan>("guest")

  useEffect(() => {
    loadTests()
  }, [])

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

  async function loadTests() {
    setLoading(true)

    const currentAccess = await loadCurrentUserAndPlan()
    setUserId(currentAccess.userId)
    setPlan(currentAccess.plan)

    const { data, error } = await supabase
      .from("vr_tests")
      .select("id, title, category, difficulty, access_level, created_at, is_free")
      .eq("category", "word-relationships")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading word relationships tests:", error)
      setTests([])
      setLoading(false)
      return
    }

    const allTests = (data || []) as VRTestRow[]

    if (!currentAccess.userId) {
      const testsWithoutProgress: TestWithProgress[] = allTests.map((test) => ({
        ...test,
        score: 0,
        completed_at: null,
        isCompleted: false,
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

    const { data: progressData, error: progressError } = await supabase
      .from("vr_progress")
      .select("id, user_id, test_id, success_rate, created_at")
      .eq("user_id", currentAccess.userId)
      .in("test_id", testIds)

    if (progressError) {
      console.error("Error loading VR progress:", progressError)

      const testsWithoutProgress: TestWithProgress[] = allTests.map((test) => ({
        ...test,
        score: 0,
        completed_at: null,
        isCompleted: false,
      }))

      setTests(sortFreeTestsFirst(testsWithoutProgress))
      setLoading(false)
      return
    }

    const progressRows = (progressData || []) as VRProgressRow[]
    const latestProgressMap = new Map<number, VRProgressRow>()

    for (const row of progressRows) {
      if (row.test_id === null) continue

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
      }
    })

    setTests(sortFreeTestsFirst(mergedTests))
    setLoading(false)
  }

  function getDifficultyLabel(level: number | null) {
    if (level === 1) return "Easy"
    if (level === 2) return "Medium"
    if (level === 3) return "Hard"
    return "Not set"
  }

  function getDifficultyBadgeStyle(level: number | null): React.CSSProperties {
    if (level === 1) return { backgroundColor: "#d1fae5", color: "#065f46" }
    if (level === 2) return { backgroundColor: "#fef3c7", color: "#92400e" }
    if (level === 3) return { backgroundColor: "#fee2e2", color: "#991b1b" }
    return { backgroundColor: "#e5e7eb", color: "#374151" }
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

  function getCompletedPercentage(items: TestWithProgress[]) {
    if (items.length === 0) return 0
    const completedCount = items.filter((item) => item.isCompleted).length
    return Math.round((completedCount / items.length) * 100)
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

  function getTestButton(test: TestWithProgress) {
    const href = `/vr/word-relationships/${test.id}`

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
        {test.isCompleted
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

  if (loading) {
    return (
      <>
        <Header />
        <p style={styles.message}>Loading word relationships tests...</p>
      </>
    )
  }

  return (
    <>
      <Header />
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.heroCard}>
            <h1 style={styles.title}>📝 Word Relationships</h1>
            <p style={styles.subtitle}>
              Practise synonyms, antonyms, analogies, and meaning connections for 11+ verbal reasoning.
            </p>

            <div style={styles.accessInfo}>
              {plan === "guest"
                ? "Guests can browse the tests. Sign in to start the free tests."
                : plan === "free"
                  ? "Free members can start tests marked as Free test."
                  : "Your membership unlocks all Word Relationships tests."}
            </div>

            <div style={styles.heroActions}>
              <Link href="/vr" style={styles.backLink}>
                ← Back to Verbal Reasoning
              </Link>
            </div>
          </div>

          {tests.length === 0 ? (
            <div style={styles.emptyCard}>
              <h2 style={styles.emptyTitle}>No tests available yet</h2>
              <p style={styles.emptyText}>
                Word Relationships tests will appear here when they are added.
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
                  <h2 style={styles.emptyTitle}>No tests in this difficulty</h2>
                  <p style={styles.emptyText}>Try another filter.</p>
                </div>
              ) : (
                <div style={styles.grid}>
                  {filteredTests.map((test) => (
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

                        <div style={styles.badgeStack}>
                          <span
                            style={{
                              ...styles.badge,
                              ...getDifficultyBadgeStyle(test.difficulty),
                            }}
                          >
                            {getDifficultyLabel(test.difficulty)}
                          </span>

                          <span
                            style={{
                              ...styles.accessBadge,
                              ...(test.is_free ? styles.freeBadge : styles.lockedBadge),
                            }}
                          >
                            {getTestAccessLabel(test)}
                          </span>
                        </div>
                      </div>

                      <p style={styles.preview}>
                        Strengthen verbal reasoning through synonyms, antonyms, analogies, and meaning connection questions.
                      </p>

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

                      {getTestButton(test)}
                    </div>
                  ))}
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
    maxWidth: "700px",
    marginInline: "auto",
  },
  accessInfo: {
    marginTop: "18px",
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: "999px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#374151",
    fontWeight: 600,
    fontSize: "14px",
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
  emptyTitle: {
    fontSize: "28px",
    marginBottom: "10px",
    color: "#111827",
  },
  emptyText: {
    fontSize: "16px",
    color: "#4b5563",
    lineHeight: 1.6,
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
    color: "#111827",
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
    border: "none",
    cursor: "pointer",
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
    border: "none",
    cursor: "pointer",
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
    color: "#374151",
  },
}