"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Header from "../../../../../components/Header"
import ReportQuestionButton from "../../../../../components/ReportQuestionButton"
import StudentAvatarPortrait from "../../../../../components/avatar/StudentAvatarPortrait"
import { supabase } from "../../../../../lib/supabaseClient"
import { useParams, useRouter, useSearchParams } from "next/navigation"

const MAIN_CATEGORY = "punctuation"
const SUBCATEGORY = "comma"
const RESULT_CATEGORY = "comma"
const REVIEW_STORAGE_KEY = "comma_review_ids"
const QUESTION_TIME = 60
const TIMER_STORAGE_KEY = "comma_timer_enabled"

type AnswerOption = "A" | "B" | "C" | "D"
type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin"

type AvatarConfig = {
  base: "yan" | "bo"
  skinTone: "light" | "medium" | "dark"
  eyeColor: "brown" | "blue" | "black"
  glasses: string
  background: string
  hat: string
  badge: string
}

const defaultAvatar: AvatarConfig = {
  base: "bo",
  skinTone: "light",
  eyeColor: "blue",
  glasses: "none",
  background: "plain",
  hat: "none",
  badge: "none",
}

type CommaPunctuationTest = {
  id: number
  title: string
  description: string | null
  difficulty: number | null
  created_at: string
  is_free: boolean
}

type CommaPunctuationQuestion = {
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

export default function CommaPunctuationTestPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id
  const testId = Number(rawId)

  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState<UserPlan>("guest")
  const [test, setTest] = useState<CommaPunctuationTest | null>(null)
  const [questions, setQuestions] = useState<CommaPunctuationQuestion[]>([])

  const [answers, setAnswers] = useState<UserAnswerMap>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [rewardMessage, setRewardMessage] = useState("")
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(defaultAvatar)
  const [avatarName, setAvatarName] = useState("Bo")
  const [reviewIds, setReviewIds] = useState<number[]>([])
  const [timerEnabled, setTimerEnabled] = useState(false)
  const [timerPreferenceLoaded, setTimerPreferenceLoaded] = useState(false)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [timeUpMessage, setTimeUpMessage] = useState("")
  const [timeExpiredProcessing, setTimeExpiredProcessing] = useState(false)

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
      setTimeLeft(QUESTION_TIME)
      setTimeUpMessage("")
      setTimeExpiredProcessing(false)

      if (!rawId || Number.isNaN(testId)) {
        setErrorMessage("Invalid Comma test ID.")
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
        console.error("Error loading comma test:", {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code,
        })

        setErrorMessage("Could not load this Comma test.")
        setLoading(false)
        return
      }

      const loadedTest = testData as CommaPunctuationTest
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

      const { data: savedAvatar, error: avatarError } = await supabase
        .from("student_avatars")
        .select("selected_base, avatar_config, avatar_name")
        .eq("user_id", user.id)
        .maybeSingle()

      if (avatarError) {
        console.error("Error loading saved avatar:", avatarError)
      }

      if (savedAvatar) {
        const savedConfig = (savedAvatar.avatar_config || {}) as Partial<AvatarConfig>
        const selectedBase = savedAvatar.selected_base

        setAvatarConfig({
          ...defaultAvatar,
          ...savedConfig,
          base:
            selectedBase === "yan" || selectedBase === "bo"
              ? selectedBase
              : savedConfig.base === "yan" || savedConfig.base === "bo"
                ? savedConfig.base
                : defaultAvatar.base,
        })

        setAvatarName(
          savedAvatar.avatar_name ||
            (selectedBase === "yan" || savedConfig.base === "yan" ? "Yan" : "Bo")
        )
      }

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
        console.error("Error loading comma questions:", {
          message: questionError.message,
          details: questionError.details,
          hint: questionError.hint,
          code: questionError.code,
        })

        setErrorMessage("Could not load the questions for this test.")
        setLoading(false)
        return
      }

      setQuestions((questionData || []) as CommaPunctuationQuestion[])
      setLoading(false)
    }

    loadPage()
  }, [rawId, testId, mode, reviewIds.join(",")])

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

    if (mode === "review") {
      router.push("/english/punctuation/comma?mode=review")
      return
    }

    router.push("/english/punctuation/comma")
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

    return `${minutes}:${String(seconds).padStart(2, "0")}`
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

    console.error("Error upserting latest comma result:", {
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
      console.error("Error deleting old comma result:", {
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
      console.error("Error saving latest comma result:", {
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

  function getLocalRewardMessage(successRate: number) {
    if (successRate < 50) return "Score 50% or more next time to earn YanBo Coins."

    if (successRate < 75) {
      return "Not bad — you earned 1 YanBo Coin. Keep practising and you can do even better!"
    }

    if (successRate < 90) {
      return "Good job — you earned 2 YanBo Coins. Keep practising to get even better!"
    }

    return "Brilliant work — you earned 3 YanBo Coins!"
  }

  function getYanBoCoinRewardMessage(coins: number) {
    if (coins === 1) {
      return "Not bad — you earned 1 YanBo Coin. Keep practising and you can do even better!"
    }

    if (coins === 2) {
      return "Good job — you earned 2 YanBo Coins. Keep practising to get even better!"
    }

    if (coins >= 3) return "Brilliant work — you earned 3 YanBo Coins!"

    return "Score 50% or more next time to earn YanBo Coins."
  }

  async function awardYanBoCoins(successRate: number) {
    if (!test || mode === "review") return

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        setRewardMessage(
          "Your result was saved, but YanBo Coins could not be awarded because the login session could not be verified."
        )
        return
      }

      const response = await fetch("/api/tokens/normal-test-reward", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subject: "english",
          category: RESULT_CATEGORY,
          testId: test.id,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        console.error("Error awarding YanBo Coins for comma:", data)

        if (typeof data?.message === "string" && data.message.trim() !== "") {
          setRewardMessage(data.message)
          return
        }

        setRewardMessage(
          "Your result was saved, but YanBo Coins could not be awarded. Please try again later."
        )
        return
      }

      const awardedCoins =
        typeof data?.coinsAwarded === "number" ? data.coinsAwarded : null

      if (awardedCoins !== null) {
        setRewardMessage(getYanBoCoinRewardMessage(awardedCoins))
        return
      }

      setRewardMessage(getLocalRewardMessage(successRate))
    } catch (rewardError) {
      console.error("Error awarding YanBo Coins for comma:", rewardError)
      setRewardMessage(
        "Your result was saved, but YanBo Coins could not be awarded. Please try again later."
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
    const nowIso = new Date().toISOString()

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
      updated_at: string
      last_attempted_at: string
    }[] = []

    const correctlyAnsweredReviewQuestionIds: number[] = []

    for (const question of questions) {
      const selected = finalAnswers[question.id]

      if (selected === question.correct_answer) {
        correctAnswers += 1
        correctlyAnsweredReviewQuestionIds.push(question.id)
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
          updated_at: nowIso,
          last_attempted_at: nowIso,
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
      console.error("Error saving comma progress:", {
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
      setTimeExpiredProcessing(false)
      return
    }

    await saveLatestTestResult(
      finalAnswers,
      correctAnswers,
      totalQuestions,
      successRate
    )

    await awardYanBoCoins(successRate)

    if (wrongAnswersForReview.length > 0) {
      const { error: reviewError } = await supabase
        .from("english_review")
        .upsert(wrongAnswersForReview, {
          onConflict: "user_id,question_id",
        })

      if (reviewError) {
        console.error("Error saving comma review:", {
          message: reviewError.message,
          details: reviewError.details,
          hint: reviewError.hint,
          code: reviewError.code,
        })
      }
    }

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
          "Error removing correctly answered comma review items:",
          {
            message: deleteReviewError.message,
            details: deleteReviewError.details,
            hint: deleteReviewError.hint,
            code: deleteReviewError.code,
          }
        )
      }
    }

    const existingReviewIds = getStoredReviewIds()
    const newWrongIds = wrongAnswersForReview.map((row) => row.question_id)
    const updatedReviewIds = Array.from(
      new Set([...existingReviewIds, ...newWrongIds])
    ).filter((id) => !correctlyAnsweredReviewQuestionIds.includes(id))

    setStoredReviewIds(updatedReviewIds)

    setScore(correctAnswers)
    setFinished(true)
    setSubmitting(false)
    setTimeExpiredProcessing(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function getOptionText(
    question: CommaPunctuationQuestion,
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
    setRewardMessage("")
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
        <p style={styles.message}>
          {mode === "review"
            ? "Loading Comma review..."
            : "Loading Comma test..."}
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
              Back to Comma
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
            <h1 style={styles.title}>Comma test not found</h1>

            <button onClick={goBackSafely} style={styles.primaryButton}>
              Back to Comma
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
                Back to Comma
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
                Back to Comma
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
                Back to Comma
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
                  : "💬 Comma Test Complete"}
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
                  <strong>Category:</strong> Comma
                </p>

                {submitting && <p style={styles.resultText}>Saving results...</p>}

                {errorMessage && <p style={styles.inlineError}>{errorMessage}</p>}

                {!errorMessage && rewardMessage && (
                  <div style={styles.rewardAvatarBox}>
                    <StudentAvatarPortrait
                      config={avatarConfig}
                      name={avatarName}
                      size={92}
                    />

                    <p style={styles.rewardMessage}>{rewardMessage}</p>
                  </div>
                )}
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
                  Back to Comma
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
                    <span>{optionText}</span>
                  </button>
                )
              })}
            </div>

            {!showFeedback ? (
              <div style={styles.submitRow}>
                <div style={styles.reportWrap}>
                  <ReportQuestionButton
                    subject="english"
                    category="comma"
                    testId={testId}
                    questionId={currentQuestion.id}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCheckAnswer}
                  disabled={!selectedAnswer || submitting || timeExpiredProcessing}
                  style={{
                    ...styles.checkButton,
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
                      ...styles.nextButton,
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

  rewardAvatarBox: {
    marginTop: "16px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
  },

  rewardMessage: {
    flex: 1,
    minWidth: "220px",
    margin: 0,
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#ecfdf5",
    color: "#065f46",
    fontSize: "16px",
    fontWeight: 700,
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
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  reportWrap: {
    display: "flex",
    alignItems: "center",
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

  checkButton: {
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

  nextButton: {
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