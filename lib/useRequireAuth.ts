"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "./supabaseClient"

export function useRequireAuth() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession()
      const currentUser = data.session?.user ?? null

      setUser(currentUser)
      setLoading(false)

      if (!currentUser) {
        router.push("/login")
      }
    }

    getUser()
  }, [router])

  return { user, loading }
}