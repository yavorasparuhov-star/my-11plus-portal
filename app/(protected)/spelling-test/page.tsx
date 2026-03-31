"use client"

import { supabase } from "../../../lib/supabaseClient"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function SpellingPage() {
  const [user, setUser] = useState<any>(null)

  const [words, setWords] = useState<any[]>([])
  const [difficulty, setDifficulty] = useState(1)
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

  const router = useRouter()
  const searchParams = useSearchParams()
  const reviewMode = searchParams.get("mode") === "review"
  const TOTAL_QUESTIONS = 10
  const totalQuestions = words.length > 0 ? words.length : TOTAL_QUESTIONS

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser()
      setUser(data.user ?? null)
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

  async function fetchWords() {
    const { data, error } = await supabase.from("words").select("*")

    if (error) {
      console.error(error)
      return
    }

    const allWords = data || []

    let selectedWords: any[] = []

    if (reviewMode) {
      const saved = localStorage.getItem("spelling_review_word_ids")
      const reviewIds: number[] = saved ? JSON.parse(saved) : []
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
    if (user) {
      fetchWords()
    }
  }, [user, difficulty, reviewMode])

  useEffect(() => {
    if (words.length > 0 && words[currentIndex]) {
      generateOptions(words[currentIndex])
    }
  }, [words, currentIndex])

  useEffect(() => {
    if (!testStarted) return
    if (!voiceEnabled) return
    if (words.length === 0) return
    if (!words[currentIndex]) return

    speakWord(words[currentIndex].word)
  }, [testStarted, words, currentIndex, voiceEnabled])

  useEffect(() => {
    if (!timerEnabled) {
      setTimeLeft(15)
      return
    }

    if (!words[currentIndex]) return
    if (selected) return

    setTimeLeft(15)

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentIndex, timerEnabled, selected, words])

  useEffect(() => {
    if (user && words.length > 0 && currentIndex >= words.length && !progressSaved) {
      saveSpellingProgress(score)
    }
  }, [currentIndex, words.length, progressSaved, score, user])

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

  function generateOptions(wordItem: any) {
    if (!wordItem || !wordItem.word) return

    const correct = wordItem.word
    const wrong = Array.isArray(wordItem.wrong_words)
      ? [...new Set(wordItem.wrong_words)]
      : []

    const allOptions = shuffle([correct, ...wrong])

    setOptions(allOptions)
    setSelected(null)
    setFeedback("")
    setHintUsed(false)
    setShowHint(false)
  }

  async function saveSpellingProgress(finalScore: number) {
    if (!user || words.length === 0) return

    const successRate = Math.round((finalScore / words.length) * 100)

    const { error } = await supabase.from("spelling_progress").insert([
      {
        user_id: user.id,
        total_words_practiced: words.length,
        correct_answers: finalScore,
        success_rate: successRate,
        difficulty: difficulty,
      },
    ])

    if (error) {
      console.error("Error saving spelling progress:", error)
    } else {
      setProgressSaved(true)
    }
  }

  async function saveWrongSpellingReview(wordItem: any) {
    if (!user) return

    const cleanedWord = wordItem.word.trim().toLowerCase()

    const { error } = await supabase
      .from("spelling_review")
      .upsert(
        [
          {
            user_id: user.id,
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
    if (!user) return

    const { error } = await supabase
      .from("spelling_review")
      .delete()
      .eq("user_id", user.id)
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
    if (selected) return

    const currentWordItem = words[currentIndex]
    const correct = currentWordItem.word
    setSelected(option)

    if (option === correct) {
      setFeedback("Correct ✅")
      setScore((prev) => prev + 1)

      if (reviewMode) {
        await removeWordFromReview(currentWordItem.id)
      }
    } else {
      setFeedback(`Incorrect ❌ (Correct: ${correct})`)

      if (!reviewMode) {
        await saveWrongSpellingReview(currentWordItem)
      }
    }

    setTimeout(() => {
      nextQuestion()
    }, 1500)
  }

  async function handleTimeout() {
    if (selected || !words[currentIndex]) return

    const currentWordItem = words[currentIndex]
    const correct = currentWordItem.word
    setSelected("TIMEOUT")
    setFeedback(`⏰ Time's up! Correct: ${correct}`)

    if (!reviewMode) {
      await saveWrongSpellingReview(currentWordItem)
    }

    setTimeout(() => {
      nextQuestion()
    }, 1500)
  }

  function nextQuestion() {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setCurrentIndex(words.length)
    }
  }

  function restartTest() {
    if (reviewMode) {
      localStorage.removeItem("spelling_review_word_ids")
    }

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
    setWords([])
  }

  function getDifficultyLabel(value: number | null | undefined) {
    if (value === 1) return "Easy"
    if (value === 2) return "Medium"
    if (value === 3) return "Hard"
    return "Not set"
  }

  if (!user) {
    return <div>Loading...</div>
  }

  if (!testStarted) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h1>{reviewMode ? "📝 Spelling Review Retry" : "11+ Spelling Test"}</h1>

          <p>{reviewMode ? "Practice your saved review words:" : "Select difficulty:"}</p>

          {!reviewMode && (
            <div style={styles.difficultyRow}>
              {[1, 2, 3].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
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
    )
  }

  if (words.length === 0) {
    return <div style={styles.center}>Preparing test...</div>
  }

  const currentWord = words[currentIndex]

  if (!currentWord) {
    const displayedDifficulty =
      reviewMode ? words[0]?.difficulty ?? null : difficulty

    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h1>🎉 Test Complete!</h1>
          <h2>
            Your Score: {score} / {totalQuestions}
          </h2>
          <p>Difficulty: {getDifficultyLabel(displayedDifficulty)}</p>

          <div style={{ marginTop: "20px" }}>
            <button onClick={restartTest} style={{ ...styles.button, marginRight: "10px" }}>
              Restart
            </button>

            <button
              onClick={() => router.push("/home")}
              style={{
                ...styles.button,
                backgroundColor: "#0070f3",
              }}
            >
              🏠 Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const correctAnswer = currentWord.word
  const displayedDifficulty =
    reviewMode ? currentWord?.difficulty ?? words[0]?.difficulty ?? null : difficulty

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Spelling Test</h1>
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
            onClick={() => setVoiceEnabled((prev) => !prev)}
            style={{
              ...styles.controlButton,
              backgroundColor: voiceEnabled ? "#374151" : "#d1d5db",
              color: voiceEnabled ? "white" : "black",
            }}
          >
            🔊 Hear: {voiceEnabled ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => speakWord(correctAnswer)}
            style={styles.controlButton}
          >
            Repeat
          </button>

          <button
            onClick={handleHint}
            style={styles.controlButton}
          >
            💡 Hint
          </button>

          <button
            onClick={() => setTimerEnabled((prev) => !prev)}
            style={{
              ...styles.controlButton,
              backgroundColor: timerEnabled ? "#374151" : "#d1d5db",
              color: timerEnabled ? "white" : "black",
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
          <strong>Definition:</strong> {currentWord.definition}
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
              key={i}
              onClick={() => handleAnswer(opt)}
              disabled={!!selected}
              style={{
                ...styles.answerButton,
                backgroundColor: bg,
                color: selected && (opt === correctAnswer || opt === selected) ? "white" : "black",
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
  )
}

const styles: any = {
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
    marginBottom: "20px",
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