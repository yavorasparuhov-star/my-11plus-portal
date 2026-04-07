"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Header from "../../../components/Header"
import { supabase } from "../../../lib/supabaseClient"

const hoverCardStyle = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

type VRTestRow = {
  id: number
  title: string
  category: string | null
  difficulty: number | null
  created_at: string
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

export default function VRCodesLogicPage() {
  const router = useRouter()
  const [tests, setTests] = useState<TestWithProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTests()
  }, [])

  async function loadTests() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from("vr_tests")
      .select("*")
      .eq("category", "codes-logic")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading codes & logic tests:", error)
      setTests([])
      setLoading(false)
      return
    }

    const allTests = (data || []) as VRTestRow[]

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
      .from("vr_progress")
      .select("id, user_id, test_id, success_rate, created_at")
      .eq("user_id", user.id)
      .in("test_id", testIds)

    if (progressError) {
      console.error("Error loading VR progress:", progressError)

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

    setTests(mergedTests)
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

  if (loading) {
    return (
      <>
        <Header />
        <p style={styles.message}>Loading codes & logic tests...</p>
      </>
    )
  }

  return (
    <>
      <Header />
      <div style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Codes & Logic</h1>
          <p style={styles.subtitle}>
            Practise coded words, letter shifts, number-letter links, and logic-based
            verbal reasoning questions.
          </p>
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
              Codes & Logic tests will appear here when they are added.
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {tests.map((test) => (
              <div
                key={test.id}
                style={{ ...styles.card, ...hoverCardStyle }}
                onClick={() => router.push(`/vr/codes-logic/${test.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)"
                  e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
                }}
              >
                <div style={styles.icon}>🔐</div>
                <h2 style={styles.cardTitle}>{test.title}</h2>
                <p style={styles.cardText}>
                  Build logic skills with code-breaking, letter rules, and structured
                  reasoning patterns.
                </p>

                <div style={styles.infoBox}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Difficulty:</span>
                    <span
                      style={{
                        ...styles.badge,
                        ...getDifficultyBadgeStyle(test.difficulty),
                      }}
                    >
                      {getDifficultyLabel(test.difficulty)}
                    </span>
                  </div>

                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Score:</span>
                    <span style={styles.infoValue}>
                      {getScoreText(test)} {getScoreIcon(test.score, test.isCompleted)}
                    </span>
                  </div>

                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Completed:</span>
                    <span style={styles.infoValue}>
                      {test.completed_at
                        ? new Date(test.completed_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "Not yet"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/vr/codes-logic/${test.id}`)
                  }}
                  onMouseEnter={(e) => {
                    if (test.isCompleted) {
                      e.currentTarget.style.background = "#bbf7d0"
                    } else {
                      e.currentTarget.style.background = "#d1d5db"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (test.isCompleted) {
                      e.currentTarget.style.background = "#d4f5d0"
                    } else {
                      e.currentTarget.style.background = "#e5e7eb"
                    }
                  }}
                  style={test.isCompleted ? styles.startButton : styles.retryButton}
                >
                  {test.isCompleted ? "Retry Test" : "Start Test"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: { padding: "32px 20px 50px", maxWidth: "1100px", margin: "0 auto" },
  hero: { textAlign: "center", marginBottom: "32px" },
  title: { fontSize: "40px", marginBottom: "10px", color: "#111827" },
  subtitle: {
    fontSize: "18px",
    color: "#4b5563",
    maxWidth: "700px",
    margin: "0 auto",
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "26px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  icon: { fontSize: "42px", marginBottom: "12px" },
  cardTitle: { fontSize: "24px", marginBottom: "10px", color: "#111827" },
  cardText: {
    fontSize: "16px",
    color: "#4b5563",
    lineHeight: 1.6,
    marginBottom: "18px",
    minHeight: "78px",
  },
  infoBox: {
    width: "100%",
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "18px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    margin: "8px 0",
  },
  infoLabel: { color: "#374151", fontSize: "15px", fontWeight: 500 },
  infoValue: { fontSize: "15px", fontWeight: 700, color: "#111827" },
  badge: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: 700,
    minWidth: "92px",
    textAlign: "center",
  },
  startButton: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#d4f5d0",
    color: "#065f46",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "16px",
    minWidth: "180px",
  },
  retryButton: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#e5e7eb",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "16px",
    minWidth: "180px",
  },
  emptyCard: {
    background: "white",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    textAlign: "center",
    maxWidth: "700px",
    margin: "0 auto",
  },
  emptyTitle: { fontSize: "28px", marginBottom: "10px", color: "#111827" },
  emptyText: { fontSize: "16px", color: "#4b5563", lineHeight: 1.6 },
  message: {
    textAlign: "center",
    marginTop: "40px",
    fontSize: "18px",
    color: "#374151",
  },
}