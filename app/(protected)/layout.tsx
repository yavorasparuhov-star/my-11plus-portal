"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import Header from "../../components/Header"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function checkUser() {
      const { data, error } = await supabase.auth.getUser()

      if (!mounted) return

      if (error || !data.user) {
        setUser(null)
        setLoading(false)
        router.replace("/login")
        return
      }

      setUser(data.user)
      setLoading(false)
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      if (!session?.user) {
        setUser(null)
        router.replace("/login")
        return
      }

      setUser(session.user)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  async function handleLogout() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }

    await supabase.auth.signOut()

    setUser(null)
    router.replace("/login")
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4fbf4",
          color: "#065f46",
          fontSize: "20px",
          fontWeight: 700,
        }}
      >
        Loading...
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      {children}
    </div>
  )
}