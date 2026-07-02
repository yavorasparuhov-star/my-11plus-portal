"use client"

import type { CSSProperties } from "react"
import { useRouter } from "next/navigation"
import Header from "../../../components/Header"
import PublicLandingCard from "../../../components/cards/PublicLandingCard"

const punctuationTopics = [
  {
    title: "Sentence",
    path: "/english/punctuation/sentence",
    icon: "!",
    iconStyle: {
      background: "linear-gradient(135deg, #f97316, #facc15)",
      color: "#ffffff",
    },
    description:
      "Practise full stops, capital letters, question marks, exclamation marks, and accurate sentence punctuation.",
    buttonText: "Open Sentence",
  },
  {
    title: "Comma",
    path: "/english/punctuation/comma",
    icon: "，",
    iconStyle: {
      background: "linear-gradient(135deg, #38bdf8, #2563eb)",
      color: "#ffffff",
      fontSize: "50px",
    },
    description:
      "Learn how commas are used in lists, clauses, sentence openings, and other common 11+ punctuation situations.",
    buttonText: "Open Comma",
  },
  {
    title: "Apostrophes",
    path: "/english/punctuation/apostrophes",
    icon: "’",
    iconStyle: {
      background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
      color: "#ffffff",
      fontSize: "54px",
    },
    description:
      "Practise apostrophes for contraction and possession, including singular and plural ownership rules.",
    buttonText: "Open Apostrophes",
  },
  {
    title: "Advanced Punctuation",
    path: "/english/punctuation/advanced-punctuation",
    icon: ";:",
    iconStyle: {
      background: "linear-gradient(135deg, #fb7185, #db2777)",
      color: "#ffffff",
      fontSize: "34px",
      letterSpacing: "-3px",
    },
    description:
      "Explore colons, semicolons, brackets, dashes, and other advanced punctuation often used in stronger 11+ English answers.",
    buttonText: "Open Advanced Punctuation",
  },
  {
    title: "Direct Speech Punctuation",
    path: "/english/punctuation/direct-speech-punctuation",
    icon: "“ ”",
    iconStyle: {
      background: "linear-gradient(135deg, #34d399, #059669)",
      color: "#ffffff",
      fontSize: "30px",
      letterSpacing: "-2px",
    },
    description:
      "Practise speech marks, commas, capital letters, and punctuation placement when writing or correcting direct speech.",
    buttonText: "Open Direct Speech",
  },
]

export default function PunctuationPage() {
  const router = useRouter()

  function openCategory(path: string) {
    router.push(path)
  }

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Punctuation</h1>
          <p style={styles.subtitle}>
            Practise punctuation skills for 11+ English, from sentence endings
            and commas to apostrophes, advanced punctuation, and direct speech.
          </p>
        </div>

        <div style={styles.grid}>
          {punctuationTopics.map((topic) => (
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
