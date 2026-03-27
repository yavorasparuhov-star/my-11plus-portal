"use client"

import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"
import { useParams, useRouter } from "next/navigation"

type ComprehensionTest = {
  id: number
  title: string
  passage: string
  difficulty: number | null
  created_at: string
}

type ComprehensionQuestion = {
  id: number
  test_id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  explanation: string | null
  question_order: number
  created_at: string
}

type UserAnswerMap = {
  [questionId: number]: "A" | "B" | "C" | "D"
}

export default function ComprehensionTestPage() {
  const params = useParams()
  const router = useRouter()

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id
  const testId = Number(rawId)

  const [userId, setUserId] = useState<string | null>(null)
  const [test, setTest] = useState<ComprehensionTest | null>(null)
  const [questions, setQuestions] = useState<ComprehensionQuestion[]>([])
  const [answers, setAnswers] = useState<UserAnswerMap>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    async function loadPage() {
      setLoading(true)
      setErrorMessage("")

      if (!rawId || Number.isNaN(testId)) {
        setErrorMessage("Invalid comprehension test ID.")
        setLoading(false)
        return
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error("Error getting user:", userError)
        setErrorMessage("Could not verify your login.")
        setLoading(false)
        return
      }

      if (!user) {
        router.push("/login")
        return
      }

      setUserId(user.id)

      const { data: testData, error: testError } = await supabase
        .from("comprehension_tests")
        .select("*")
        .eq("id", testId)
        .single()

      if (testError) {
        console.error("Error loading comprehension test:", testError)
        setErrorMessage("Could not load this comprehension test.")
        setLoading(false)
        return
      }

      const { data: questionData, error: questionError } = await supabase
        .from("comprehension_questions")
        .select("*")
        .eq("test_id", testId)
        .order("question_order", { ascending: true })

      if (questionError) {
        console.error("Error loading comprehension questions:", questionError)
        setErrorMessage("Could not load the questions for this test.")
        setLoading(false)
        return
      }

      setTest(testData as ComprehensionTest)
      setQuestions((questionData || []) as ComprehensionQuestion[])
      setLoading(false)
    }

    loadPage()
  }, [rawId, testId, router])

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])

  function handleSelect(questionId: number, option: "A" | "B" | "C" | "D") {
    if (submitted) return

    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }))
  }

  async function handleSubmit() {
    if (!userId || !test) return
    if (questions.length === 0) return

    setSubmitting(true)

    let correctAnswers = 0
    const wrongAnswersForReview: {
      user_id: string
      test_id: number
      question_id: number
      question_text: string
      user_answer: string
      correct_answer: string
      difficulty: number | null
    }[] = []

    for (const question of questions) {
      const selected = answers[question.id]

      if (selected === question.correct_answer) {
        correctAnswers += 1
      } else {
        wrongAnswersForReview.push({
          user_id: userId,
          test_id: test.id,
          question_id: question.id,
          question_text: question.question_text,
          user_answer: selected || "",
          correct_answer: question.correct_answer,
          difficulty: test.difficulty,
        })
      }
    }

    const totalQuestions = questions.length
    const successRate =
      totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

    const { error: progressError } = await supabase
      .from("comprehension_progress")
      .insert([
        {
          user_id: userId,
          test_id: test.id,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          success_rate: successRate,
        },
      ])

    if (progressError) {
      console.error("Error saving comprehension progress:", progressError)
    }

    if (wrongAnswersForReview.length > 0) {
      const { error: reviewError } = await supabase
        .from("comprehension_review")
        .insert(wrongAnswersForReview)

      if (reviewError) {
        console.error("Error saving comprehension review:", reviewError)
      }
    }

    setScore(correctAnswers)
    setSubmitted(true)
    setSubmitting(false)

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function getOptionText(question: ComprehensionQuestion, option: "A" | "B" | "C" | "D") {
    if (option === "A") return question.option_a
    if (option === "B") return question.option_b
    if (option === "C") return question.option_c
    return question.option_d
  }

  function restartSameTest() {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (loading) {
    return <p style={styles.message}>Loading comprehension test...</p>
  }

  if (errorMessage) {
    return (
      <div style={styles.page}>
        <div style={styles.centerCard}>
          <h1 style={styles.title}>Could not open test</h1>
          <p>{errorMessage}</p>
          <button onClick={() => router.push("/home")} style={styles.primaryButton}>
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (!test) {
    return (
      <div style={styles.page}>
        <div style={styles.centerCard}>
          <h1 style={styles.title}>Comprehension test not found</h1>
          <button onClick={() => router.push("/home")} style={styles.primaryButton}>
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.heroCard}>
          <div style={styles.heroTop}>
            <div>
              <h1 style={styles.title}>📖 {test.title}</h1>
              <p style={styles.subtitle}>
                Read the passage carefully, then answer all questions below.
              </p>
            </div>

            <div style={styles.badge}>
              Difficulty:{" "}
              {test.difficulty === 1
                ? "Easy"
                : test.difficulty === 2
                ? "Medium"
                : test.difficulty === 3
                ? "Hard"
                : "Not set"}
            </div>
          </div>

          {submitted ? (
            <div style={styles.resultBanner}>
              <h2 style={{ marginTop: 0 }}>Finished</h2>
              <p style={styles.resultText}>
                You scored <strong>{score}</strong> out of <strong>{questions.length}</strong>
              </p>
              <p style={styles.resultText}>
                Success rate:{" "}
                <strong>
                  {questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%
                </strong>
              </p>

              <div style={styles.resultButtons}>
                <button onClick={restartSameTest} style={styles.secondaryButton}>
                  Retry This Test
                </button>
                <button
                  onClick={() => router.push("/home")}
                  style={styles.primaryButton}
                >
                  Back to Home
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.progressRow}>
              <div style={styles.progressInfo}>
                Answered: <strong>{answeredCount}</strong> / {questions.length}
              </div>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div style={styles.passageCard}>
          <h2 style={styles.sectionTitle}>Passage</h2>
          <div style={styles.passageText}>
            {test.passage.split("\n").map((paragraph, index) => (
              <p key={index} style={styles.paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div style={styles.questionsCard}>
          <h2 style={styles.sectionTitle}>Questions</h2>

          {questions.map((question, index) => {
            const selected = answers[question.id]
            const isCorrect = selected === question.correct_answer

            return (
              <div key={question.id} style={styles.questionBlock}>
                <h3 style={styles.questionTitle}>
                  {index + 1}. {question.question_text}
                </h3>

                <div style={styles.optionsGrid}>
                  {(["A", "B", "C", "D"] as const).map((option) => {
                    const optionText = getOptionText(question, option)

                    let backgroundColor = "#f3f4f6"
                    let borderColor = "transparent"

                    if (selected === option) {
                      backgroundColor = "#e0e7ff"
                      borderColor = "#4f46e5"
                    }

                    if (submitted) {
                      if (option === question.correct_answer) {
                        backgroundColor = "#dcfce7"
                        borderColor = "#16a34a"
                      } else if (selected === option && option !== question.correct_answer) {
                        backgroundColor = "#fee2e2"
                        borderColor = "#dc2626"
                      }
                    }

                    return (
                      <button
                        key={option}
                        onClick={() => handleSelect(question.id, option)}
                        disabled={submitted}
                        style={{
                          ...styles.optionButton,
                          backgroundColor,
                          borderColor,
                          cursor: submitted ? "default" : "pointer",
                        }}
                      >
                        <span style={styles.optionLetter}>{option}</span>
                        <span>{optionText}</span>
                      </button>
                    )
                  })}
                </div>

                {submitted && (
                  <div
                    style={{
                      ...styles.feedbackBox,
                      backgroundColor: isCorrect ? "#f0fdf4" : "#fef2f2",
                      borderColor: isCorrect ? "#86efac" : "#fecaca",
                    }}
                  >
                    <p style={{ margin: 0 }}>
                      <strong>{isCorrect ? "Correct" : "Incorrect"}</strong>
                    </p>
                    {!isCorrect && (
                      <p style={{ margin: "8px 0 0 0" }}>
                        Correct answer:{" "}
                        <strong>
                          {question.correct_answer} —{" "}
                          {getOptionText(question, question.correct_answer as "A" | "B" | "C" | "D")}
                        </strong>
                      </p>
                    )}
                    {question.explanation && question.explanation.trim() !== "" && (
                      <p style={{ margin: "8px 0 0 0" }}>
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {!submitted && (
            <div style={styles.submitRow}>
              <button
                onClick={handleSubmit}
                disabled={submitting || questions.length === 0}
                style={{
                  ...styles.primaryButton,
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Submitting..." : "Submit Answers"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
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
  progressRow: {
    marginTop: "20px",
  },
  progressInfo: {
    marginBottom: "10px",
    color: "#444",
  },
  progressBar: {
    width: "100%",
    height: "12px",
    background: "#e5e7eb",
    borderRadius: "999px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "#4f46e5",
    borderRadius: "999px",
    transition: "width 0.3s ease",
  },
  resultBanner: {
    marginTop: "20px",
    background: "#f8fafc",
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid #e5e7eb",
  },
  resultText: {
    margin: "8px 0",
    fontSize: "18px",
  },
  resultButtons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "18px",
  },
  passageCard: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    marginBottom: "24px",
  },
  questionsCard: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "20px",
    fontSize: "28px",
  },
  passageText: {
    lineHeight: 1.8,
    fontSize: "17px",
    color: "#1f2937",
  },
  paragraph: {
    marginBottom: "18px",
  },
  questionBlock: {
    padding: "22px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  questionTitle: {
    marginTop: 0,
    marginBottom: "16px",
    fontSize: "22px",
    lineHeight: 1.5,
  },
  optionsGrid: {
    display: "grid",
    gap: "12px",
  },
  optionButton: {
    width: "100%",
    textAlign: "left",
    padding: "16px",
    borderRadius: "14px",
    border: "2px solid transparent",
    fontSize: "16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    transition: "all 0.2s ease",
  },
  optionLetter: {
    fontWeight: 700,
    minWidth: "22px",
  },
  feedbackBox: {
    marginTop: "14px",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid",
    lineHeight: 1.5,
  },
  submitRow: {
    marginTop: "28px",
    display: "flex",
    justifyContent: "center",
  },
  primaryButton: {
    padding: "12px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#4f46e5",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
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