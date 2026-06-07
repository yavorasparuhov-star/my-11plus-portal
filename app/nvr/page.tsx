"use client"

import React from "react"
import Header from "../../components/Header"
import { useRouter } from "next/navigation"

const hoverCardStyle = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

export default function NVRPage() {
  const router = useRouter()

  function openCategory(path: string) {
    router.push(path)
  }

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Non-Verbal Reasoning</h1>
          <p style={styles.subtitle}>
            Practise core NVR skills to build confidence for
            11+ entrance exams.
          </p>
        </div>

        <div style={styles.grid}>
          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/nvr/shape-patterns")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
            }}
          >
            <div style={{ ...styles.icon, ...styles.shapeIcon }}>◆◇◆</div>
            <h2 style={styles.cardTitle}>Shape Patterns</h2>
            <p style={styles.cardText}>
              Practise visual patterns, odd one out, missing shapes, and
              rule-based figure sequences.
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/nvr/shape-patterns")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open Shape Patterns
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/nvr/rotations-reflections")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
            }}
          >
            <div style={{ ...styles.icon, ...styles.rotationIcon }}>↻↔</div>
            <h2 style={styles.cardTitle}>Rotations & Reflections</h2>
            <p style={styles.cardText}>
              Build confidence with mirror images, rotations, flips, and changes
              in shape orientation.
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/nvr/rotations-reflections")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open Rotations & Reflections
            </button>
          </div>

          <div
            style={{ ...styles.card, ...hoverCardStyle }}
            onClick={() => openCategory("/nvr/codes-spatial-logic")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
            }}
          >
            <div style={{ ...styles.icon, ...styles.logicIcon }}>▣🔐</div>
            <h2 style={styles.cardTitle}>Codes & Spatial Logic</h2>
            <p style={styles.cardText}>
              Work on shape codes, spatial logic, hidden shapes, nets, cubes,
              and other visual reasoning problems.
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCategory("/nvr/codes-spatial-logic")
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#bbf7d0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#d4f5d0"
              }}
              style={styles.button}
            >
              Open Codes & Spatial Logic
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
    width: "86px",
    height: "86px",
    borderRadius: "24px",
    fontSize: "30px",
    lineHeight: 1,
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    letterSpacing: "2px",
    fontWeight: 900,
    boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
  },
  shapeIcon: {
    background: "linear-gradient(135deg, #fef3c7, #fb923c)",
    color: "#7c2d12",
  },
  rotationIcon: {
    background: "linear-gradient(135deg, #dbeafe, #60a5fa)",
    color: "#1e3a8a",
  },
  logicIcon: {
    background: "linear-gradient(135deg, #dcfce7, #34d399)",
    color: "#064e3b",
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
