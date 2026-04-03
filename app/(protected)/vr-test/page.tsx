"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../lib/supabaseClient"

const hoverCardStyle = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

type VRStats = {
  vrScore: number | null
  vrReviewCount: number
}

type TopicCard = {
  title: string
  path: string
  icon: string
  description: string
  buttonText: string
  available: boolean
}

export default function VRTestPage() {
  const router = useRouter()

  const [stats, setStats] = useState<VRStats>({
    vrScore: null,
    vrReviewCount: 0,
  })

  const [loadingStats, setLoadingStats] = useState(true)

  const topics: TopicCard[] = useMemo(
    () => [
      {
        title: "Word Relationships",
        path: "/vr-test/word-relationships",
        icon: "📝",
        description:
          "Build skills in synonyms, antonyms, analogies, and word meaning connections.",
        buttonText: "Start Word Relationships",
        available: true,
      },
      {
        title: "Codes & Logic",
        path: "/vr-test/codes-logic",
        icon: "🔐",
        description:
          "Practise letter codes, word rules, hidden logic, and structured verbal puzzles.",
        buttonText: "Start Codes & Logic",
        available: true,
      },
      {
        title: "Sequence & Patterns",
        path: "/vr-test/sequence-patterns",
        icon: "🔤",
        description:
          "Improve recognition of letter sequences, word patterns, and logical order questions.",
        buttonText: "Start Sequence & Patterns",
        available: true,
      },
    ],
    []
  )

  useEffect(() => {
    async function loadVRStats() {
      setLoadingStats(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoadingStats(false)
        return
      }

      const [vrProgressRes, vrReviewRes] = await Promise.all([
        supabase
          .from("vr_progress")
          .select("success_rate, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),

        supabase
          .from("vr_review")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ])

      setStats({
        vrScore:
          vrProgressRes.data && vrProgressRes.data.length > 0
            ? Math.round(vrProgressRes.data[0].success_rate)
            : null,
        vrReviewCount: vrReviewRes.count ?? 0,
      })

      setLoadingStats(false)
    }

    loadVRStats()
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

  function handleTopicClick(topic: TopicCard) {
    router.push(topic.path)
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.title}>Verbal Reasoning</h1>
        <p style={styles.subtitle}>
          Choose a verbal reasoning activity and keep building confidence in word
          relationships, codes, logic, and sequences.
        </p>
      </div>

      <div style={styles.grid}>
        {topics.map((topic) => (
          <div
            key={topic.title}
            style={{
              ...styles.card,
              ...hoverCardStyle,
            }}
            onClick={() => handleTopicClick(topic)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
            }}
          >
            <div style={styles.icon}>{topic.icon}</div>
            <h2 style={styles.cardTitle}>{topic.title}</h2>
            <p style={styles.cardText}>{topic.description}</p>

            <div style={styles.statsBox}>
              <div style={styles.statRow}>
                <span style={styles.statLabel}>Last score:</span>
                <span
                  style={{
                    ...styles.scoreBadge,
                    ...getScoreBadgeStyle(loadingStats ? null : stats.vrScore),
                  }}
                >
                  {loadingStats ? "Loading..." : getScoreLabel(stats.vrScore)}
                </span>
              </div>

              <div style={styles.statRow}>
                <span style={styles.statLabel}>Review items:</span>
                <span style={styles.reviewCount}>
                  {loadingStats ? "Loading..." : stats.vrReviewCount}
                </span>
              </div>

              <div style={styles.statRow}>
                <span style={styles.statLabel}>Status:</span>
                <span style={styles.reviewCount}>Ready</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleTopicClick(topic)
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              {topic.buttonText}
            </button>
          </div>
        ))}
      </div>

      <div style={styles.bottomButtons}>
        <button
          onClick={() => router.push("/review/vr")}
          style={styles.secondaryButton}
        >
          VR Review
        </button>

        <button
          onClick={() => router.push("/progress/vr")}
          style={styles.secondaryButton}
        >
          VR Progress
        </button>
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
    minHeight: "96px",
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
  bottomButtons: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "30px",
  },
  secondaryButton: {
    padding: "12px 24px",
    borderRadius: "12px",
    border: "1px solid #90ee90",
    background: "white",
    color: "#065f46",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "16px",
    minWidth: "180px",
  },
}