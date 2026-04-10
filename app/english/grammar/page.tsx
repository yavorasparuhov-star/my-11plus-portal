"use client"

import type { CSSProperties } from "react"
import Header from "../../../components/Header"
import { useRouter } from "next/navigation"

const hoverCardStyle: CSSProperties = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

export default function GrammarPage() {
  const router = useRouter()

  function openCategory(path: string) {
    router.push(path)
  }

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Grammar</h1>
          <p style={styles.subtitle}>
            Build strong grammar skills for 11+ English with focused practice in
            word classes, sentence structure, and accurate sentence building.
          </p>
        </div>

        <div style={styles.grid}>
          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/english/grammar/primary-word-classes")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
            }}
          >
            <div style={styles.icon}>🔤</div>
            <h2 style={styles.cardTitle}>Primary Word Classes</h2>
            <p style={styles.cardText}>
              Practise nouns, verbs, adjectives, adverbs, pronouns,
              prepositions, conjunctions, and other essential grammar building
              blocks.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Parts of speech</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Status:</span>
                <span style={styles.infoValue}>Ready</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/english/grammar/primary-word-classes")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open Word Classes
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() =>
              openCategory("/english/grammar/sentence-structure-syntax")
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
            }}
          >
            <div style={styles.icon}>🧩</div>
            <h2 style={styles.cardTitle}>Sentence Structure & Syntax</h2>
            <p style={styles.cardText}>
              Improve sentence construction, word order, clauses, phrase use,
              and the structure needed for accurate 11+ English answers.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Sentence building</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Status:</span>
                <span style={styles.infoValue}>Ready</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/english/grammar/sentence-structure-syntax")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open Sentence Structure
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

const styles: { [key: string]: CSSProperties } = {
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