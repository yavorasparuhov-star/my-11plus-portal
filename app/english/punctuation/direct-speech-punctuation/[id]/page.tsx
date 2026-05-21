"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Header from "../../../../../components/Header"
import { supabase } from "../../../../../lib/supabaseClient"
import { useParams, useRouter, useSearchParams } from "next/navigation"

const MAIN_CATEGORY = "punctuation"
const SUBCATEGORY = "direct_speech_punctuation"
const RESULT_CATEGORY = "direct-speech-punctuation"
const REVIEW_STORAGE_KEY = "direct_speech_punctuation_review_ids"

type AnswerOption = "A" | "B" | "C" | "D"
type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin"

type DirectSpeechPunctuationTest = {
  id: number
  title: string
  description: string | null
  difficulty: number | null
  created_at: string
  is_free: boolean
}

type DirectSpeechPunctuationQuestion = {
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

type UserAnswerMap = {
  [questionId: number]: AnswerOption
}

function hasFullAccess(plan: UserPlan) {
  return plan === "monthly" || plan === "annual" || plan === "admin"
}

export default function DirectSpeechPunctuationTestPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id
  const testId = Number(rawId)

  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState<UserPlan>("guest")
  const [test, setTest] = useState<DirectSpeechPunctuationTest | null>(null)
  const [questions, setQuestions] = useState<DirectSpeechPunctuationQuestion[]>([])

  const [answers, setAnswers] = useState<UserAnswerMap>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [reviewIds, setReviewIds] = useState<number[]>([])

  const currentQuestion = questions[currentIndex]

  const canAccessTest = useMemo(() => {
    if (!test) return false
    return hasFullAccess(plan) || (plan === "free" && test.is_free)
  }, [plan, test])

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])

  const shouldWarnBeforeLeaving = answeredCount > 0 && !finished && !submitting

  const selectedAnswerText = useMemo(() => {
    if (!currentQuestion || !selectedAnswer) return ""
    return getOptionText(currentQuestion, selectedAnswer)
  }, [currentQuestion, selectedAnswer])

  useEffect(() => {
    if (mode !== "review") {
      setReviewIds([])
      return
    }

    const raw = localStorage.getItem(REVIEW_STORAGE_KEY)

    if (!raw) {
      setReviewIds([])
      return
    }

    try {
      const parsed = JSON.parse(raw)

      if (Array.isArray(parsed)) {
        setReviewIds(parsed.filter((id) => typeof id === "number"))
      } else {
        setReviewIds([])
      }
    } catch {
      setReviewIds([])
    }
  }, [mode])

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

      if (!rawId || Number.isNaN(testId)) {
        setErrorMessage("Invalid Direct Speech Punctuation test ID.")
        setLoading(false)
        return
      }

      const { data: testData, error: testError } = await supabase
        .from("english_tests")
        .select("id, title, description, difficulty, created_at, is_free")
        .eq("id", testId)
        .eq("main_category", MAIN_CATEGORY)
        .eq("subcategory", SUBCATEGORY)
        .single()

      if (testError) {
        console.error("Error loading direct speech punctuation test:", {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code,
        })

        setErrorMessage("Could not load this Direct Speech Punctuation test.")
        setLoading(false)
        return
      }

      const loadedTest = testData as DirectSpeechPunctuationTest
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
        hasFullAccess(safePlan) || (safePlan === "free" && loadedTest.is_free)

      if (!canOpenTest) {
        setLoading(false)
        return
      }

      let questionQuery = supabase
        .from("english_questions")
        .select(
          "id, test_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, question_order, created_at"
        )
        .eq("test_id", testId)
        .eq("main_category", MAIN_CATEGORY)
        .eq("subcategory", SUBCATEGORY)
        .order("question_order", { ascending: true })

      if (mode === "review") {
        if (reviewIds.length === 0) {
          setQuestions([])
          setLoading(false)
          return
        }

        questionQuery = questionQuery.in("id", reviewIds)
      }

      const { data: questionData, error: questionError } = await questionQuery

      if (questionError) {
        console.error("Error loading direct speech punctuation questions:", {
          message: questionError.message,
          details: questionError.details,
          hint: questionError.hint,
          code: questionError.code,
        })

        setErrorMessage("Could not load the questions for this test.")
        setLoading(false)
        return
      }

      setQuestions((questionData || []) as DirectSpeechPunctuationQuestion[])
      setLoading(false)
    }

    loadPage()
  }, [rawId, testId, mode, reviewIds.join(",")])

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

    if (mode === "review") {
      router.push("/english/punctuation/direct-speech-punctuation?mode=review")
      return
    }

    router.push("/english/punctuation/direct-speech-punctuation")
  }

  function getStoredReviewIds() {
    const raw = localStorage.getItem(REVIEW_STORAGE_KEY)

    if (!raw) return []

    try {
      const parsed = JSON.parse(raw)

      if (!Array.isArray(parsed)) return []

      return Array.from(
        new Set(parsed.filter((id): id is number => typeof id === "number"))
      )
    } catch {
      return []
    }
  }

  function setStoredReviewIds(ids: number[]) {
    const uniqueIds = Array.from(new Set(ids))

    if (uniqueIds.length === 0) {
      localStorage.removeItem(REVIEW_STORAGE_KEY)
      return
    }

    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(uniqueIds))
  }

  function handleSelectAnswer(option: AnswerOption) {
    if (showFeedback || finished || submitting) return
    setSelectedAnswer(option)
  }

  function handleCheckAnswer() {
    if (!currentQuestion || !selectedAnswer || submitting || finished) return

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer,
    }))

    setShowFeedback(true)
  }

  async function handleNext() {
    if (!currentQuestion || !selectedAnswer || !showFeedback || submitting) return

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
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function buildSavedAnswers(finalAnswers: UserAnswerMap): SavedQuestionReview[] {
    return questions.map((question, index) => {
      const userAnswer = finalAnswers[question.id] ?? null
      const correctAnswer = question.correct_answer

      return {
        question_id: question.id,
        question_order: question.question_order ?? index + 1,
        question_text: question.question_text,
        question_image_url: null,
        options: {
          A: question.option_a,
          B: question.option_b,
          C: question.option_c,
          D: question.option_d,
        },
        option_images: {},
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        user_answer_text: userAnswer ? getOptionText(question, userAnswer) : null,
        correct_answer_text: getOptionText(question, correctAnswer),
        user_answer_image_url: null,
        correct_answer_image_url: null,
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
      subject: "english",
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

    console.error("Error upserting latest direct speech punctuation result:", {
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
      .eq("subject", "english")
      .eq("category", RESULT_CATEGORY)
      .eq("subcategory", "")
      .eq("subcategory_two", "")
      .eq("subcategory_three", "")
      .eq("test_id", test.id)

    if (deleteError) {
      console.error("Error deleting old direct speech punctuation result:", {
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
      console.error("Error saving latest direct speech punctuation result:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        payload,
      })

      setErrorMessage(
        "Progress was saved, but the full test result could not be saved."
      )
    }
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
      main_category: string
      subcategory: string
      question_text: string
      user_answer: AnswerOption | null
      correct_answer: AnswerOption
      difficulty: number | null
    }[] = []

    const correctlyAnsweredReviewQuestionIds: number[] = []

    for (const question of questions) {
      const selected = finalAnswers[question.id]

      if (selected === question.correct_answer) {
        correctAnswers += 1

        if (mode === "review") {
          correctlyAnsweredReviewQuestionIds.push(question.id)
        }
      } else {
        wrongAnswersForReview.push({
          user_id: userId,
          test_id: test.id,
          question_id: question.id,
          main_category: MAIN_CATEGORY,
          subcategory: SUBCATEGORY,
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
      main_category: MAIN_CATEGORY,
      subcategory: SUBCATEGORY,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      success_rate: successRate,
      difficulty: test.difficulty ?? null,
    }

    const { error: progressError } = await supabase
      .from("english_progress")
      .insert([progressPayload])

    if (progressError) {
      console.error("Error saving direct speech punctuation progress:", {
        message: progressError.message,
        details: progressError.details,
        hint: progressError.hint,
        code: progressError.code,
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

    if (mode === "review") {
      if (correctlyAnsweredReviewQuestionIds.length > 0) {
        const { error: deleteReviewError } = await supabase
          .from("english_review")
          .delete()
          .eq("user_id", userId)
          .eq("main_category", MAIN_CATEGORY)
          .eq("subcategory", SUBCATEGORY)
          .in("question_id", correctlyAnsweredReviewQuestionIds)

        if (deleteReviewError) {
          console.error(
            "Error removing correctly answered direct speech punctuation review items:",
            {
              message: deleteReviewError.message,
              details: deleteReviewError.details,
              hint: deleteReviewError.hint,
              code: deleteReviewError.code,
            }
          )
        }
      }

      const remainingIds = reviewIds.filter(
        (id) => !correctlyAnsweredReviewQuestionIds.includes(id)
      )

      setStoredReviewIds(remainingIds)
    } else if (wrongAnswersForReview.length > 0) {
      const { error: reviewError } = await supabase
        .from("english_review")
        .insert(wrongAnswersForReview)

      if (reviewError) {
        console.error("Error saving direct speech punctuation review:", {
          message: reviewError.message,
          details: reviewError.details,
          hint: reviewError.hint,
          code: reviewError.code,
        })
      }

      const existingReviewIds = getStoredReviewIds()
      const newWrongIds = wrongAnswersForReview.map((row) => row.question_id)
      const updatedReviewIds = Array.from(
        new Set([...existingReviewIds, ...newWrongIds])
      )

      setStoredReviewIds(updatedReviewIds)
    }

    setScore(correctAnswers)
    setFinished(true)
    setSubmitting(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function getOptionText(
    question: DirectSpeechPunctuationQuestion,
    option: AnswerOption
  ) {
    if (option === "A") return question.option_a
    if (option === "B") return question.option_b
    if (option === "C") return question.option_c
    return question.option_d
  }

  function restartSameTest() {
    setAnswers({})
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowFeedback(false)
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
        <p style={styles.message}>
          {mode === "review"
            ? "Loading Direct Speech Punctuation review..."
            : "Loading Direct Speech Punctuation test..."}
        </p>
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

            <button onClick={goBackSafely} style={styles.primaryButton}>
              Back to Direct Speech Punctuation
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
            <h1 style={styles.title}>Direct Speech Punctuation test not found</h1>

            <button onClick={goBackSafely} style={styles.primaryButton}>
              Back to Direct Speech Punctuation
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
              tests.
            </p>

            <div style={styles.accessButtonRow}>
              <button
                onClick={() => router.push("/login")}
                style={styles.primaryButton}
              >
                Sign In
              </button>

              <button onClick={goBackSafely} style={styles.secondaryButton}>
                Back to Direct Speech Punctuation
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
              can access all YanBo Learning tests.
            </p>

            <div style={styles.accessButtonRow}>
              <button
                onClick={() => router.push("/profile")}
                style={styles.primaryButton}
              >
                View Membership Options
              </button>

              <button onClick={goBackSafely} style={styles.secondaryButton}>
                Back to Direct Speech Punctuation
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
              <h2>
                {mode === "review" ? "No review questions found" : "No questions found"}
              </h2>

              <p>
                {mode === "review"
                  ? "There are no saved review questions for this test."
                  : "Add questions in Supabase for this test."}
              </p>

              <button onClick={goBackSafely} style={styles.primaryButton}>
                Back to Direct Speech Punctuation
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
              <h1 style={styles.title}>
                {mode === "review"
                  ? "💬 Review Complete"
                  : "💬 Direct Speech Punctuation Test Complete"}
              </h1>

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
                  <strong>Category:</strong> Direct Speech Punctuation
                </p>

                {submitting && <p style={styles.resultText}>Saving results...</p>}

                {errorMessage && <p style={styles.inlineError}>{errorMessage}</p>}
              </div>

              <div style={styles.resultButtons}>
                <Link
                  href={`/results/english/${RESULT_CATEGORY}/${test.id}`}
                  style={styles.primaryLinkButton}
                >
                  View Full Result
                </Link>

                <button onClick={restartSameTest} style={styles.secondaryButton}>
                  Retry This Set
                </button>

                <button onClick={goBackSafely} style={styles.secondaryButton}>
                  Back to Direct Speech Punctuation
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
                <h1 style={styles.title}>
                  {mode === "review" ? "💬 Review:" : "💬"} {test.title}
                </h1>
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
            </div>

            <h2 style={styles.questionTitle}>{currentQuestion.question_text}</h2>

            <div style={styles.optionsGrid}>
              {(["A", "B", "C", "D"] as const).map((option) => {
                const optionText = getOptionText(currentQuestion, option)

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
                    onClick={() => handleSelectAnswer(option)}
                    disabled={showFeedback || submitting}
                    style={{
                      ...styles.optionButton,
                      backgroundColor,
                      borderColor,
                      cursor: showFeedback || submitting ? "default" : "pointer",
                    }}
                  >
                    <span style={styles.optionLetter}>{option}.</span>
                    <span>{optionText}</span>
                  </button>
                )
              })}
            </div>

            {!showFeedback ? (
              <div style={styles.submitRow}>
                <button
                  type="button"
                  onClick={handleCheckAnswer}
                  disabled={!selectedAnswer || submitting}
                  style={{
                    ...styles.primaryButton,
                    opacity: selectedAnswer && !submitting ? 1 : 0.6,
                    cursor: selectedAnswer && !submitting ? "pointer" : "not-allowed",
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

                <div style={styles.submitRow}>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={submitting}
                    style={{
                      ...styles.primaryButton,
                      opacity: submitting ? 0.7 : 1,
                      cursor: submitting ? "not-allowed" : "pointer",
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

            <div style={styles.backRow}>
              <button onClick={goBackSafely} style={styles.secondaryButton}>
                Back to Direct Speech Punctuation
              </button>
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

  feedbackBox: {
    marginTop: "20px",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid",
    lineHeight: 1.5,
  },

  submitRow: {
    marginTop: "24px",
    display: "flex",
    justifyContent: "center",
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
    background: "#4f46e5",
    color: "white",
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
    background: "#4f46e5",
    color: "white",
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