"use client"

import Header from "../../components/Header"
import { useRouter } from "next/navigation"

const hoverCardStyle = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

export default function VRPage() {
  const router = useRouter()

  function openCategory(path: string) {
    router.push(path)
  }

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Verbal Reasoning</h1>
          <p style={styles.subtitle}>
            Practise core verbal reasoning skills to prepare for 11+ entrance exams.
          </p>
        </div>

        <div style={styles.grid}>
          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/vr/word-relationships")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
            }}
          >
            <div style={{ ...styles.icon, ...styles.wordIcon }}>↔</div>
            <h2 style={styles.cardTitle}>Word Relationships</h2>
            <p style={styles.cardText}>
              Build skills in synonyms, antonyms, analogies, and word meaning
              connections.
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/vr/word-relationships")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open VR
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/vr/code-logic")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
            }}
          >
            <div style={{ ...styles.icon, ...styles.codeIcon }}>🔐</div>
            <h2 style={styles.cardTitle}>Codes & Logic</h2>
            <p style={styles.cardText}>
              Practise letter codes, word rules, hidden logic, and structured
              verbal puzzles.
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/vr/code-logic")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open VR
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/vr/sequence-patterns")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
            }}
          >
            <div style={{ ...styles.icon, ...styles.sequenceIcon }}>A→Z</div>
            <h2 style={styles.cardTitle}>Sequence & Patterns</h2>
            <p style={styles.cardText}>
              Improve recognition of letter sequences, word patterns, and logical
              order questions.
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/vr/sequence-patterns")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open VR
            </button>
          </div>
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
    width: "76px",
    height: "76px",
    borderRadius: "22px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "34px",
    fontWeight: 900,
    letterSpacing: "-1px",
    boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
  },
  wordIcon: {
    background: "linear-gradient(135deg, #dbeafe, #93c5fd)",
    color: "#1d4ed8",
  },
  codeIcon: {
    background: "linear-gradient(135deg, #fef3c7, #fbbf24)",
    color: "#92400e",
  },
  sequenceIcon: {
    background: "linear-gradient(135deg, #fce7f3, #f9a8d4)",
    color: "#9d174d",
    fontSize: "25px",
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
    marginBottom: "22px",
    minHeight: "78px",
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
    marginTop: "auto",
  },
}
