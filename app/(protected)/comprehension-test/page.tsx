"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "../../../lib/supabaseClient"

type ComprehensionTest = {
  id: number
  title: string
  passage: string
  difficulty: number | null
  created_at: string
}

export default function ComprehensionTestsPage() {
  const [tests, setTests] = useState<ComprehensionTest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTests()
  }, [])

  async function fetchTests() {
    setLoading(true)

    const { data, error } = await supabase
      .from("comprehension_tests")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading comprehension tests:", error)
      setLoading(false)
      return
    }

    setTests((data || []) as ComprehensionTest[])
    setLoading(false)
  }

  function getDifficultyLabel(difficulty: number | null) {
    if (difficulty === 1) return "Easy"
    if (difficulty === 2) return "Medium"
    if (difficulty === 3) return "Hard"
    return "Not set"
  }

  function getPreviewText(passage: string) {
    if (passage.length <= 180) return passage
    return passage.slice(0, 180).trim() + "..."
  }

  if (loading) {
    return <p style={styles.message}>Loading comprehension tests...</p>
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.heroCard}>
          <h1 style={styles.title}>📖 Comprehension Tests</h1>
          <p style={styles.subtitle}>
            Choose a comprehension passage and answer 10 multiple-choice questions.
          </p>
        </div>

        {tests.length === 0 ? (
          <div style={styles.emptyCard}>
            <h2>No comprehension tests yet</h2>
            <p>Add a test in Supabase and it will appear here.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {tests.map((test) => (
              <div key={test.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <h2 style={styles.cardTitle}>{test.title}</h2>
                  <span style={styles.badge}>
                    {getDifficultyLabel(test.difficulty)}
                  </span>
                </div>

                <p style={styles.preview}>{getPreviewText(test.passage)}</p>

                <p style={styles.meta}>
                  Created:{" "}
                  {new Date(test.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>

                <Link href={`/comprehension-test/${test.id}`} style={styles.button}>
                  Start Test →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    padding: "24px",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  heroCard: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    marginBottom: "24px",
    textAlign: "center",
  },
  title: {
    fontSize: "36px",
    margin: "0 0 8px 0",
  },
  subtitle: {
    margin: 0,
    color: "#555",
    lineHeight: 1.6,
  },
  emptyCard: {
    background: "white",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.3,
  },
  badge: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#3730a3",
    fontWeight: 600,
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  preview: {
    margin: 0,
    color: "#374151",
    lineHeight: 1.6,
    flexGrow: 1,
  },
  meta: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
  },
  button: {
    display: "inline-block",
    padding: "12px 18px",
    borderRadius: "12px",
background: "#d4f5d0",
color: "#065f46",
    textDecoration: "none",
    fontWeight: 600,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    marginTop: "40px",
    fontSize: "18px",
  },
}