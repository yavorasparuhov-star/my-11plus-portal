"use client"

import { supabase } from "../../lib/supabaseClient"
import { useEffect, useState } from "react"

export default function RevisionPage() {

  const [weakWords, setWeakWords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWeakWords()
  }, [])

  const loadWeakWords = async () => {

    const { data, error } = await supabase
      .from("practice_results")
      .select("*")

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

  if (loading) return <p>Loading...</p>

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
      <h1>Revision Words</h1>

      {weakWords.length === 0 ? (
        <p>Great job! No weak words yet.</p>
      ) : (
        weakWords.map((word, i) => (
          <div key={i} style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "10px"
          }}>
            {word}
          </div>
        ))
      )}
    </div>
  )
}