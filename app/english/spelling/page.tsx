"use client"

import React, { Suspense, useEffect, useState } from "react"
import Header from "../../../components/Header"
import ReportQuestionButton from "../../../components/ReportQuestionButton"
import { supabase } from "../../../lib/supabaseClient"
import { useRouter, useSearchParams } from "next/navigation"

type UserPlan = "guest" | "free" | "monthly" | "annual" | "admin"
type AnswerOption = "A" | "B" | "C" | "D"

type WordRow = {
  id: number
  word: string
  definition: string | null
  difficulty: number | null
  wrong_words: string[] | null
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

type SpellingResult = {
  wordId: number
  word: string
  definition: string | null
  difficulty: number | null
  isCorrect: boolean
  userAnswer: AnswerOption | null
  correctAnswer: AnswerOption
  userAnswerText: string | null
  correctAnswerText: string
  options: Record<AnswerOption, string>
}

const REVIEW_STORAGE_KEY = "spelling_review_ids"
const LEGACY_REVIEW_STORAGE_KEY = "spelling_review_word_ids"
const TOTAL_QUESTIONS = 10
const RESULT_TEST_ID = 0
const OPTION_KEYS: AnswerOption[] = ["A", "B", "C", "D"]

export default function SpellingPage() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <p style={styles.message}>Loading Spelling tests...</p>
        </>
      }
    >
      <SpellingContent />
    </Suspense>
  )
}

function SpellingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reviewMode = searchParams.get("mode") === "review"

  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState<UserPlan>("guest")
  const [authChecked, setAuthChecked] = useState(false)

  const [words, setWords] = useState<WordRow[]>([])
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1)
  const [testStarted, setTestStarted] = useState(false)

  const [showHint, setShowHint] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  const [score, setScore] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)
  const [progressSaved, setProgressSaved] = useState(false)
  const [resultSaved, setResultSaved] = useState(false)
  const [spellingResults, setSpellingResults] = useState<SpellingResult[]>([])
  const [pendingScore, setPendingScore] = useState(0)
  const [pendingResults, setPendingResults] = useState<SpellingResult[]>([])
  const [errorMessage, setErrorMessage] = useState("")

  const [timerEnabled, setTimerEnabled] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [timeLeft, setTimeLeft] = useState(15)

  const [repeatPressed, setRepeatPressed] = useState(false)
  const [hearPressed, setHearPressed] = useState(false)
  const [hintPressed, setHintPressed] = useState(false)
  const [timerPressed, setTimerPressed] = useState(false)

  const totalQuestions = words.length > 0 ? words.length : TOTAL_QUESTIONS
  const currentWord = words[currentIndex] || null

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error("Error getting user:", userError)
      }

      if (!user) {
        setUserId(null)
        setPlan("guest")
        setAuthChecked(true)
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
      setAuthChecked(true)
    }

    getUser()
  }, [])

  useEffect(() => {
    const savedTimer = localStorage.getItem("spelling_timer_enabled")
    const savedVoice = localStorage.getItem("spelling_voice_enabled")

    if (savedTimer !== null) {
      setTimerEnabled(savedTimer === "true")
    }

    if (savedVoice !== null) {
      setVoiceEnabled(savedVoice === "true")
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("spelling_timer_enabled", String(timerEnabled))
  }, [timerEnabled])

  useEffect(() => {
    localStorage.setItem("spelling_voice_enabled", String(voiceEnabled))
  }, [voiceEnabled])

  function getStoredReviewIds() {
    const rawNew = localStorage.getItem(REVIEW_STORAGE_KEY)
    const rawOld = localStorage.getItem(LEGACY_REVIEW_STORAGE_KEY)
    const raw = rawNew ?? rawOld

    if (!raw) return []

    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []

      const ids = Array.from(
        new Set(parsed.filter((id): id is number => typeof id === "number"))
      )

      if (!rawNew && rawOld) {
        localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(ids))
        localStorage.removeItem(LEGACY_REVIEW_STORAGE_KEY)
      }

      return ids
    } catch {
      return []
    }
  }

  function setStoredReviewIds(ids: number[]) {
    const uniqueIds = Array.from(new Set(ids))

    if (uniqueIds.length === 0) {
      localStorage.removeItem(REVIEW_STORAGE_KEY)
      localStorage.removeItem(LEGACY_REVIEW_STORAGE_KEY)
      return
    }

    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(uniqueIds))
    localStorage.removeItem(LEGACY_REVIEW_STORAGE_KEY)
  }

  function removeWordIdFromStoredReviewIds(wordId: number) {
    const remainingIds = getStoredReviewIds().filter((id) => id !== wordId)
    setStoredReviewIds(remainingIds)
  }

  async function getDatabaseReviewIds() {
    if (!userId) return []

    const { data, error } = await supabase
      .from("spelling_review")
      .select("word_id")
      .eq("user_id", userId)

    if (error) {
      console.error("Error loading spelling review IDs:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })

      setErrorMessage(
        "Could not load spelling review words from Supabase. Using the local backup list instead."
      )

      return []
    }

    return Array.from(
      new Set(
        (data || [])
          .map((item) => item.word_id)
          .filter((id): id is number => typeof id === "number")
      )
    )
  }

  function getProgressDifficulty(testWords: WordRow[]) {
    if (!reviewMode) return difficulty

    const uniqueDifficulties = Array.from(
      new Set(
        testWords
          .map((word) => word.difficulty)
          .filter((value): value is number => typeof value === "number")
      )
    )

    return uniqueDifficulties.length === 1 ? uniqueDifficulties[0] : null
  }

  async function fetchWords() {
    const { data, error } = await supabase
      .from("words")
      .select("id, word, definition, difficulty, wrong_words")
      .order("id", { ascending: true })

    if (error) {
      console.error("Error loading spelling words:", error)
      setErrorMessage("Could not load spelling words.")
      return
    }

    const allWords = (data || []) as WordRow[]

    let selectedWords: WordRow[] = []

    if (reviewMode) {
      const databaseReviewIds = await getDatabaseReviewIds()
      const localReviewIds = getStoredReviewIds()
      const reviewIds =
        databaseReviewIds.length > 0 ? databaseReviewIds : localReviewIds

      setStoredReviewIds(reviewIds)
      selectedWords = allWords.filter((word) => reviewIds.includes(word.id))
    } else {
      selectedWords = allWords.filter((word) => word.difficulty === difficulty)
    }

    const shuffled = [...selectedWords].sort(() => Math.random() - 0.5)

    setWords(shuffled.slice(0, TOTAL_QUESTIONS))
    setCurrentIndex(0)
    setSelected(null)
    setFeedback("")
    setShowFeedback(false)
    setScore(0)
    setHintUsed(false)
    setShowHint(false)
    setTimeLeft(15)
    setProgressSaved(false)
    setResultSaved(false)
    setSpellingResults([])
    setPendingScore(0)
    setPendingResults([])
    setErrorMessage("")
  }

  useEffect(() => {
    if (!userId) return
    void fetchWords()
  }, [userId, difficulty, reviewMode])

  useEffect(() => {
    if (words.length > 0 && words[currentIndex]) {
      generateOptions(words[currentIndex], words)
    }
  }, [words, currentIndex])

  useEffect(() => {
    if (!testStarted) return
    if (!voiceEnabled) return
    if (!currentWord) return

    speakWord(currentWord.word)
  }, [testStarted, currentWord, voiceEnabled])

  useEffect(() => {
    if (!timerEnabled) {
      setTimeLeft(15)
      return
    }

    if (!testStarted) return
    if (!currentWord) return
    if (showFeedback) return

    setTimeLeft(15)

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          void handleTimeout()
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentIndex, timerEnabled, showFeedback, currentWord, testStarted])

  function shuffle(array: string[]) {
    return [...array].sort(() => Math.random() - 0.5)
  }

  function speakWord(word: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = "en-GB"
    utterance.rate = 0.8
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  function animatePress(setter: (value: boolean) => void) {
    setter(true)

    setTimeout(() => {
      setter(false)
    }, 140)
  }

  function handleRepeatPress(word: string) {
    setRepeatPressed(true)
    speakWord(word)

    setTimeout(() => {
      setRepeatPressed(false)
    }, 140)
  }

  function generateOptions(wordItem: WordRow, allWords: WordRow[]) {
    const correct = wordItem.word
    const wrongFromRow = Array.isArray(wordItem.wrong_words)
      ? wordItem.wrong_words.filter((value): value is string => typeof value === "string")
      : []

    const cleanedWrong = [...new Set(wrongFromRow.map((word) => word.trim()).filter(Boolean))]
      .filter((word) => word.toLowerCase() !== correct.trim().toLowerCase())

    let wrongOptions = cleanedWrong.slice(0, 3)

    if (wrongOptions.length < 3) {
      const fallback = allWords
        .map((word) => word.word)
        .filter((word) => word.trim().toLowerCase() !== correct.trim().toLowerCase())
        .filter((word) => !wrongOptions.includes(word))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 - wrongOptions.length)

      wrongOptions = [...wrongOptions, ...fallback]
    }

    const allOptions = shuffle([correct, ...wrongOptions]).slice(0, 4)

    setOptions(allOptions)
    setSelected(null)
    setFeedback("")
    setShowFeedback(false)
    setHintUsed(false)
    setShowHint(false)
  }

  function buildSpellingResult(
    wordItem: WordRow,
    selectedOption: string | null,
    currentOptions: string[]
  ): SpellingResult {
    const safeOptions =
      currentOptions.length === 4
        ? currentOptions
        : [wordItem.word, ...(wordItem.wrong_words || [])].slice(0, 4)

    const optionMap = OPTION_KEYS.reduce((map, key, index) => {
      map[key] = safeOptions[index] || ""
      return map
    }, {} as Record<AnswerOption, string>)

    const correctIndex = safeOptions.findIndex((option) => option === wordItem.word)
    const selectedIndex =
      selectedOption === null
        ? -1
        : safeOptions.findIndex((option) => option === selectedOption)

    const correctAnswer = OPTION_KEYS[correctIndex >= 0 ? correctIndex : 0]
    const userAnswer = selectedIndex >= 0 ? OPTION_KEYS[selectedIndex] : null
    const isCorrect = selectedOption === wordItem.word

    return {
      wordId: wordItem.id,
      word: wordItem.word,
      definition: wordItem.definition,
      difficulty: wordItem.difficulty,
      isCorrect,
      userAnswer,
      correctAnswer,
      userAnswerText: selectedOption,
      correctAnswerText: wordItem.word,
      options: optionMap,
    }
  }

  async function saveSpellingProgress(finalScore: number) {
    if (!userId || words.length === 0) return false

    const successRate = Math.round((finalScore / words.length) * 100)
    const progressDifficulty = getProgressDifficulty(words)

    const { error } = await supabase.from("spelling_progress").insert([
      {
        user_id: userId,
        total_words_practiced: words.length,
        correct_answers: finalScore,
        success_rate: successRate,
        difficulty: progressDifficulty,
      },
    ])

    if (error) {
      console.error("Error saving spelling progress:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })

      setErrorMessage(
        `The test finished, but spelling progress was not saved: ${error.message}`
      )

      return false
    }

    setProgressSaved(true)
    return true
  }

  async function saveLatestSpellingResult(results: SpellingResult[]) {
    if (!userId) return

    const totalQuestions = results.length
    const correctAnswers = results.filter((result) => result.isCorrect).length
    const successRate =
      totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

    const progressDifficulty = getProgressDifficulty(words)
    const completedAt = new Date().toISOString()

    const answers: SavedQuestionReview[] = results.map((result, index) => ({
      question_id: result.wordId,
      question_order: index + 1,
      question_text: "Choose the correct spelling.",
      question_image_url: null,
      options: result.options,
      option_images: {},
      user_answer: result.userAnswer,
      correct_answer: result.correctAnswer,
      user_answer_text: result.userAnswerText,
      correct_answer_text: result.correctAnswerText,
      user_answer_image_url: null,
      correct_answer_image_url: null,
      is_correct: result.isCorrect,
      explanation: result.definition ? `Definition: ${result.definition}` : null,
      explanation_image_url: null,
      difficulty: result.difficulty,
    }))

    const payload = {
      user_id: userId,
      subject: "english",
      category: "spelling",
      subcategory: "",
      subcategory_two: "",
      subcategory_three: "",
      test_id: RESULT_TEST_ID,
      test_title: reviewMode
        ? "Spelling Review"
        : `Spelling ${["Easy", "Medium", "Hard"][difficulty - 1]} Test`,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      success_rate: successRate,
      difficulty: progressDifficulty,
      answers,
      completed_at: completedAt,
      updated_at: completedAt,
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("latest_test_results")
      .update(payload)
      .eq("user_id", userId)
      .eq("subject", "english")
      .eq("category", "spelling")
      .eq("subcategory", "")
      .eq("subcategory_two", "")
      .eq("subcategory_three", "")
      .eq("test_id", RESULT_TEST_ID)
      .select("id")

    if (updateError) {
      console.error("Error updating latest spelling result:", {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
        payload,
      })

      setErrorMessage("The test was completed, but the full result could not be saved.")
      return
    }

    if (updatedRows && updatedRows.length > 0) {
      setResultSaved(true)
      return
    }

    const { error: insertError } = await supabase
      .from("latest_test_results")
      .insert([payload])

    if (insertError) {
      console.error("Error inserting latest spelling result:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        payload,
      })

      setErrorMessage("The test was completed, but the full result could not be saved.")
      return
    }

    setResultSaved(true)
  }

  async function saveWrongSpellingReview(wordItem: WordRow) {
    if (!userId) return false

    const cleanedWord = wordItem.word.trim().toLowerCase()
    const now = new Date().toISOString()

    const fullPayload = {
      user_id: userId,
      word_id: wordItem.id,
      word: cleanedWord,
      knew_it: false,
      difficulty: wordItem.difficulty,
      updated_at: now,
      last_attempted_at: now,
    }

    const minimalPayload = {
      user_id: userId,
      word_id: wordItem.id,
      word: cleanedWord,
      knew_it: false,
      difficulty: wordItem.difficulty,
    }

    const { error: upsertError } = await supabase.from("spelling_review").upsert(
      [fullPayload],
      {
        onConflict: "user_id,word_id",
      }
    )

    if (!upsertError) {
      const existingIds = getStoredReviewIds()
      setStoredReviewIds([...existingIds, wordItem.id])
      return true
    }

    console.error("Error saving spelling review with active-queue fields:", {
      message: upsertError.message,
      details: upsertError.details,
      hint: upsertError.hint,
      code: upsertError.code,
    })

    /*
      Fallback for older spelling_review table shapes.
      This keeps the page working even if updated_at / last_attempted_at
      or the unique user_id + word_id index have not been added yet.
    */
    const { data: updatedRows, error: updateError } = await supabase
      .from("spelling_review")
      .update({
        word: cleanedWord,
        knew_it: false,
        difficulty: wordItem.difficulty,
      })
      .eq("user_id", userId)
      .eq("word_id", wordItem.id)
      .select("id")

    if (!updateError && updatedRows && updatedRows.length > 0) {
      const existingIds = getStoredReviewIds()
      setStoredReviewIds([...existingIds, wordItem.id])
      return true
    }

    if (updateError) {
      console.error("Error updating existing spelling review row:", {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      })
    }

    const { error: insertError } = await supabase
      .from("spelling_review")
      .insert([minimalPayload])

    if (insertError) {
      console.error("Error inserting spelling review fallback row:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      })

      setErrorMessage(
        `This word was answered incorrectly, but it could not be saved to spelling review: ${insertError.message}`
      )

      return false
    }

    const existingIds = getStoredReviewIds()
    setStoredReviewIds([...existingIds, wordItem.id])
    return true
  }

  async function removeWordFromReview(wordId: number) {
    if (!userId) return false

    const { error } = await supabase
      .from("spelling_review")
      .delete()
      .eq("user_id", userId)
      .eq("word_id", wordId)

    if (error) {
      console.error("Error removing spelling review word:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })

      setErrorMessage(
        "This word was answered correctly, but it could not be removed from spelling review."
      )

      return false
    }

    removeWordIdFromStoredReviewIds(wordId)
    return true
  }

  function handleHint() {
    if (hintUsed || showFeedback) return
    setShowHint(true)
    setHintUsed(true)
  }

  function handleAnswer(option: string) {
    if (showFeedback || !currentWord) return
    setSelected(option)
    setFeedback("")
  }

  async function handleCheckAnswer() {
    if (!selected || showFeedback || !currentWord) return

    const correct = currentWord.word
    const isCorrect = selected === correct
    const updatedScore = isCorrect ? score + 1 : score

    const newResult = buildSpellingResult(currentWord, selected, options)
    const updatedResults = [...spellingResults, newResult]

    setSpellingResults(updatedResults)
    setPendingScore(updatedScore)
    setPendingResults(updatedResults)
    setShowFeedback(true)

    if (isCorrect) {
      setFeedback("Correct ✅")
      setScore(updatedScore)

      await removeWordFromReview(currentWord.id)
    } else {
      const savedToReview = await saveWrongSpellingReview(currentWord)
      setFeedback(
        savedToReview
          ? "Not quite ❌ Added to spelling review."
          : "Not quite ❌ This word could not be saved to spelling review."
      )
    }
  }

  async function handleTimeout() {
    if (showFeedback || !currentWord) return

    const newResult = buildSpellingResult(currentWord, null, options)
    const updatedResults = [...spellingResults, newResult]

    setSpellingResults(updatedResults)
    setPendingScore(score)
    setPendingResults(updatedResults)
    setSelected("TIMEOUT")
    setShowFeedback(true)
    setFeedback("⏰ Time's up!")

    const savedToReview = await saveWrongSpellingReview(currentWord)

    if (savedToReview) {
      setFeedback("⏰ Time's up! Added to spelling review.")
    } else {
      setFeedback("⏰ Time's up! This word could not be saved to spelling review.")
    }
  }

  async function nextQuestion(finalScore: number, finalResults: SpellingResult[]) {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      return
    }

    await saveSpellingProgress(finalScore)
    await saveLatestSpellingResult(finalResults)

    setCurrentIndex(words.length)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function restartTest() {
    setTestStarted(false)
    setScore(0)
    setCurrentIndex(0)
    setSelected(null)
    setFeedback("")
    setShowFeedback(false)
    setOptions([])
    setHintUsed(false)
    setShowHint(false)
    setTimeLeft(15)
    setProgressSaved(false)
    setResultSaved(false)
    setSpellingResults([])
    setPendingScore(0)
    setPendingResults([])
    setErrorMessage("")
    void fetchWords()
  }

  function getDifficultyLabel(value: number | null | undefined) {
    if (value === 1) return "Easy"
    if (value === 2) return "Medium"
    if (value === 3) return "Hard"
    return "Not set"
  }

  const correctCount = spellingResults.filter((result) => result.isCorrect).length
  const wrongCount = spellingResults.filter((result) => !result.isCorrect).length
  const successRate =
    spellingResults.length > 0
      ? Math.round((correctCount / spellingResults.length) * 100)
      : 0

  if (!authChecked) {
    return (
      <>
        <Header />
        <p style={styles.message}>Loading Spelling tests...</p>
      </>
    )
  }

  if (plan === "guest") {
    return (
      <>
        <Header />
        <div style={styles.center}>
          <div style={styles.card}>
            <h1>Sign in to start spelling practice</h1>

            <p style={{ marginBottom: "20px", fontSize: "18px", lineHeight: 1.6 }}>
              Please sign in or create a free account to access YanBo Learning
              spelling tests.
            </p>

            <div style={styles.accessButtonRow}>
              <button onClick={() => router.push("/login")} style={styles.button}>
                Sign In
              </button>

              <button
                onClick={() => router.push("/english")}
                style={{
                  ...styles.button,
                  backgroundColor: "#e5e7eb",
                  color: "#111827",
                }}
              >
                Back to English
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!testStarted) {
    return (
      <>
        <Header />
        <div style={styles.center}>
          <div style={styles.card}>
            <h1>{reviewMode ? "📝 Spelling Review Retry" : "11+ Spelling Test"}</h1>

            <p>{reviewMode ? "Practice your saved review words:" : "Select difficulty:"}</p>

            {!reviewMode && (
              <div style={styles.difficultyRow}>
                {[1, 2, 3].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level as 1 | 2 | 3)}
                    style={{
                      ...styles.smallButton,
                      backgroundColor: difficulty === level ? "#c7d2fe" : "#e5e7eb",
                      color: "black",
                      fontWeight: difficulty === level ? "bold" : "normal",
                    }}
                  >
                    {["Easy", "Medium", "Hard"][level - 1]}
                  </button>
                ))}
              </div>
            )}

            <button onClick={() => setTestStarted(true)} style={styles.button}>
              {reviewMode
                ? "Start Review Retry"
                : `Start Test (${["Easy", "Medium", "Hard"][difficulty - 1]})`}
            </button>

            {errorMessage && <p style={styles.inlineError}>{errorMessage}</p>}
          </div>
        </div>
      </>
    )
  }

  if (words.length === 0) {
    return (
      <>
        <Header />
        <div style={styles.center}>
          <div style={styles.card}>
            <h1 style={{ marginBottom: "12px" }}>
              {reviewMode ? "No review words found" : "Preparing test..."}
            </h1>

            <p style={{ marginBottom: "20px", fontSize: "18px" }}>
              {reviewMode
                ? "There are no saved spelling review words for this set."
                : "Please wait while your spelling test is being prepared."}
            </p>

            <button
              onClick={() => router.push(reviewMode ? "/review/english" : "/english")}
              style={styles.button}
            >
              {reviewMode ? "Back to English Review" : "Back to English"}
            </button>
          </div>
        </div>
      </>
    )
  }

  if (!currentWord) {
    const displayedDifficulty = reviewMode ? getProgressDifficulty(words) : difficulty

    return (
      <>
        <Header />
        <div style={styles.page}>
          <div style={styles.resultCard}>
            <h1 style={styles.resultTitle}>🎉 Test Complete!</h1>

            <div style={styles.resultSummary}>
              <p style={styles.resultText}>
                <strong>Score:</strong> {score} / {totalQuestions}
              </p>

              <p style={styles.resultText}>
                <strong>Correct:</strong> {correctCount}
              </p>

              <p style={styles.resultText}>
                <strong>Wrong:</strong> {wrongCount}
              </p>

              <p style={styles.resultText}>
                <strong>Success Rate:</strong> {successRate}%
              </p>

              <p style={styles.resultText}>
                <strong>Difficulty:</strong> {getDifficultyLabel(displayedDifficulty)}
              </p>

              {progressSaved && <p style={styles.savedText}>Progress saved.</p>}
              {resultSaved && <p style={styles.savedText}>Full result saved.</p>}
              {errorMessage && <p style={styles.inlineError}>{errorMessage}</p>}
            </div>

            <div style={styles.resultButtons}>
              <button onClick={restartTest} style={styles.secondaryButton}>
                Restart
              </button>

              <button
                onClick={() => router.push(reviewMode ? "/review/english" : "/english")}
                style={styles.primaryButton}
              >
                {reviewMode ? "📘 Back to English Review" : "📘 Back to English"}
              </button>
            </div>

            <div style={styles.reviewSection}>
              <h2 style={styles.sectionTitle}>Answer Review</h2>

              {spellingResults.map((result, index) => (
                <div
                  key={`${result.wordId}-${index}`}
                  style={{
                    ...styles.reviewQuestionCard,
                    borderColor: result.isCorrect ? "#86efac" : "#fecaca",
                    background: result.isCorrect ? "#f0fdf4" : "#fef2f2",
                  }}
                >
                  <div style={styles.reviewQuestionTop}>
                    <h3 style={styles.reviewQuestionTitle}>Question {index + 1}</h3>

                    <span
                      style={{
                        ...styles.reviewStatusBadge,
                        background: result.isCorrect ? "#dcfce7" : "#fee2e2",
                        color: result.isCorrect ? "#166534" : "#991b1b",
                      }}
                    >
                      {result.isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>

                  <div style={styles.reviewOptionsGrid}>
                    {OPTION_KEYS.map((option) => {
                      const isUserAnswer = result.userAnswer === option
                      const isCorrectAnswer = result.correctAnswer === option

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
                          <strong>{option}.</strong> {result.options[option]}

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
                      {result.userAnswer
                        ? `${result.userAnswer} — ${result.userAnswerText || ""}`
                        : "No answer"}
                    </p>

                    <p>
                      <strong>Correct answer:</strong> {result.correctAnswer} —{" "}
                      {result.correctAnswerText}
                    </p>

                    {result.definition && (
                      <p>
                        <strong>Definition:</strong> {result.definition}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }

  const correctAnswer = currentWord.word
  const displayedDifficulty =
    reviewMode ? currentWord.difficulty ?? words[0]?.difficulty ?? null : difficulty

  return (
    <>
      <Header />
      <div style={styles.page}>
        <div style={styles.headerRow}>
          <div style={styles.headerLeft}>
            <h1 style={styles.title}>{reviewMode ? "Spelling Review" : "Spelling Test"}</h1>
            <p style={styles.metaText}>
              Question {currentIndex + 1} / {totalQuestions}
            </p>
            <p style={styles.metaText}>
              Difficulty: {getDifficultyLabel(displayedDifficulty)}
            </p>
            {timerEnabled && <p style={styles.metaText}>Word Timer: {timeLeft}s</p>}
          </div>

          <div style={styles.headerButtons}>
            <button
              onClick={() => {
                animatePress(setHearPressed)
                setVoiceEnabled((prev) => !prev)
              }}
              style={{
                ...styles.controlButton,
                backgroundColor: voiceEnabled ? "#374151" : "#d1d5db",
                color: voiceEnabled ? "white" : "black",
                transform: hearPressed ? "translateY(2px) scale(0.98)" : "translateY(0) scale(1)",
                boxShadow: hearPressed
                  ? "inset 0 2px 6px rgba(0,0,0,0.25)"
                  : "0 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              🔊 Hear: {voiceEnabled ? "ON" : "OFF"}
            </button>

            <button
              onClick={() => handleRepeatPress(correctAnswer)}
              style={{
                ...styles.controlButton,
                transform: repeatPressed
                  ? "translateY(2px) scale(0.98)"
                  : "translateY(0) scale(1)",
                boxShadow: repeatPressed
                  ? "inset 0 2px 6px rgba(0,0,0,0.25)"
                  : "0 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              Repeat
            </button>

            <button
              onClick={() => {
                animatePress(setHintPressed)
                handleHint()
              }}
              style={{
                ...styles.controlButton,
                transform: hintPressed
                  ? "translateY(2px) scale(0.98)"
                  : "translateY(0) scale(1)",
                boxShadow: hintPressed
                  ? "inset 0 2px 6px rgba(0,0,0,0.25)"
                  : "0 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              💡 Hint
            </button>

            <button
              onClick={() => {
                animatePress(setTimerPressed)
                setTimerEnabled((prev) => !prev)
              }}
              style={{
                ...styles.controlButton,
                backgroundColor: timerEnabled ? "#374151" : "#d1d5db",
                color: timerEnabled ? "white" : "black",
                transform: timerPressed
                  ? "translateY(2px) scale(0.98)"
                  : "translateY(0) scale(1)",
                boxShadow: timerPressed
                  ? "inset 0 2px 6px rgba(0,0,0,0.25)"
                  : "0 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              Timer: {timerEnabled ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        <div style={styles.wordArea}>
          <p style={styles.promptText}>Choose the correct spelling:</p>
        </div>

        {showHint && !showFeedback && (
          <p style={styles.hintText}>
            <strong>Definition:</strong> {currentWord.definition || "No definition available."}
          </p>
        )}

        <div style={{ marginTop: "20px" }}>
          {options.map((opt, index) => {
            const isSelected = selected === opt
            const isCorrectAnswer = opt === correctAnswer
            let bg = "#f3f4f6"
            let borderColor = "#e5e7eb"
            let textColor = "black"

            if (showFeedback) {
              if (isCorrectAnswer) {
                bg = "#22c55e"
                borderColor = "#16a34a"
                textColor = "white"
              } else if (isSelected) {
                bg = "#ef4444"
                borderColor = "#dc2626"
                textColor = "white"
              }
            } else if (isSelected) {
              bg = "#eef2ff"
              borderColor = "#4f46e5"
            }

            return (
              <button
                key={`${opt}-${index}`}
                onClick={() => handleAnswer(opt)}
                disabled={showFeedback}
                style={{
                  ...styles.answerButton,
                  backgroundColor: bg,
                  border: `2px solid ${borderColor}`,
                  color: textColor,
                  cursor: showFeedback ? "not-allowed" : "pointer",
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {!showFeedback ? (
          <div style={styles.submitRow}>
            <ReportQuestionButton
              subject="english"
              category="spelling"
              testId={RESULT_TEST_ID}
              questionId={currentWord.id}
            />

            <button
              type="button"
              onClick={handleCheckAnswer}
              disabled={!selected}
              style={{
                ...styles.checkButton,
                opacity: selected ? 1 : 0.6,
                cursor: selected ? "pointer" : "not-allowed",
              }}
            >
              Check Answer
            </button>
          </div>
        ) : (
          <>
            <div style={styles.feedbackBox}>
              <p style={styles.feedbackText}>{feedback}</p>

              <p style={styles.feedbackDetail}>
                <strong>Your answer:</strong>{" "}
                {selected && selected !== "TIMEOUT" ? selected : "No answer"}
              </p>

              <p style={styles.feedbackDetail}>
                <strong>Correct answer:</strong> {correctAnswer}
              </p>

              <p style={styles.feedbackDetail}>
                <strong>Definition:</strong>{" "}
                {currentWord.definition || "No definition available."}
              </p>
            </div>

            <div style={styles.feedbackActionRow}>
              <button
                type="button"
                onClick={() => void nextQuestion(pendingScore, pendingResults)}
                style={styles.nextButton}
              >
                {currentIndex < words.length - 1 ? "Next Question" : "Finish Test"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: "20px",
    maxWidth: "900px",
    margin: "0 auto",
  },
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "550px",
    background: "white",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  difficultyRow: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  button: {
    marginTop: "10px",
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    background: "#4f46e5",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
  },
  smallButton: {
    padding: "10px 18px",
    borderRadius: "10px",
    border: "none",
    background: "#e5e7eb",
    cursor: "pointer",
    fontSize: "16px",
  },
  accessButtonRow: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "10px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
    marginBottom: "30px",
    flexWrap: "wrap",
  },
  headerLeft: {
    flex: 1,
    minWidth: "260px",
  },
  title: {
    margin: "0 0 10px 0",
    fontSize: "32px",
  },
  metaText: {
    margin: "6px 0",
    fontSize: "24px",
  },
  headerButtons: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 140px)",
    gap: "10px",
    justifyContent: "end",
  },
  controlButton: {
    width: "140px",
    height: "44px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#374151",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.12s ease, box-shadow 0.12s ease",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  },
  wordArea: {
    textAlign: "center",
    marginBottom: "20px",
  },
  promptText: {
    fontSize: "36px",
    fontWeight: "bold",
    margin: "10px 0 20px 0",
  },
  hintText: {
    textAlign: "center",
    fontStyle: "italic",
    fontSize: "30px",
    color: "#066e0b",
    lineHeight: "1.5",
    maxWidth: "800px",
    margin: "0 auto 20px auto",
  },
  answerButton: {
    display: "block",
    width: "100%",
    marginBottom: "12px",
    padding: "18px",
    fontSize: "28px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
  },
  feedbackText: {
    margin: "0 0 12px 0",
    textAlign: "center",
    fontSize: "22px",
    fontWeight: "bold",
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
  feedbackBox: {
    marginTop: "22px",
    padding: "18px",
    borderRadius: "14px",
    border: "1px solid #d1fae5",
    background: "#f0fdf4",
  },
  feedbackDetail: {
    margin: "8px 0",
    fontSize: "18px",
    color: "#111827",
  },
  feedbackActionRow: {
    width: "100%",
    marginTop: "18px",
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  resultCard: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  resultTitle: {
    textAlign: "center",
    fontSize: "36px",
    marginTop: 0,
  },
  resultSummary: {
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
  savedText: {
    margin: "10px 0",
    fontSize: "16px",
    color: "#166534",
    fontWeight: 700,
  },
  resultButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: "28px",
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
    textDecoration: "none",
    textAlign: "center",
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
  reviewSection: {
    marginTop: "24px",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "20px",
    fontSize: "28px",
    color: "#111827",
  },
  reviewQuestionCard: {
    border: "2px solid",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "18px",
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