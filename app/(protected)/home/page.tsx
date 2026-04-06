"use client"

import React from "react"
import { useRouter } from "next/navigation"

const cardHover = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

export default function HomePage() {
  const router = useRouter()

  const cards = [
    {
      title: "English",
      icon: "📘",
      text: "Vocabulary, spelling, and comprehension practice.",
      path: "/english",
    },
    {
      title: "Math",
      icon: "➗",
      text: "Build arithmetic, reasoning, and problem-solving skills.",
      path: "/math",
    },
    {
      title: "VR",
      icon: "🧠",
      text: "Verbal reasoning practice across different question types.",
      path: "/vr",
    },
    {
      title: "NVR",
      icon: "🔷",
      text: "Non-verbal reasoning training and pattern recognition.",
      path: "/nvr",
    },
    {
      title: "Progress",
      icon: "📊",
      text: "Check recent scores and see how learning is going.",
      path: "/progress",
    },
    {
      title: "Review",
      icon: "📚",
      text: "Retry questions and words that need more practice.",
      path: "/review",
    },
  ]

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>
          Choose a subject to continue practising, or review your progress.
        </p>
      </div>

      <div style={styles.grid}>
        {cards.map((card) => (
          <div
            key={card.title}
            style={{ ...styles.card, ...cardHover }}
            onClick={() => router.push(card.path)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)"
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
            }}
          >
            <div style={styles.icon}>{card.icon}</div>
            <h2 style={styles.cardTitle}>{card.title}</h2>
            <p style={styles.cardText}>{card.text}</p>
            <button
              style={styles.button}
              onClick={(e) => {
                e.stopPropagation()
                router.push(card.path)
              }}
            >
              Open
            </button>
          </div>
        ))}
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
  button: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#d4f5d0",
    color: "#065f46",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "16px",
    minWidth: "140px",
  },
}