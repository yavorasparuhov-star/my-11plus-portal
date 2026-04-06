"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"

const hoverCardStyle = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

type VRWordRelationshipsTest = {
  id: number
  title: string
  category: string | null
  difficulty: number | null
  created_at: string
}

export default function VRWordRelationshipsPage() {
  const router = useRouter()

  const [tests, setTests] = useState<VRWordRelationshipsTest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTests()
  }, [])

  async function loadTests() {
    setLoading(true)

    const { data, error } = await supabase
      .from("vr_tests")
      .select("*")
      .eq("category", "word-relationships")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading word relationships tests:", error)
      setTests([])
      setLoading(false)
      return
    }

    setTests(data || [])
    setLoading(false)
  }

  function getDifficultyLabel(level: number | null) {
    if (level === 1) return "Easy"
    if (level === 2) return "Medium"
    if (level === 3) return "Hard"
    return "Not set"
  }

  function getDifficultyBadgeStyle(level: number | null): React.CSSProperties {
    if (level === 1) {
      return {
        backgroundColor: "#d1fae5",
        color: "#065f46",
      }
    }

    if (level === 2) {
      return {
        backgroundColor: "#fef3c7",
        color: "#92400e",
      }
    }

    if (level === 3) {
      return {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
      }
    }

    return {
      backgroundColor: "#e5e7eb",
      color: "#374151",
    }
  }

  if (loading) {
    return <p style={styles.message}>Loading word relationships tests...</p>
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.title}>Word Relationships</h1>
        <p style={styles.subtitle}>
          Practise synonyms, antonyms, analogies, and meaning connections with
          structured verbal reasoning tests.
        </p>
      </div>

      {tests.length === 0 ? (
        <div style={styles.emptyCard}>
          <h2 style={styles.emptyTitle}>No tests available yet</h2>
          <p style={styles.emptyText}>
            Word Relationships tests will appear here when they are added.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {tests.map((test) => (
            <div
              key={test.id}
              style={{ ...styles.card, ...hoverCardStyle }}
              onClick={() => router.push(`/vr-test/word-relationships/${test.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)"
                e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
              }}
            >
              <div style={styles.icon}>📝</div>
              <h2 style={styles.cardTitle}>{test.title}</h2>
              <p style={styles.cardText}>
                Strengthen verbal reasoning through word meaning, opposites,
                connections, and analogy questions.
              </p>

              <div style={styles.infoBox}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Difficulty:</span>
                  <span
                    style={{
                      ...styles.badge,
                      ...getDifficultyBadgeStyle(test.difficulty),
                    }}
                  >
                    {getDifficultyLabel(test.difficulty)}
                  </span>
                </div>

                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Test ID:</span>
                  <span style={styles.infoValue}>{test.id}</span>
                </div>

                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Created:</span>
                  <span style={styles.infoValue}>
                    {new Date(test.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/vr-test/word-relationships/${test.id}`)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#bbf7d0"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#d4f5d0"
                }}
                style={styles.button}
              >
                Start Test
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    padding: "32px 20px 50px",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  hero: {
    textAlign: "center",
    marginBottom: "32px",
  },
  title: {
    fontSize: "40px",
    marginBottom: "10px",
    color: "#111827",
  },
  subtitle: {
    fontSize: "18px",
    color: "#4b5563",
    maxWidth: "700px",
    margin: "0 auto",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "26px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  icon: {
    fontSize: "42px",
    marginBottom: "12px",
  },
  cardTitle: {
    fontSize: "24px",
    marginBottom: "10px",
    color: "#111827",
  },
  cardText: {
    fontSize: "16px",
    color: "#4b5563",
    lineHeight: 1.6,
    marginBottom: "18px",
    minHeight: "78px",
  },
  infoBox: {
    width: "100%",
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "18px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    margin: "8px 0",
  },
  infoLabel: {
    color: "#374151",
    fontSize: "15px",
    fontWeight: 500,
  },
  infoValue: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#111827",
  },
  badge: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: 700,
    minWidth: "92px",
    textAlign: "center",
  },
  button: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#d4f5d0",
    color: "#065f46",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "16px",
    minWidth: "180px",
  },
  emptyCard: {
    background: "white",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    textAlign: "center",
    maxWidth: "700px",
    margin: "0 auto",
  },
  emptyTitle: {
    fontSize: "28px",
    marginBottom: "10px",
    color: "#111827",
  },
  emptyText: {
    fontSize: "16px",
    color: "#4b5563",
    lineHeight: 1.6,
  },
  message: {
    textAlign: "center",
    marginTop: "40px",
    fontSize: "18px",
    color: "#374151",
  },
}