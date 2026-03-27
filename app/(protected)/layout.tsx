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
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push("/login")
      } else {
        setUser(data.user)
      }

      setLoading(false)
    }

    checkUser()
  }, [router])

  async function handleLogout() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }

    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <Header user={user} onLogout={handleLogout} />
      {children}
    </div>
  )
}