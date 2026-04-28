"use client"

import Header from "../../components/Header"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"

const hoverCardStyle = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

type MathStats = {
  mathScore: number | null
  mathReviewCount: number
}

export default function MathPage() {
  const router = useRouter()

  const [stats, setStats] = useState<MathStats>({
    mathScore: null,
    mathReviewCount: 0,
  })

  const [loadingStats, setLoadingStats] = useState(true)

  const topics = [
    {
      title: "Number & Place Value",
      path: "/math/number-place-value",
      icon: "🔢",
      description:
        "Build confidence with place value, ordering numbers, rounding, and number patterns.",
      buttonText: "Open Number & Place Value",
    },
    {
      title: "Four Operations",
      path: "/math/four-operations",
      icon: "➕",
      description:
        "Practise addition, subtraction, multiplication, division, and multi-step calculations.",
      buttonText: "Open Four Operations",
    },
    {
      title: "Fractions, Decimals & Percentages",
      path: "/math/fractions-decimals-percentages",
      icon: "🟰",
      description: "Convert, compare and solve problems with FDP.",
      buttonText: "Open FDP",
    },
    {
      title: "Shape & Space",
      path: "/math/shape-space",
      icon: "📐",
      description:
        "Explore angles, properties of shapes, symmetry, coordinates, and spatial reasoning.",
      buttonText: "Open Shape & Space",
    },
    {
      title: "Measurement",
      path: "/math/measurement",
      icon: "📏",
      description:
        "Practise length, mass, capacity, time, area, perimeter, and practical measurement problems.",
      buttonText: "Open Measurement",
    },
    {
      title: "Data Handling",
      path: "/math/data-handling",
      icon: "📊",
      description:
        "Interpret charts, tables, graphs, and solve problems based on mathematical data.",
      buttonText: "Open Data Handling",
    },
    {
      title: "Algebra & Reasoning",
      path: "/math/algebra-reasoning",
      icon: "🧠",
      description:
        "Develop algebraic thinking, sequences, formulas, and logical mathematical reasoning.",
      buttonText: "Open Algebra & Reasoning",
    },
  ]

  useEffect(() => {
    async function loadMathStats() {
      setLoadingStats(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoadingStats(false)
        return
      }

      const [mathProgressRes, mathReviewRes] = await Promise.all([
        supabase
          .from("math_progress")
          .select("success_rate, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),

        supabase
          .from("math_review")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ])

      setStats({
        mathScore:
          mathProgressRes.data && mathProgressRes.data.length > 0
            ? Math.round(mathProgressRes.data[0].success_rate)
            : null,
        mathReviewCount: mathReviewRes.count ?? 0,
      })

      setLoadingStats(false)
    }

    loadMathStats()
  }, [])

  function openCategory(path: string) {
    router.push(path)
  }

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
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Maths</h1>
          <p style={styles.subtitle}>
            Practise core mathematical skills across all major 11+ topics and
            build confidence step by step.
          </p>
        </div>

        <div style={styles.grid}>
          {topics.map((topic) => (
            <div
              key={topic.title}
              style={{ ...styles.card, ...hoverCardStyle }}
              onClick={() => openCategory(topic.path)}
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

              <div style={styles.infoBox}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Last score:</span>
                  <span
                    style={{
                      ...styles.scoreBadge,
                      ...getScoreBadgeStyle(
                        loadingStats ? null : stats.mathScore
                      ),
                    }}
                  >
                    {loadingStats ? "Loading..." : getScoreLabel(stats.mathScore)}
                  </span>
                </div>

                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Review items:</span>
                  <span style={styles.infoValue}>
                    {loadingStats ? "Loading..." : stats.mathReviewCount}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openCategory(topic.path)
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
      </div>
    </>
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
  scoreBadge: {
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
}