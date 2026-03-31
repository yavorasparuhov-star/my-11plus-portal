"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"

const hoverCardStyle = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}
type DashboardStats = {
  vocabularyScore: number | null
  spellingScore: number | null
  comprehensionScore: number | null
  vocabularyReviewCount: number
  spellingReviewCount: number
  comprehensionReviewCount: number
}

export default function HomePage() {
  const router = useRouter()

  const [stats, setStats] = useState<DashboardStats>({
    vocabularyScore: null,
    spellingScore: null,
    comprehensionScore: null,
    vocabularyReviewCount: 0,
    spellingReviewCount: 0,
    comprehensionReviewCount: 0,
  })

  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    async function loadDashboardStats() {
      setLoadingStats(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoadingStats(false)
        return
      }

      const [
        vocabularyProgressRes,
        spellingProgressRes,
        comprehensionProgressRes,
        vocabularyReviewRes,
        spellingReviewRes,
        comprehensionReviewRes,
      ] = await Promise.all([
        supabase
          .from("vocabulary_progress")
          .select("success_rate, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),

        supabase
          .from("spelling_progress")
          .select("success_rate, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),

        supabase
          .from("comprehension_progress")
          .select("success_rate, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),

        supabase
          .from("vocabulary_review")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),

        supabase
          .from("spelling_review")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),

        supabase
          .from("comprehension_review")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ])

      setStats({
        vocabularyScore:
          vocabularyProgressRes.data && vocabularyProgressRes.data.length > 0
            ? Math.round(vocabularyProgressRes.data[0].success_rate)
            : null,

        spellingScore:
          spellingProgressRes.data && spellingProgressRes.data.length > 0
            ? Math.round(spellingProgressRes.data[0].success_rate)
            : null,

        comprehensionScore:
          comprehensionProgressRes.data && comprehensionProgressRes.data.length > 0
            ? Math.round(comprehensionProgressRes.data[0].success_rate)
            : null,

        vocabularyReviewCount: vocabularyReviewRes.count ?? 0,
        spellingReviewCount: spellingReviewRes.count ?? 0,
        comprehensionReviewCount: comprehensionReviewRes.count ?? 0,
      })

      setLoadingStats(false)
    }

    loadDashboardStats()
  }, [])

  function getScoreLabel(score: number | null) {
    if (score === null) return "Not tested yet"
    return `${score}%`
  }

  function getScoreBadgeStyle(score: number | null): React.CSSProperties {
    if (score === null) {
      return {
        backgroundColor: "#e5e7eb",
        color: "#374151",
      }
    }

    if (score >= 80) {
      return {
        backgroundColor: "#d1fae5",
        color: "#065f46",
      }
    }

    if (score >= 50) {
      return {
        backgroundColor: "#fef3c7",
        color: "#92400e",
      }
    }

    return {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.title}>11+ Learning Portal</h1>
        <p style={styles.subtitle}>
          Welcome back. Choose a training activity and keep building your 11+ skills.
        </p>
      </div>

      <div style={styles.grid}>
        <div
  style={{ ...styles.card, ...hoverCardStyle }}
  onClick={() => router.push("/vocabulary-test")}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-6px)"
    e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)"
    e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
  }}
>
          <div style={styles.icon}>📘</div>
          <h2 style={styles.cardTitle}>Vocabulary</h2>
          <p style={styles.cardText}>
            Strengthen word knowledge, meanings, and usage with multiple-choice practice.
          </p>

          <div style={styles.statsBox}>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Last score:</span>
              <span
                style={{
                  ...styles.scoreBadge,
                  ...getScoreBadgeStyle(loadingStats ? null : stats.vocabularyScore),
                }}
              >
                {loadingStats ? "Loading..." : getScoreLabel(stats.vocabularyScore)}
              </span>
            </div>

            <div style={styles.statRow}>
              <span style={styles.statLabel}>Review words:</span>
              <span style={styles.reviewCount}>
                {loadingStats ? "Loading..." : stats.vocabularyReviewCount}
              </span>
            </div>
          </div>

<button
  onClick={(e) => {
    e.stopPropagation() 
    router.push("/vocabulary-test")
  }}
    onMouseEnter={(e) => {
    e.currentTarget.style.background = "#bbf7d0"
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "#d4f5d0"
  }}
  style={styles.button}
>
  Start Vocabulary
</button>
        </div>

       <div
  style={{ ...styles.card, ...hoverCardStyle }}
  onClick={() => router.push("/spelling-test")}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-6px)"
    e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)"
    e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
  }}
>
          <div style={styles.icon}>✏️</div>
          <h2 style={styles.cardTitle}>Spelling</h2>
          <p style={styles.cardText}>
            Practise correct spelling, improve recall, and review difficult words.
          </p>

          <div style={styles.statsBox}>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Last score:</span>
              <span
                style={{
                  ...styles.scoreBadge,
                  ...getScoreBadgeStyle(loadingStats ? null : stats.spellingScore),
                }}
              >
                {loadingStats ? "Loading..." : getScoreLabel(stats.spellingScore)}
              </span>
            </div>

            <div style={styles.statRow}>
              <span style={styles.statLabel}>Review words:</span>
              <span style={styles.reviewCount}>
                {loadingStats ? "Loading..." : stats.spellingReviewCount}
              </span>
            </div>
          </div>
<button
  onClick={(e) => {
    e.stopPropagation() // 👈 THIS IS THE IMPORTANT LINE
    router.push("/spelling-test")
  }}
    onMouseEnter={(e) => {
    e.currentTarget.style.background = "#bbf7d0"
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "#d4f5d0"
  }}
  style={styles.button}
>
  Start Spelling
</button>
         
        </div>

<div
  style={{ ...styles.card, ...hoverCardStyle }}
  onClick={() => router.push("/comprehension-test")}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-6px)"
    e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)"
    e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
  }}
>
          <div style={styles.icon}>📖</div>
          <h2 style={styles.cardTitle}>Comprehension</h2>
          <p style={styles.cardText}>
            Read passages carefully and answer questions to build understanding and accuracy.
          </p>

          <div style={styles.statsBox}>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Last score:</span>
              <span
                style={{
                  ...styles.scoreBadge,
                  ...getScoreBadgeStyle(loadingStats ? null : stats.comprehensionScore),
                }}
              >
                {loadingStats ? "Loading..." : getScoreLabel(stats.comprehensionScore)}
              </span>
            </div>

            <div style={styles.statRow}>
              <span style={styles.statLabel}>Review items:</span>
              <span style={styles.reviewCount}>
                {loadingStats ? "Loading..." : stats.comprehensionReviewCount}
              </span>
            </div>
          </div>
<button
  onClick={(e) => {
    e.stopPropagation()
    router.push("/comprehension-test")
  }}
    onMouseEnter={(e) => {
    e.currentTarget.style.background = "#bbf7d0"
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "#d4f5d0"
  }}
  style={styles.button}
>
  Start Comprehension
</button>
          
        </div>
      </div>
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
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
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
  statsBox: {
    width: "100%",
    background: "#f9fafb",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "18px",
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    margin: "8px 0",
  },
  statLabel: {
    color: "#374151",
    fontSize: "15px",
    fontWeight: 500,
  },
  scoreBadge: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: 700,
    minWidth: "92px",
    textAlign: "center",
  },
  reviewCount: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#111827",
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
}