"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useRouter } from "next/navigation"
import Header from "../../components/Header"

export default function Dashboard() {
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [stats, setStats] = useState({
    testsTaken: 0,
    totalWordsPracticed: 0,
    correctAnswers: 0,
    percentage: 0,
    bestScore: 0,
    latestScore: 0,
  })

  // ---------- Auth ----------
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user ?? null)
      setLoadingUser(false)
    }

    getUser()
  }, [])

  useEffect(() => {
    if (!loadingUser && !user) {
      router.push("/login")
    }
  }, [user, loadingUser, router])

  // ---------- Logout ----------
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  // ---------- Load Stats ----------
  useEffect(() => {
    const loadStats = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from("vocabulary_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading dashboard stats:", error)
        return
      }

      const testsTaken = data?.length || 0
      const totalWordsPracticed =
        data?.reduce((sum, row) => sum + (row.total_words_practiced || 0), 0) || 0
      const correctAnswers =
        data?.reduce((sum, row) => sum + (row.correct_answers || 0), 0) || 0

      const percentage =
        totalWordsPracticed > 0 ? (correctAnswers / totalWordsPracticed) * 100 : 0

      const bestScore =
        data?.reduce((max, row) => {
          const rowScore =
            row.total_words_practiced > 0
              ? (row.correct_answers / row.total_words_practiced) * 100
              : 0
          return Math.max(max, rowScore)
        }, 0) || 0

      const latestScore =
        data && data.length > 0
          ? data[0].total_words_practiced > 0
            ? (data[0].correct_answers / data[0].total_words_practiced) * 100
            : 0
          : 0

      setStats({
        testsTaken,
        totalWordsPracticed,
        correctAnswers,
        percentage,
        bestScore,
        latestScore,
      })
    }

    if (user) {
      loadStats()
    }
  }, [user])

  if (loadingUser) return <p>Loading...</p>
  if (!user) return null

  return (
    <>
      <Header user={user} onLogout={handleLogout} />

      <div style={{ padding: "40px", maxWidth: "700px", margin: "0 auto" }}>
        <h1>📊 Student Dashboard</h1>

        <div
          style={{
            marginTop: "30px",
            backgroundColor: "#f8f9fa",
            padding: "24px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <p><strong>Tests Taken:</strong> {stats.testsTaken}</p>
          <p><strong>Total Words Practiced:</strong> {stats.totalWordsPracticed}</p>
          <p><strong>Correct Answers:</strong> {stats.correctAnswers}</p>
          <p><strong>Overall Success Rate:</strong> {stats.percentage.toFixed(1)}%</p>
          <p><strong>Best Score:</strong> {stats.bestScore.toFixed(1)}%</p>
          <p><strong>Latest Score:</strong> {stats.latestScore.toFixed(1)}%</p>
        </div>
      </div>
    </>
  )
}