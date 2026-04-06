"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Header from "../../../components/Header"
import { supabase } from "../../../lib/supabaseClient"

type MathTest = {
  id: number
  title: string
  category: string
  difficulty: number | null
  access_level: string
  created_at: string
}

type MathProgress = {
  id: string
  user_id: string
  test_id: number | null
  success_rate: number | null
  created_at: string | null
}

type TestWithProgress = MathTest & {
  score: number
  completed_at: string | null
  isCompleted: boolean
}

export default function ShapeAndSpacePage() {
  const [tests, setTests] = useState<TestWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | 1 | 2 | 3>("all")

  useEffect(() => {
    fetchTests()
  }, [])

  async function fetchTests() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: testsData, error: testsError } = await supabase
      .from("math_tests")
      .select("*")
      .eq("category", "shape_space")
      .order("created_at", { ascending: false })

    if (testsError) {
      console.error("Error loading shape and space tests:", testsError)
      setLoading(false)
      return
    }

    const allTests = (testsData || []) as MathTest[]

    if (!user) {
      const testsWithoutProgress: TestWithProgress[] = allTests.map((test) => ({
        ...test,
        score: 0,
        completed_at: null,
        isCompleted: false,
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
      .from("math_progress")
      .select("id, user_id, test_id, success_rate, created_at")
      .eq("user_id", user.id)
      .in("test_id", testIds)

    if (progressError) {
      console.error("Error loading math progress:", progressError)

      const testsWithoutProgress: TestWithProgress[] = allTests.map((test) => ({
        ...test,
        score: 0,
        completed_at: null,
        isCompleted: false,
      }))

      setTests(testsWithoutProgress)
      setLoading(false)
      return
    }

    const progressRows = (progressData || []) as MathProgress[]
    const latestProgressMap = new Map<number, MathProgress>()

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
        <p style={styles.message}>Loading Shape & Space tests...</p>
      </>
    )
  }

  return (
    <>
      <Header />
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.heroCard}>
            <h1 style={styles.title}>📐 Shape & Space Tests</h1>
            <p style={styles.subtitle}>
              Choose a Shape & Space test and answer 10 multiple-choice questions.
            </p>
            <div style={styles.heroActions}>
              <Link href="/math" style={styles.backLink}>
                ← Back to Math
              </Link>
            </div>
          </div>

          {tests.length === 0 ? (
            <div style={styles.emptyCard}>
              <h2>No Shape & Space tests yet</h2>
              <p>Add tests in Supabase and they will appear here.</p>
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
                  {filteredTests.map((test) => (
                    <div key={test.id} style={styles.card}>
                      <div style={styles.cardTop}>
                        <h2 style={styles.cardTitle}>{test.title}</h2>
                        <span style={styles.badge}>
                          {getDifficultyLabel(test.difficulty)}
                        </span>
                      </div>

                      <p style={styles.preview}>
                        Practise angles, shapes, symmetry, coordinates, nets,
                        transformations, and spatial reasoning in this test.
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

                      <Link
                        href={`/math/shape-space/${test.id}`}
                        style={test.isCompleted ? styles.retryButton : styles.startButton}
                      >
                        {test.isCompleted ? "Retry Test →" : "Start Test →"}
                      </Link>
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