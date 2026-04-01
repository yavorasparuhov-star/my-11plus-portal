"use client"

import { supabase } from "../../../lib/supabaseClient"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reviewMode = searchParams.get("mode") === "review"

  const [words, setWords] = useState<any[]>([])
  const [testWords, setTestWords] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [difficulty, setDifficulty] = useState(1)
  const [practiceResults, setPracticeResults] = useState<any[]>([])
  const [timer, setTimer] = useState(15)
  const [totalTimer, setTotalTimer] = useState(90)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [progressSaved, setProgressSaved] = useState(false)
  const [isAnswerLocked, setIsAnswerLocked] = useState(false)
  const [options, setOptions] = useState<any[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [timerEnabled, setTimerEnabled] = useState(true)

  const currentWord = testWords[currentIndex] || null

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser()
      setUser(data.user ?? null)
    }
    getUser()
  }, [])

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
      const { data, error } = await supabase.from("words").select().order("id")
      if (error) console.error(error)
      else setWords(data || [])
    }
    fetchWords()
  }, [])

  useEffect(() => {
    if (!user || !testStarted || words.length === 0) return

    let selectedWords: any[] = []

    if (reviewMode) {
      const saved = localStorage.getItem("vocabulary_review_word_ids")
      const reviewIds: number[] = saved ? JSON.parse(saved) : []
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
  }, [difficulty, words, user, testStarted, reviewMode])

  function generateOptions(correctWord: any, allWords: any[]) {
    const incorrect = allWords
      .filter((w) => w.id !== correctWord.id)
      .sort(() => 0.5 - Math.random())
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
      handleNext(false)
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

  function handleAnswer(option: any) {
    if (isAnswerLocked) return
    if (selectedAnswer !== null) return
    if (!currentWord) return
    if (currentIndex >= testWords.length) return

    setIsAnswerLocked(true)

    const correct = option.id === currentWord.id

    setSelectedAnswer(option.id)
    setIsTimerActive(false)

    setTimeout(() => {
      handleNext(correct)
      setSelectedAnswer(null)
    }, 1800)
  }

  async function removeWordFromReview(wordId: number) {
    if (!user) return

    const { error } = await supabase
      .from("vocabulary_review")
      .delete()
      .eq("user_id", user.id)
      .eq("word_id", wordId)

    if (error) {
      console.error("Error removing vocabulary review word:", error)
    }
  }

  const handleNext = async (knewIt: boolean | null = null) => {
    if (!user || !currentWord) {
      setIsAnswerLocked(false)
      return
    }

    let updatedResults = practiceResults

    if (knewIt !== null) {
      const newResult = { word: currentWord.word, knewIt }
      updatedResults = [...practiceResults, newResult]
      setPracticeResults(updatedResults)

      if (reviewMode) {
        if (knewIt) {
          await removeWordFromReview(currentWord.id)
        }
      } else {
        const { error } = await supabase.from("vocabulary_review").insert([
          {
            user_id: user.id,
            word_id: currentWord.id,
            word: currentWord.word,
            knew_it: knewIt,
            difficulty: currentWord.difficulty,
          },
        ])

        if (error) {
          console.error("Error saving vocabulary review:", error)
        }
      }
    }

    if (currentIndex + 1 >= testWords.length) {
      const totalWordsPracticed = updatedResults.length
      const correctAnswers = updatedResults.filter((r) => r.knewIt).length
      const successRate =
        totalWordsPracticed > 0 ? (correctAnswers / totalWordsPracticed) * 100 : 0

      const { error } = await supabase.from("vocabulary_progress").insert([
        {
          user_id: user.id,
          total_words_practiced: totalWordsPracticed,
          correct_answers: correctAnswers,
          success_rate: successRate,
          difficulty: difficulty,
        },
      ])

      if (error) {
        console.error("Error saving vocabulary progress:", error)
      } else {
        setProgressSaved(true)
      }

      if (reviewMode) {
        localStorage.removeItem("vocabulary_review_word_ids")
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

  const restartTest = () => {
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

    setTimeout(() => {
      setTestStarted(true)
    }, 0)
  }

  const speakWord = (text: string) => {
    if (typeof window === "undefined") return
    if (!("speechSynthesis" in window)) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "en-GB"
    utterance.rate = 0.95
    window.speechSynthesis.speak(utterance)
  }

  const toggleVoice = () => {
    const newValue = !voiceEnabled
    setVoiceEnabled(newValue)
    localStorage.setItem("vocabulary_voice_enabled", String(newValue))
  }

  const toggleTimer = () => {
    const newValue = !timerEnabled
    setTimerEnabled(newValue)
    localStorage.setItem("vocabulary_timer_enabled", String(newValue))

    if (!newValue) {
      setIsTimerActive(false)
    } else if (!testCompleted && testStarted && currentWord && selectedAnswer === null) {
      setIsTimerActive(true)
    }
  }

  if (!user) return <p>Loading...</p>

  if (!testStarted) {
    return (
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

  if (!testWords.length) return <p style={{ padding: "20px" }}>Preparing test...</p>

  return (
    <div style={styles.page}>
      {!testCompleted && currentWord && (
        <>
          <div style={styles.headerRow}>
            <div style={styles.headerLeft}>
              <h1 style={styles.title}>Vocabulary Test</h1>
              <p style={styles.metaText}>
                Question {Math.min(currentIndex + 1, testWords.length)} / {testWords.length}
              </p>
              <p style={styles.metaText}>
                Difficulty: {["Easy", "Medium", "Hard"][difficulty - 1]}
              </p>
              {timerEnabled && (
                <p style={styles.metaText}>
                  Word Timer: {timer}s | Total: {totalTimer}s
                </p>
              )}
            </div>

            <div style={styles.headerButtons}>
              <button
                onClick={toggleVoice}
                style={{
                  ...styles.controlButton,
                  backgroundColor: voiceEnabled ? "#374151" : "#d1d5db",
                  color: voiceEnabled ? "white" : "black",
                }}
              >
                🔊 Hear: {voiceEnabled ? "ON" : "OFF"}
              </button>

              <button
                onClick={() => currentWord && speakWord(currentWord.word)}
                style={styles.controlButton}
              >
                Repeat
              </button>

              <button
                onClick={() => setShowHint((prev) => !prev)}
                style={styles.controlButton}
              >
                💡 Hint
              </button>

              <button
                onClick={toggleTimer}
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
            <h2 style={styles.word}>{currentWord.word}</h2>
          </div>

          {showHint && currentWord?.example_sentence && (
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
                    color: selectedAnswer !== null && (isCorrect || isSelected) ? "white" : "black",
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

          <div style={{ marginTop: "20px" }}>
            <button onClick={restartTest} style={{ ...styles.button, marginRight: "10px" }}>
              🔁 Restart Test
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
      )}
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
  word: {
    fontSize: "64px",
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
}