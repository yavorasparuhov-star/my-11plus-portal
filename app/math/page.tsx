"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"
import Header from "../../components/Header"

const hoverCardStyle = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

type TopicCard = {
  title: string
  path: string
  icon: string
  description: string
  buttonText: string
}

export default function MathPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const topics: TopicCard[] = [
    {
      title: "Number & Place Value",
      path: "/math-test/number-place-value",
      icon: "🔢",
      description:
        "Build confidence with place value, ordering numbers, rounding, and number patterns.",
      buttonText: "Explore Number & Place Value",
    },
    {
      title: "Four Operations",
      path: "/math-test/four-operations",
      icon: "➕",
      description:
        "Practise addition, subtraction, multiplication, division, and multi-step calculations.",
      buttonText: "Explore Four Operations",
    },
    {
      title: "Fractions, Decimals & Percentages",
      path: "/math-test/fractions-decimals-percentages",
      icon: "🟰",
      description: "Convert, compare and solve problems with FDP.",
      buttonText: "Explore FDP",
    },
    {
      title: "Shape & Space",
      path: "/math-test/shape-space",
      icon: "📐",
      description:
        "Explore angles, properties of shapes, symmetry, coordinates, and spatial reasoning.",
      buttonText: "Explore Shape & Space",
    },
    {
      title: "Measurement",
      path: "/math-test/measurement",
      icon: "📏",
      description:
        "Practise length, mass, capacity, time, area, perimeter, and practical measurement problems.",
      buttonText: "Explore Measurement",
    },
    {
      title: "Data Handling",
      path: "/math-test/data-handling",
      icon: "📊",
      description:
        "Interpret charts, tables, graphs, and solve problems based on mathematical data.",
      buttonText: "Explore Data Handling",
    },
    {
      title: "Algebra & Reasoning",
      path: "/math-test/algebra-reasoning",
      icon: "🧠",
      description:
        "Develop algebraic thinking, sequences, formulas, and logical mathematical reasoning.",
      buttonText: "Explore Algebra & Reasoning",
    },
  ]

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      setIsLoggedIn(!!user)
    }

    checkUser()
  }, [])

  function handleTopicClick(path: string) {
    if (isLoggedIn) {
      router.push(path)
    } else {
      router.push("/signup")
    }
  }

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Math</h1>
          <p style={styles.subtitle}>
            Discover our 11+ maths practice across number, calculation,
            measurement, geometry, data handling, and reasoning.
          </p>

          <p style={styles.helperText}>
            {isLoggedIn
              ? "You’re signed in. Explore the topics below and continue to Maths Practice."
              : "Browse the topics below. Create a free account to start practising."}
          </p>

          <div style={styles.heroButtons}>
            <button
              onClick={() => router.push(isLoggedIn ? "/math-test" : "/signup")}
              style={styles.primaryButton}
            >
              {isLoggedIn ? "Go to Maths Practice" : "Create Free Account"}
            </button>

            {!isLoggedIn && (
              <button
                onClick={() => router.push("/login")}
                style={styles.secondaryButton}
              >
                Log In
              </button>
            )}
          </div>
        </div>

        <div style={styles.grid}>
          {topics.map((topic) => (
            <div
              key={topic.title}
              style={{ ...styles.card, ...hoverCardStyle }}
              onClick={() => handleTopicClick(topic.path)}
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

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleTopicClick(topic.path)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#bbf7d0"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#d4f5d0"
                }}
                style={styles.topicButton}
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
  helperText: {
    fontSize: "16px",
    color: "#6b7280",
    marginTop: "12px",
  },
  heroButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "24px",
  },
  primaryButton: {
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    background: "#d4f5d0",
    color: "#065f46",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "16px",
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
  topicButton: {
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