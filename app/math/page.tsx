"use client"

import type { CSSProperties } from "react"
import { useRouter } from "next/navigation"
import Header from "../../components/Header"

const hoverCardStyle: CSSProperties = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

export default function MathPage() {
  const router = useRouter()

  const topics = [
    {
      title: "Number & Place Value",
      path: "/math/number-place-value",
      icon: "10",
      iconBackground: "#fef3c7",
      iconColor: "#b45309",
      description:
        "Build confidence with place value, ordering numbers, rounding, and number patterns.",
      buttonText: "Open Number & Place Value",
    },
    {
      title: "Four Operations",
      path: "/math/four-operations",
      icon: "+ − × ÷",
      iconBackground: "#dbeafe",
      iconColor: "#1d4ed8",
      description:
        "Practise addition, subtraction, multiplication, division, and multi-step calculations.",
      buttonText: "Open Four Operations",
    },
    {
      title: "Fractions, Decimals & Percentages",
      path: "/math/fractions-decimals-percentages",
      icon: "½ %",
      iconBackground: "#ede9fe",
      iconColor: "#6d28d9",
      description: "Convert, compare and solve problems with FDP.",
      buttonText: "Open FDP",
    },
    {
      title: "Shape & Space",
      path: "/math/shape-space",
      icon: "△ □",
      iconBackground: "#dcfce7",
      iconColor: "#15803d",
      description:
        "Explore angles, properties of shapes, symmetry, coordinates, and spatial reasoning.",
      buttonText: "Open Shape & Space",
    },
    {
      title: "Measurement",
      path: "/math/measurement",
      icon: "📏",
      iconBackground: "#ffedd5",
      iconColor: "#c2410c",
      description:
        "Practise length, mass, capacity, time, area, perimeter, and practical measurement problems.",
      buttonText: "Open Measurement",
    },
    {
      title: "Data Handling",
      path: "/math/data-handling",
      icon: "📊",
      iconBackground: "#cffafe",
      iconColor: "#0e7490",
      description:
        "Interpret charts, tables, graphs, and solve problems based on mathematical data.",
      buttonText: "Open Data Handling",
    },
    {
      title: "Algebra & Reasoning",
      path: "/math/algebra-reasoning",
      icon: "𝑥",
      iconBackground: "#fce7f3",
      iconColor: "#be185d",
      description:
        "Develop algebraic thinking, sequences, formulas, and logical mathematical reasoning.",
      buttonText: "Open Algebra & Reasoning",
    },
  ]

  function openCategory(path: string) {
    router.push(path)
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
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(0,0,0,0.12)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.08)"
              }}
            >
              <div
                style={{
                  ...styles.icon,
                  background: topic.iconBackground,
                  color: topic.iconColor,
                }}
              >
                {topic.icon}
              </div>

              <h2 style={styles.cardTitle}>{topic.title}</h2>
              <p style={styles.cardText}>{topic.description}</p>

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
    width: "76px",
    height: "76px",
    borderRadius: "22px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    fontWeight: 900,
    letterSpacing: "1px",
    boxShadow: "inset 0 -4px 0 rgba(0,0,0,0.08)",
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
