"use client"

import React, { Suspense, useEffect, useState } from "react"
import Header from "../../../components/Header"
import { supabase } from "../../../lib/supabaseClient"
import { useRouter, useSearchParams } from "next/navigation"

type WordRow = {
  id: number
  word: string
  definition: string
  difficulty: number | null
  example_sentence: string | null
}

type PracticeResult = {
  wordId: number
  word: string
  knewIt: boolean
}

const REVIEW_STORAGE_KEY = "vocabulary_review_ids"
const LEGACY_REVIEW_STORAGE_KEY = "vocabulary_review_word_ids"

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
  const [isAnswerLocked, setIsAnswerLocked] = useState(false)
  const [options, setOptions] = useState<WordRow[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [clearedReviewWordIds, setClearedReviewWordIds] = useState<number[]>([])

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

  function clearStoredReviewIds() {
    localStorage.removeItem(REVIEW_STORAGE_KEY)
    localStorage.removeItem(LEGACY_REVIEW_STORAGE_KEY)
  }

  useEffect(() => {
    if (!userId || !testStarted || words.length === 0) return

    let selectedWords: WordRow[] = []

    if (reviewMode) {
      const reviewIds = getStoredReviewIds()
      selectedWords = words.filter((w) => reviewIds.includes(w.id))
    } else {
      selectedWords = words.filter((w) => w.difficulty === difficulty)
    }

    const shuffled = [...selectedWords].sort(() => Math.random() - 0.5).slice(0, 10)

    setTestWords(shuffled)
    setCurrentIndex(0)
    setPracticeResults([])
    setTestCompleted(false)
    setProgressSaved(false)
    setTimer(15)
    setTotalTimer(90)
    setIsTimerActive(timerEnabled && shuffled.length > 0)
    setSelectedAnswer(null)
    setShowHint(false)
    setIsAnswerLocked(false)
    setClearedReviewWordIds([])
  }, [difficulty, words, userId, testStarted, reviewMode, timerEnabled])

  function generateOptions(correctWord: WordRow, allWords: WordRow[]) {
    const incorrect = allWords
      .filter((w) => w.id !== correctWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    return [...incorrect, correctWord].sort(() => Math.random() - 0.5)
  }

  useEffect(() => {
    if (!currentWord || words.length === 0) return

    const opts = generateOptions(currentWord, words)
    setOptions(opts)
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
      void handleNext(false)
      return
    }

    const interval = setInterval(() => {
      setTimer((t) => t - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerActive, timer, timerEnabled])

  useEffect(() => {
    if (!isTimerActive || !timerEnabled) return

    if (totalTimer === 0) {
      setTestCompleted(true)
      setIsTimerActive(false)
      return
    }

    const interval = setInterval(() => {
      setTotalTimer((t) => t - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerActive, totalTimer, timerEnabled])

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
      void handleNext(correct)
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

  async function handleNext(knewIt: boolean | null = null) {
    if (!userId || !currentWord) {
      setIsAnswerLocked(false)
      return
    }

    let updatedResults = practiceResults
    let updatedClearedReviewIds = clearedReviewWordIds

    if (knewIt !== null) {
      const newResult: PracticeResult = {
        wordId: currentWord.id,
        word: currentWord.word,
        knewIt,
      }

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
      const totalWordsPracticed = updatedResults.length
      const correctAnswers = updatedResults.filter((r) => r.knewIt).length
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

      if (reviewMode) {
        const storedIds = getStoredReviewIds()
        const remainingIds = storedIds.filter(
          (id) => !updatedClearedReviewIds.includes(id)
        )

        localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(remainingIds))
        localStorage.removeItem(LEGACY_REVIEW_STORAGE_KEY)
      }

      setTestCompleted(true)
      setIsTimerActive(false)
      setIsAnswerLocked(true)
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
    setTimer(15)
    setTotalTimer(90)
    setIsTimerActive(false)
    setSelectedAnswer(null)
    setShowHint(false)
    setIsAnswerLocked(false)
    setClearedReviewWordIds([])

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
                  Question {Math.min(currentIndex + 1, testWords.length)} / {testWords.length}
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

                let bg = "#f3f4f6"

                if (selectedAnswer !== null) {
                  if (isCorrect) bg = "#22c55e"
                  else if (isSelected) bg = "#ef4444"
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option)}
                    disabled={selectedAnswer !== null}
                    style={{
                      ...styles.answerButton,
                      backgroundColor: bg,
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
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <h2>Finished!</h2>

            <p>Correct: {practiceResults.filter((r) => r.knewIt).length}</p>
            <p>Wrong: {practiceResults.filter((r) => !r.knewIt).length}</p>
            {progressSaved && <p>Progress saved.</p>}

            <div style={{ marginTop: "20px" }}>
              <button onClick={restartTest} style={{ ...styles.button, marginRight: "10px" }}>
                🔁 Restart Test
              </button>

              <button
                onClick={() => router.push(reviewMode ? "/review/english" : "/english")}
                style={{
                  ...styles.button,
                  backgroundColor: "#0070f3",
                }}
              >
                {reviewMode ? "📘 Back to English Review" : "📘 Back to English"}
              </button>
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
  },
  word: {
    fontSize: "64px",
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
}