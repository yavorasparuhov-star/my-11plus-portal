"use client"

import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "../../../../lib/supabaseClient"
import Header from "../../../../components/Header"
import ReportQuestionButton from "../../../../components/ReportQuestionButton"
import { useParams, useRouter } from "next/navigation"

type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin"
type AnswerOption = "A" | "B" | "C" | "D"

const QUESTION_TIME = 60
const TIMER_STORAGE_KEY = "vr_word_relationships_timer_enabled"

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

type CompletedQuestionReview = {
  question_id: number
  question_order: number
  question_text: string
  question_image_url: string | null
  options: Record<AnswerOption, string>
  option_images: Partial<Record<AnswerOption, string | null>>
  user_answer: AnswerOption | null
  correct_answer: AnswerOption
  user_answer_text: string | null
  correct_answer_text: string
  user_answer_image_url: string | null
  correct_answer_image_url: string | null
  is_correct: boolean
  explanation: string | null
  explanation_image_url: string | null
  difficulty: number | null
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

export default function VRWordRelationshipsTestPage() {
  const params = useParams()
  const router = useRouter()

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id
  const testId = Number(rawId)

  const [loading, setLoading] = useState(true)
  const [test, setTest] = useState<VRTest | null>(null)
  const [questions, setQuestions] = useState<VRQuestion[]>([])

  const [userId, setUserId] = useState<string | null>(null)
  const [userPlan, setUserPlan] = useState<UserPlan>("guest")

  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswerMap>({})
  const [completedReview, setCompletedReview] = useState<CompletedQuestionReview[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [savingResults, setSavingResults] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [timeUp, setTimeUp] = useState(false)

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
    async function loadVRTest() {
      setLoading(true)
      setFinished(false)
      setCurrentIndex(0)
      setUserAnswers({})
      setCompletedReview([])
      setSelectedAnswer(null)
      setShowFeedback(false)
      setScore(0)
      setErrorMessage("")
      setQuestions([])
      setSavingResults(false)
      setTimeLeft(QUESTION_TIME)
      setTimeUp(false)

      if (!rawId || Number.isNaN(testId)) {
        setErrorMessage("Invalid test ID.")
        setLoading(false)
        return
      }

      const { data: testData, error: testError } = await supabase
        .from("vr_tests")
        .select("*")
        .eq("id", testId)
        .eq("category", "word-relationships")
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
        setErrorMessage("This Word Relationships test is not available yet.")
        setLoading(false)
        return
      }

      const loadedTest = testData as VRTest
      setTest(loadedTest)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Error getting auth session:", sessionError)
      }

      const user = session?.user ?? null

      if (!user) {
        setUserId(null)
        setUserPlan("guest")
        setLoading(false)
        return
      }

      setUserId(user.id)

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
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

      setUserPlan(safePlan)

      if (!canUserAccessTest(safePlan, loadedTest)) {
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
    const savedTimerPreference = localStorage.getItem(TIMER_STORAGE_KEY)

    if (savedTimerPreference === null) return

    setTimerEnabled(savedTimerPreference === "true")
  }, [])

  useEffect(() => {
    if (finished) return

    setTimeLeft(QUESTION_TIME)
    setTimeUp(false)
  }, [currentIndex, finished])

  useEffect(() => {
    if (!timerEnabled) return
    if (loading || finished || savingResults || showFeedback || timeUp) return
    if (timeLeft <= 0) return

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0))
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [timerEnabled, loading, finished, savingResults, showFeedback, timeUp, timeLeft])

  useEffect(() => {
    if (!timerEnabled) return
    if (loading || finished || savingResults || showFeedback || timeUp) return
    if (timeLeft !== 0) return

    setTimeUp(true)

    const timeout = window.setTimeout(() => {
      handleTimeUp()
    }, 500)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [timerEnabled, loading, finished, savingResults, showFeedback, timeUp, timeLeft])

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

    router.push("/vr/word-relationships")
  }

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  function toggleTimer() {
    setTimerEnabled((prev) => {
      const next = !prev

      localStorage.setItem(TIMER_STORAGE_KEY, String(next))
      setTimeLeft(QUESTION_TIME)
      setTimeUp(false)

      return next
    })
  }

  async function handleTimeUp() {
    if (!currentQuestion || !hasAccess || finished || savingResults || showFeedback) return

    const isLastQuestion = currentIndex === questions.length - 1

    const finalAnswers = {
      ...userAnswers,
    }

    if (selectedAnswer) {
      finalAnswers[currentQuestion.id] = selectedAnswer
    }

    if (isLastQuestion) {
      const finalScore = questions.reduce((total, question) => {
        return finalAnswers[question.id] === question.correct_answer
          ? total + 1
          : total
      }, 0)

      await saveResults(finalScore, finalAnswers)
      return
    }

    setUserAnswers(finalAnswers)
    setCurrentIndex((prev) => prev + 1)
    setSelectedAnswer(null)
    setShowFeedback(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleSelectAnswer(answer: AnswerOption) {
    if (showFeedback || !hasAccess || savingResults || finished) return
    setSelectedAnswer(answer)
  }

  function handleCheckAnswer() {
    if (!currentQuestion || !selectedAnswer || !hasAccess || savingResults || finished) return

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
    if (!currentQuestion || !hasAccess || !selectedAnswer || savingResults) return

    const isLastQuestion = currentIndex === questions.length - 1

    const finalAnswers = {
      ...userAnswers,
      [currentQuestion.id]: selectedAnswer,
    }

    if (isLastQuestion) {
      const finalScore = questions.reduce((total, question) => {
        return finalAnswers[question.id] === question.correct_answer
          ? total + 1
          : total
      }, 0)

      await saveResults(finalScore, finalAnswers)
      return
    }

    setCurrentIndex((prev) => prev + 1)
    setSelectedAnswer(null)
    setShowFeedback(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function saveResults(finalScore: number, finalAnswers: UserAnswerMap) {
    if (!userId || !test) return
    if (questions.length === 0) return

    setSavingResults(true)
    setErrorMessage("")

    try {
      const totalQuestions = questions.length
      const successRate =
        totalQuestions > 0 ? Math.round((finalScore / totalQuestions) * 100) : 0

      const category = test.category || "word-relationships"

      const fullReview: CompletedQuestionReview[] = questions.map((question) => {
        const selected = finalAnswers[question.id] ?? null

        return {
          question_id: question.id,
          question_order: question.question_order,
          question_text: question.question_text,
          question_image_url: null,
          options: {
            A: question.option_a,
            B: question.option_b,
            C: question.option_c,
            D: question.option_d,
          },
          option_images: {
            A: null,
            B: null,
            C: null,
            D: null,
          },
          user_answer: selected,
          correct_answer: question.correct_answer,
          user_answer_text: selected ? getOptionText(question, selected) : null,
          correct_answer_text: getOptionText(question, question.correct_answer),
          user_answer_image_url: null,
          correct_answer_image_url: null,
          is_correct: selected === question.correct_answer,
          explanation: question.explanation,
          explanation_image_url: null,
          difficulty: question.difficulty ?? test.difficulty ?? null,
        }
      })

      const progressPayload = {
        user_id: userId,
        test_id: test.id,
        category,
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

      const latestResultPayload = {
        user_id: userId,
        subject: "vr",
        category,
        subcategory: "",
        subcategory_two: "",
        subcategory_three: "",
        test_id: test.id,
        test_title: test.title,
        total_questions: totalQuestions,
        correct_answers: finalScore,
        success_rate: successRate,
        difficulty: test.difficulty ?? null,
        answers: fullReview,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: latestResultError } = await supabase
        .from("latest_test_results")
        .upsert([latestResultPayload], {
          onConflict:
            "user_id,subject,category,subcategory,subcategory_two,subcategory_three,test_id",
        })

      if (latestResultError) {
        console.error("Error saving latest full VR test result:", {
          message: latestResultError.message,
          details: latestResultError.details,
          hint: latestResultError.hint,
          code: latestResultError.code,
          full: latestResultError,
          payload: latestResultPayload,
        })

        setErrorMessage(
          "Your score was saved, but the full test result could not be saved for later."
        )
      }

      const reviewAttemptedAt = new Date().toISOString()

      const reviewRows = questions
        .filter((question) => finalAnswers[question.id] !== question.correct_answer)
        .map((question) => ({
          user_id: userId,
          test_id: test.id,
          question_id: question.id,
          category,
          question_text: question.question_text,
          user_answer: finalAnswers[question.id] ?? null,
          correct_answer: question.correct_answer,
          difficulty: question.difficulty ?? test.difficulty ?? null,
          updated_at: reviewAttemptedAt,
          last_attempted_at: reviewAttemptedAt,
        }))

      const correctedReviewQuestionIds = questions
        .filter((question) => finalAnswers[question.id] === question.correct_answer)
        .map((question) => question.id)

      if (reviewRows.length > 0) {
        const { error: reviewError } = await supabase
          .from("vr_review")
          .upsert(reviewRows, {
            onConflict: "user_id,question_id",
          })

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

      if (correctedReviewQuestionIds.length > 0) {
        const { error: reviewDeleteError } = await supabase
          .from("vr_review")
          .delete()
          .eq("user_id", userId)
          .in("question_id", correctedReviewQuestionIds)

        if (reviewDeleteError) {
          console.error("Error removing corrected VR review questions:", {
            message: reviewDeleteError.message,
            details: reviewDeleteError.details,
            hint: reviewDeleteError.hint,
            code: reviewDeleteError.code,
            full: reviewDeleteError,
          })
        }
      }

      setUserAnswers(finalAnswers)
      setCompletedReview(fullReview)
      setScore(finalScore)
      setFinished(true)
      setSavingResults(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error) {
      console.error("Unexpected VR submit error:", error)
      setErrorMessage("Something went wrong while saving your result. Please try again.")
      setSavingResults(false)
    }
  }

  function restartTest() {
    setFinished(false)
    setCurrentIndex(0)
    setUserAnswers({})
    setCompletedReview([])
    setSelectedAnswer(null)
    setShowFeedback(false)
    setScore(0)
    setErrorMessage("")
    setTimeLeft(QUESTION_TIME)
    setTimeUp(false)
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
        <p style={styles.message}>Loading Word Relationships test...</p>
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
                This Word Relationships test is not available yet.
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

  if (userPlan === "guest") {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.container}>
            <div style={styles.emptyCard}>
              <h2 style={styles.cardTitle}>Sign in to start this test</h2>

              <p style={styles.subtitle}>
                Please sign in or create a free account to access YanBo Learning
                VR tests and save progress.
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

  if (!hasAccess) {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.container}>
            <div style={styles.emptyCard}>
              <h2 style={styles.cardTitle}>This test is for paid members</h2>

              <p style={styles.subtitle}>
                Free members can access free tests only. Monthly and annual members
                can access all YanBo Learning VR tests.
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
              <h1 style={styles.title}>🧠 Word Relationships Test Complete</h1>
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
                  <strong>Category:</strong> Word Relationships
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

            <div style={styles.reviewCard}>
              <h2 style={styles.cardTitle}>Full Test Review</h2>

              <p style={styles.subtitle}>
                Here are all the questions, your answers, and the correct answers.
              </p>

              <div style={styles.reviewList}>
                {completedReview.map((item, index) => (
                  <div
                    key={item.question_id}
                    style={{
                      ...styles.reviewQuestionCard,
                      borderColor: item.is_correct ? "#86efac" : "#fecaca",
                      background: item.is_correct ? "#f0fdf4" : "#fef2f2",
                    }}
                  >
                    <div style={styles.reviewQuestionTop}>
                      <h3 style={styles.reviewQuestionTitle}>Question {index + 1}</h3>

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

                    <div style={styles.reviewOptionsGrid}>
                      {(["A", "B", "C", "D"] as const).map((option) => {
                        const isUserAnswer = item.user_answer === option
                        const isCorrectAnswer = item.correct_answer === option

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
                            <strong>{option}.</strong> {item.options[option]}

                            {isCorrectAnswer && (
                              <span style={styles.optionTag}>Correct answer</span>
                            )}

                            {isUserAnswer && (
                              <span style={styles.optionTag}>Your answer</span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div style={styles.reviewAnswerBox}>
                      <p>
                        <strong>Your answer:</strong>{" "}
                        {item.user_answer
                          ? `${item.user_answer} — ${item.user_answer_text}`
                          : "No answer"}
                      </p>

                      <p>
                        <strong>Correct answer:</strong>{" "}
                        {item.correct_answer} — {item.correct_answer_text}
                      </p>

                      {item.explanation && item.explanation.trim() !== "" && (
                        <p>
                          <strong>Explanation:</strong> {item.explanation}
                        </p>
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

              <div style={styles.timerBox}>
                <button
                  type="button"
                  onClick={toggleTimer}
                  style={{
                    ...styles.timerToggleButton,
                    background: timerEnabled ? "#dcfce7" : "#e5e7eb",
                    color: timerEnabled ? "#166534" : "#111827",
                  }}
                >
                  Timer: {timerEnabled ? "ON" : "OFF"}
                </button>

                {timerEnabled && (
                  <span
                    style={{
                      ...styles.timerText,
                      color: timeLeft <= 10 || timeUp ? "#dc2626" : "#374151",
                    }}
                  >
                    {timeUp ? "Time's up!" : `Time left: ${formatTime(timeLeft)}`}
                  </span>
                )}
              </div>
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
                    disabled={showFeedback || savingResults}
                    style={{
                      ...styles.optionButton,
                      background,
                      border,
                      cursor: showFeedback || savingResults ? "default" : "pointer",
                    }}
                  >
                    <strong>{answerKey}.</strong> {optionText}
                  </button>
                )
              })}
            </div>

            {!showFeedback ? (
              <div style={styles.submitRow}>
                <ReportQuestionButton
                  subject="vr"
                  category="word-relationships"
                  testId={testId}
                  questionId={currentQuestion.id}
                />

                <button
                  type="button"
                  onClick={handleCheckAnswer}
                  disabled={!selectedAnswer || savingResults}
                  style={{
                    ...styles.startButton,
                    opacity: selectedAnswer && !savingResults ? 1 : 0.6,
                    cursor:
                      selectedAnswer && !savingResults ? "pointer" : "not-allowed",
                  }}
                >
                  Check Answer
                </button>
              </div>
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

                <div style={styles.feedbackActionRow}>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={savingResults}
                    style={{
                      ...styles.startButton,
                      opacity: savingResults ? 0.7 : 1,
                      cursor: savingResults ? "not-allowed" : "pointer",
                    }}
                  >
                    {savingResults
                      ? "Saving..."
                      : currentIndex === questions.length - 1
                        ? "Finish Test"
                        : "Next Question"}
                  </button>
                </div>
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

  reviewCard: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    marginTop: "24px",
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

  timerBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  timerToggleButton: {
    padding: "8px 12px",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  timerText: {
    fontSize: "15px",
    fontWeight: 700,
    whiteSpace: "nowrap",
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

  submitRow: {
    width: "100%",
    marginTop: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  feedbackActionRow: {
    width: "100%",
    marginTop: "20px",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
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

  optionTag: {
    display: "inline-block",
    marginLeft: "8px",
    fontSize: "13px",
    fontWeight: 700,
  },

  reviewAnswerBox: {
    background: "rgba(255,255,255,0.75)",
    borderRadius: "12px",
    padding: "14px",
    lineHeight: 1.6,
  },

  message: {
    textAlign: "center",
    marginTop: "40px",
    fontSize: "18px",
  },
}