"use client"

import type { CSSProperties } from "react"
import Header from "../../../components/Header"
import { useRouter } from "next/navigation"

const hoverCardStyle: CSSProperties = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

export default function PunctuationPage() {
  const router = useRouter()

  function openCategory(path: string) {
    router.push(path)
  }

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Punctuation</h1>
          <p style={styles.subtitle}>
            Practise punctuation skills for 11+ English, from sentence endings
            and commas to apostrophes, advanced punctuation, and direct speech.
          </p>
        </div>

        <div style={styles.grid}>
          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/english/punctuation/sentence")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
            }}
          >
            <div style={styles.icon}>📍</div>
            <h2 style={styles.cardTitle}>Sentence</h2>
            <p style={styles.cardText}>
              Practise full stops, capital letters, question marks,
              exclamation marks, and accurate sentence punctuation.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Sentence punctuation</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Status:</span>
                <span style={styles.infoValue}>Ready</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/english/punctuation/sentence")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open Sentence
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/english/punctuation/comma")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
            }}
          >
            <div style={styles.icon}>➖</div>
            <h2 style={styles.cardTitle}>Comma</h2>
            <p style={styles.cardText}>
              Learn how commas are used in lists, clauses, sentence openings,
              and other common 11+ punctuation situations.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Comma rules</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Status:</span>
                <span style={styles.infoValue}>Ready</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/english/punctuation/comma")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open Comma
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/english/punctuation/apostrophes")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
            }}
          >
            <div style={styles.icon}>’</div>
            <h2 style={styles.cardTitle}>Apostrophes</h2>
            <p style={styles.cardText}>
              Practise apostrophes for contraction and possession, including
              singular and plural ownership rules.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Possession & omission</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Status:</span>
                <span style={styles.infoValue}>Ready</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/english/punctuation/apostrophes")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open Apostrophes
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() =>
              openCategory("/english/punctuation/advanced-punctuation")
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
            <div style={styles.icon}>✒️</div>
            <h2 style={styles.cardTitle}>Advanced Punctuation</h2>
            <p style={styles.cardText}>
              Explore colons, semicolons, brackets, dashes, and other advanced
              punctuation often used in stronger 11+ English answers.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Advanced punctuation</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Status:</span>
                <span style={styles.infoValue}>Ready</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/english/punctuation/advanced-punctuation")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open Advanced Punctuation
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() =>
              openCategory("/english/punctuation/direct-speech-punctuation")
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
            <div style={styles.icon}>💬</div>
            <h2 style={styles.cardTitle}>Direct Speech Punctuation</h2>
            <p style={styles.cardText}>
              Practise speech marks, commas, capital letters, and punctuation
              placement when writing or correcting direct speech.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Speech punctuation</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Status:</span>
                <span style={styles.infoValue}>Ready</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/english/punctuation/direct-speech-punctuation")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open Direct Speech
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