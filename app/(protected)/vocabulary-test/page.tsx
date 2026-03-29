"use client"

import { supabase } from "../../../lib/supabaseClient"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  // ---------- State ----------
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [words, setWords] = useState<any[]>([])
  const [testWords, setTestWords] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [difficulty, setDifficulty] = useState(1)
  const [practiceResults, setPracticeResults] = useState<any[]>([])
  const [timer, setTimer] = useState(15)
  const [totalTimer, setTotalTimer] = useState(60)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [testStarted, setTestStarted] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [progressSaved, setProgressSaved] = useState(false)
const [isAnswerLocked, setIsAnswerLocked] = useState(false)
  const [options, setOptions] = useState<any[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null)

  const currentWord = testWords[currentIndex] || null

  // ---------- Auth ----------
  useEffect(() => {
    let subscription: any = null

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoadingUser(false)
    })

    subscription = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      if (subscription) subscription?.unsubscribe?.()
    }
  }, [])

  useEffect(() => {
    if (!loadingUser && !user) {
      router.push("/login")
    }
  }, [user, loadingUser, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // ---------- Fetch Words ----------
  useEffect(() => {
    async function fetchWords() {
      const { data, error } = await supabase.from("words").select().order("id")
      if (error) console.error(error)
      else setWords(data || [])
    }
    fetchWords()
  }, [])

  // ---------- Prepare Test ----------
  useEffect(() => {
    if (!user || !testStarted) return

    const filtered = words.filter((w) => w.difficulty === difficulty)
    const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, 10)

    setTestWords(shuffled)
    setCurrentIndex(0)
    setPracticeResults([])
    setTestCompleted(false)
    setProgressSaved(false)
    setTimer(15)
    setTotalTimer(90)
    setIsTimerActive(shuffled.length > 0)
  }, [difficulty, words, user, testStarted])

  // ---------- Generate Options ----------
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

  // ---------- Timers ----------
  useEffect(() => {
    if (!isTimerActive) return

    if (timer === 0) {
      setIsTimerActive(false)
      handleNext(false)
      return
    }

    const interval = setInterval(() => {
      setTimer((t) => t - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerActive, timer])

  useEffect(() => {
    if (!isTimerActive) return

    if (totalTimer === 0) {
      setTestCompleted(true)
      setIsTimerActive(false)
      return
    }

    const interval = setInterval(() => {
      setTotalTimer((t) => t - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerActive, totalTimer])

  // ---------- Handle Answer ----------
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
  }, 2500)
}

  // ---------- Next ----------
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

    const { error } = await supabase.from("vocabulary_review").insert([
      {
        user_id: user.id,
        word_id: currentWord.id,
        word: currentWord.word,
        knew_it: knewIt,
        difficulty: currentWord.difficulty,
      },
    ])
    if (error) console.error(error)
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
      },
    ])

    if (error) {
      console.error("Error saving vocabulary progress:", error)
    } else {
      setProgressSaved(true)
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
  setIsTimerActive(true)
}

  // ---------- Restart ----------
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
  // ---------- Speak Word ----------
const speakWord = (text: string) => {
  if (typeof window === "undefined") return
  if (!("speechSynthesis" in window)) return

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = "en-GB" // change to "en-US" if you prefer
  speechSynthesis.speak(utterance)
}
  // ---------- Loading ----------
  if (loadingUser) return <p>Checking login...</p>
  if (!user) return null

    // ---------- Start Screen ----------
  if (!testStarted) {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h1 style={{ marginBottom: "10px" }}>11+ Vocabulary Test</h1>

          <p style={{ marginBottom: "18px", fontSize: "18px" }}>
            Select difficulty:
          </p>

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

          <button onClick={() => setTestStarted(true)} style={styles.button}>
            Start Test ({["Easy", "Medium", "Hard"][difficulty - 1]})
          </button>
        </div>
      </div>
    )
  }

  if (!testWords.length) return <p>Preparing test...</p>

  // ---------- Test UI ----------
  return (
    <>

      <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
        <h1>Vocabulary Test</h1>

        <p>Question {Math.min(currentIndex + 1, testWords.length)} / {testWords.length}</p>
        <p>Word Timer: {timer}s | Total: {totalTimer}s</p>

        {!testCompleted && currentWord && (
          <>
        <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "15px",
    marginBottom: "10px"
  }}
>
  {/* Word */}
  <h2 style={{ fontSize: "48px", margin: 0 }}>
    {currentWord.word}
  </h2>

  {/* Buttons */}
  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
    <button
      onClick={() => setShowHint(true)}
      style={{
        padding: "6px 10px",
        borderRadius: "4px",
        border: "none",
        backgroundColor: "#555",
        color: "white",
        cursor: "pointer",
        fontSize: "12px"
      }}
    >
      💡 Hint
    </button>

    <button
      onClick={() => speakWord(currentWord.word)}
      style={{
        padding: "6px 10px",
        borderRadius: "4px",
        border: "none",
        backgroundColor: "#333",
        color: "white",
        cursor: "pointer",
        fontSize: "12px"
      }}
    >
      🔊 Hear
    </button>
  </div>
</div>    
   {/* ✅ SHOW HINT */}
  {showHint && currentWord?.example_sentence && (
    <p style={{ textAlign: "center", fontStyle: "italic", marginBottom: "15px" }}>
      {currentWord.example_sentence}
    </p>
  )}
            <div style={{ marginTop: "20px" }}>
              {options.map((option) => {
                const isSelected = selectedAnswer === option.id
                const isCorrect = option.id === currentWord.id

                let bg = "#f0f0f0"

                if (selectedAnswer) {
                  if (isCorrect) bg = "#28a745"
                  else if (isSelected) bg = "#dc3545"
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option)}
                    disabled={!!selectedAnswer}
                    style={{
                      display: "block",
                      width: "100%",
                      marginBottom: "10px",
                      padding: "14px",
                      fontSize: "18px",
                      borderRadius: "8px",
                      backgroundColor: bg,
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

            <p>Correct: {practiceResults.filter(r => r.knewIt).length}</p>
            <p>Wrong: {practiceResults.filter(r => !r.knewIt).length}</p>

            <div style={{ marginTop: "20px" }}>
              <button
                onClick={restartTest}
                style={{ marginRight: "10px", padding: "10px 20px" }}
              >
                🔁 Restart Test
              </button>

              <button
onClick={() => router.push("/home")}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#0070f3",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                }}
              >
                🏠 Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </>
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
}