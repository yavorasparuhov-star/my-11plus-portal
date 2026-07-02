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
      icon: <EnglishIcon size={38} />,
      text: "Track your latest English scores across vocabulary, spelling, grammar, punctuation and comprehension.",
      href: "/progress/english",
    },
    {
      title: "Maths Progress",
      shortTitle: "Maths",
      icon: <MathsIcon size={38} />,
      text: "Review your Maths performance across number, operations, fractions, shape, measurement and reasoning.",
      href: "/progress/math",
    },
    {
      title: "VR Progress",
      shortTitle: "VR",
      icon: <VRIcon size={38} />,
      text: "Follow your verbal reasoning progress across word relationships, code logic and sequence patterns.",
      href: "/progress/vr",
    },
    {
      title: "NVR Progress",
      shortTitle: "NVR",
      icon: <NVRIcon size={38} />,
      text: "Monitor your non-verbal reasoning progress across visual patterns, rotations, reflections and spatial logic.",
      href: "/progress/nvr",
    },
  ]

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroTitleRow}>
          <div style={styles.heroIcon}>
            <ProgressIcon size={34} />
          </div>

          <div>
            <h1 style={styles.title}>Your Progress</h1>

            <p style={styles.subtitle}>
              Choose a subject to view recent scores, completed practice and
              areas that need more attention.
            </p>
          </div>
        </div>
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
              <div style={styles.cardHeader}>
                <div style={styles.iconWrap}>{subject.icon}</div>

                <h3 style={styles.cardTitle}>{subject.shortTitle}</h3>
              </div>

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
    padding: "28px 20px 60px",
    maxWidth: "1180px",
    margin: "0 auto",
  },

  hero: {
    marginBottom: "30px",
    background:
      "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 45%, #ffffff 100%)",
    borderRadius: "22px",
    padding: "22px 26px",
    boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
    border: "1px solid #d1fae5",
  },

  heroTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    textAlign: "left",
    flexWrap: "wrap",
  },

  heroIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 18px rgba(0,0,0,0.07)",
    border: "1px solid #d1fae5",
    flexShrink: 0,
  },

  title: {
    fontSize: "34px",
    margin: "0 0 6px",
    color: "#064e3b",
    fontWeight: 800,
  },

  subtitle: {
    fontSize: "17px",
    color: "#4b5563",
    margin: 0,
    lineHeight: 1.5,
    maxWidth: "900px",
  },

  section: {
    marginBottom: "56px",
  },

  sectionHeader: {
    textAlign: "center",
    marginBottom: "24px",
  },

  sectionTitle: {
    fontSize: "32px",
    margin: "0 0 8px",
    color: "#111827",
    fontWeight: 800,
  },

  sectionText: {
    fontSize: "17px",
    color: "#4b5563",
    maxWidth: "760px",
    margin: "0 auto",
    lineHeight: 1.6,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px",
  },

  card: {
    background: "white",
    borderRadius: "20px",
    padding: "22px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    border: "1px solid #e5e7eb",
    textDecoration: "none",
    color: "inherit",
    transition: "all 0.25s ease",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "12px",
  },

  iconWrap: {
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "inset 0 0 0 1px #e5e7eb",
    flexShrink: 0,
  },

  cardTitle: {
    fontSize: "24px",
    margin: 0,
    color: "#111827",
    fontWeight: 800,
  },

  cardText: {
    fontSize: "15.5px",
    color: "#4b5563",
    lineHeight: 1.55,
    margin: "0 0 18px",
    minHeight: "76px",
  },

  cardButton: {
    marginTop: "auto",
    padding: "11px 16px",
    borderRadius: "12px",
    background: "#d4f5d0",
    color: "#065f46",
    fontWeight: 800,
    fontSize: "15.5px",
    minWidth: "145px",
    display: "inline-block",
    textAlign: "center",
    alignSelf: "flex-start",
  },
}
