"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Header from "../../../../components/Header"
import ReportQuestionButton from "../../../../components/ReportQuestionButton"
import { supabase } from "../../../../lib/supabaseClient"

type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin"
type AnswerOption = "A" | "B" | "C" | "D"

const QUESTION_TIME = 60
const TIMER_STORAGE_KEY = "math_shape_space_timer_enabled"

type MathTest = {
  id: number
  title: string
  category: string
  difficulty: number | null
  access_level: string | null
  created_at: string
}

type MathQuestion = {
  id: number
  test_id: number
  question_text: string
  image_url: string | null
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_a_image_url: string | null
  option_b_image_url: string | null
  option_c_image_url: string | null
  option_d_image_url: string | null
  correct_answer: AnswerOption
  explanation: string | null
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

function isFreeTest(accessLevel: string | null) {
  return accessLevel === "free"
}

export default function ShapeAndSpaceTestPage() {
  const params = useParams()
  const router = useRouter()

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id
  const testId = Number(rawId)

  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState<UserPlan>("guest")
  const [test, setTest] = useState<MathTest | null>(null)
  const [questions, setQuestions] = useState<MathQuestion[]>([])

  const [answers, setAnswers] = useState<UserAnswerMap>({})
  const [completedReview, setCompletedReview] = useState<CompletedQuestionReview[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timerPreferenceLoaded, setTimerPreferenceLoaded] = useState(false)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [timeUpMessage, setTimeUpMessage] = useState("")
  const [timeExpiredProcessing, setTimeExpiredProcessing] = useState(false)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")

  const currentQuestion = questions[currentIndex]

  const canAccessTest = useMemo(() => {
    if (!test) return false

    return hasFullAccess(plan) || (plan === "free" && isFreeTest(test.access_level))
  }, [plan, test])

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])

  const shouldWarnBeforeLeaving = answeredCount > 0 && !finished && !submitting

  const selectedAnswerText = useMemo(() => {
    if (!currentQuestion || !selectedAnswer) return ""
    return getOptionText(currentQuestion, selectedAnswer)
  }, [currentQuestion, selectedAnswer])

  useEffect(() => {
    async function loadPage() {
      setLoading(true)
      setErrorMessage("")
      setQuestions([])
      setAnswers({})
      setCompletedReview([])
      setCurrentIndex(0)
      setSelectedAnswer(null)
      setShowFeedback(false)
      setTimeLeft(QUESTION_TIME)
      setTimeUpMessage("")
      setTimeExpiredProcessing(false)
      setFinished(false)
      setScore(0)
      setSubmitting(false)

      if (!rawId || Number.isNaN(testId)) {
        setErrorMessage("Invalid math test ID.")
        setLoading(false)
        return
      }

      const { data: testData, error: testError } = await supabase
        .from("math_tests")
        .select("*")
        .eq("id", testId)
        .eq("category", "shape_space")
        .single()

      if (testError) {
        console.error("Error loading math test:", {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code,
          full: testError,
        })

        setErrorMessage("Could not load this Shape & Space test.")
        setLoading(false)
        return
      }

      const loadedTest = testData as MathTest
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
        hasFullAccess(safePlan) ||
        (safePlan === "free" && isFreeTest(loadedTest.access_level))

      if (!canOpenTest) {
        setLoading(false)
        return
      }

      const { data: questionData, error: questionError } = await supabase
        .from("math_questions")
        .select("*")
        .eq("test_id", testId)
        .order("question_order", { ascending: true })

      if (questionError) {
        console.error("Error loading math questions:", {
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

      setQuestions((questionData || []) as MathQuestion[])
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

    router.push("/math/shape-space")
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

  async function submitResults(finalAnswers: UserAnswerMap) {
    if (submitting) return
    if (!userId || !test) return
    if (questions.length === 0) return

    setSubmitting(true)
    setErrorMessage("")

    let correctAnswers = 0

    const wrongAnswersForReview: {
      user_id: string
      test_id: number
      question_id: number
      category: string
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
          difficulty: test.difficulty ?? null,
        })
      }
    }

    const totalQuestions = questions.length
    const successRate =
      totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

    const fullReview: CompletedQuestionReview[] = questions.map((question) => {
      const selected = finalAnswers[question.id] ?? null

      return {
        question_id: question.id,
        question_order: question.question_order,
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
        user_answer: selected,
        correct_answer: question.correct_answer,
        user_answer_text: selected ? getOptionText(question, selected) : null,
        correct_answer_text: getOptionText(question, question.correct_answer),
        user_answer_image_url: selected ? getOptionImageUrl(question, selected) : null,
        correct_answer_image_url: getOptionImageUrl(
          question,
          question.correct_answer
        ),
        is_correct: selected === question.correct_answer,
        explanation: question.explanation,
        explanation_image_url: null,
        difficulty: test.difficulty ?? null,
      }
    })

    setAnswers(finalAnswers)
    setCompletedReview(fullReview)
    setScore(correctAnswers)
    setFinished(true)
    window.scrollTo({ top: 0, behavior: "smooth" })

    try {
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
        .from("math_progress")
        .insert([progressPayload])

      if (progressError) {
        console.error("Error saving math progress:", {
          message: progressError.message,
          details: progressError.details,
          hint: progressError.hint,
          code: progressError.code,
          full: progressError,
          payload: progressPayload,
        })

        setErrorMessage(
          "Your result is shown below, but the progress history could not be saved."
        )
      }

      const latestResultPayload = {
        user_id: userId,
        subject: "math",
        category: test.category,
        subcategory: "",
        subcategory_two: "",
        subcategory_three: "",
        test_id: test.id,
        test_title: test.title,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        success_rate: successRate,
        difficulty: test.difficulty ?? null,
        answers: fullReview,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data: savedLatestResult, error: latestResultError } = await supabase
        .from("latest_test_results")
        .upsert([latestResultPayload], {
          onConflict:
            "user_id,subject,category,subcategory,subcategory_two,subcategory_three,test_id",
        })
        .select()

      if (latestResultError) {
        console.error("Error saving latest full test result:", {
          message: latestResultError.message,
          details: latestResultError.details,
          hint: latestResultError.hint,
          code: latestResultError.code,
          full: latestResultError,
          payload: latestResultPayload,
        })

        setErrorMessage(
          "Your result is shown below, but the full test result could not be saved for later."
        )
      } else {
        console.log("Latest Shape & Space result saved:", savedLatestResult)
      }

      if (wrongAnswersForReview.length > 0) {
        const { error: reviewError } = await supabase
          .from("math_review")
          .insert(wrongAnswersForReview)

        if (reviewError) {
          console.error("Error saving math review:", {
            message: reviewError.message,
            details: reviewError.details,
            hint: reviewError.hint,
            code: reviewError.code,
            full: reviewError,
          })
        }
      }
    } catch (error) {
      console.error("Unexpected math submit error:", error)
      setErrorMessage(
        "Your result is shown below, but something went wrong while saving it."
      )
    } finally {
      setSubmitting(false)
      setTimeExpiredProcessing(false)
    }
  }

  function getOptionText(question: MathQuestion, option: AnswerOption) {
    if (option === "A") return question.option_a
    if (option === "B") return question.option_b
    if (option === "C") return question.option_c
    return question.option_d
  }

  function getOptionImageUrl(question: MathQuestion, option: AnswerOption) {
    if (option === "A") return question.option_a_image_url
    if (option === "B") return question.option_b_image_url
    if (option === "C") return question.option_c_image_url
    return question.option_d_image_url
  }

  function restartSameTest() {
    setAnswers({})
    setCompletedReview([])
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setTimeLeft(QUESTION_TIME)
    setTimeUpMessage("")
    setTimeExpiredProcessing(false)
    setFinished(false)
    setScore(0)
    setErrorMessage("")
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
        <div style={styles.page}>
          <p style={styles.message}>Loading Shape & Space test...</p>
        </div>
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
            <h1 style={styles.title}>Math test not found</h1>

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
              maths tests.
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
              can access all YanBo Learning maths tests.
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
              <h1 style={styles.title}>📐 Shape & Space Test Complete</h1>
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
                  <strong>Category:</strong> Shape & Space
                </p>

                {submitting && <p style={styles.resultText}>Saving results...</p>}

                {errorMessage && <p style={styles.inlineError}>{errorMessage}</p>}
              </div>

              <div style={styles.resultButtons}>
                <button type="button" onClick={restartSameTest} style={styles.secondaryButton}>
                  Retry This Test
                </button>

                <button type="button" onClick={goBackSafely} style={styles.primaryButton}>
                  Back to Topic
                </button>
              </div>
            </div>

            <div style={styles.reviewCard}>
              <h2 style={styles.sectionTitle}>Full Test Review</h2>

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
                      <div style={styles.reviewQuestionImageWrap}>
                        <img
                          src={item.question_image_url}
                          alt={`Question ${index + 1} diagram`}
                          style={styles.reviewQuestionImage}
                        />
                      </div>
                    )}

                    <div style={styles.reviewOptionsGrid}>
                      {(["A", "B", "C", "D"] as const).map((option) => {
                        const isUserAnswer = item.user_answer === option
                        const isCorrectAnswer = item.correct_answer === option
                        const optionImageUrl = item.option_images[option]

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
                            <strong>{option}.</strong>{" "}

                            {optionImageUrl ? (
                              <img
                                src={optionImageUrl}
                                alt={`Option ${option}`}
                                style={styles.reviewOptionImage}
                              />
                            ) : (
                              item.options[option]
                            )}

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

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.heroCard}>
            <div style={styles.heroTop}>
              <div>
                <h1 style={styles.title}>📐 {test.title}</h1>
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

              <span style={styles.progressText}>
                Answered: {answeredCount} / {questions.length}
              </span>

              <div style={styles.timerControls}>
                <button
                  type="button"
                  onClick={() => setTimerEnabled((prev) => !prev)}
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
                    Time left: {timeLeft}s
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
                  alt="Maths question diagram"
                  style={styles.questionImage}
                />
              </div>
            )}

            <div style={styles.optionsGrid}>
              {(["A", "B", "C", "D"] as const).map((option) => {
                const optionText = getOptionText(currentQuestion, option)
                const optionImageUrl = getOptionImageUrl(currentQuestion, option)

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

                    <span style={styles.optionContent}>
                      {optionImageUrl ? (
                        <img
                          src={optionImageUrl}
                          alt={`Option ${option}`}
                          style={styles.optionImage}
                        />
                      ) : (
                        optionText
                      )}
                    </span>
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
                      {currentQuestion.correct_answer} —{" "}
                      {getOptionText(
                        currentQuestion,
                        currentQuestion.correct_answer
                      )}
                    </p>
                  )}

                  {selectedAnswer && (
                    <p style={{ margin: "8px 0 0 0" }}>
                      <strong>Your answer:</strong> {selectedAnswer} —{" "}
                      {selectedAnswerText}
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
    marginBottom: "24px",
    fontSize: "26px",
    lineHeight: 1.5,
    color: "#111827",
  },

  questionImageWrap: {
    margin: "0 0 24px 0",
    display: "flex",
    justifyContent: "center",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
  },

  questionImage: {
    maxWidth: "100%",
    maxHeight: "360px",
    objectFit: "contain",
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
    flex: 1,
  },

  optionImage: {
    maxWidth: "100%",
    maxHeight: "160px",
    objectFit: "contain",
    display: "block",
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

  reviewCard: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    marginTop: "24px",
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

  reviewQuestionImageWrap: {
    margin: "0 0 16px 0",
    display: "flex",
    justifyContent: "center",
    background: "rgba(255,255,255,0.75)",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "14px",
  },

  reviewQuestionImage: {
    maxWidth: "100%",
    maxHeight: "320px",
    objectFit: "contain",
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

  reviewOptionImage: {
    maxWidth: "100%",
    maxHeight: "120px",
    objectFit: "contain",
    display: "block",
    marginTop: "8px",
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
}
