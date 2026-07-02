"use client"

import type { CSSProperties } from "react"
import { useRouter } from "next/navigation"
import Header from "../../components/Header"
import PublicLandingCard from "../../components/cards/PublicLandingCard"

export default function VRPage() {
  const router = useRouter()

  const topics = [
    {
      title: "Word Relationships",
      path: "/vr/word-relationships",
      icon: "↔",
      iconStyle: styles.wordIcon,
      description:
        "Build skills in synonyms, antonyms, analogies, and word meaning connections.",
      buttonText: "Open VR",
    },
    {
      title: "Codes & Logic",
      path: "/vr/code-logic",
      icon: "🔐",
      iconStyle: styles.codeIcon,
      description:
        "Practise letter codes, word rules, hidden logic, and structured verbal puzzles.",
      buttonText: "Open VR",
    },
    {
      title: "Sequence & Patterns",
      path: "/vr/sequence-patterns",
      icon: "A→Z",
      iconStyle: styles.sequenceIcon,
      description:
        "Improve recognition of letter sequences, word patterns, and logical order questions.",
      buttonText: "Open VR",
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
          <h1 style={styles.title}>Verbal Reasoning</h1>
          <p style={styles.subtitle}>
            Practise core verbal reasoning skills to prepare for 11+ entrance
            exams.
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
  wordIcon: {
    background: "linear-gradient(135deg, #dbeafe, #93c5fd)",
    color: "#1d4ed8",
  },
  codeIcon: {
    background: "linear-gradient(135deg, #fef3c7, #fbbf24)",
    color: "#92400e",
  },
  sequenceIcon: {
    background: "linear-gradient(135deg, #fce7f3, #f9a8d4)",
    color: "#9d174d",
    fontSize: "22px",
  },
}
