"use client"

import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"
import Header from "../../../../components/Header"
import { useParams, useRouter } from "next/navigation"

type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin"

type AnswerOption = "A" | "B" | "C" | "D"

type VRTest = {
  id: number
  title: string
  category: string | null
  difficulty: number | null
  access_level?: string | null
  is_free?: boolean | null
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
  correct_answer: AnswerOption
  explanation: string | null
  difficulty: number | null
  question_order: number
  created_at: string
}

type UserAnswerMap = {
  [questionId: number]: AnswerOption
}

function hasFullAccess(plan: UserPlan) {
  return plan === "monthly" || plan === "annual" || plan === "admin"
}

function isFreeTest(test: VRTest) {
  return test.is_free === true || test.access_level === "free"
}

function canUserAccessTest(plan: UserPlan, test: VRTest | null) {
  if (!test) return false
  if (hasFullAccess(plan)) return true
  if (plan === "free" && isFreeTest(test)) return true
  return false
}

export default function VRSequencePatternsTestPage() {
  const params = useParams()
  const router = useRouter()

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id
  const testId = Number(rawId)

  const [loading, setLoading] = useState(true)
  const [test, setTest] = useState<VRTest | null>(null)
  const [questions, setQuestions] = useState<VRQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswerMap>({})
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [savingResults, setSavingResults] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<UserPlan>("guest")
  const [accessBlocked, setAccessBlocked] = useState<"guest" | "upgrade" | null>(
    null
  )

  const currentQuestion = questions[currentIndex]
  const hasAccess = canUserAccessTest(userPlan, test)

  const answeredCount = useMemo(
    () => Object.keys(userAnswers).length,
    [userAnswers]
  )

  const shouldWarnBeforeLeaving =
    answeredCount > 0 && !finished && !savingResults

  const selectedAnswerText = useMemo(() => {
    if (!currentQuestion || !selectedAnswer) return ""
    return getOptionText(currentQuestion, selectedAnswer)
  }, [currentQuestion, selectedAnswer])

  useEffect(() => {
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

    async function loadVRTest() {
      setLoading(true)
      setFinished(false)
      setCurrentIndex(0)
      setUserAnswers({})
      setSelectedAnswer(null)
      setShowFeedback(false)
      setScore(0)
      setErrorMessage("")
      setAccessBlocked(null)
      setQuestions([])

      if (!rawId || Number.isNaN(testId)) {
        setErrorMessage("Invalid test ID.")
        setLoading(false)
        return
      }

      const { data: testData, error: testError } = await supabase
        .from("vr_tests")
        .select("*")
        .eq("id", testId)
        .eq("category", "sequence-pattern")
        .maybeSingle()

      if (testError || !testData) {
        console.error("Error loading VR test:", {
          message: testError?.message,
          details: testError?.details,
          hint: testError?.hint,
          code: testError?.code,
          full: testError,
        })

        setTest(null)
        setErrorMessage("This Sequence Patterns test is not available yet.")
        setLoading(false)
        return
      }

      const loadedTest = testData as VRTest
      setTest(loadedTest)

      const currentAccess = await loadCurrentUserAndPlan()
      setUserId(currentAccess.userId)
      setUserPlan(currentAccess.plan)

      if (!currentAccess.userId) {
        setAccessBlocked("guest")
        setLoading(false)
        return
      }

      if (!canUserAccessTest(currentAccess.plan, loadedTest)) {
        setAccessBlocked("upgrade")
        setLoading(false)
        return
      }

      const { data: questionData, error: questionError } = await supabase
        .from("vr_questions")
        .select("*")
        .eq("test_id", loadedTest.id)
        .order("question_order", { ascending: true })

      if (questionError) {
        console.error("Error loading VR questions:", {
          message: questionError.message,
          details: questionError.details,
          hint: questionError.hint,
          code: questionError.code,
          full: questionError,
        })

        setQuestions([])
        setErrorMessage("Could not load the questions for this test.")
        setLoading(false)
        return
      }

      setQuestions((questionData || []) as VRQuestion[])
      setLoading(false)
    }

    loadVRTest()
  }, [rawId, testId])

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

    router.push("/vr/sequence-patterns")
  }

  function handleSelectAnswer(answer: AnswerOption) {
    if (showFeedback || !hasAccess) return
    setSelectedAnswer(answer)
  }

  function handleCheckAnswer() {
    if (!currentQuestion || !selectedAnswer || !hasAccess) return

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
    if (!currentQuestion || !hasAccess) return

    const isLastQuestion = currentIndex === questions.length - 1

    if (isLastQuestion) {
      const finalAnswers = {
        ...userAnswers,
        [currentQuestion.id]: selectedAnswer as AnswerOption,
      }

      const finalScore = questions.reduce((total, question) => {
        return finalAnswers[question.id] === question.correct_answer
          ? total + 1
          : total
      }, 0)

      await saveResults(finalScore, finalAnswers)
      setScore(finalScore)
      setFinished(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    setCurrentIndex((prev) => prev + 1)
    setSelectedAnswer(null)
    setShowFeedback(false)
  }

  async function saveResults(finalScore: number, finalAnswers: UserAnswerMap) {
    if (!userId || !test) return

    setSavingResults(true)
    setErrorMessage("")

    const totalQuestions = questions.length
    const successRate =
      totalQuestions > 0 ? Math.round((finalScore / totalQuestions) * 100) : 0

    const progressPayload = {
      user_id: userId,
      test_id: test.id,
      category: test.category || "sequence-pattern",
      total_questions: totalQuestions,
      correct_answers: finalScore,
      success_rate: successRate,
      difficulty: test.difficulty ?? null,
    }

    const { error: progressError } = await supabase
      .from("vr_progress")
      .insert([progressPayload])

    if (progressError) {
      console.error("Error saving VR progress:", {
        message: progressError.message,
        details: progressError.details,
        hint: progressError.hint,
        code: progressError.code,
        full: progressError,
        payload: progressPayload,
      })

      setErrorMessage(
        progressError.message || "Could not save your progress. Please try again."
      )
      setSavingResults(false)
      return
    }

    const reviewRows = questions
      .filter((question) => finalAnswers[question.id] !== question.correct_answer)
      .map((question) => ({
        user_id: userId,
        test_id: test.id,
        question_id: question.id,
        category: test.category || "sequence-pattern",
        question_text: question.question_text,
        user_answer: finalAnswers[question.id] ?? null,
        correct_answer: question.correct_answer,
        difficulty: question.difficulty ?? test.difficulty ?? null,
      }))

    if (reviewRows.length > 0) {
      const { error: reviewError } = await supabase
        .from("vr_review")
        .insert(reviewRows)

      if (reviewError) {
        console.error("Error saving VR review:", {
          message: reviewError.message,
          details: reviewError.details,
          hint: reviewError.hint,
          code: reviewError.code,
          full: reviewError,
        })
      }
    }

    setSavingResults(false)
  }

  function restartTest() {
    setFinished(false)
    setCurrentIndex(0)
    setUserAnswers({})
    setSelectedAnswer(null)
    setShowFeedback(false)
    setScore(0)
    setErrorMessage("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function getOptionText(question: VRQuestion, answer: AnswerOption) {
    if (answer === "A") return question.option_a
    if (answer === "B") return question.option_b
    if (answer === "C") return question.option_c
    return question.option_d
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

  function getAccessLabel(testToCheck: VRTest) {
    if (isFreeTest(testToCheck)) return "Free"
    return "Members only"
  }

  if (loading) {
    return (
      <>
        <Header />
        <p style={styles.message}>Loading Sequence Patterns test...</p>
      </>
    )
  }

  if (errorMessage && !test) {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.container}>
            <div style={styles.emptyCard}>
              <h2 style={styles.cardTitle}>Could not open test</h2>
              <p style={styles.subtitle}>{errorMessage}</p>

              <button onClick={goBackSafely} style={styles.startButton}>
                Back to Topic
              </button>
            </div>
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
          <div style={styles.container}>
            <div style={styles.emptyCard}>
              <h2 style={styles.cardTitle}>No test found</h2>
              <p style={styles.subtitle}>
                This Sequence Patterns test is not available yet.
              </p>

              <button onClick={goBackSafely} style={styles.startButton}>
                Back to Topic
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (accessBlocked === "guest") {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.container}>
            <div style={styles.emptyCard}>
              <h2 style={styles.cardTitle}>Please sign in to start this test</h2>

              <p style={styles.subtitle}>
                Guests can browse the portal, but you need an account to start tests
                and save progress.
              </p>

              <div style={styles.finishButtons}>
                <button onClick={() => router.push("/login")} style={styles.startButton}>
                  Login
                </button>

                <button onClick={() => router.push("/signup")} style={styles.retryButton}>
                  Sign Up
                </button>

                <button onClick={goBackSafely} style={styles.retryButton}>
                  Back to Topic
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (accessBlocked === "upgrade") {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.container}>
            <div style={styles.emptyCard}>
              <h2 style={styles.cardTitle}>Members-only test</h2>

              <p style={styles.subtitle}>
                This test is not included in the free plan. Your current plan is{" "}
                <strong>{userPlan}</strong>. Upgrade your plan to unlock it.
              </p>

              <div style={styles.finishButtons}>
                <button onClick={() => router.push("/profile")} style={styles.startButton}>
                  View Membership
                </button>

                <button onClick={goBackSafely} style={styles.retryButton}>
                  Back to Topic
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (questions.length === 0) {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.container}>
            <div style={styles.emptyCard}>
              <h2 style={styles.cardTitle}>No questions found</h2>
              <p style={styles.subtitle}>Add questions in Supabase for this test.</p>

              <button onClick={goBackSafely} style={styles.startButton}>
                Back to Topic
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (finished) {
    const totalQuestions = questions.length
    const percentage =
      totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

    const badgeColors = getDifficultyColors(test.difficulty)

    return (
      <>
        <Header />

        <div style={styles.page}>
          <div style={styles.container}>
            <div style={styles.heroCard}>
              <h1 style={styles.title}>🔢 Sequence Patterns Test Complete</h1>
              <p style={styles.subtitle}>{test.title}</p>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.cardTop}>
                <h2 style={styles.cardTitle}>Your Results</h2>

                <span
                  style={{
                    ...styles.badge,
                    background: badgeColors.background,
                    color: badgeColors.color,
                  }}
                >
                  {getDifficultyLabel(test.difficulty)}
                </span>
              </div>

              <div style={styles.resultBox}>
                <p style={styles.resultText}>
                  <strong>Score:</strong> {score} / {totalQuestions}
                </p>

                <p style={styles.resultText}>
                  <strong>Success Rate:</strong> {percentage}%
                </p>

                <p style={styles.resultText}>
                  <strong>Category:</strong> Sequence Patterns
                </p>

                {savingResults && <p style={styles.resultText}>Saving results...</p>}

                {errorMessage && <p style={styles.inlineError}>{errorMessage}</p>}
              </div>

              <div style={styles.finishButtons}>
                <button onClick={restartTest} style={styles.startButton}>
                  Try Again
                </button>

                <button onClick={goBackSafely} style={styles.retryButton}>
                  Back to Topic
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const isCorrect = selectedAnswer === currentQuestion.correct_answer
  const badgeColors = getDifficultyColors(test.difficulty)

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.heroCard}>
            <div style={styles.cardTop}>
              <div>
                <h1 style={styles.titleLeft}>{test.title}</h1>

                <p style={styles.subtitleLeft}>
                  Work through each question and check your answer before moving on.
                </p>
              </div>

              <div style={styles.badgeStack}>
                <span
                  style={{
                    ...styles.badge,
                    background: badgeColors.background,
                    color: badgeColors.color,
                  }}
                >
                  {getDifficultyLabel(test.difficulty)}
                </span>

                <span style={styles.accessBadge}>{getAccessLabel(test)}</span>
              </div>
            </div>
          </div>

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

                if (
                  showFeedback &&
                  selectedAnswer === answerKey &&
                  currentQuestion.correct_answer !== answerKey
                ) {
                  background = "#fee2e2"
                  border = "1px solid #f87171"
                }

                return (
                  <button
                    key={answerKey}
                    onClick={() => handleSelectAnswer(answerKey)}
                    disabled={showFeedback}
                    style={{
                      ...styles.optionButton,
                      background,
                      border,
                      cursor: showFeedback ? "default" : "pointer",
                    }}
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
                  <p style={styles.feedbackText}>
                    <strong>{isCorrect ? "Correct!" : "Not quite."}</strong>
                  </p>

                  {!isCorrect && (
                    <p style={styles.feedbackText}>
                      <strong>Correct answer:</strong>{" "}
                      {currentQuestion.correct_answer}.{" "}
                      {getOptionText(currentQuestion, currentQuestion.correct_answer)}
                    </p>
                  )}

                  {selectedAnswer && (
                    <p style={styles.feedbackText}>
                      <strong>Your answer:</strong> {selectedAnswer}.{" "}
                      {selectedAnswerText}
                    </p>
                  )}

                  {currentQuestion.explanation &&
                    currentQuestion.explanation.trim() !== "" && (
                      <p style={styles.feedbackText}>
                        <strong>Explanation:</strong> {currentQuestion.explanation}
                      </p>
                    )}
                </div>

                <button onClick={handleNext} style={styles.startButton}>
                  {currentIndex === questions.length - 1
                    ? "Finish Test"
                    : "Next Question"}
                </button>
              </>
            )}
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

  summaryCard: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },

  questionCard: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },

  emptyCard: {
    background: "white",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
  },

  title: {
    fontSize: "36px",
    margin: "0 0 8px 0",
    textAlign: "center",
    color: "#111827",
  },

  titleLeft: {
    fontSize: "32px",
    margin: "0 0 8px 0",
    color: "#111827",
  },

  subtitle: {
    margin: 0,
    color: "#555",
    lineHeight: 1.6,
    textAlign: "center",
  },

  subtitleLeft: {
    margin: 0,
    color: "#555",
    lineHeight: 1.6,
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
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
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #86efac",
  },

  progressRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },

  progressText: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#374151",
  },

  questionText: {
    fontSize: "26px",
    color: "#111827",
    marginBottom: "24px",
    lineHeight: 1.5,
  },

  options: {
    display: "grid",
    gap: "14px",
    marginBottom: "24px",
  },

  optionButton: {
    padding: "16px",
    borderRadius: "14px",
    textAlign: "left",
    fontSize: "16px",
    lineHeight: 1.5,
  },

  feedbackBox: {
    border: "1px solid",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "20px",
  },

  feedbackText: {
    fontSize: "16px",
    color: "#111827",
    margin: "8px 0",
    lineHeight: 1.5,
  },

  resultBox: {
    background: "#f9fafb",
    borderRadius: "14px",
    padding: "18px",
    margin: "24px 0",
  },

  resultText: {
    fontSize: "18px",
    color: "#111827",
    margin: "10px 0",
  },

  finishButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "20px",
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
    minWidth: "180px",
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
    minWidth: "180px",
    cursor: "pointer",
  },

  inlineError: {
    marginTop: "12px",
    marginBottom: 0,
    color: "#b91c1c",
    lineHeight: 1.6,
    fontWeight: 600,
  },

  message: {
    textAlign: "center",
    marginTop: "40px",
    fontSize: "18px",
  },
}