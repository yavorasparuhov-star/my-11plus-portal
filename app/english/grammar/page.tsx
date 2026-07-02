"use client"

import type { CSSProperties } from "react"
import { useRouter } from "next/navigation"
import Header from "../../../components/Header"
import PublicLandingCard from "../../../components/cards/PublicLandingCard"

const grammarTopics = [
  {
    title: "Primary Word Classes",
    path: "/english/grammar/primary-word-classes",
    icon: "ABC",
    iconStyle: {
      background: "linear-gradient(135deg, #fef3c7, #fb923c)",
      color: "#7c2d12",
      fontSize: "30px",
      letterSpacing: "0.5px",
      boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
    },
    description:
      "Practise nouns, verbs, adjectives, adverbs, pronouns, prepositions, conjunctions, and other essential grammar building blocks.",
    buttonText: "Open Word Classes",
  },
  {
    title: "Sentence Structure & Syntax",
    path: "/english/grammar/sentence-structure-syntax",
    icon: "S→S",
    iconStyle: {
      background: "linear-gradient(135deg, #dbeafe, #818cf8)",
      color: "#1e1b4b",
      fontSize: "30px",
      letterSpacing: "0.5px",
      boxShadow: "0 10px 22px rgba(0,0,0,0.12)",
    },
    description:
      "Improve sentence construction, word order, clauses, phrase use, and the structure needed for accurate 11+ English answers.",
    buttonText: "Open Sentence Structure",
  },
]

export default function GrammarPage() {
  const router = useRouter()

  function openCategory(path: string) {
    router.push(path)
  }

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Grammar</h1>
          <p style={styles.subtitle}>
            Build strong grammar skills for 11+ English with focused practice in
            word classes, sentence structure, and accurate sentence building.
          </p>
        </div>

        <div style={styles.grid}>
          {grammarTopics.map((topic) => (
            <PublicLandingCard
              key={topic.title}
              variant="centeredIcon"
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
}
