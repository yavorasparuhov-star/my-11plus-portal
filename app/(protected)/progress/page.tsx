"use client"

import Link from "next/link"
import React from "react"
import {
  EnglishIcon,
  MathsIcon,
  NVRIcon,
  ProgressIcon,
  VRIcon,
} from "../../../components/icons/PortalIcons"

export default function ProgressPage() {
  const subjects = [
    {
      title: "English Progress",
      shortTitle: "English",
      icon: <EnglishIcon size={46} />,
      text: "Track your latest English scores across vocabulary, spelling, grammar, punctuation and comprehension.",
      href: "/progress/english",
    },
    {
      title: "Maths Progress",
      shortTitle: "Maths",
      icon: <MathsIcon size={46} />,
      text: "Review your Maths performance across number, operations, fractions, shape, measurement and reasoning.",
      href: "/progress/math",
    },
    {
      title: "VR Progress",
      shortTitle: "VR",
      icon: <VRIcon size={46} />,
      text: "Follow your verbal reasoning progress across word relationships, code logic and sequence patterns.",
      href: "/progress/vr",
    },
    {
      title: "NVR Progress",
      shortTitle: "NVR",
      icon: <NVRIcon size={46} />,
      text: "Monitor your non-verbal reasoning progress across visual patterns, rotations, reflections and spatial logic.",
      href: "/progress/nvr",
    },
  ]

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroIcon}>
          <ProgressIcon size={42} />
        </div>

        <div style={styles.heroBadge}>Learning progress</div>

        <h1 style={styles.title}>Your Progress</h1>

        <p style={styles.subtitle}>
          Choose a subject to view recent scores, completed practice and areas
          that may need more attention.
        </p>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Choose a subject</h2>

          <p style={styles.sectionText}>
            Open a subject progress page to see how practice is developing over
            time.
          </p>
        </div>

        <div style={styles.grid}>
          {subjects.map((subject) => (
            <Link
              key={subject.title}
              href={subject.href}
              style={styles.card}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)"
                e.currentTarget.style.boxShadow =
                  "0 20px 40px rgba(0,0,0,0.12)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow =
                  "0 10px 25px rgba(0,0,0,0.08)"
              }}
            >
              <div style={styles.iconWrap}>{subject.icon}</div>

              <h3 style={styles.cardTitle}>{subject.shortTitle}</h3>

              <p style={styles.cardText}>{subject.text}</p>

              <span style={styles.cardButton}>View progress →</span>
            </Link>
          ))}
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

  heroIcon: {
    width: "76px",
    height: "76px",
    borderRadius: "24px",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    boxShadow: "0 10px 24px rgba(0,0,0,0.08)",
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
    margin: "0 0 14px",
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
    textDecoration: "none",
    color: "inherit",
    transition: "all 0.25s ease",
  },

  iconWrap: {
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
    margin: "0 0 10px",
    color: "#111827",
    fontWeight: 800,
  },

  cardText: {
    fontSize: "16px",
    color: "#4b5563",
    lineHeight: 1.6,
    margin: "0 0 20px",
    minHeight: "104px",
  },

  cardButton: {
    marginTop: "auto",
    padding: "12px 18px",
    borderRadius: "12px",
    background: "#d4f5d0",
    color: "#065f46",
    fontWeight: 800,
    fontSize: "16px",
    minWidth: "150px",
    display: "inline-block",
  },
}