"use client"

import { supabase } from "../lib/supabaseClient"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Home() {
  const router = useRouter()

  // ---------- State ----------
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [words, setWords] = useState<any[]>([])
  const [testWords, setTestWords] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showDefinition, setShowDefinition] = useState(false)
  const [difficulty, setDifficulty] = useState(1)
  const [practiceResults, setPracticeResults] = useState<any[]>([])
  const [timer, setTimer] = useState(10)
  const [totalTimer, setTotalTimer] = useState(60)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [testCompleted, setTestCompleted] = useState(false)
  const [testStarted, setTestStarted] = useState(false)

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

  // Redirect to login after auth check
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
    setShowDefinition(false)
    setPracticeResults([])
    setTestCompleted(false)
    setTimer(10)
    setTotalTimer(60)
    setIsTimerActive(shuffled.length > 0)
  }, [difficulty, words, user, testStarted])

  // ---------- Word Timer ----------
  useEffect(() => {
    if (!isTimerActive || showDefinition) return
    if (timer === 0) {
      handleNext(false)
      return
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [isTimerActive, timer, showDefinition])

  // ---------- Total Timer ----------
  useEffect(() => {
    if (!isTimerActive || showDefinition) return
    if (totalTimer === 0) {
      setTestCompleted(true)
      setIsTimerActive(false)
      return
    }
    const interval = setInterval(() => setTotalTimer((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [isTimerActive, totalTimer, showDefinition])

  // ---------- Handle Next ----------
  const handleNext = async (knewIt: boolean | null = null) => {
    if (!user || !currentWord) return

    if (knewIt !== null) {
      setPracticeResults((prev) => [...prev, { word: currentWord.word, knewIt }])
      const { error } = await supabase.from("practice_results").insert([
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
      setTestCompleted(true)
      setIsTimerActive(false)
      return
    }

    setCurrentIndex((prev) => prev + 1)
    setShowDefinition(false)
    setTimer(10)
  }

  // ---------- Loading ----------
  if (loadingUser) return <p>Checking login...</p>
  if (!user) return null // redirect handled by useEffect

  // ---------- Start Screen ----------
  if (!testStarted) {
    const difficultyLevels = [
      { id: 1, label: "Easy", color: "#d4edda" },
      { id: 2, label: "Medium", color: "#fff3cd" },
      { id: 3, label: "Hard", color: "#f8d7da" },
    ]

    return (
      <div style={{ padding: "20px", maxWidth: "600px", margin: "auto", textAlign: "center" }}>
        <h1>11+ Vocabulary Trainer</h1>

        <div style={{ marginBottom: "20px" }}>
          <Link href="/dashboard" style={{ marginRight: "20px" }}>
            📊 View My Progress
          </Link>
          <Link href="/revision">📚 Review Weak Words</Link>
        </div>

        <p>Select difficulty and start the test.</p>

        <div style={{ marginBottom: "20px" }}>
          {difficultyLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => setDifficulty(level.id)}
              style={{
                marginRight: level.id < 3 ? "10px" : "0",
                fontWeight: difficulty === level.id ? "bold" : "normal",
                backgroundColor: difficulty === level.id ? level.color : "white",
                padding: "10px 20px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              {level.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setTestStarted(true)}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            borderRadius: "4px",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
          }}
        >
          Start Test
        </button>
      </div>
    )
  }

  // ---------- Mini-Test ----------
  if (!testWords.length) return <p>Preparing test...</p>

  const testDifficultyLevels = [
    { id: 1, label: "Easy", color: "#d4edda" },
    { id: 2, label: "Medium", color: "#fff3cd" },
    { id: 3, label: "Hard", color: "#f8d7da" },
  ]

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h1>11+ Mini-Test</h1>
<div style={{ textAlign: "center", marginBottom: "20px" }}>
  <span
    style={{
      backgroundColor: "#0070f3",
      color: "white",
      padding: "6px 14px",
      borderRadius: "20px",
      fontSize: "14px",
    }}
  >
    {currentIndex + 1} / {testWords.length}
  </span>
</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
        <span>Logged in as: {user?.email}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>

     <div style={{ marginBottom: "20px" }}>
  {testDifficultyLevels.map((level) => (
    <button
      key={level.id}
      disabled // <-- always disabled, visual only
      style={{
        marginRight: level.id < 3 ? "10px" : "0",
        fontWeight: difficulty === level.id ? "bold" : "normal",
        backgroundColor: difficulty === level.id ? level.color : "white",
        padding: "6px 14px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        cursor: "not-allowed", // indicate that it’s inactive
      }}
    >
      {level.label}
    </button>
  ))}
</div>

      {!testCompleted && currentWord ? (
        <div style={{ border: "1px solid #ccc", padding: "20px" }}>
          <div
  style={{
    backgroundColor: "#f9f9f9",
    padding: "30px",
    borderRadius: "8px",
    marginBottom: "20px",
    textAlign: "center",
  }}
>
  <h2 style={{ fontSize: "56px", margin: 0 }}>
    {currentWord.word}
  </h2>
</div>
<p style={{ opacity: showDefinition ? 0.5 : 1 }}>
  Word Timer: {timer}s
</p>

          <p style={{ opacity: showDefinition ? 0.5 : 1 }}>
  Total Timer: {totalTimer}s
</p>

          {showDefinition ? (
  <div
    style={{
      marginTop: "20px",
      padding: "20px",
      backgroundColor: "#f9f9f9",
      borderRadius: "8px",
      textAlign: "center",
    }}
  >
    <p
      style={{
        fontSize: "28px",
fontWeight: "500",
        margin: 0,
        lineHeight: "1.5",
      }}
    >
      {currentWord.definition}
    </p>
  </div>
) : (
            <div style={{ textAlign: "center", marginTop: "30px" }}>
  <button
    onClick={() => setShowDefinition(true)}
    style={{
      fontSize: "22px",
      padding: "14px 30px",
      borderRadius: "8px",
      backgroundColor: "#28a745",
      color: "white",
      border: "none",
      cursor: "pointer",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    }}
  >
    Reveal Definition
  </button>
</div>
          )}

        {showDefinition && (
  <div
    style={{
      marginTop: "30px",
      display: "flex",
      justifyContent: "center",
      gap: "20px",
    }}
  >
    <button
      onClick={() => handleNext(true)}
      style={{
        fontSize: "20px",
        padding: "14px 28px",
        borderRadius: "8px",
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      }}
    >
      👍 I Knew It
    </button>

    <button
      onClick={() => handleNext(false)}
      style={{
        fontSize: "20px",
        padding: "14px 28px",
        borderRadius: "8px",
        backgroundColor: "#d0d336",
        color: "white",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      }}
    >
      ❌ I Didn’t Know It
    </button>
  </div>
)}
</div> 
      ) : testCompleted ? (
        <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "20px" }}>
          <h2>Test Completed!</h2>
          <p>Total Words: {testWords.length}</p>
          <p>Correct: {practiceResults.filter((r) => r.knewIt).length}</p>
          <p>Incorrect: {practiceResults.filter((r) => !r.knewIt).length}</p>
          <button
            onClick={() => {
              setTestStarted(false)
            }}
          >
            Restart Test
          </button>
        </div>
      ) : null}
    </div>
  )
}