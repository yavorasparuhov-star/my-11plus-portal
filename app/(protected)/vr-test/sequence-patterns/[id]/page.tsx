"use client"

import { supabase } from "../../../../../lib/supabaseClient"
import { useParams } from "next/navigation"
import { useMemo, useState, useEffect } from "react"

type VRTest = {
  id: number
  title: string
  category: string | null
  difficulty: number | null
  created_at: string
}

type VRQuestion = {
  id: number
  test_id: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: "A" | "B" | "C" | "D"
  explanation: string | null
  difficulty: number | null
  question_order: number
  created_at: string
}

type UserAnswerMap = {
  [questionId: number]: "A" | "B" | "C" | "D"
}

export default function VRSequencePatternsTestPage() {
  const params = useParams<{ id: string }>()
  const rawId = params?.id
  const testId = rawId ? Number(rawId) : null

  const [loading, setLoading] = useState(true)
  const [test, setTest] = useState<VRTest | null>(null)
  const [questions, setQuestions] = useState<VRQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswerMap>({})
  const [selectedAnswer, setSelectedAnswer] = useState<"A" | "B" | "C" | "D" | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [savingResults, setSavingResults] = useState(false)

  const currentQuestion = questions[currentIndex]

  const selectedAnswerText = useMemo(() => {
    if (!currentQuestion || !selectedAnswer) return ""
    if (selectedAnswer === "A") return currentQuestion.option_a
    if (selectedAnswer === "B") return currentQuestion.option_b
    if (selectedAnswer === "C") return currentQuestion.option_c
    return currentQuestion.option_d
  }, [currentQuestion, selectedAnswer])

  useEffect(() => {
    if (!rawId) return
    if (testId === null || Number.isNaN(testId)) {
      setLoading(false)
      return
    }
    loadVRTest()
  }, [rawId, testId])

  async function loadVRTest() {
    if (testId === null || Number.isNaN(testId)) return

    setLoading(true)
    setFinished(false)
    setCurrentIndex(0)
    setUserAnswers({})
    setSelectedAnswer(null)
    setShowFeedback(false)
    setScore(0)

    const { data: testData, error: testError } = await supabase
      .from("vr_tests")
      .select("*")
      .eq("id", testId)
      .eq("category", "sequence-patterns")
      .maybeSingle()

    if (testError || !testData) {
      console.error("Error loading VR test:", testError)
      setTest(null)
      setQuestions([])
      setLoading(false)
      return
    }

    const { data: questionData, error: questionError } = await supabase
      .from("vr_questions")
      .select("*")
      .eq("test_id", testData.id)
      .order("question_order", { ascending: true })

    if (questionError) {
      console.error("Error loading VR questions:", questionError)
      setTest(testData)
      setQuestions([])
      setLoading(false)
      return
    }

    setTest(testData)
    setQuestions(questionData || [])
    setLoading(false)
  }

  function handleSelectAnswer(answer: "A" | "B" | "C" | "D") {
    if (showFeedback) return
    setSelectedAnswer(answer)
  }

  function handleCheckAnswer() {
    if (!currentQuestion || !selectedAnswer) return

    const isCorrect = selectedAnswer === currentQuestion.correct_answer

    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer,
    }))

    if (isCorrect) {
      setScore((prev) => prev + 1)
    }

    setShowFeedback(true)
  }

  async function handleNext() {
    if (!currentQuestion) return

    const isLastQuestion = currentIndex === questions.length - 1

    if (isLastQuestion) {
      await saveResults(score)
      setFinished(true)
      return
    }

    setCurrentIndex((prev) => prev + 1)
    setSelectedAnswer(null)
    setShowFeedback(false)
  }

  async function saveResults(finalScore: number) {
    setSavingResults(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSavingResults(false)
      return
    }

    const totalQuestions = questions.length
    const successRate =
      totalQuestions > 0 ? Math.round((finalScore / totalQuestions) * 100) : 0

    const { error: progressError } = await supabase.from("vr_progress").insert({
      user_id: user.id,
      total_questions: totalQuestions,
      correct_answers: finalScore,
      success_rate: successRate,
      difficulty: test?.difficulty,
    })

    if (progressError) {
      console.error("Error saving VR progress:", progressError)
    }

    const reviewRows = questions
      .filter((question) => userAnswers[question.id] !== question.correct_answer)
      .map((question) => ({
        user_id: user.id,
        question_id: question.id,
        question_text: question.question_text,
        knew_it: false,
        difficulty: question.difficulty ?? test?.difficulty,
      }))

    if (reviewRows.length > 0) {
      const { error: reviewError } = await supabase
        .from("vr_review")
        .insert(reviewRows)

      if (reviewError) {
        console.error("Error saving VR review:", reviewError)
      }
    }

    setSavingResults(false)
  }

  function restartTest() {
    loadVRTest()
  }

  function getOptionText(question: VRQuestion, answer: "A" | "B" | "C" | "D") {
    if (answer === "A") return question.option_a
    if (answer === "B") return question.option_b
    if (answer === "C") return question.option_c
    return question.option_d
  }

  if (!rawId) return <p style={styles.message}>Loading test...</p>
  if (loading) return <p style={styles.message}>Loading sequence & patterns test...</p>
  if (testId === null || Number.isNaN(testId)) {
    return <p style={styles.message}>Invalid test id.</p>
  }

  if (!test || questions.length === 0) {
    return (
      <div style={styles.page}>
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>No test found</h2>
            <p style={styles.subtitle}>This sequence & patterns test is not available yet.</p>
          </div>
        </div>
      </div>
    )
  }

  if (finished) {
    const totalQuestions = questions.length
    const percentage =
      totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

    return (
      <div style={styles.page}>
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <h1 style={styles.title}>Test Complete</h1>
            <p style={styles.subtitle}>{test.title}</p>

            <div style={styles.resultBox}>
              <p style={styles.resultText}>Score: <strong>{score}</strong> / {totalQuestions}</p>
              <p style={styles.resultText}>Success Rate: <strong>{percentage}%</strong></p>
              <p style={styles.resultText}>Category: <strong>Sequence & Patterns</strong></p>
              {savingResults && <p style={styles.resultText}>Saving results...</p>}
            </div>

            <button onClick={restartTest} style={styles.startButton}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isCorrect = selectedAnswer === currentQuestion.correct_answer

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.questionCard}>
          <div style={styles.progressRow}>
            <span style={styles.progressText}>
              Question {currentIndex + 1} / {questions.length}
            </span>
            <span style={styles.progressText}>Score: {score}</span>
          </div>

          <h2 style={styles.questionText}>{currentQuestion.question_text}</h2>

          <div style={styles.options}>
            {(["A", "B", "C", "D"] as const).map((answerKey) => {
              const optionText = getOptionText(currentQuestion, answerKey)

              let background = "white"
              let border = "1px solid #d1d5db"

              if (selectedAnswer === answerKey) {
                background = "#dbeafe"
                border = "1px solid #60a5fa"
              }
              if (showFeedback && currentQuestion.correct_answer === answerKey) {
                background = "#d1fae5"
                border = "1px solid #34d399"
              }
              if (showFeedback && selectedAnswer === answerKey && currentQuestion.correct_answer !== answerKey) {
                background = "#fee2e2"
                border = "1px solid #f87171"
              }

              return (
                <button
                  key={answerKey}
                  onClick={() => handleSelectAnswer(answerKey)}
                  style={{ ...styles.optionButton, background, border }}
                >
                  <strong>{answerKey}.</strong> {optionText}
                </button>
              )
            })}
          </div>

          {!showFeedback ? (
            <button
              onClick={handleCheckAnswer}
              disabled={!selectedAnswer}
              style={{
                ...styles.startButton,
                opacity: selectedAnswer ? 1 : 0.6,
                cursor: selectedAnswer ? "pointer" : "not-allowed",
              }}
            >
              Check Answer
            </button>
          ) : (
            <>
              <div
                style={{
                  ...styles.feedbackBox,
                  background: isCorrect ? "#ecfdf5" : "#fef2f2",
                  borderColor: isCorrect ? "#34d399" : "#f87171",
                }}
              >
                <p style={styles.feedbackText}>{isCorrect ? "Correct!" : "Not quite."}</p>
                {!isCorrect && (
                  <p style={styles.feedbackText}>
                    Correct answer: <strong>{currentQuestion.correct_answer}. {getOptionText(currentQuestion, currentQuestion.correct_answer)}</strong>
                  </p>
                )}
                {selectedAnswer && (
                  <p style={styles.feedbackText}>
                    Your answer: <strong>{selectedAnswer}. {selectedAnswerText}</strong>
                  </p>
                )}
                {currentQuestion.explanation && (
                  <p style={styles.feedbackText}>Explanation: {currentQuestion.explanation}</p>
                )}
              </div>

              <button onClick={handleNext} style={styles.startButton}>
                {currentIndex === questions.length - 1 ? "Finish Test" : "Next Question"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: { minHeight: "calc(100vh - 70px)", background: "#f9fafb", padding: "32px 20px 50px" },
  wrapper: { maxWidth: "900px", margin: "0 auto" },
  title: { fontSize: "38px", marginBottom: "10px", color: "#111827", textAlign: "center" },
  subtitle: {
    fontSize: "18px",
    color: "#4b5563",
    lineHeight: 1.6,
    maxWidth: "700px",
    margin: "0 auto",
    textAlign: "center",
  },
  card: {
    background: "white",
    borderRadius: "22px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    padding: "30px",
    textAlign: "center",
  },
  questionCard: {
    background: "white",
    borderRadius: "22px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    padding: "30px",
  },
  cardTitle: { fontSize: "26px", marginBottom: "20px", color: "#111827", textAlign: "center" },
  startButton: {
    padding: "14px 24px",
    borderRadius: "12px",
    border: "none",
    background: "#d4f5d0",
    color: "#065f46",
    cursor: "pointer",
    fontSize: "17px",
    fontWeight: 700,
    minWidth: "180px",
  },
  progressRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  progressText: { fontSize: "15px", fontWeight: 600, color: "#374151" },
  questionText: { fontSize: "26px", color: "#111827", marginBottom: "24px", lineHeight: 1.5 },
  options: { display: "grid", gap: "14px", marginBottom: "24px" },
  optionButton: {
    padding: "16px",
    borderRadius: "14px",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "16px",
    lineHeight: 1.5,
  },
  feedbackBox: { border: "1px solid", borderRadius: "14px", padding: "16px", marginBottom: "20px" },
  feedbackText: { fontSize: "16px", color: "#111827", margin: "8px 0", lineHeight: 1.5 },
  resultBox: { background: "#f9fafb", borderRadius: "14px", padding: "18px", margin: "24px 0" },
  resultText: { fontSize: "18px", color: "#111827", margin: "10px 0" },
  message: { textAlign: "center", marginTop: "40px", fontSize: "18px" },
}