"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import Header from "../../../../../components/Header"
import { supabase } from "../../../../../lib/supabaseClient"

type AnswerOption = "A" | "B" | "C" | "D"

type SavedQuestionReview = {
  question_id: number
  question_order: number
  question_text: string
  question_image_url?: string | null
  options: Record<AnswerOption, string>
  option_images?: Partial<Record<AnswerOption, string | null>>
  user_answer: AnswerOption | null
  correct_answer: AnswerOption
  user_answer_text: string | null
  correct_answer_text: string
  user_answer_image_url?: string | null
  correct_answer_image_url?: string | null
  is_correct: boolean
  explanation: string | null
  explanation_image_url?: string | null
  difficulty: number | null
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
  answers: SavedQuestionReview[]
  completed_at: string | null
  updated_at: string | null
}

function getSubjectLabel(subject: string) {
  if (subject === "math") return "Maths"
  if (subject === "english") return "English"
  if (subject === "vr") return "Verbal Reasoning"
  if (subject === "nvr") return "Non-Verbal Reasoning"
  return subject
}

function getCategoryLabel(category: string) {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function getDifficultyLabel(difficulty: number | null) {
  if (difficulty === 1) return "Easy"
  if (difficulty === 2) return "Medium"
  if (difficulty === 3) return "Hard"
  return "Not set"
}

function getDifficultyColors(difficulty: number | null) {
  if (difficulty === 1) {
    return { background: "#ecfdf5", color: "#065f46" }
  }

  if (difficulty === 2) {
    return { background: "#eff6ff", color: "#1d4ed8" }
  }

  if (difficulty === 3) {
    return { background: "#fef2f2", color: "#b91c1c" }
  }

  return { background: "#f3f4f6", color: "#374151" }
}

function getBackHref(subject: string, category: string) {
  if (subject === "math" && category === "algebra_reasoning") {
    return "/math/algebra-reasoning"
  }

  if (subject === "math" && category === "data_handling") {
    return "/math/data-handling"
  }

  if (subject === "math" && category === "four_operations") {
    return "/math/four-operations"
  }

  if (subject === "math" && category === "fractions_decimals_percentages") {
    return "/math/fractions-decimals-percentages"
  }

  if (subject === "math" && category === "measurement") {
    return "/math/measurement"
  }

  if (subject === "math" && category === "number_place_value") {
    return "/math/number-place-value"
  }

  if (subject === "math" && category === "shape_space") {
    return "/math/shape-space"
  }

  if (subject === "math") {
    return "/math"
  }

  if (subject === "english") {
    return "/english"
  }

  if (subject === "vr" && category === "codes-logic") {
    return "/vr/code-logic"
  }
if (subject === "vr" && category === "sequence-pattern") {
  return "/vr/sequence-patterns"
}
if (subject === "vr" && category === "word-relationships") {
  return "/vr/word-relationships"
}
  if (subject === "vr") {
    return "/vr"
  }

  if (subject === "nvr") {
    return "/nvr"
  }

  return "/"
}

export default function UniversalResultPage() {
  const params = useParams()
  const router = useRouter()

  const rawSubject = Array.isArray(params.subject) ? params.subject[0] : params.subject
  const rawCategory = Array.isArray(params.category) ? params.category[0] : params.category
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id

  const subject = String(rawSubject || "")
  const category = String(rawCategory || "")
  const testId = Number(rawId)

  const [result, setResult] = useState<LatestTestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  const badgeColors = useMemo(
    () => getDifficultyColors(result?.difficulty ?? null),
    [result]
  )

  const backHref = getBackHref(subject, category)

  useEffect(() => {
    async function loadResult() {
      setLoading(true)
      setErrorMessage("")
      setResult(null)

      if (!subject || !category || !rawId || Number.isNaN(testId)) {
        setErrorMessage("Invalid result page link.")
        setLoading(false)
        return
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Error getting auth session:", sessionError)
      }

      const user = session?.user ?? null

      if (!user) {
        setErrorMessage("Please sign in to view this test result.")
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("latest_test_results")
        .select("*")
        .eq("user_id", user.id)
        .eq("subject", subject)
        .eq("category", category)
        .eq("subcategory", "")
        .eq("subcategory_two", "")
        .eq("subcategory_three", "")
        .eq("test_id", testId)
        .maybeSingle()

      if (error) {
        console.error("Error loading latest test result:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          full: error,
        })

        setErrorMessage("Could not load this test result.")
        setLoading(false)
        return
      }

      if (!data) {
        setErrorMessage("No completed result was found for this test.")
        setLoading(false)
        return
      }

      setResult(data as LatestTestResult)
      setLoading(false)
    }

    loadResult()
  }, [subject, category, rawId, testId])

  if (loading) {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <p style={styles.message}>Loading test result...</p>
        </div>
      </>
    )
  }

  if (errorMessage || !result) {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.centerCard}>
            <h1 style={styles.title}>Result not available</h1>

            <p style={styles.subtitle}>{errorMessage}</p>

            <div style={styles.buttonRow}>
              {errorMessage === "Please sign in to view this test result." ? (
                <Link href="/login" style={styles.primaryButton}>
                  Sign In
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push(backHref)}
                  style={styles.primaryButton}
                >
                  Back
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  const completedDate = result.completed_at
    ? new Date(result.completed_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not recorded"

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.heroCard}>
            <div style={styles.heroTop}>
              <div>
                <h1 style={styles.title}>📊 Test Result</h1>
                <p style={styles.subtitle}>{result.test_title}</p>
              </div>

              <span
                style={{
                  ...styles.badge,
                  background: badgeColors.background,
                  color: badgeColors.color,
                }}
              >
                {getDifficultyLabel(result.difficulty)}
              </span>
            </div>

            <div style={styles.resultSummary}>
              <p style={styles.resultText}>
                <strong>Subject:</strong> {getSubjectLabel(result.subject)}
              </p>

              <p style={styles.resultText}>
                <strong>Category:</strong> {getCategoryLabel(result.category)}
              </p>

              <p style={styles.resultText}>
                <strong>Completed:</strong> {completedDate}
              </p>

              <p style={styles.resultText}>
                <strong>Score:</strong> {result.correct_answers} /{" "}
                {result.total_questions}
              </p>

              <p style={styles.resultText}>
                <strong>Success Rate:</strong> {result.success_rate}%
              </p>
            </div>

            <div style={styles.buttonRow}>
              <Link href={backHref} style={styles.secondaryButton}>
                Back to Tests
              </Link>
            </div>
          </div>

          <div style={styles.reviewCard}>
            <h2 style={styles.sectionTitle}>Full Test Review</h2>

            <p style={styles.subtitle}>
              Here are all the questions, the student's answers, and the correct
              answers.
            </p>

            <div style={styles.reviewList}>
              {result.answers.map((item, index) => (
                <div
                  key={`${item.question_id}-${index}`}
                  style={{
                    ...styles.reviewQuestionCard,
                    borderColor: item.is_correct ? "#86efac" : "#fecaca",
                    background: item.is_correct ? "#f0fdf4" : "#fef2f2",
                  }}
                >
                  <div style={styles.reviewQuestionTop}>
                    <h3 style={styles.reviewQuestionTitle}>
                      Question {index + 1}
                    </h3>

                    <span
                      style={{
                        ...styles.reviewStatusBadge,
                        background: item.is_correct ? "#dcfce7" : "#fee2e2",
                        color: item.is_correct ? "#166534" : "#991b1b",
                      }}
                    >
                      {item.is_correct ? "Correct" : "Incorrect"}
                    </span>
                  </div>

                  <p style={styles.reviewQuestionText}>{item.question_text}</p>

                  {item.question_image_url && (
                    <img
                      src={item.question_image_url}
                      alt={`Question ${index + 1}`}
                      style={styles.questionImage}
                    />
                  )}

                  <div style={styles.reviewOptionsGrid}>
                    {(["A", "B", "C", "D"] as const).map((option) => {
                      const isUserAnswer = item.user_answer === option
                      const isCorrectAnswer = item.correct_answer === option
                      const optionImage = item.option_images?.[option] || null

                      let background = "white"
                      let borderColor = "#e5e7eb"

                      if (isCorrectAnswer) {
                        background = "#dcfce7"
                        borderColor = "#16a34a"
                      }

                      if (isUserAnswer && !isCorrectAnswer) {
                        background = "#fee2e2"
                        borderColor = "#dc2626"
                      }

                      return (
                        <div
                          key={option}
                          style={{
                            ...styles.reviewOption,
                            background,
                            borderColor,
                          }}
                        >
                          <div>
                            <strong>{option}.</strong> {item.options?.[option] || ""}
                          </div>

                          {optionImage && (
                            <img
                              src={optionImage}
                              alt={`Option ${option}`}
                              style={styles.optionImage}
                            />
                          )}

                          <div>
                            {isCorrectAnswer && (
                              <span style={styles.optionTag}>Correct answer</span>
                            )}

                            {isUserAnswer && (
                              <span style={styles.optionTag}>Your answer</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div style={styles.reviewAnswerBox}>
                    <p>
                      <strong>Your answer:</strong>{" "}
                      {item.user_answer
                        ? `${item.user_answer} — ${item.user_answer_text || ""}`
                        : "No answer"}
                    </p>

                    {item.user_answer_image_url && (
                      <img
                        src={item.user_answer_image_url}
                        alt="Your answer"
                        style={styles.answerImage}
                      />
                    )}

                    <p>
                      <strong>Correct answer:</strong>{" "}
                      {item.correct_answer} — {item.correct_answer_text}
                    </p>

                    {item.correct_answer_image_url && (
                      <img
                        src={item.correct_answer_image_url}
                        alt="Correct answer"
                        style={styles.answerImage}
                      />
                    )}

                    {item.explanation && item.explanation.trim() !== "" && (
                      <p>
                        <strong>Explanation:</strong> {item.explanation}
                      </p>
                    )}

                    {item.explanation_image_url && (
                      <img
                        src={item.explanation_image_url}
                        alt="Explanation"
                        style={styles.explanationImage}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    padding: "24px",
    background: "#f9fafb",
    minHeight: "calc(100vh - 70px)",
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
  },

  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },

  title: {
    fontSize: "36px",
    margin: "0 0 8px 0",
    color: "#111827",
  },

  subtitle: {
    margin: 0,
    color: "#555",
    lineHeight: 1.6,
  },

  badge: {
    padding: "10px 14px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  resultSummary: {
    background: "#f9fafb",
    borderRadius: "14px",
    padding: "18px",
    marginTop: "24px",
  },

  resultText: {
    margin: "10px 0",
    fontSize: "18px",
    color: "#111827",
  },

  reviewCard: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },

  sectionTitle: {
    marginTop: 0,
    marginBottom: "20px",
    fontSize: "28px",
    color: "#111827",
  },

  reviewList: {
    display: "grid",
    gap: "18px",
    marginTop: "24px",
  },

  reviewQuestionCard: {
    border: "2px solid",
    borderRadius: "16px",
    padding: "20px",
  },

  reviewQuestionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },

  reviewQuestionTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#111827",
  },

  reviewStatusBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "14px",
  },

  reviewQuestionText: {
    fontSize: "18px",
    lineHeight: 1.6,
    color: "#111827",
    marginBottom: "16px",
  },

  questionImage: {
    display: "block",
    maxWidth: "100%",
    maxHeight: "420px",
    objectFit: "contain",
    borderRadius: "12px",
    background: "white",
    border: "1px solid #e5e7eb",
    marginBottom: "16px",
  },

  reviewOptionsGrid: {
    display: "grid",
    gap: "10px",
    marginBottom: "16px",
  },

  reviewOption: {
    border: "2px solid",
    borderRadius: "12px",
    padding: "12px",
    lineHeight: 1.5,
  },

  optionImage: {
    display: "block",
    maxWidth: "100%",
    maxHeight: "220px",
    objectFit: "contain",
    borderRadius: "10px",
    background: "white",
    border: "1px solid #e5e7eb",
    marginTop: "10px",
  },

  optionTag: {
    display: "inline-block",
    marginTop: "8px",
    marginRight: "8px",
    fontSize: "13px",
    fontWeight: 700,
  },

  reviewAnswerBox: {
    background: "rgba(255,255,255,0.75)",
    borderRadius: "12px",
    padding: "14px",
    lineHeight: 1.6,
  },

  answerImage: {
    display: "block",
    maxWidth: "260px",
    maxHeight: "180px",
    objectFit: "contain",
    borderRadius: "10px",
    background: "white",
    border: "1px solid #e5e7eb",
    marginTop: "8px",
    marginBottom: "12px",
  },

  explanationImage: {
    display: "block",
    maxWidth: "100%",
    maxHeight: "320px",
    objectFit: "contain",
    borderRadius: "10px",
    background: "white",
    border: "1px solid #e5e7eb",
    marginTop: "8px",
  },

  buttonRow: {
    marginTop: "24px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },

  primaryButton: {
    padding: "12px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#d4f5d0",
    color: "#065f46",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
    minWidth: "180px",
    textDecoration: "none",
    textAlign: "center",
  },

  secondaryButton: {
    padding: "12px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#e5e7eb",
    color: "#111827",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
    minWidth: "180px",
    textDecoration: "none",
    textAlign: "center",
  },

  centerCard: {
    maxWidth: "700px",
    margin: "80px auto",
    background: "white",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
  },

  message: {
    textAlign: "center",
    marginTop: "40px",
    fontSize: "18px",
  },
}