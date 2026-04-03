"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabaseClient"

type NVRReviewRow = {
  id: string
  user_id: string
  question_id: number | null
  question_text: string
  knew_it: boolean | null
  difficulty: number | null
  created_at: string
  explanation?: string
}

type NVRQuestionRow = {
  id: number
  explanation: string | null
}

export default function NVRReviewPage() {
  const router = useRouter()
  const [reviewQuestions, setReviewQuestions] = useState<NVRReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | 1 | 2 | 3>("all")

  useEffect(() => {
    fetchReviewQuestions()
  }, [])

  async function fetchReviewQuestions() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("nvr_review")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading NVR review:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      setLoading(false)
      return
    }

    const reviewData = (data || []) as NVRReviewRow[]

    const questionIds = reviewData
      .map((row) => row.question_id)
      .filter((id): id is number => id !== null)

    let explanationMap = new Map<number, string>()

    if (questionIds.length > 0) {
      const { data: questionsData, error: questionsError } = await supabase
        .from("nvr_questions")
        .select("id, explanation")
        .in("id", questionIds)

      if (questionsError) {
        console.error("Error loading NVR explanations:", questionsError)
      } else {
        explanationMap = new Map(
          ((questionsData || []) as NVRQuestionRow[]).map((question) => [
            question.id,
            question.explanation || "",
          ])
        )
      }
    }

    const mergedData = reviewData.map((row) => ({
      ...row,
      explanation:
        row.question_id !== null ? explanationMap.get(row.question_id) || "" : "",
    }))

    setReviewQuestions(mergedData)
    setLoading(false)
  }

  async function removeQuestion(questionText: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { error } = await supabase
      .from("nvr_review")
      .delete()
      .eq("user_id", user.id)
      .ilike("question_text", questionText)

    if (error) {
      console.error("Error deleting NVR review question:", error)
      return
    }

    setReviewQuestions((prev) =>
      prev.filter((row) => row.question_text.toLowerCase() !== questionText.toLowerCase())
    )
  }

  function retryFilteredQuestions() {
    const reviewQuestionIds = filteredQuestions
      .map((row) => row.question_id)
      .filter((id): id is number => id !== null)

    if (reviewQuestionIds.length === 0) return

    localStorage.setItem("nvr_review_question_ids", JSON.stringify(reviewQuestionIds))
    router.push("/nvr-test?mode=review")
  }

  const uniqueQuestions = Array.from(
    new Map(reviewQuestions.map((item) => [item.question_text.toLowerCase(), item])).values()
  )

  const easyCount = uniqueQuestions.filter((q) => q.difficulty === 1).length
  const mediumCount = uniqueQuestions.filter((q) => q.difficulty === 2).length
  const hardCount = uniqueQuestions.filter((q) => q.difficulty === 3).length

  const filteredQuestions =
    difficultyFilter === "all"
      ? uniqueQuestions
      : uniqueQuestions.filter((q) => q.difficulty === difficultyFilter)

  if (loading) {
    return <p style={styles.message}>Loading NVR review...</p>
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>🔷 NVR Review</h1>
        <p style={styles.subtitle}>
          These are the non-verbal reasoning questions that need more practice.
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
              All ({uniqueQuestions.length})
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

          {filteredQuestions.length > 0 && (
            <div style={styles.retryRow}>
              <button onClick={retryFilteredQuestions} style={styles.actionButton}>
                Retry filtered questions
              </button>
            </div>
          )}
        </div>

        {uniqueQuestions.length === 0 ? (
          <div style={styles.emptyCard}>
            <h2>No NVR review questions yet</h2>
            <p>Complete an NVR test and any incorrect answers will appear here.</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div style={styles.emptyCard}>
            <h2>No questions in this difficulty</h2>
            <p>Try another filter.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredQuestions.map((row) => (
              <div key={row.id} style={styles.card}>
                <h2 style={styles.questionTitle}>Question</h2>

                <p style={styles.questionText}>{row.question_text}</p>

                <p style={styles.definition}>
                  <strong>Explanation:</strong>{" "}
                  {row.explanation && row.explanation.trim() !== ""
                    ? row.explanation
                    : "No explanation available."}
                </p>

                <p style={styles.meta}>
                  Added:{" "}
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

                <p style={styles.meta}>
                  Difficulty:{" "}
                  {row.difficulty === 1
                    ? "Easy"
                    : row.difficulty === 2
                    ? "Medium"
                    : row.difficulty === 3
                    ? "Hard"
                    : "Not set"}
                </p>

                <button
                  onClick={() => removeQuestion(row.question_text)}
                  style={styles.button}
                >
                  Remove from review
                </button>
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
  emptyCard: {
    background: "white",
    borderRadius: "16px",
    padding: "32px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },
  questionTitle: {
    marginTop: 0,
    marginBottom: "12px",
    fontSize: "22px",
  },
  questionText: {
    color: "#111827",
    marginBottom: "12px",
    lineHeight: 1.6,
    fontWeight: 500,
  },
  definition: {
    color: "#222",
    marginBottom: "12px",
    lineHeight: 1.5,
  },
  meta: {
    color: "#555",
    marginBottom: "10px",
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
  retryRow: {
    marginTop: "18px",
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
  message: {
    textAlign: "center",
    marginTop: "40px",
  },
}