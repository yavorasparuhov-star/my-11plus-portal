"use client"

import { supabase } from "../../lib/supabaseClient"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "../../components/Header"

export default function RevisionPage() {
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [weakWords, setWeakWords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  // ---------- Load Weak Words ----------
  useEffect(() => {
    if (!user) return
    loadWeakWords()
  }, [user])

  const loadWeakWords = async () => {
    const { data, error } = await supabase
      .from("vocabulary_review")
      .select("*")
      .eq("user_id", user.id)

    if (error) {
      console.error(error)
      return
    }

    // Group results by word
    const stats: any = {}

    data.forEach((r) => {
      if (!stats[r.word]) {
        stats[r.word] = { correct: 0, incorrect: 0 }
      }

      if (r.knew_it) stats[r.word].correct++
      else stats[r.word].incorrect++
    })

    // Weak words = more wrong than correct
    const weak = Object.entries(stats)
      .filter(([_, v]: any) => v.incorrect > v.correct)
      .map(([word]) => word)

    setWeakWords(weak)
    setLoading(false)
  }

  if (loadingUser) return <p>Loading...</p>
  if (!user) return null
  if (loading) return <p>Loading...</p>

  return (
    <>
      <Header user={user} onLogout={handleLogout} />

      <div style={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
        <h1>Revision Words</h1>

        {weakWords.length === 0 ? (
          <p>Great job! No weak words yet.</p>
        ) : (
          weakWords.map((word, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px"
              }}
            >
              {word}
            </div>
          ))
        )}
      </div>
    </>
  )
}