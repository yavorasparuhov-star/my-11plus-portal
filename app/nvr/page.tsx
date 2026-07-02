"use client"

import type { CSSProperties } from "react"
import { useRouter } from "next/navigation"
import Header from "../../components/Header"
import PublicLandingCard from "../../components/cards/PublicLandingCard"

export default function NVRPage() {
  const router = useRouter()

  const topics = [
    {
      title: "Shape Patterns",
      path: "/nvr/shape-patterns",
      icon: "◆◇◆",
      iconStyle: styles.shapeIcon,
      description:
        "Practise visual patterns, odd one out, missing shapes, and rule-based figure sequences.",
      buttonText: "Open Shape Patterns",
    },
    {
      title: "Rotations & Reflections",
      path: "/nvr/rotations-reflections",
      icon: "↻↔",
      iconStyle: styles.rotationIcon,
      description:
        "Build confidence with mirror images, rotations, flips, and changes in shape orientation.",
      buttonText: "Open Rotations & Reflections",
    },
    {
      title: "Codes & Spatial Logic",
      path: "/nvr/codes-spatial-logic",
      icon: "▣🔐",
      iconStyle: styles.logicIcon,
      description:
        "Work on shape codes, spatial logic, hidden shapes, nets, cubes, and other visual reasoning problems.",
      buttonText: "Open Codes & Spatial Logic",
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
          <h1 style={styles.title}>Non-Verbal Reasoning</h1>
          <p style={styles.subtitle}>
            Practise core NVR skills to build confidence for 11+ entrance exams.
          </p>
        </div>

        <div style={styles.grid}>
          {topics.map((topic) => (
            <PublicLandingCard
              key={topic.title}
              title={topic.title}
              description={topic.description}
              buttonText={topic.buttonText}
              icon={topic.icon}
              iconStyle={topic.iconStyle}
              onOpen={() => openCategory(topic.path)}
            />
          ))}
        </div>
      </div>
    </>
  )
}

const styles: Record<string, CSSProperties> = {
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
}
