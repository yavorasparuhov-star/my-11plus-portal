"use client"

import { supabase } from "../../lib/supabaseClient"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "../../components/Header"

export default function SpellingPage() {
  const [user, setUser] = useState<any>(null)
  const [words, setWords] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState("")
  const [score, setScore] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)

  const [timerEnabled, setTimerEnabled] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [timeLeft, setTimeLeft] = useState(15)

  const router = useRouter()
  const TOTAL_QUESTIONS = 10

  useEffect(() => {
    checkUser()
    fetchWords()
  }, [])

  async function checkUser() {
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      router.push("/")
    } else {
      setUser(data.user)
    }
  }

  async function fetchWords() {
    const { data, error } = await supabase.from("words").select("*")

    if (error) {
      console.error(error)
      return
    }

    const shuffled = [...(data || [])].sort(() => Math.random() - 0.5)
    setWords(shuffled.slice(0, TOTAL_QUESTIONS))
  }

  useEffect(() => {
    if (words.length > 0 && words[currentIndex]) {
      generateOptions(words[currentIndex])

      if (voiceEnabled) {
        speakWord(words[currentIndex].word)
      }
    }
  }, [words, currentIndex, voiceEnabled])
useEffect(() => {
  checkUser()
  fetchWords()
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
  }

  function handleHint() {
    if (hintUsed || selected) return

    const correct = words[currentIndex].word
    const wrong = options.filter((o) => o !== correct)

    if (wrong.length === 0) return

    const randomWrong = wrong[Math.floor(Math.random() * wrong.length)]
    setOptions(shuffle([correct, randomWrong]))
    setHintUsed(true)
  }

  function handleAnswer(option: string) {
    if (selected) return

    const correct = words[currentIndex].word
    setSelected(option)

    if (option === correct) {
      setFeedback("Correct ✅")
      setScore((prev) => prev + 1)
    } else {
      setFeedback(`Incorrect ❌ (Correct: ${correct})`)
    }
  }

  function handleTimeout() {
    if (selected || !words[currentIndex]) return

    const correct = words[currentIndex].word
    setSelected("TIMEOUT")
    setFeedback(`⏰ Time's up! Correct: ${correct}`)
  }

  function nextQuestion() {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setCurrentIndex(words.length)
    }
  }

  function restartTest() {
    setScore(0)
    setCurrentIndex(0)
    setSelected(null)
    setFeedback("")
    setOptions([])
    setHintUsed(false)
    setTimeLeft(15)
    fetchWords()
  }

  async function handleLogout() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }

    await supabase.auth.signOut()
    router.push("/")
  }

  if (words.length === 0) {
    return <div>Loading...</div>
  }

  const currentWord = words[currentIndex]

  if (!currentWord) {
    return (
      <div>
        <Header user={user} onLogout={handleLogout} />

        <div style={styles.center}>
          <div style={styles.card}>
            <h1>🎉 Test Complete!</h1>
            <h2>
              Your Score: {score} / {TOTAL_QUESTIONS}
            </h2>

            <button onClick={restartTest} style={styles.button}>
              Restart
            </button>
          </div>
        </div>
      </div>
    )
  }

  const correctAnswer = currentWord.word
  const progress = ((currentIndex + 1) / TOTAL_QUESTIONS) * 100

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />

      <div style={styles.center}>
        <div style={styles.card}>
          <h2>
            Question {currentIndex + 1} / {TOTAL_QUESTIONS}
          </h2>

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
            disabled={hintUsed || !!selected}
            style={{
              ...styles.button,
              background: hintUsed || selected ? "#9ca3af" : "#10b981",
              marginBottom: "10px",
            }}
          >
            Hint (50/50)
          </button>

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

          {feedback && (
            <button onClick={nextQuestion} style={styles.button}>
              Next →
            </button>
          )}

          <p style={{ marginTop: 15 }}>Score: {score}</p>
        </div>
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