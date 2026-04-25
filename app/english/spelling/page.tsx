"use client"

import React, { Suspense, useEffect, useState } from "react"
import Header from "../../../components/Header"
import { supabase } from "../../../lib/supabaseClient"
import { useRouter } from "next/navigation"

type WordRow = {
  id: number
  word: string
  definition: string | null
  difficulty: number | null
  wrong_words: string[] | null
}

const REVIEW_STORAGE_KEY = "spelling_review_ids"
const LEGACY_REVIEW_STORAGE_KEY = "spelling_review_word_ids"
const TOTAL_QUESTIONS = 10

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
  const [reviewMode, setReviewMode] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setReviewMode(params.get("mode") === "review")
  }, [])

  const [userId, setUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const [words, setWords] = useState<WordRow[]>([])
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1)
  const [testStarted, setTestStarted] = useState(false)

  const [showHint, setShowHint] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState("")
  const [score, setScore] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)
  const [progressSaved, setProgressSaved] = useState(false)

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
      return
    }

    const allWords = (data || []) as WordRow[]

    let selectedWords: WordRow[] = []

    if (reviewMode) {
      const reviewIds = getStoredReviewIds()
      selectedWords = allWords.filter((w) => reviewIds.includes(w.id))
    } else {
      selectedWords = allWords.filter((w) => w.difficulty === difficulty)
    }

    const shuffled = [...selectedWords].sort(() => Math.random() - 0.5)

    setWords(shuffled.slice(0, TOTAL_QUESTIONS))
    setCurrentIndex(0)
    setSelected(null)
    setFeedback("")
    setScore(0)
    setHintUsed(false)
    setShowHint(false)
    setTimeLeft(15)
    setProgressSaved(false)
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
    if (selected) return

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
  }, [currentIndex, timerEnabled, selected, currentWord, testStarted])

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

    const cleanedWrong = [...new Set(wrongFromRow.map((w) => w.trim()).filter(Boolean))]
      .filter((w) => w.toLowerCase() !== correct.trim().toLowerCase())

    let wrongOptions = cleanedWrong.slice(0, 3)

    if (wrongOptions.length < 3) {
      const fallback = allWords
        .map((w) => w.word)
        .filter((w) => w.trim().toLowerCase() !== correct.trim().toLowerCase())
        .filter((w) => !wrongOptions.includes(w))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 - wrongOptions.length)

      wrongOptions = [...wrongOptions, ...fallback]
    }

    const allOptions = shuffle([correct, ...wrongOptions]).slice(0, 4)

    setOptions(allOptions)
    setSelected(null)
    setFeedback("")
    setHintUsed(false)
    setShowHint(false)
  }

  async function saveSpellingProgress(finalScore: number) {
    if (!userId || words.length === 0) return

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
      console.error("Error saving spelling progress:", error)
    } else {
      setProgressSaved(true)
    }
  }

  async function saveWrongSpellingReview(wordItem: WordRow) {
    if (!userId) return

    const cleanedWord = wordItem.word.trim().toLowerCase()

    const { error } = await supabase.from("spelling_review").upsert(
      [
        {
          user_id: userId,
          word_id: wordItem.id,
          word: cleanedWord,
          knew_it: false,
          difficulty: wordItem.difficulty,
        },
      ],
      {
        onConflict: "user_id,word",
      }
    )

    if (error) {
      console.error("Error saving spelling review:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
    }
  }

  async function removeWordFromReview(wordId: number) {
    if (!userId) return

    const { error } = await supabase
      .from("spelling_review")
      .delete()
      .eq("user_id", userId)
      .eq("word_id", wordId)

    if (error) {
      console.error("Error removing spelling review word:", error)
    }
  }

  function handleHint() {
    if (hintUsed || selected) return
    setShowHint(true)
    setHintUsed(true)
  }

  async function handleAnswer(option: string) {
    if (selected || !currentWord) return

    const correct = currentWord.word
    const isCorrect = option === correct
    const updatedScore = isCorrect ? score + 1 : score

    setSelected(option)

    if (isCorrect) {
      setFeedback("Correct ✅")
      setScore(updatedScore)

      if (reviewMode) {
        await removeWordFromReview(currentWord.id)
        removeWordIdFromStoredReviewIds(currentWord.id)
      }
    } else {
      setFeedback(`Incorrect ❌ (Correct: ${correct})`)

      if (!reviewMode) {
        await saveWrongSpellingReview(currentWord)
      }
    }

    setTimeout(() => {
      void nextQuestion(updatedScore)
    }, 1500)
  }

  async function handleTimeout() {
    if (selected || !currentWord) return

    const correct = currentWord.word
    setSelected("TIMEOUT")
    setFeedback(`⏰ Time's up! Correct: ${correct}`)

    if (!reviewMode) {
      await saveWrongSpellingReview(currentWord)
    }

    setTimeout(() => {
      void nextQuestion(score)
    }, 1500)
  }

  async function nextQuestion(finalScore: number) {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      return
    }

    await saveSpellingProgress(finalScore)
    setCurrentIndex(words.length)
  }

  function restartTest() {
    setTestStarted(false)
    setScore(0)
    setCurrentIndex(0)
    setSelected(null)
    setFeedback("")
    setOptions([])
    setHintUsed(false)
    setShowHint(false)
    setTimeLeft(15)
    setProgressSaved(false)
    void fetchWords()
  }

  function getDifficultyLabel(value: number | null | undefined) {
    if (value === 1) return "Easy"
    if (value === 2) return "Medium"
    if (value === 3) return "Hard"
    return "Not set"
  }

  if (!authChecked) {
    return (
      <>
        <Header />
        <div>Loading...</div>
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
        <div style={styles.center}>
          <div style={styles.card}>
            <h1>🎉 Test Complete!</h1>
            <h2>
              Your Score: {score} / {totalQuestions}
            </h2>
            <p>Difficulty: {getDifficultyLabel(displayedDifficulty)}</p>
            {progressSaved && <p>Progress saved.</p>}

            <div style={{ marginTop: "20px" }}>
              <button onClick={restartTest} style={{ ...styles.button, marginRight: "10px" }}>
                Restart
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

        {showHint && (
          <p style={styles.hintText}>
            <strong>Definition:</strong> {currentWord.definition || "No definition available."}
          </p>
        )}

        <div style={{ marginTop: "20px" }}>
          {options.map((opt, i) => {
            let bg = "#f3f4f6"

            if (selected) {
              if (opt === correctAnswer) bg = "#22c55e"
              else if (opt === selected) bg = "#ef4444"
            }

            return (
              <button
                key={`${opt}-${i}`}
                onClick={() => handleAnswer(opt)}
                disabled={!!selected}
                style={{
                  ...styles.answerButton,
                  backgroundColor: bg,
                  color:
                    selected && (opt === correctAnswer || opt === selected)
                      ? "white"
                      : "black",
                  cursor: selected ? "not-allowed" : "pointer",
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {feedback && <p style={styles.feedbackText}>{feedback}</p>}
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
    marginTop: "18px",
    textAlign: "center",
    fontSize: "22px",
    fontWeight: "bold",
  },
}