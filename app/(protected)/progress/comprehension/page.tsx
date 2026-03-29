"use client"

import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"

type ComprehensionProgressRow = {
  id: string
  user_id: string
  test_id: number | null
  total_questions: number
  correct_answers: number
  success_rate: number
  created_at: string
  test_title?: string
  difficulty?: number | null
}

type ComprehensionTestRow = {
  id: number
  title: string
  difficulty: number | null
}

export default function ComprehensionProgressPage() {
  const [progressRows, setProgressRows] = useState<ComprehensionProgressRow[]>([])
  const [loading, setLoading] = useState(true)
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | 1 | 2 | 3>("all")

  useEffect(() => {
    fetchProgress()
  }, [])

  async function fetchProgress() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("comprehension_progress")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading comprehension progress:", error)
      setLoading(false)
      return
    }

    const progressData = (data || []) as ComprehensionProgressRow[]

    const testIds = Array.from(
      new Set(
        progressData
          .map((row) => row.test_id)
          .filter((id): id is number => id !== null)
      )
    )

    let testMap = new Map<number, ComprehensionTestRow>()

    if (testIds.length > 0) {
      const { data: testsData, error: testsError } = await supabase
        .from("comprehension_tests")
        .select("id, title, difficulty")
        .in("id", testIds)

      if (testsError) {
        console.error("Error loading comprehension test titles:", testsError)
      } else {
        testMap = new Map(
          ((testsData || []) as ComprehensionTestRow[]).map((test) => [test.id, test])
        )
      }
    }

    const merged = progressData.map((row) => ({
      ...row,
      test_title:
        row.test_id !== null ? testMap.get(row.test_id)?.title || "Unknown test" : "Unknown test",
      difficulty:
        row.test_id !== null ? testMap.get(row.test_id)?.difficulty ?? null : null,
    }))

    setProgressRows(merged)
    setLoading(false)
  }

  const filteredRows =
    difficultyFilter === "all"
      ? progressRows
      : progressRows.filter((row) => row.difficulty === difficultyFilter)

  const summary = useMemo(() => {
    const totalTests = filteredRows.length
    const totalQuestions = filteredRows.reduce((sum, row) => sum + (row.total_questions || 0), 0)
    const totalCorrect = filteredRows.reduce((sum, row) => sum + (row.correct_answers || 0), 0)
    const averageScore =
      totalTests > 0
        ? Math.round(
            filteredRows.reduce((sum, row) => sum + (row.success_rate || 0), 0) / totalTests
          )
        : 0

    return {
      totalTests,
      totalQuestions,
      totalCorrect,
      averageScore,
    }
  }, [filteredRows])

  const easyCount = progressRows.filter((row) => row.difficulty === 1).length
  const mediumCount = progressRows.filter((row) => row.difficulty === 2).length
  const hardCount = progressRows.filter((row) => row.difficulty === 3).length

  if (loading) {
    return <p style={styles.message}>Loading comprehension progress...</p>
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>📊 Comprehension Progress</h1>
        <p style={styles.subtitle}>
          Review all completed comprehension tests and track improvement over time.
        </p>

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
              All ({progressRows.length})
            </button>

            <button
              onClick={() => setDifficultyFilter(1)}
              style={{
                ...styles.filterButton,
                backgroundColor: difficultyFilter === 1 ? "#4f46e5" : "#e5e7eb",
                color: difficultyFilter === 1 ? "white" : "black",
              }}
            >
              Easy ({easyCount})
            </button>

            <button
              onClick={() => setDifficultyFilter(2)}
              style={{
                ...styles.filterButton,
                backgroundColor: difficultyFilter === 2 ? "#4f46e5" : "#e5e7eb",
                color: difficultyFilter === 2 ? "white" : "black",
              }}
            >
              Medium ({mediumCount})
            </button>

            <button
              onClick={() => setDifficultyFilter(3)}
              style={{
                ...styles.filterButton,
                backgroundColor: difficultyFilter === 3 ? "#4f46e5" : "#e5e7eb",
                color: difficultyFilter === 3 ? "white" : "black",
              }}
            >
              Hard ({hardCount})
            </button>
          </div>

          <div style={styles.summaryGrid}>
            <div style={styles.summaryBox}>
              <div style={styles.summaryNumber}>{summary.totalTests}</div>
              <div style={styles.summaryLabel}>Tests Completed</div>
            </div>

            <div style={styles.summaryBox}>
              <div style={styles.summaryNumber}>{summary.totalQuestions}</div>
              <div style={styles.summaryLabel}>Questions Answered</div>
            </div>

            <div style={styles.summaryBox}>
              <div style={styles.summaryNumber}>{summary.totalCorrect}</div>
              <div style={styles.summaryLabel}>Correct Answers</div>
            </div>

            <div style={styles.summaryBox}>
              <div style={styles.summaryNumber}>{summary.averageScore}%</div>
              <div style={styles.summaryLabel}>Average Score</div>
            </div>
          </div>
        </div>

        {progressRows.length === 0 ? (
          <div style={styles.emptyCard}>
            <h2>No comprehension progress yet</h2>
            <p>Complete a comprehension test and your results will appear here.</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div style={styles.emptyCard}>
            <h2>No tests in this difficulty</h2>
            <p>Try another filter.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredRows.map((row) => (
              <div key={row.id} style={styles.card}>
                <h2 style={styles.cardTitle}>{row.test_title || "Unknown test"}</h2>

                <p style={styles.meta}>
                  <strong>Difficulty:</strong>{" "}
                  {row.difficulty === 1
                    ? "Easy"
                    : row.difficulty === 2
                    ? "Medium"
                    : row.difficulty === 3
                    ? "Hard"
                    : "Not set"}
                </p>

                <p style={styles.meta}>
                  <strong>Score:</strong> {row.correct_answers} / {row.total_questions}
                </p>

                <p style={styles.meta}>
                  <strong>Success rate:</strong> {Math.round(row.success_rate || 0)}%
                </p>

                <p style={styles.meta}>
                  <strong>Completed:</strong>{" "}
                  {new Date(row.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  {new Date(row.created_at).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    padding: "24px",
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  title: {
    fontSize: "32px",
    marginBottom: "8px",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: "#555",
    marginBottom: "24px",
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
    marginBottom: "20px",
  },
  filterButton: {
    padding: "8px 14px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },
  summaryBox: {
    background: "#f8fafc",
    borderRadius: "14px",
    padding: "18px",
    textAlign: "center",
  },
  summaryNumber: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#4f46e5",
    marginBottom: "6px",
  },
  summaryLabel: {
    color: "#555",
    fontSize: "14px",
  },
  emptyCard: {
    background: "white",
    borderRadius: "16px",
    padding: "32px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: "14px",
    fontSize: "22px",
  },
  meta: {
    color: "#555",
    marginBottom: "10px",
    lineHeight: 1.5,
  },
  message: {
    textAlign: "center",
    marginTop: "40px",
  },
}