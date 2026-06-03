"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Header from "../../../../components/Header"
import ReportQuestionButton from "../../../../components/ReportQuestionButton"
import { supabase } from "../../../../lib/supabaseClient"
import { useParams, useRouter } from "next/navigation"

const RESULT_CATEGORY = "codes-spatial-logic"
const NVR_CATEGORY = "codes-spatial-logic"
const QUESTION_TIME = 60
const TIMER_STORAGE_KEY = "nvr_codes_spatial_logic_timer_enabled"

type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin"
type AnswerOption = "A" | "B" | "C" | "D"

type NVRTest = {
  id: number
  title: string
  category: string | null
  difficulty: number | null
  access_level: string | null
  is_free: boolean | null
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
  correct_answer: AnswerOption
  explanation: string | null
  difficulty: number | null
  question_order: number
  created_at: string
}

type SavedQuestionReview = {
  question_id: number
  question_order: number
  question_text: string
  question_image_url?: string | null
  options: Record<AnswerOption, string | null>
  option_images?: Partial<Record<AnswerOption, string | null>>
  user_answer: AnswerOption | null
  correct_answer: AnswerOption
  user_answer_text: string | null
  correct_answer_text: string | null
  user_answer_image_url?: string | null
  correct_answer_image_url?: string | null
  is_correct: boolean
  explanation: string | null
  explanation_image_url?: string | null
  difficulty: number | null
}

type UserAnswerMap = {
  [questionId: number]: AnswerOption
}

function hasFullAccess(plan: UserPlan) {
  return plan === "monthly" || plan === "annual" || plan === "admin"
}

function isFreeTest(test: NVRTest) {
  return test.is_free === true || test.access_level === "free"
}

export default function NVRCodesSpatialLogicTestPage() {
  const params = useParams()
  const router = useRouter()

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id
  const testId = Number(rawId)

  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState<UserPlan>("guest")
  const [test, setTest] = useState<NVRTest | null>(null)
  const [questions, setQuestions] = useState<NVRQuestion[]>([])

  const [answers, setAnswers] = useState<UserAnswerMap>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timerPreferenceLoaded, setTimerPreferenceLoaded] = useState(false)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [timeUpMessage, setTimeUpMessage] = useState("")
  const [timeExpiredProcessing, setTimeExpiredProcessing] = useState(false)

  const currentQuestion = questions[currentIndex]

  const resultHref = `/results/nvr/${RESULT_CATEGORY}/${testId}`

  const canAccessTest = useMemo(() => {
    if (!test) return false
    return hasFullAccess(plan) || (plan === "free" && isFreeTest(test))
  }, [plan, test])

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])

  const shouldWarnBeforeLeaving = answeredCount > 0 && !finished && !submitting

  const selectedAnswerText = useMemo(() => {
    if (!currentQuestion || !selectedAnswer) return ""
    return getOptionText(currentQuestion, selectedAnswer) || ""
  }, [currentQuestion, selectedAnswer])

  useEffect(() => {
    async function loadPage() {
      setLoading(true)
      setErrorMessage("")
      setQuestions([])
      setAnswers({})
      setCurrentIndex(0)
      setSelectedAnswer(null)
      setShowFeedback(false)
      setFinished(false)
      setScore(0)
      setSubmitting(false)
      setTimeLeft(QUESTION_TIME)
      setTimeUpMessage("")
      setTimeExpiredProcessing(false)

      if (!rawId || Number.isNaN(testId)) {
        setErrorMessage("Invalid NVR test ID.")
        setLoading(false)
        return
      }

      const { data: testData, error: testError } = await supabase
        .from("nvr_tests")
        .select("id, title, category, difficulty, access_level, is_free, created_at")
        .eq("id", testId)
        .eq("category", NVR_CATEGORY)
        .single()

      if (testError || !testData) {
        console.error("Error loading NVR test:", {
          message: testError?.message,
          details: testError?.details,
          hint: testError?.hint,
          code: testError?.code,
          full: testError,
        })

        setErrorMessage("Could not load this Codes & Spatial Logic test.")
        setLoading(false)
        return
      }

      const loadedTest = testData as NVRTest
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
        setPlan("guest")
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

      setPlan(safePlan)

      const canOpenTest =
        hasFullAccess(safePlan) || (safePlan === "free" && isFreeTest(loadedTest))

      if (!canOpenTest) {
        setLoading(false)
        return
      }

      const { data: questionData, error: questionError } = await supabase
        .from("nvr_questions")
        .select("*")
        .eq("test_id", testId)
        .order("question_order", { ascending: true })

      if (questionError) {
        console.error("Error loading NVR questions:", {
          message: questionError.message,
          details: questionError.details,
          hint: questionError.hint,
          code: questionError.code,
          full: questionError,
        })

        setErrorMessage("Could not load the questions for this test.")
        setLoading(false)
        return
      }

      setQuestions((questionData || []) as NVRQuestion[])
      setLoading(false)
    }

    loadPage()
  }, [rawId, testId])

  useEffect(() => {
    const savedTimerSetting = window.localStorage.getItem(TIMER_STORAGE_KEY)

    if (savedTimerSetting !== null) {
      setTimerEnabled(savedTimerSetting === "true")
    }

    setTimerPreferenceLoaded(true)
  }, [])

  useEffect(() => {
    if (!timerPreferenceLoaded) return

    window.localStorage.setItem(TIMER_STORAGE_KEY, String(timerEnabled))
  }, [timerEnabled, timerPreferenceLoaded])

  useEffect(() => {
    setTimeLeft(QUESTION_TIME)
    setTimeUpMessage("")
    setTimeExpiredProcessing(false)
  }, [currentIndex, timerEnabled])

  useEffect(() => {
    if (!timerEnabled) return
    if (!currentQuestion) return
    if (finished || submitting || showFeedback || timeExpiredProcessing) return

    if (timeLeft <= 0) {
      void handleTimeUp()
      return
    }

    const timeoutId = window.setTimeout(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0))
    }, 1000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [
    timerEnabled,
    currentQuestion,
    finished,
    submitting,
    showFeedback,
    timeExpiredProcessing,
    timeLeft,
  ])

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
      "Not all questions have been finished. Are you sure you want to leave this test?"
    )
  }

  function goBackSafely() {
    const confirmed = confirmLeaveIfNeeded()
    if (!confirmed) return

    router.push("/nvr/codes-spatial-logic")
  }

  function handleSelectAnswer(option: AnswerOption) {
    if (showFeedback || finished || submitting || timeExpiredProcessing) return
    setSelectedAnswer(option)
  }

  function handleCheckAnswer() {
    if (
      !currentQuestion ||
      !selectedAnswer ||
      submitting ||
      finished ||
      timeExpiredProcessing
    ) {
      return
    }

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer,
    }))

    setShowFeedback(true)
  }

  async function handleNext() {
    if (
      !currentQuestion ||
      !selectedAnswer ||
      !showFeedback ||
      submitting ||
      timeExpiredProcessing
    ) {
      return
    }

    const isLastQuestion = currentIndex === questions.length - 1

    const finalAnswers = {
      ...answers,
      [currentQuestion.id]: selectedAnswer,
    }

    if (isLastQuestion) {
      await submitResults(finalAnswers)
      return
    }

    setCurrentIndex((prev) => prev + 1)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setTimeLeft(QUESTION_TIME)
    setTimeUpMessage("")
    setTimeExpiredProcessing(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleTimeUp() {
    if (!currentQuestion || submitting || finished || timeExpiredProcessing) return

    setTimeExpiredProcessing(true)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setTimeUpMessage("Time’s up!")

    const isLastQuestion = currentIndex === questions.length - 1
    const finalAnswers = { ...answers }

    await new Promise((resolve) => window.setTimeout(resolve, 900))

    if (isLastQuestion) {
      await submitResults(finalAnswers)
      return
    }

    setCurrentIndex((prev) => prev + 1)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setTimeLeft(QUESTION_TIME)
    setTimeUpMessage("")
    setTimeExpiredProcessing(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  function buildSavedAnswers(finalAnswers: UserAnswerMap): SavedQuestionReview[] {
    return questions.map((question, index) => {
      const userAnswer = finalAnswers[question.id] ?? null
      const correctAnswer = question.correct_answer

      return {
        question_id: question.id,
        question_order: question.question_order ?? index + 1,
        question_text: question.question_text,
        question_image_url: question.image_url,
        options: {
          A: question.option_a,
          B: question.option_b,
          C: question.option_c,
          D: question.option_d,
        },
        option_images: {
          A: question.option_a_image_url,
          B: question.option_b_image_url,
          C: question.option_c_image_url,
          D: question.option_d_image_url,
        },
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        user_answer_text: userAnswer ? getOptionText(question, userAnswer) : null,
        correct_answer_text: getOptionText(question, correctAnswer),
        user_answer_image_url: userAnswer
          ? getOptionImage(question, userAnswer)
          : null,
        correct_answer_image_url: getOptionImage(question, correctAnswer),
        is_correct: userAnswer === correctAnswer,
        explanation: question.explanation,
        explanation_image_url: null,
        difficulty: question.difficulty ?? test?.difficulty ?? null,
      }
    })
  }

  async function saveLatestTestResult(
    finalAnswers: UserAnswerMap,
    correctAnswers: number,
    totalQuestions: number,
    successRate: number
  ) {
    if (!userId || !test) return

    const completedAt = new Date().toISOString()

    const payload = {
      user_id: userId,
      subject: "nvr",
      category: RESULT_CATEGORY,
      subcategory: "",
      subcategory_two: "",
      subcategory_three: "",
      test_id: test.id,
      test_title: test.title,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      success_rate: successRate,
      difficulty: test.difficulty ?? null,
      answers: buildSavedAnswers(finalAnswers),
      completed_at: completedAt,
      updated_at: completedAt,
    }

    const { error: upsertError } = await supabase
      .from("latest_test_results")
      .upsert([payload], {
        onConflict:
          "user_id,subject,category,subcategory,subcategory_two,subcategory_three,test_id",
      })

    if (!upsertError) return

    console.error("Error upserting latest NVR result:", {
      message: upsertError.message,
      details: upsertError.details,
      hint: upsertError.hint,
      code: upsertError.code,
      payload,
    })

    const { error: deleteError } = await supabase
      .from("latest_test_results")
      .delete()
      .eq("user_id", userId)
      .eq("subject", "nvr")
      .eq("category", RESULT_CATEGORY)
      .eq("subcategory", "")
      .eq("subcategory_two", "")
      .eq("subcategory_three", "")
      .eq("test_id", test.id)

    if (deleteError) {
      console.error("Error deleting old NVR result:", {
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
        code: deleteError.code,
      })
    }

    const { error: insertError } = await supabase
      .from("latest_test_results")
      .insert([payload])

    if (insertError) {
      console.error("Error saving latest NVR result:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        payload,
      })

      setErrorMessage("Progress was saved, but the full test result could not be saved.")
    }
  }

  async function submitResults(finalAnswers: UserAnswerMap) {
    if (submitting) return
    if (!userId || !test) return
    if (questions.length === 0) return

    setSubmitting(true)
    setErrorMessage("")

    try {
      let correctAnswers = 0

      const wrongAnswersForReview: {
        user_id: string
        test_id: number
        question_id: number
        category: string | null
        question_text: string
        user_answer: string | null
        correct_answer: string
        difficulty: number | null
      }[] = []

      for (const question of questions) {
        const selected = finalAnswers[question.id]

        if (selected === question.correct_answer) {
          correctAnswers += 1
        } else {
          wrongAnswersForReview.push({
            user_id: userId,
            test_id: test.id,
            question_id: question.id,
            category: test.category,
            question_text: question.question_text,
            user_answer: selected ?? null,
            correct_answer: question.correct_answer,
            difficulty: question.difficulty ?? test.difficulty ?? null,
          })
        }
      }

      const totalQuestions = questions.length
      const successRate =
        totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

      const progressPayload = {
        user_id: userId,
        test_id: test.id,
        category: test.category,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        success_rate: successRate,
        difficulty: test.difficulty ?? null,
      }

      const { error: progressError } = await supabase
        .from("nvr_progress")
        .insert([progressPayload])

      if (progressError) {
        console.error("Error saving NVR progress:", {
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
        setSubmitting(false)
        return
      }

      await saveLatestTestResult(
        finalAnswers,
        correctAnswers,
        totalQuestions,
        successRate
      )

      if (wrongAnswersForReview.length > 0) {
        const { error: reviewError } = await supabase
          .from("nvr_review")
          .insert(wrongAnswersForReview)

        if (reviewError) {
          console.error("Error saving NVR review:", {
            message: reviewError.message,
            details: reviewError.details,
            hint: reviewError.hint,
            code: reviewError.code,
            full: reviewError,
          })
        }
      }

      setScore(correctAnswers)
      setFinished(true)
      setSubmitting(false)
      setTimeExpiredProcessing(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (error) {
      console.error("Unexpected NVR submit error:", error)
      setErrorMessage("Something went wrong while submitting. Please try again.")
      setSubmitting(false)
      setTimeExpiredProcessing(false)
    }
  }

  function getOptionText(question: NVRQuestion, option: AnswerOption) {
    if (option === "A") return question.option_a
    if (option === "B") return question.option_b
    if (option === "C") return question.option_c
    return question.option_d
  }

  function getOptionImage(question: NVRQuestion, option: AnswerOption) {
    if (option === "A") return question.option_a_image_url
    if (option === "B") return question.option_b_image_url
    if (option === "C") return question.option_c_image_url
    return question.option_d_image_url
  }

  function restartSameTest() {
    setAnswers({})
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setFinished(false)
    setScore(0)
    setErrorMessage("")
    setTimeLeft(QUESTION_TIME)
    setTimeUpMessage("")
    setTimeExpiredProcessing(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
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

  if (loading) {
    return (
      <>
        <Header />
        <p style={styles.message}>Loading Codes & Spatial Logic test...</p>
      </>
    )
  }

  if (errorMessage && !test) {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.centerCard}>
            <h1 style={styles.title}>Could not open test</h1>
            <p>{errorMessage}</p>

            <button type="button" onClick={goBackSafely} style={styles.primaryButton}>
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

            <button type="button" onClick={goBackSafely} style={styles.primaryButton}>
              Back to Topic
            </button>
          </div>
        </div>
      </>
    )
  }

  if (plan === "guest") {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.centerCard}>
            <h1 style={styles.title}>Sign in to start this test</h1>

            <p style={styles.subtitle}>
              Please sign in or create a free account to access YanBo Learning
              NVR tests.
            </p>

            <div style={styles.accessButtonRow}>
              <button
                type="button"
                onClick={() => router.push("/login")}
                style={styles.primaryButton}
              >
                Sign In
              </button>

              <button type="button" onClick={goBackSafely} style={styles.secondaryButton}>
                Back to Topic
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!canAccessTest) {
    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.centerCard}>
            <h1 style={styles.title}>This test is for paid members</h1>

            <p style={styles.subtitle}>
              Free members can access free tests only. Monthly and annual members
              can access all YanBo Learning NVR tests.
            </p>

            <div style={styles.accessButtonRow}>
              <button
                type="button"
                onClick={() => router.push("/profile")}
                style={styles.primaryButton}
              >
                View Membership Options
              </button>

              <button type="button" onClick={goBackSafely} style={styles.secondaryButton}>
                Back to Topic
              </button>
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
              <h2>No questions found</h2>
              <p>Add questions in Supabase for this test.</p>

              <button type="button" onClick={goBackSafely} style={styles.primaryButton}>
                Back to Topic
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  const percentage =
    questions.length > 0 ? Math.round((score / questions.length) * 100) : 0

  const badgeColors = getDifficultyColors(test.difficulty)

  if (finished) {
    return (
      <>
        <Header />

        <div style={styles.page}>
          <div style={styles.container}>
            <div style={styles.heroCard}>
              <h1 style={styles.title}>🧠 Codes & Spatial Logic Test Complete</h1>
              <p style={styles.subtitle}>{test.title}</p>
            </div>

            <div style={styles.resultBanner}>
              <div style={styles.cardTop}>
                <h2 style={styles.sectionTitle}>Your Results</h2>

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
                  <strong>Score:</strong> {score} / {questions.length}
                </p>

                <p style={styles.resultText}>
                  <strong>Success Rate:</strong> {percentage}%
                </p>

                <p style={styles.resultText}>
                  <strong>Category:</strong> Codes & Spatial Logic
                </p>

                {submitting && <p style={styles.resultText}>Saving results...</p>}

                {errorMessage && <p style={styles.inlineError}>{errorMessage}</p>}
              </div>

              <div style={styles.resultButtons}>
                <Link href={resultHref} style={styles.primaryLinkButton}>
                  View Full Result
                </Link>

                <button type="button" onClick={restartSameTest} style={styles.secondaryButton}>
                  Retry This Test
                </button>

                <button type="button" onClick={goBackSafely} style={styles.secondaryButton}>
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

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.heroCard}>
            <div style={styles.heroTop}>
              <div>
                <h1 style={styles.title}>🧩 {test.title}</h1>
              </div>

              <div
                style={{
                  ...styles.badge,
                  background: badgeColors.background,
                  color: badgeColors.color,
                }}
              >
                {getDifficultyLabel(test.difficulty)}
              </div>
            </div>



            {errorMessage && <p style={styles.inlineError}>{errorMessage}</p>}
          </div>

          <div style={styles.questionsCard}>
            <div style={styles.progressRow}>
              <span style={styles.progressText}>
                Question {currentIndex + 1} / {questions.length}
              </span>

              <div style={styles.timerControls}>
                <button
                  type="button"
                  onClick={() => {
                    setTimerEnabled((prev) => !prev)
                    setTimeLeft(QUESTION_TIME)
                    setTimeUpMessage("")
                    setTimeExpiredProcessing(false)
                  }}
                  disabled={submitting || timeExpiredProcessing}
                  style={{
                    ...styles.timerButton,
                    opacity: submitting || timeExpiredProcessing ? 0.6 : 1,
                    cursor:
                      submitting || timeExpiredProcessing ? "not-allowed" : "pointer",
                  }}
                >
                  Timer: {timerEnabled ? "ON" : "OFF"}
                </button>

                {timerEnabled && (
                  <span
                    style={{
                      ...styles.timerText,
                      color: timeLeft <= 10 ? "#b91c1c" : "#374151",
                    }}
                  >
                    Time left: {formatTime(timeLeft)}
                  </span>
                )}
              </div>
            </div>

            {timeUpMessage && <p style={styles.timeUpText}>{timeUpMessage}</p>}

            <h2 style={styles.questionTitle}>{currentQuestion.question_text}</h2>

            {currentQuestion.image_url && (
              <div style={styles.questionImageWrap}>
                <img
                  src={currentQuestion.image_url}
                  alt={`Question ${currentIndex + 1} visual`}
                  style={styles.questionImage}
                />
              </div>
            )}

            <div style={styles.optionsGrid}>
              {(["A", "B", "C", "D"] as const).map((option) => {
                const optionText = getOptionText(currentQuestion, option)
                const optionImage = getOptionImage(currentQuestion, option)

                let backgroundColor = "#f3f4f6"
                let borderColor = "transparent"

                if (selectedAnswer === option) {
                  backgroundColor = "#e0e7ff"
                  borderColor = "#4f46e5"
                }

                if (showFeedback) {
                  if (option === currentQuestion.correct_answer) {
                    backgroundColor = "#dcfce7"
                    borderColor = "#16a34a"
                  } else if (
                    selectedAnswer === option &&
                    option !== currentQuestion.correct_answer
                  ) {
                    backgroundColor = "#fee2e2"
                    borderColor = "#dc2626"
                  }
                }

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectAnswer(option)}
                    disabled={showFeedback || submitting || timeExpiredProcessing}
                    style={{
                      ...styles.optionButton,
                      backgroundColor,
                      borderColor,
                      cursor:
                        showFeedback || submitting || timeExpiredProcessing
                          ? "default"
                          : "pointer",
                    }}
                  >
                    <span style={styles.optionLetter}>{option}.</span>

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

            {!showFeedback ? (
              <div style={styles.submitRow}>
                <ReportQuestionButton
                  subject="nvr"
                  category="codes-spatial-logic"
                  testId={testId}
                  questionId={currentQuestion.id}
                />

                <button
                  type="button"
                  onClick={handleCheckAnswer}
                  disabled={!selectedAnswer || submitting || timeExpiredProcessing}
                  style={{
                    ...styles.primaryButton,
                    opacity:
                      selectedAnswer && !submitting && !timeExpiredProcessing ? 1 : 0.6,
                    cursor:
                      selectedAnswer && !submitting && !timeExpiredProcessing
                        ? "pointer"
                        : "not-allowed",
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
                    backgroundColor: isCorrect ? "#f0fdf4" : "#fef2f2",
                    borderColor: isCorrect ? "#86efac" : "#fecaca",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <strong>{isCorrect ? "Correct!" : "Not quite."}</strong>
                  </p>

                  {!isCorrect && (
                    <p style={{ margin: "8px 0 0 0" }}>
                      <strong>Correct answer:</strong>{" "}
                      {currentQuestion.correct_answer}
                    </p>
                  )}

                  {selectedAnswer && (
                    <p style={{ margin: "8px 0 0 0" }}>
                      <strong>Your answer:</strong> {selectedAnswer}
                      {selectedAnswerText ? ` — ${selectedAnswerText}` : ""}
                    </p>
                  )}

                  {currentQuestion.explanation &&
                    currentQuestion.explanation.trim() !== "" && (
                      <p style={{ margin: "8px 0 0 0" }}>
                        <strong>Explanation:</strong>{" "}
                        {currentQuestion.explanation}
                      </p>
                    )}
                </div>

                <div style={styles.feedbackActionRow}>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={submitting || timeExpiredProcessing}
                    style={{
                      ...styles.primaryButton,
                      opacity: submitting || timeExpiredProcessing ? 0.7 : 1,
                      cursor:
                        submitting || timeExpiredProcessing ? "not-allowed" : "pointer",
                    }}
                  >
                    {submitting
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

  progressInfo: {
    marginTop: "20px",
    color: "#444",
    fontWeight: 600,
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

  timerControls: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  timerButton: {
    padding: "8px 12px",
    borderRadius: "999px",
    border: "none",
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 700,
    fontSize: "14px",
  },

  timerText: {
    fontSize: "15px",
    fontWeight: 700,
  },

  timeUpText: {
    margin: "0 0 18px 0",
    color: "#b91c1c",
    fontWeight: 700,
    fontSize: "18px",
  },

  inlineError: {
    marginTop: "12px",
    marginBottom: 0,
    color: "#b91c1c",
    lineHeight: 1.6,
    fontWeight: 600,
  },

  resultBanner: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },

  resultBox: {
    background: "#f9fafb",
    borderRadius: "14px",
    padding: "18px",
    margin: "24px 0",
  },

  resultText: {
    margin: "10px 0",
    fontSize: "18px",
    color: "#111827",
  },

  resultButtons: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "18px",
    justifyContent: "center",
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
    color: "#111827",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },

  questionTitle: {
    marginTop: 0,
    marginBottom: "16px",
    fontSize: "26px",
    lineHeight: 1.5,
    color: "#111827",
  },

  questionImageWrap: {
    marginBottom: "18px",
    textAlign: "center",
  },

  questionImage: {
    maxWidth: "100%",
    maxHeight: "340px",
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
    lineHeight: 1.5,
  },

  optionLetter: {
    fontWeight: 700,
    minWidth: "24px",
  },

  optionContent: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "100%",
  },

  optionImage: {
    maxWidth: "220px",
    maxHeight: "150px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    objectFit: "contain",
    background: "#fff",
  },

  feedbackBox: {
    marginTop: "20px",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid",
    lineHeight: 1.5,
  },

  submitRow: {
    width: "100%",
    marginTop: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  feedbackActionRow: {
    width: "100%",
    marginTop: "24px",
    display: "flex",
    justifyContent: "flex-end",
  },

  backRow: {
    marginTop: "16px",
    display: "flex",
    justifyContent: "center",
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
  },

  primaryLinkButton: {
    display: "inline-block",
    padding: "12px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#d4f5d0",
    color: "#065f46",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
    minWidth: "180px",
    textAlign: "center",
    textDecoration: "none",
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

  accessButtonRow: {
    marginTop: "24px",
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  emptyCard: {
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