"use client"

import React, { Suspense, useEffect, useState } from "react"
import Header from "../../../components/Header"
import { supabase } from "../../../lib/supabaseClient"
import { useRouter, useSearchParams } from "next/navigation"

type AnswerOption = "A" | "B" | "C" | "D"

type WordRow = {
  id: number
  word: string
  definition: string
  difficulty: number | null
  example_sentence: string | null
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

type PracticeResult = {
  wordId: number
  word: string
  definition: string
  example_sentence: string | null
  difficulty: number | null
  knewIt: boolean
  userAnswer: AnswerOption | null
  correctAnswer: AnswerOption
  userAnswerText: string | null
  correctAnswerText: string
  options: Record<AnswerOption, string>
}

const REVIEW_STORAGE_KEY = "vocabulary_review_ids"
const LEGACY_REVIEW_STORAGE_KEY = "vocabulary_review_word_ids"

const RESULT_TEST_ID = 0

const OPTION_KEYS: AnswerOption[] = ["A", "B", "C", "D"]

export default function VocabularyPage() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <p style={styles.message}>Loading Vocabulary tests...</p>
        </>
      }
    >
      <VocabularyContent />
    </Suspense>
  )
}

function VocabularyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reviewMode = searchParams.get("mode") === "review"

  const [words, setWords] = useState<WordRow[]>([])
  const [testWords, setTestWords] = useState<WordRow[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1)
  const [practiceResults, setPracticeResults] = useState<PracticeResult[]>([])
  const [timer, setTimer] = useState(15)
  const [totalTimer, setTotalTimer] = useState(90)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [progressSaved, setProgressSaved] = useState(false)
  const [resultSaved, setResultSaved] = useState(false)
  const [isAnswerLocked, setIsAnswerLocked] = useState(false)
  const [options, setOptions] = useState<WordRow[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [clearedReviewWordIds, setClearedReviewWordIds] = useState<number[]>([])
  const [errorMessage, setErrorMessage] = useState("")

  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [timerEnabled, setTimerEnabled] = useState(true)

  const [repeatPressed, setRepeatPressed] = useState(false)
  const [hearPressed, setHearPressed] = useState(false)
  const [hintPressed, setHintPressed] = useState(false)
  const [timerPressed, setTimerPressed] = useState(false)

  const currentWord = testWords[currentIndex] || null

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setUserId(user.id)
      setAuthChecked(true)
    }

    getUser()
  }, [router])

  useEffect(() => {
    const savedVoice = localStorage.getItem("vocabulary_voice_enabled")
    const savedTimer = localStorage.getItem("vocabulary_timer_enabled")

    if (savedVoice !== null) {
      setVoiceEnabled(savedVoice === "true")
    }

    if (savedTimer !== null) {
      setTimerEnabled(savedTimer === "true")
    }
  }, [])

  useEffect(() => {
    async function fetchWords() {
      const { data, error } = await supabase
        .from("words")
        .select("id, word, definition, difficulty, example_sentence")
        .order("id", { ascending: true })

      if (error) {
        console.error("Error loading vocabulary words:", error)
        setErrorMessage("Could not load vocabulary words.")
        return
      }

      setWords((data || []) as WordRow[])
    }

    fetchWords()
  }, [])

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

  useEffect(() => {
    if (!userId || !testStarted || words.length === 0) return

    let selectedWords: WordRow[] = []

    if (reviewMode) {
      const reviewIds = getStoredReviewIds()
      selectedWords = words.filter((word) => reviewIds.includes(word.id))
    } else {
      selectedWords = words.filter((word) => word.difficulty === difficulty)
    }

    const shuffled = [...selectedWords].sort(() => Math.random() - 0.5).slice(0, 10)

    setTestWords(shuffled)
    setCurrentIndex(0)
    setPracticeResults([])
    setTestCompleted(false)
    setProgressSaved(false)
    setResultSaved(false)
    setTimer(15)
    setTotalTimer(90)
    setIsTimerActive(timerEnabled && shuffled.length > 0)
    setSelectedAnswer(null)
    setShowHint(false)
    setIsAnswerLocked(false)
    setClearedReviewWordIds([])
    setErrorMessage("")
  }, [difficulty, words, userId, testStarted, reviewMode, timerEnabled])

  function generateOptions(correctWord: WordRow, allWords: WordRow[]) {
    const incorrect = allWords
      .filter((word) => word.id !== correctWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    return [...incorrect, correctWord].sort(() => Math.random() - 0.5)
  }

  useEffect(() => {
    if (!currentWord || words.length === 0) return

    const generatedOptions = generateOptions(currentWord, words)

    setOptions(generatedOptions)
    setSelectedAnswer(null)
    setShowHint(false)
  }, [currentWord, words])

  useEffect(() => {
    if (!currentWord || !voiceEnabled || !testStarted || testCompleted) return

    speakWord(currentWord.word)
  }, [currentWord, voiceEnabled, testStarted, testCompleted])

  useEffect(() => {
    if (!timerEnabled) {
      setIsTimerActive(false)
      return
    }

    if (!testStarted || testCompleted || !currentWord) return
    if (selectedAnswer !== null) return

    setIsTimerActive(true)
  }, [timerEnabled, testStarted, testCompleted, currentWord, selectedAnswer])

  useEffect(() => {
    if (!isTimerActive || !timerEnabled) return

    if (timer === 0) {
      setIsTimerActive(false)
      void handleNext(false, null, options)
      return
    }

    const interval = setInterval(() => {
      setTimer((time) => time - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerActive, timer, timerEnabled, options])

  useEffect(() => {
    if (!isTimerActive || !timerEnabled) return

    if (totalTimer === 0) {
      void finishTest(practiceResults)
      return
    }

    const interval = setInterval(() => {
      setTotalTimer((time) => time - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerActive, totalTimer, timerEnabled, practiceResults])

  function buildResultRow(
    word: WordRow,
    knewIt: boolean,
    selectedOptionId: number | null,
    currentOptions: WordRow[]
  ): PracticeResult {
    const safeOptions =
      currentOptions.length === 4 ? currentOptions : generateOptions(word, words)

    const optionMap = OPTION_KEYS.reduce((map, key, index) => {
      map[key] = safeOptions[index]?.definition || ""
      return map
    }, {} as Record<AnswerOption, string>)

    const correctIndex = safeOptions.findIndex((option) => option.id === word.id)
    const selectedIndex =
      selectedOptionId === null
        ? -1
        : safeOptions.findIndex((option) => option.id === selectedOptionId)

    const correctAnswer = OPTION_KEYS[correctIndex >= 0 ? correctIndex : 0]
    const userAnswer = selectedIndex >= 0 ? OPTION_KEYS[selectedIndex] : null

    const selectedOption =
      selectedOptionId === null
        ? null
        : safeOptions.find((option) => option.id === selectedOptionId) || null

    return {
      wordId: word.id,
      word: word.word,
      definition: word.definition,
      example_sentence: word.example_sentence,
      difficulty: word.difficulty,
      knewIt,
      userAnswer,
      correctAnswer,
      userAnswerText: selectedOption?.definition ?? null,
      correctAnswerText: word.definition,
      options: optionMap,
    }
  }

  function handleAnswer(option: WordRow) {
    if (isAnswerLocked) return
    if (selectedAnswer !== null) return
    if (!currentWord) return
    if (currentIndex >= testWords.length) return

    setIsAnswerLocked(true)

    const correct = option.id === currentWord.id

    setSelectedAnswer(option.id)
    setIsTimerActive(false)

    setTimeout(() => {
      void handleNext(correct, option.id, options)
      setSelectedAnswer(null)
    }, 1800)
  }

  async function removeWordFromReview(wordId: number) {
    if (!userId) return

    const { error } = await supabase
      .from("vocabulary_review")
      .delete()
      .eq("user_id", userId)
      .eq("word_id", wordId)

    if (error) {
      console.error("Error removing vocabulary review word:", error)
    }
  }

  async function addWordToReview(word: WordRow) {
    if (!userId) return

    const { error } = await supabase.from("vocabulary_review").insert([
      {
        user_id: userId,
        word_id: word.id,
        word: word.word,
        knew_it: false,
        difficulty: word.difficulty,
      },
    ])

    if (error) {
      console.error("Error saving vocabulary review:", error)
    }
  }

  async function saveVocabularyProgress(results: PracticeResult[]) {
    if (!userId) return

    const totalWordsPracticed = results.length
    const correctAnswers = results.filter((result) => result.knewIt).length
    const successRate =
      totalWordsPracticed > 0
        ? Math.round((correctAnswers / totalWordsPracticed) * 100)
        : 0

    const { error } = await supabase.from("vocabulary_progress").insert([
      {
        user_id: userId,
        total_words_practiced: totalWordsPracticed,
        correct_answers: correctAnswers,
        success_rate: successRate,
      },
    ])

    if (error) {
      console.error("Error saving vocabulary progress:", error)
    } else {
      setProgressSaved(true)
    }
  }

  async function saveLatestVocabularyResult(results: PracticeResult[]) {
    if (!userId) return

    const totalQuestions = results.length
    const correctAnswers = results.filter((result) => result.knewIt).length
    const successRate =
      totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

    const completedAt = new Date().toISOString()

    const answers: SavedQuestionReview[] = results.map((result, index) => ({
      question_id: result.wordId,
      question_order: index + 1,
      question_text: result.word,
      question_image_url: null,
      options: result.options,
      option_images: {},
      user_answer: result.userAnswer,
      correct_answer: result.correctAnswer,
      user_answer_text: result.userAnswerText,
      correct_answer_text: result.correctAnswerText,
      user_answer_image_url: null,
      correct_answer_image_url: null,
      is_correct: result.knewIt,
      explanation: result.example_sentence
        ? `Example sentence: ${result.example_sentence}`
        : null,
      explanation_image_url: null,
      difficulty: result.difficulty,
    }))

    const payload = {
      user_id: userId,
      subject: "english",
      category: "vocabulary",
      subcategory: "",
      subcategory_two: "",
      subcategory_three: "",
      test_id: RESULT_TEST_ID,
      test_title: reviewMode
        ? "Vocabulary Review"
        : `Vocabulary ${["Easy", "Medium", "Hard"][difficulty - 1]} Test`,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      success_rate: successRate,
      difficulty: reviewMode ? null : difficulty,
      answers,
      completed_at: completedAt,
      updated_at: completedAt,
    }

    const { error: deleteError } = await supabase
      .from("latest_test_results")
      .delete()
      .eq("user_id", userId)
      .eq("subject", "english")
      .eq("category", "vocabulary")
      .eq("subcategory", "")
      .eq("subcategory_two", "")
      .eq("subcategory_three", "")
      .eq("test_id", RESULT_TEST_ID)

    if (deleteError) {
      console.error("Error deleting old vocabulary result:", deleteError)
    }

    const { error: insertError } = await supabase
      .from("latest_test_results")
      .insert([payload])

    if (insertError) {
      console.error("Error saving latest vocabulary result:", {
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

  async function finishTest(results: PracticeResult[]) {
    setTestCompleted(true)
    setIsTimerActive(false)
    setIsAnswerLocked(true)

    await saveVocabularyProgress(results)
    await saveLatestVocabularyResult(results)

    if (reviewMode) {
      const storedIds = getStoredReviewIds()
      const remainingIds = storedIds.filter(
        (id) => !clearedReviewWordIds.includes(id)
      )

      localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(remainingIds))
      localStorage.removeItem(LEGACY_REVIEW_STORAGE_KEY)
    }

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleNext(
    knewIt: boolean | null = null,
    selectedOptionId: number | null = null,
    currentOptions: WordRow[] = options
  ) {
    if (!userId || !currentWord) {
      setIsAnswerLocked(false)
      return
    }

    let updatedResults = practiceResults
    let updatedClearedReviewIds = clearedReviewWordIds

    if (knewIt !== null) {
      const newResult = buildResultRow(
        currentWord,
        knewIt,
        selectedOptionId,
        currentOptions
      )

      updatedResults = [...practiceResults, newResult]
      setPracticeResults(updatedResults)

      if (reviewMode) {
        if (knewIt) {
          await removeWordFromReview(currentWord.id)
          updatedClearedReviewIds = [...clearedReviewWordIds, currentWord.id]
          setClearedReviewWordIds(updatedClearedReviewIds)
        }
      } else {
        if (!knewIt) {
          await addWordToReview(currentWord)
        }
      }
    }

    if (currentIndex + 1 >= testWords.length) {
      await finishTest(updatedResults)
      return
    }

    setCurrentIndex((prev) => prev + 1)
    setTimer(15)
    setSelectedAnswer(null)
    setShowHint(false)
    setIsAnswerLocked(false)
    setIsTimerActive(timerEnabled)
  }

  function restartTest() {
    setTestStarted(false)
    setTestCompleted(false)
    setCurrentIndex(0)
    setPracticeResults([])
    setProgressSaved(false)
    setResultSaved(false)
    setTimer(15)
    setTotalTimer(90)
    setIsTimerActive(false)
    setSelectedAnswer(null)
    setShowHint(false)
    setIsAnswerLocked(false)
    setClearedReviewWordIds([])
    setErrorMessage("")

    setTimeout(() => {
      setTestStarted(true)
    }, 0)
  }

  function speakWord(text: string) {
    if (typeof window === "undefined") return
    if (!("speechSynthesis" in window)) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-GB"
    utterance.rate = 0.95

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

  function toggleVoice() {
    const newValue = !voiceEnabled

    setVoiceEnabled(newValue)
    localStorage.setItem("vocabulary_voice_enabled", String(newValue))
  }

  function toggleTimer() {
    const newValue = !timerEnabled

    setTimerEnabled(newValue)
    localStorage.setItem("vocabulary_timer_enabled", String(newValue))

    if (!newValue) {
      setIsTimerActive(false)
    } else if (!testCompleted && testStarted && currentWord && selectedAnswer === null) {
      setIsTimerActive(true)
    }
  }

  const correctCount = practiceResults.filter((result) => result.knewIt).length
  const wrongCount = practiceResults.filter((result) => !result.knewIt).length
  const successRate =
    practiceResults.length > 0
      ? Math.round((correctCount / practiceResults.length) * 100)
      : 0

  if (!authChecked) {
    return (
      <>
        <Header />
        <p style={{ padding: "20px" }}>Loading...</p>
      </>
    )
  }

  if (!testStarted) {
    return (
      <>
        <Header />

        <div style={styles.center}>
          <div style={styles.card}>
            <h1 style={{ marginBottom: "10px" }}>
              {reviewMode ? "📚 Vocabulary Review Retry" : "11+ Vocabulary Test"}
            </h1>

            <p style={{ marginBottom: "18px", fontSize: "18px" }}>
              {reviewMode ? "Practice your saved review words:" : "Select difficulty:"}
            </p>

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

  if (!testWords.length) {
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
                ? "There are no saved vocabulary review words for this set."
                : "Please wait while your vocabulary test is being prepared."}
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

  return (
    <>
      <Header />

      <div style={styles.page}>
        {!testCompleted && currentWord && (
          <>
            <div style={styles.headerRow}>
              <div style={styles.headerLeft}>
                <h1 style={styles.title}>
                  {reviewMode ? "Vocabulary Review" : "Vocabulary Test"}
                </h1>

                <p style={styles.metaText}>
                  Question {Math.min(currentIndex + 1, testWords.length)} /{" "}
                  {testWords.length}
                </p>

                {!reviewMode && (
                  <p style={styles.metaText}>
                    Difficulty: {["Easy", "Medium", "Hard"][difficulty - 1]}
                  </p>
                )}

                {timerEnabled && (
                  <p style={styles.metaText}>
                    Word Timer: {timer}s | Total: {totalTimer}s
                  </p>
                )}
              </div>

              <div style={styles.headerButtons}>
                <button
                  onClick={() => {
                    animatePress(setHearPressed)
                    toggleVoice()
                  }}
                  style={{
                    ...styles.controlButton,
                    backgroundColor: voiceEnabled ? "#374151" : "#d1d5db",
                    color: voiceEnabled ? "white" : "black",
                    transform: hearPressed
                      ? "translateY(2px) scale(0.98)"
                      : "translateY(0) scale(1)",
                    boxShadow: hearPressed
                      ? "inset 0 2px 6px rgba(0,0,0,0.25)"
                      : "0 2px 6px rgba(0,0,0,0.15)",
                  }}
                >
                  🔊 Hear: {voiceEnabled ? "ON" : "OFF"}
                </button>

                <button
                  onClick={() => handleRepeatPress(currentWord.word)}
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
                    setShowHint((prev) => !prev)
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
                    toggleTimer()
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
              <h2 style={styles.word}>{currentWord.word}</h2>
            </div>

            {showHint && currentWord.example_sentence && (
              <p style={styles.hintText}>{currentWord.example_sentence}</p>
            )}

            <div style={{ marginTop: "20px" }}>
              {options.map((option) => {
                const isSelected = selectedAnswer === option.id
                const isCorrect = option.id === currentWord.id

                let backgroundColor = "#f3f4f6"

                if (selectedAnswer !== null) {
                  if (isCorrect) backgroundColor = "#22c55e"
                  else if (isSelected) backgroundColor = "#ef4444"
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option)}
                    disabled={selectedAnswer !== null}
                    style={{
                      ...styles.answerButton,
                      backgroundColor,
                      color:
                        selectedAnswer !== null && (isCorrect || isSelected)
                          ? "white"
                          : "black",
                    }}
                  >
                    {option.definition}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {testCompleted && (
          <div style={styles.resultCard}>
            <h1 style={styles.resultTitle}>Finished!</h1>

            <div style={styles.resultSummary}>
              <p style={styles.resultText}>
                <strong>Correct:</strong> {correctCount}
              </p>

              <p style={styles.resultText}>
                <strong>Wrong:</strong> {wrongCount}
              </p>

              <p style={styles.resultText}>
                <strong>Success Rate:</strong> {successRate}%
              </p>

              {progressSaved && <p style={styles.savedText}>Progress saved.</p>}
              {resultSaved && <p style={styles.savedText}>Full result saved.</p>}
              {errorMessage && <p style={styles.inlineError}>{errorMessage}</p>}
            </div>

            <div style={styles.resultButtons}>
              <button onClick={restartTest} style={styles.secondaryButton}>
                🔁 Restart Test
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

              {practiceResults.map((result, index) => (
                <div
                  key={`${result.wordId}-${index}`}
                  style={{
                    ...styles.reviewQuestionCard,
                    borderColor: result.knewIt ? "#86efac" : "#fecaca",
                    background: result.knewIt ? "#f0fdf4" : "#fef2f2",
                  }}
                >
                  <div style={styles.reviewQuestionTop}>
                    <h3 style={styles.reviewQuestionTitle}>
                      Question {index + 1}: {result.word}
                    </h3>

                    <span
                      style={{
                        ...styles.reviewStatusBadge,
                        background: result.knewIt ? "#dcfce7" : "#fee2e2",
                        color: result.knewIt ? "#166534" : "#991b1b",
                      }}
                    >
                      {result.knewIt ? "Correct" : "Incorrect"}
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

                    {result.example_sentence && (
                      <p>
                        <strong>Example sentence:</strong> {result.example_sentence}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
    width: "100%",
    overflow: "hidden",
    boxSizing: "border-box",
  },

  word: {
    fontSize: "clamp(34px, 10vw, 64px)",
    margin: "10px auto 20px auto",
    maxWidth: "100%",
    lineHeight: 1.1,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    hyphens: "auto",
  },

  hintText: {
    textAlign: "center",
    fontStyle: "italic",
    fontSize: "clamp(18px, 6vw, 30px)",
    color: "#066e0b",
    lineHeight: "1.5",
    maxWidth: "800px",
    margin: "0 auto 20px auto",
    overflowWrap: "break-word",
    wordBreak: "break-word",
  },

  answerButton: {
    display: "block",
    width: "100%",
    marginBottom: "12px",
    padding: "18px",
    fontSize: "clamp(18px, 6vw, 28px)",
    lineHeight: 1.35,
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    whiteSpace: "normal",
    overflowWrap: "break-word",
    wordBreak: "break-word",
    boxSizing: "border-box",
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