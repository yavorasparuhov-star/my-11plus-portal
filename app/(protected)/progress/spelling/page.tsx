"use client"

import { supabase } from "../../../../lib/supabaseClient"
import { useEffect, useState } from "react"

type SpellingProgressRow = {
  id: string
  user_id: string
  total_words_practiced: number
  correct_answers: number
  success_rate: number
  created_at: string
}

export default function SpellingProgressPage() {
  const [progress, setProgress] = useState<SpellingProgressRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [])

  async function fetchProgress() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("spelling_progress")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading spelling progress:", error)
      setLoading(false)
      return
    }

    setProgress(data || [])
    setLoading(false)
  }

  const totalTests = progress.length

  const totalWordsPracticed = progress.reduce(
    (sum, row) => sum + row.total_words_practiced,
    0
  )

  const totalCorrectAnswers = progress.reduce(
    (sum, row) => sum + row.correct_answers,
    0
  )

  const averageSuccessRate =
    totalTests > 0
      ? Math.round(
          progress.reduce((sum, row) => sum + row.success_rate, 0) / totalTests
        )
      : 0

  const bestScore =
    totalTests > 0
      ? Math.max(...progress.map((row) => Math.round(row.success_rate)))
      : 0

  if (loading) {
    return <p style={styles.message}>Loading spelling progress...</p>
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>✍️ Spelling Progress</h1>
        <p style={styles.subtitle}>Track spelling test performance over time.</p>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={styles.statLabel}>Tests Completed</h3>
            <p style={styles.statValue}>{totalTests}</p>
          </div>

          <div style={styles.statCard}>
            <h3 style={styles.statLabel}>Words Practised</h3>
            <p style={styles.statValue}>{totalWordsPracticed}</p>
          </div>

          <div style={styles.statCard}>
            <h3 style={styles.statLabel}>Average Success</h3>
            <p style={styles.statValue}>{averageSuccessRate}%</p>
          </div>

          <div style={styles.statCard}>
            <h3 style={styles.statLabel}>Best Score</h3>
            <p style={styles.statValue}>{bestScore}%</p>
          </div>
        </div>

        {progress.length === 0 ? (
          <div style={styles.emptyCard}>
            <h2>No spelling progress yet</h2>
            <p>Complete a spelling test and your results will appear here.</p>
          </div>
        ) : (
          <div style={styles.historyCard}>
            <h2 style={styles.sectionTitle}>Recent Attempts</h2>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Correct</th>
                    <th style={styles.th}>Words</th>
                    <th style={styles.th}>Success</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.map((row) => (
                    <tr key={row.id}>
                      <td style={styles.td}>
                        {new Date(row.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        {new Date(row.created_at).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td style={styles.td}>{row.correct_answers}</td>
                      <td style={styles.td}>{row.total_words_practiced}</td>
                      <td style={styles.td}>{Math.round(row.success_rate)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={styles.mobileList}>
              {progress.map((row) => (
                <div key={row.id} style={styles.attemptCard}>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(row.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    {new Date(row.created_at).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p>
                    <strong>Correct:</strong> {row.correct_answers}
                  </p>
                  <p>
                    <strong>Total words:</strong> {row.total_words_practiced}
                  </p>
                  <p>
                    <strong>Success:</strong> {Math.round(row.success_rate)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={styles.summaryCard}>
          <h2 style={styles.sectionTitle}>Overall Summary</h2>
          <p>
            You answered <strong>{totalCorrectAnswers}</strong> spelling words
            correctly across <strong>{totalTests}</strong> completed test
            {totalTests === 1 ? "" : "s"}.
          </p>
        </div>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    padding: "24px",
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  title: {
    fontSize: "32px",
    marginBottom: "8px",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: "#555",
    marginBottom: "24px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  statLabel: {
    fontSize: "16px",
    marginBottom: "10px",
    color: "#555",
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: 0,
  },
  historyCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    marginBottom: "24px",
  },
  summaryCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },
  emptyCard: {
    background: "white",
    borderRadius: "16px",
    padding: "32px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    textAlign: "center",
    marginBottom: "24px",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "16px",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #ddd",
    fontSize: "14px",
    color: "#555",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #eee",
  },
  mobileList: {
    display: "none",
  },
  attemptCard: {
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "16px",
    marginTop: "12px",
  },
  message: {
    textAlign: "center",
    marginTop: "40px",
  },
}