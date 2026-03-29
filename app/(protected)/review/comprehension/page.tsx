"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabaseClient"

type ComprehensionReviewRow = {
  id: string
  user_id: string
  test_id: number | null
  question_id: number | null
  question_text: string
  user_answer: string
  correct_answer: string
  difficulty: number | null
  created_at: string
  test_title?: string
}

type ComprehensionTestRow = {
  id: number
  title: string
}

export default function ComprehensionReviewPage() {
 const router = useRouter()
  const [reviewRows, setReviewRows] = useState<ComprehensionReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | 1 | 2 | 3>("all")

  useEffect(() => {
    fetchReviewRows()
  }, [])

  async function fetchReviewRows() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("comprehension_review")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading comprehension review:", error)
      setLoading(false)
      return
    }

    const reviewData = (data || []) as ComprehensionReviewRow[]

    const testIds = Array.from(
      new Set(
        reviewData
          .map((row) => row.test_id)
          .filter((id): id is number => id !== null)
      )
    )

    let testMap = new Map<number, string>()

    if (testIds.length > 0) {
      const { data: testsData, error: testsError } = await supabase
        .from("comprehension_tests")
        .select("id, title")
        .in("id", testIds)

      if (testsError) {
        console.error("Error loading comprehension test titles:", testsError)
      } else {
        testMap = new Map(
          ((testsData || []) as ComprehensionTestRow[]).map((test) => [test.id, test.title])
        )
      }
    }

    const mergedData = reviewData.map((row) => ({
      ...row,
      test_title:
        row.test_id !== null ? testMap.get(row.test_id) || "Unknown test" : "Unknown test",
    }))

    setReviewRows(mergedData)
    setLoading(false)
  }

  async function removeReviewItem(id: string) {
    const { error } = await supabase
      .from("comprehension_review")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting comprehension review item:", error)
      return
    }

    setReviewRows((prev) => prev.filter((row) => row.id !== id))
  }

  const uniqueRows = useMemo(() => {
    return Array.from(
      new Map(
        reviewRows.map((item) => [
          `${item.test_id}-${item.question_id}-${item.question_text.trim().toLowerCase()}`,
          item,
        ])
      ).values()
    )
  }, [reviewRows])

  const easyCount = uniqueRows.filter((row) => row.difficulty === 1).length
  const mediumCount = uniqueRows.filter((row) => row.difficulty === 2).length
  const hardCount = uniqueRows.filter((row) => row.difficulty === 3).length

  const filteredRows =
    difficultyFilter === "all"
      ? uniqueRows
      : uniqueRows.filter((row) => row.difficulty === difficultyFilter)

  if (loading) {
    return <p style={styles.message}>Loading comprehension review...</p>
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>📚 Comprehension Review</h1>
        <p style={styles.subtitle}>
          Review questions answered incorrectly and remove them once they are mastered.
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
              All ({uniqueRows.length})
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
        </div>

        {uniqueRows.length === 0 ? (
          <div style={styles.emptyCard}>
            <h2>No comprehension review items yet</h2>
            <p>Any incorrect comprehension answers will appear here after a test.</p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div style={styles.emptyCard}>
            <h2>No questions in this difficulty</h2>
            <p>Try another filter.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {filteredRows.map((row) => (
              <div key={row.id} style={styles.card}>
                <h2 style={styles.cardTitle}>{row.test_title || "Unknown test"}</h2>

                <p style={styles.questionText}>
                  <strong>Question:</strong> {row.question_text}
                </p>

                <p style={styles.meta}>
                  <strong>Your answer:</strong> {row.user_answer || "No answer"}
                </p>

                <p style={styles.meta}>
                  <strong>Correct answer:</strong> {row.correct_answer}
                </p>

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
                  <strong>Added:</strong>{" "}
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

<div style={styles.buttonRow}>
  {row.test_id && (
    <button
      onClick={() => router.push(`/comprehension-test/${row.test_id}`)}
      style={styles.actionButton}
    >
      Retry this test
    </button>
  )}

  <button
    onClick={() => removeReviewItem(row.id)}
    style={styles.actionButton}
  >
    Remove from review
  </button>
</div>
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
    borderRadius: "16px",
    padding: "32px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  list: {
    display: "grid",
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
  questionText: {
    marginBottom: "14px",
    lineHeight: 1.6,
    color: "#222",
  },
  meta: {
    color: "#555",
    marginBottom: "10px",
    lineHeight: 1.5,
  },
  button: {
    marginTop: "10px",
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#4f46e5",
    color: "white",
    cursor: "pointer",
  },
  message: {
    textAlign: "center",
    marginTop: "40px",
  },
  buttonRow: {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "12px",
},
actionButton: {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "none",
  background: "#e5e7eb",
  color: "#111827",
  cursor: "pointer",
  fontWeight: 600,
},
}