"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    total: 0,
    correct: 0,
    percentage: 0,
  })

  useEffect(() => {
    const loadStats = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push("/login")
        return
      }

      const { data, error } = await supabase
        .from("practice_results")
        .select("*")
        .eq("user_id", userData.user.id)

      if (error) {
        console.error(error)
        return
      }

      const total = data.length
      const correct = data.filter(r => r.knew_it).length
      const percentage = total > 0 ? (correct / total) * 100 : 0

      setStats({
        total,
        correct,
        percentage
      })
    }

    loadStats()
  }, [])

  return (
    <div style={{ padding: "40px" }}>
      <h1>📊 Student Dashboard</h1>

      <div style={{ marginTop: "30px" }}>
        <p><strong>Total Words Practiced:</strong> {stats.total}</p>
        <p><strong>Correct Answers:</strong> {stats.correct}</p>
        <p><strong>Success Rate:</strong> {stats.percentage.toFixed(1)}%</p>
      </div>
    </div>
  )
}