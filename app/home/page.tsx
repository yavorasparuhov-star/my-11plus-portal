"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import Header from "../../components/Header"

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) return <p>Loading...</p>
  if (!user) return null

  return (
    <>
      <Header user={user} onLogout={handleLogout} />

      <div style={{
        padding: "40px",
        maxWidth: "600px",
        margin: "auto",
        textAlign: "center"
      }}>
        <h1>11+ Learning Portal</h1>

        <p style={{ marginBottom: "30px" }}>
          Choose your training mode:
        </p>

        <button
          onClick={() => router.push("/vocabulary-test")}
          style={{
            display: "block",
            width: "100%",
            padding: "15px",
            marginBottom: "15px",
            fontSize: "18px",
            borderRadius: "8px",
          }}
        >
          📘 Vocabulary
        </button>

        <button
          onClick={() => router.push("/spelling")}
          style={{
            display: "block",
            width: "100%",
            padding: "15px",
            fontSize: "18px",
            borderRadius: "8px",
          }}
        >
          ✏️ Spelling
        </button>
      </div>
    </>
  )
}