"use client"

import type { CSSProperties } from "react"
import Link from "next/link"
import Header from "../../components/Header"
import { useRouter } from "next/navigation"

const hoverCardStyle: CSSProperties = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

export default function EnglishPage() {
  const router = useRouter()

  function openCategory(path: string) {
    router.push(path)
  }

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.title}>English</h1>
          <p style={styles.subtitle}>
            Practise core English skills including vocabulary, spelling,
            comprehension, grammar, and punctuation to build confidence for 11+
            entrance exams.
          </p>
        </div>

        <div style={styles.grid}>
          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/english/vocabulary")}
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
              Strengthen word meaning, synonyms, antonyms, and precise language
              knowledge for 11+ English.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Word meaning</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Last result:</span>
                <Link
                  href="/results/english/vocabulary/0"
                  style={styles.resultLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  View
                </Link>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/english/vocabulary")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open Vocabulary
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/english/spelling")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
            }}
          >
            <div style={styles.icon}>✍️</div>

            <h2 style={styles.cardTitle}>Spelling</h2>

            <p style={styles.cardText}>
              Practise accurate spelling, spot common mistakes, and improve word
              recognition under test conditions.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Correct spelling</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Last result:</span>
                <Link
                  href="/results/english/spelling/0"
                  style={styles.resultLink}
                  onClick={(e) => e.stopPropagation()}
                >
                  View
                </Link>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/english/spelling")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open Spelling
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/english/comprehension")}
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
              Develop reading skills, inference, retrieval, and understanding of
              fiction and non-fiction passages.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Reading skills</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/english/comprehension")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open Comprehension
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/english/grammar")}
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

            <h2 style={styles.cardTitle}>Grammar</h2>

            <p style={styles.cardText}>
              Build confidence with sentence structure, tenses, word classes,
              agreement, and key grammar rules for 11+ exams.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Grammar rules</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/english/grammar")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open Grammar
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/english/punctuation")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
            }}
          >
            <div style={styles.icon}>✒️</div>

            <h2 style={styles.cardTitle}>Punctuation</h2>

            <p style={styles.cardText}>
              Practise full stops, commas, apostrophes, speech marks, colons,
              semicolons, and other punctuation used in 11+ English.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Punctuation marks</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/english/punctuation")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open Punctuation
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
    textAlign: "right",
  },

  resultLink: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#3730a3",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
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