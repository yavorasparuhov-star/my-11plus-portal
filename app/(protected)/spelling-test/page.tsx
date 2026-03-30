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
    if (
      user &&
      words.length > 0 &&
      currentIndex >= words.length &&
      !progressSaved
    ) {
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

  if (!user) {
    return <div>Loading...</div>
  }

  if (!testStarted) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h1>{reviewMode ? "📝 Spelling Review Retry" : "11+ Spelling Test"}</h1>

          <p>{reviewMode ? "Practice your saved review words:" : "Select difficulty:"}</p>

          {!reviewMode &&
            [1, 2, 3].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                style={{
                  ...styles.smallButton,
                  margin: "5px",
                  background: difficulty === level ? "#c7d2fe" : "#e5e7eb",
                }}
              >
                {["Easy", "Medium", "Hard"][level - 1]}
              </button>
            ))}

          <div style={{ marginTop: "20px" }}>
            <button onClick={() => setTestStarted(true)} style={styles.button}>
              {reviewMode
                ? "Start Review Retry"
                : `Start Test (${["Easy", "Medium", "Hard"][difficulty - 1]})`}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (words.length === 0) {
    return <div style={styles.center}>Preparing test...</div>
  }

  const currentWord = words[currentIndex]

  function getDifficultyLabel(value: number | null | undefined) {
    if (value === 1) return "Easy"
    if (value === 2) return "Medium"
    if (value === 3) return "Hard"
    return "Not set"
  }

  const displayedDifficulty = reviewMode
    ? currentWord?.difficulty ?? words[0]?.difficulty ?? null
    : difficulty

  if (!currentWord) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h1>🎉 Test Complete!</h1>
          <h2>
            Your Score: {score} / {totalQuestions}
          </h2>
          <p>Difficulty: {getDifficultyLabel(displayedDifficulty)}</p>

          <button onClick={restartTest} style={styles.button}>
            Restart
          </button>
        </div>
      </div>
    )
  }

  const correctAnswer = currentWord.word
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0

  return (
    <div style={styles.center}>
      <div style={styles.card}>
        <h2>
          Question {currentIndex + 1} / {totalQuestions}
        </h2>

        <p>Difficulty: {getDifficultyLabel(displayedDifficulty)}</p>

        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>

        <div style={styles.toggleRow}>
          <button
            onClick={() => setTimerEnabled((prev) => !prev)}
            style={styles.smallButton}
          >
            Timer: {timerEnabled ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => setVoiceEnabled((prev) => !prev)}
            style={styles.smallButton}
          >
            Voice: {voiceEnabled ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => speakWord(correctAnswer)}
            style={styles.smallButton}
          >
            🔊 Repeat
          </button>
        </div>

        {timerEnabled && <p>⏳ Time left: {timeLeft}s</p>}

        <h3>Choose the correct spelling:</h3>

        <button
          onClick={handleHint}
          style={{
            padding: "8px 16px",
            marginTop: "10px",
            cursor: "pointer",
          }}
        >
          💡 Hint
        </button>

        {showHint && (
          <div
            style={{
              marginTop: "12px",
              marginBottom: "12px",
              padding: "10px",
              backgroundColor: "#f3f4f6",
              borderRadius: "8px",
            }}
          >
            <strong>Definition:</strong> {currentWord.definition}
          </div>
        )}

        <div>
          {options.map((opt, i) => {
            let bg = "#f3f4f6"

            if (selected) {
              if (opt === correctAnswer) bg = "#b9fbc0"
              else if (opt === selected) bg = "#ffadad"
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={!!selected}
                style={{
                  ...styles.option,
                  backgroundColor: bg,
                  cursor: selected ? "not-allowed" : "pointer",
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {feedback && <p style={{ marginTop: 10 }}>{feedback}</p>}

        <p style={{ marginTop: 15 }}>Score: {score}</p>
      </div>
    </div>
  )
}

const styles: any = {
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
  toggleRow: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
    margin: "15px 0",
  },
  option: {
    display: "block",
    width: "100%",
    margin: "10px 0",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    fontSize: "16px",
    transition: "all 0.2s ease",
  },
  button: {
    marginTop: "15px",
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    background: "#4f46e5",
    color: "white",
    cursor: "pointer",
  },
  smallButton: {
    padding: "8px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#e5e7eb",
    cursor: "pointer",
  },
  progressBar: {
    width: "100%",
    height: "10px",
    background: "#e5e7eb",
    borderRadius: "5px",
    margin: "15px 0",
  },
  progressFill: {
    height: "100%",
    background: "#4f46e5",
    borderRadius: "5px",
    transition: "width 0.3s ease",
  },
}