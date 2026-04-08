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
            Practise core NVR skills including shape patterns, rotations and
            reflections, and codes with spatial logic to build confidence for
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
            <div style={styles.icon}>🧩</div>
            <h2 style={styles.cardTitle}>Shape Patterns</h2>
            <p style={styles.cardText}>
              Practise visual patterns, odd one out, missing shapes, and
              rule-based figure sequences.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Pattern spotting</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Status:</span>
                <span style={styles.infoValue}>Ready</span>
              </div>
            </div>

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
            <div style={styles.icon}>🔄</div>
            <h2 style={styles.cardTitle}>Rotations & Reflections</h2>
            <p style={styles.cardText}>
              Build confidence with mirror images, rotations, flips, and changes
              in shape orientation.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Transformations</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Status:</span>
                <span style={styles.infoValue}>Ready</span>
              </div>
            </div>

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
            <div style={styles.icon}>🧠</div>
            <h2 style={styles.cardTitle}>Codes & Spatial Logic</h2>
            <p style={styles.cardText}>
              Work on shape codes, spatial logic, hidden shapes, nets, cubes,
              and other visual reasoning problems.
            </p>

            <div style={styles.infoBox}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Focus:</span>
                <span style={styles.infoValue}>Spatial reasoning</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Status:</span>
                <span style={styles.infoValue}>Ready</span>
              </div>
            </div>

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