"use client"

import React from "react"
import { useRouter } from "next/navigation"
import {
  CustomTestsIcon,
  EnglishIcon,
  MathsIcon,
  NVRIcon,
  ProgressIcon,
  ReviewIcon,
  VRIcon,
} from "../../../components/icons/PortalIcons"

const cardHover = {
  transition: "all 0.25s ease",
  cursor: "pointer",
}

export default function HomePage() {
  const router = useRouter()

  const cards = [
    {
      title: "English",
      icon: <EnglishIcon size={46} />,
      text: "Vocabulary, spelling, grammar, punctuation and comprehension practice.",
      path: "/english",
    },
    {
      title: "Maths",
      icon: <MathsIcon size={46} />,
      text: "Build arithmetic, reasoning, fractions, problem-solving and exam confidence.",
      path: "/math",
    },
    {
      title: "VR",
      icon: <VRIcon size={46} />,
      text: "Practise verbal reasoning question types including words, codes and logic.",
      path: "/vr",
    },
    {
      title: "NVR",
      icon: <NVRIcon size={46} />,
      text: "Develop non-verbal reasoning skills, pattern recognition and spatial awareness.",
      path: "/nvr",
    },
  ]

  const learningTools = [
    {
      title: "Custom Tests",
      badge: "Premium Practice",
      icon: <CustomTestsIcon size={42} />,
      text: "Create focused tests by subject, topic, difficulty and time limit to match your child’s current goals.",
      button: "Build test",
      path: "/custom-tests",
    },
    {
      title: "Track Progress",
      badge: "Premium Insights",
      icon: <ProgressIcon size={42} />,
      text: "Monitor recent scores, success rates and improvement trends so practice stays targeted.",
      button: "View progress",
      path: "/progress",
    },
    {
      title: "Review Mistakes",
      badge: "Premium Review",
      icon: <ReviewIcon size={42} />,
      text: "Revisit previous mistakes and strengthen weaker topics until they are fully mastered.",
      button: "Open review",
      path: "/review",
    },
  ]

  function handleCardHover(e: React.MouseEvent<HTMLDivElement>, active: boolean) {
    e.currentTarget.style.transform = active ? "translateY(-6px)" : "translateY(0)"
    e.currentTarget.style.boxShadow = active
      ? "0 20px 40px rgba(0,0,0,0.12)"
      : "0 10px 25px rgba(0,0,0,0.08)"
  }

  return (
    <div style={styles.page}>
      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroBadge}>Member dashboard</div>

        <h1 style={styles.title}>Welcome back</h1>

        <p style={styles.subtitle}>
          Continue practising by subject, build a custom test, review mistakes,
          or check your latest progress with your YanBo Learning tools.
        </p>

        <div style={styles.heroActions}>
          <button
            style={styles.primaryButton}
            onClick={() => router.push("/custom-tests")}
          >
            Build a custom test
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() => router.push("/progress")}
          >
            View progress
          </button>
        </div>
      </section>

      {/* SUBJECT CARDS */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Continue learning</h2>
          <p style={styles.sectionText}>
            Choose one of the four main 11+ subject areas and continue building
            confidence step by step.
          </p>
        </div>

        <div style={styles.grid}>
          {cards.map((card) => (
            <div
              key={card.title}
              style={{ ...styles.card, ...cardHover }}
              onClick={() => router.push(card.path)}
              onMouseEnter={(e) => handleCardHover(e, true)}
              onMouseLeave={(e) => handleCardHover(e, false)}
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
      </section>

      {/* PREMIUM LEARNING TOOLS */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Your Premium Learning Tools</h2>
          <p style={styles.sectionText}>
            Use these tools to personalise practice, track improvement and turn
            mistakes into stronger exam performance.
          </p>
        </div>

        <div style={styles.toolsGrid}>
          {learningTools.map((tool) => (
            <div
              key={tool.title}
              style={{ ...styles.toolCard, ...cardHover }}
              onClick={() => router.push(tool.path)}
              onMouseEnter={(e) => handleCardHover(e, true)}
              onMouseLeave={(e) => handleCardHover(e, false)}
            >
              <div style={styles.toolTopRow}>
                <span style={styles.toolBadge}>{tool.badge}</span>
                <span style={styles.toolIcon}>{tool.icon}</span>
              </div>

              <h3 style={styles.toolTitle}>{tool.title}</h3>

              <p style={styles.toolText}>{tool.text}</p>

              <button
                style={styles.toolButton}
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(tool.path)
                }}
              >
                {tool.button}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* STUDY TIP */}
      <section style={styles.tipSection}>
        <div style={styles.tipCard}>
          <div style={styles.tipIcon}>💡</div>

          <div>
            <h2 style={styles.tipTitle}>Today’s study idea</h2>
            <p style={styles.tipText}>
              Try one short practice session, then spend a few minutes reviewing
              mistakes. Small regular sessions are better than rushing through
              lots of questions at once.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    padding: "32px 20px 60px",
    maxWidth: "1180px",
    margin: "0 auto",
  },

  hero: {
    textAlign: "center",
    marginBottom: "44px",
    background:
      "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 45%, #ffffff 100%)",
    borderRadius: "28px",
    padding: "46px 24px",
    boxShadow: "0 14px 36px rgba(0,0,0,0.07)",
    border: "1px solid #d1fae5",
  },

  heroBadge: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    padding: "8px 14px",
    borderRadius: "999px",
    fontSize: "14px",
    fontWeight: 800,
    marginBottom: "16px",
  },

  title: {
    fontSize: "44px",
    marginBottom: "14px",
    color: "#064e3b",
    fontWeight: 800,
  },

  subtitle: {
    fontSize: "18px",
    color: "#4b5563",
    maxWidth: "760px",
    margin: "0 auto",
    lineHeight: 1.7,
  },

  heroActions: {
    display: "flex",
    justifyContent: "center",
    gap: "14px",
    flexWrap: "wrap",
    marginTop: "28px",
  },

  primaryButton: {
    padding: "13px 22px",
    borderRadius: "14px",
    border: "none",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "16px",
    boxShadow: "0 10px 24px rgba(22,163,74,0.25)",
  },

  secondaryButton: {
    padding: "13px 22px",
    borderRadius: "14px",
    border: "1px solid #bbf7d0",
    background: "white",
    color: "#065f46",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "16px",
  },

  section: {
    marginBottom: "56px",
  },

  sectionHeader: {
    textAlign: "center",
    marginBottom: "26px",
  },

  sectionTitle: {
    fontSize: "32px",
    margin: "0 0 10px",
    color: "#111827",
    fontWeight: 800,
  },

  sectionText: {
    fontSize: "17px",
    color: "#4b5563",
    maxWidth: "760px",
    margin: "0 auto",
    lineHeight: 1.7,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
    border: "1px solid #e5e7eb",
  },

  icon: {
    width: "70px",
    height: "70px",
    borderRadius: "22px",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
    boxShadow: "inset 0 0 0 1px #e5e7eb",
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
    fontWeight: 700,
    fontSize: "16px",
    minWidth: "140px",
  },

  toolsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },

  toolCard: {
    background: "white",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
  },

  toolTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "18px",
  },

  toolBadge: {
    display: "inline-block",
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 800,
  },

  toolIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "20px",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "inset 0 0 0 1px #e5e7eb",
  },

  toolTitle: {
    fontSize: "24px",
    margin: "0 0 10px",
    color: "#111827",
    fontWeight: 800,
  },

  toolText: {
    fontSize: "16px",
    color: "#4b5563",
    lineHeight: 1.6,
    marginBottom: "22px",
    flexGrow: 1,
  },

  toolButton: {
    padding: "13px 18px",
    borderRadius: "14px",
    border: "none",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "16px",
    width: "100%",
  },

  tipSection: {
    marginBottom: "20px",
  },

  tipCard: {
    background: "#064e3b",
    color: "white",
    borderRadius: "26px",
    padding: "28px",
    boxShadow: "0 14px 34px rgba(6,78,59,0.22)",
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
  },

  tipIcon: {
    fontSize: "38px",
    lineHeight: 1,
  },

  tipTitle: {
    margin: "0 0 8px",
    fontSize: "26px",
    fontWeight: 800,
  },

  tipText: {
    margin: 0,
    color: "#d1fae5",
    fontSize: "16px",
    lineHeight: 1.7,
  },
}