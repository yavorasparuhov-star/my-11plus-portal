"use client"

import React, { useEffect, useMemo, useState } from "react"
import Header from "../../../../components/Header"
import { supabase } from "../../../../lib/supabaseClient"
import { useParams, useRouter } from "next/navigation"

type NVRTest = {
  id: number
  title: string
  category: string | null
  difficulty: number | null
  created_at: string
}

type NVRQuestion = {
  id: number
  test_id: number
  question_text: string
  image_url: string | null
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  option_a_image_url: string | null
  option_b_image_url: string | null
  option_c_image_url: string | null
  option_d_image_url: string | null
  correct_answer: string
  explanation: string | null
  difficulty: number | null
  question_order: number
  created_at: string
}

type UserAnswerMap = {
  [questionId: number]: "A" | "B" | "C" | "D"
}

export default function NVRCodesSpatialLogicTestPage() {
  const params = useParams()
  const router = useRouter()

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id
  const testId = Number(rawId)

  const [userId, setUserId] = useState<string | null>(null)
  const [test, setTest] = useState<NVRTest | null>(null)
  const [questions, setQuestions] = useState<NVRQuestion[]>([])
  const [answers, setAnswers] = useState<UserAnswerMap>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [showIncompleteModal, setShowIncompleteModal] = useState(false)

  useEffect(() => {
    async function loadPage() {
      setLoading(true)
      setErrorMessage("")

      if (!rawId || Number.isNaN(testId)) {
        setErrorMessage("Invalid NVR test ID.")
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
  setErrorMessage("Please sign in to start this test.")
  setLoading(false)
  return
}

      setUserId(user.id)

      const { data: testData, error: testError } = await supabase
        .from("nvr_tests")
        .select("*")
        .eq("id", testId)
        .eq("category", "codes-spatial-logic")
        .single()

      if (testError) {
        console.error("Error loading NVR test:", testError)
        setErrorMessage("Could not load this Codes & Spatial Logic test.")
        setLoading(false)
        return
      }

      const { data: questionData, error: questionError } = await supabase
        .from("nvr_questions")
        .select("*")
        .eq("test_id", testId)
        .order("question_order", { ascending: true })

      if (questionError) {
        console.error("Error loading NVR questions:", questionError)
        setErrorMessage("Could not load the questions for this test.")
        setLoading(false)
        return
      }

      setTest(testData as NVRTest)
      setQuestions((questionData || []) as NVRQuestion[])
      setLoading(false)
    }

    loadPage()
  }, [rawId, testId, router])

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])

  const shouldWarnBeforeLeaving = answeredCount > 0 && !submitted && !submitting

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!shouldWarnBeforeLeaving) return
      e.preventDefault()
      e.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [shouldWarnBeforeLeaving])

  function confirmLeaveIfNeeded() {
    if (!shouldWarnBeforeLeaving) return true

    return window.confirm(
      "Not all questions have been answered. Are you sure you want to leave this test?"
    )
  }

  function goBackSafely() {
    const confirmed = confirmLeaveIfNeeded()
    if (!confirmed) return
    router.push("/nvr/codes-spatial-logic")
  }

  function handleSelect(questionId: number, option: "A" | "B" | "C" | "D") {
    if (submitted) return

    setAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }))
  }

  async function submitTest() {
    if (!userId || !test) return
    if (questions.length === 0) return

    setSubmitting(true)

    let correctAnswers = 0
   const wrongAnswersForReview: {
  user_id: string
  question_id: number
  question_text: string
  knew_it: boolean
  difficulty: number | null
}[] = []

    for (const question of questions) {
      const selected = answers[question.id]

      if (selected === question.correct_answer) {
        correctAnswers += 1
      } else {
      wrongAnswersForReview.push({
  user_id: userId,
  question_id: question.id,
  question_text: question.question_text,
  knew_it: false,
  difficulty: question.difficulty ?? test.difficulty ?? null,
})
      }
    }

    const totalQuestions = questions.length
    const successRate =
      totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

  const { error: progressError } = await supabase.from("nvr_progress").insert([
  {
    user_id: userId,
    test_id: test.id,
    total_questions: totalQuestions,
    correct_answers: correctAnswers,
    success_rate: successRate,
    difficulty: test.difficulty ?? null,
  },
])

    if (progressError) {
      console.error("Error saving NVR progress:", progressError)
    }

    if (wrongAnswersForReview.length > 0) {
      const { error: reviewError } = await supabase
        .from("nvr_review")
        .insert(wrongAnswersForReview)

      if (reviewError) {
        console.error("Error saving NVR review:", reviewError)
      }
    }

    setScore(correctAnswers)
    setSubmitted(true)
    setSubmitting(false)
    setShowIncompleteModal(false)

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleSubmit() {
    if (!userId || !test) return
    if (questions.length === 0) return

    const unansweredCount = questions.length - answeredCount

    if (unansweredCount > 0) {
      setShowIncompleteModal(true)
      return
    }

    await submitTest()
  }

  function getOptionText(question: NVRQuestion, option: "A" | "B" | "C" | "D") {
    if (option === "A") return question.option_a
    if (option === "B") return question.option_b
    if (option === "C") return question.option_c
    return question.option_d
  }

  function getOptionImage(question: NVRQuestion, option: "A" | "B" | "C" | "D") {
    if (option === "A") return question.option_a_image_url
    if (option === "B") return question.option_b_image_url
    if (option === "C") return question.option_c_image_url
    return question.option_d_image_url
  }

  function restartSameTest() {
    setAnswers({})
    setSubmitted(false)
    setScore(0)
    setShowIncompleteModal(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const unansweredCount = questions.length - answeredCount

  if (loading) {
    return (
      <>
        <Header />
        <p style={styles.message}>Loading Codes & Spatial Logic test...</p>
      </>
    )
  }

  if (errorMessage) {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.centerCard}>
            <h1 style={styles.title}>Could not open test</h1>
            <p>{errorMessage}</p>
            <button onClick={goBackSafely} style={styles.primaryButton}>
              Back to Topic
            </button>
          </div>
        </div>
      </>
    )
  }

  if (!test) {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.centerCard}>
            <h1 style={styles.title}>NVR test not found</h1>
            <button onClick={goBackSafely} style={styles.primaryButton}>
              Back to Topic
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.heroCard}>
            <div style={styles.heroTop}>
              <div>
                <h1 style={styles.title}>🧠 {test.title}</h1>
                <p style={styles.subtitle}>
                  Answer all multiple-choice questions carefully and study the codes,
                  hidden shapes, nets, cubes, and spatial logic.
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
                    onClick={() => router.push("/nvr/codes-spatial-logic")}
                    style={styles.primaryButton}
                  >
                    Back to Topic
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.progressInfo}>
                Answered: <strong>{answeredCount}</strong> / {questions.length}
              </div>
            )}
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

                  {question.image_url && (
                    <div style={styles.questionImageWrap}>
                      <img
                        src={question.image_url}
                        alt={`Question ${index + 1} visual`}
                        style={styles.questionImage}
                      />
                    </div>
                  )}

                  <div style={styles.optionsGrid}>
                    {(["A", "B", "C", "D"] as const).map((option) => {
                      const optionText = getOptionText(question, option)
                      const optionImage = getOptionImage(question, option)

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

                          <div style={styles.optionContent}>
                            {optionText && <span>{optionText}</span>}

                            {optionImage && (
                              <img
                                src={optionImage}
                                alt={`Option ${option}`}
                                style={styles.optionImage}
                              />
                            )}
                          </div>
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
                          Correct answer: <strong>{question.correct_answer}</strong>
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

      {showIncompleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h2 style={styles.modalTitle}>Incomplete Test</h2>
            <p style={styles.modalText}>Not all questions have been answered.</p>
            <p style={styles.modalText}>
              You still have <strong>{unansweredCount}</strong> unanswered question
              {unansweredCount === 1 ? "" : "s"}.
            </p>
            <p style={styles.modalText}>Are you sure you want to submit the test?</p>

            <div style={styles.modalButtons}>
              <button
                onClick={() => setShowIncompleteModal(false)}
                style={styles.secondaryButton}
              >
                Go Back
              </button>
              <button onClick={submitTest} style={styles.primaryButton}>
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
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
  progressInfo: {
    marginTop: "20px",
    color: "#444",
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
  questionImageWrap: {
    marginBottom: "16px",
    textAlign: "center",
  },
  questionImage: {
    maxWidth: "100%",
    maxHeight: "320px",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
    objectFit: "contain",
    background: "#fff",
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
  optionContent: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "100%",
  },
  optionImage: {
    maxWidth: "220px",
    maxHeight: "140px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    objectFit: "contain",
    background: "#fff",
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
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
  },
  modalCard: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
  },
  modalTitle: {
    marginTop: 0,
    marginBottom: "14px",
    fontSize: "28px",
  },
  modalText: {
    margin: "8px 0",
    color: "#374151",
    lineHeight: 1.6,
    fontSize: "16px",
  },
  modalButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "22px",
  },
}