"use client"

import type { CSSProperties } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Header from "../../components/Header"
import PublicLandingCard from "../../components/cards/PublicLandingCard"
import { supabase } from "../../lib/supabaseClient"

const categories = [
  {
    title: "Vocabulary",
    path: "/english/vocabulary",
    description:
      "Strengthen word meaning, synonyms, antonyms, and precise language knowledge for 11+ English.",
    focus: "Word meaning",
    resultHref: "/results/english/vocabulary/0",
    buttonText: "Open Vocabulary",
  },
  {
    title: "Spelling",
    path: "/english/spelling",
    description:
      "Practise accurate spelling, spot common mistakes, and improve word recognition under test conditions.",
    focus: "Correct spelling",
    resultHref: "/results/english/spelling/0",
    buttonText: "Open Spelling",
  },
  {
    title: "Comprehension",
    path: "/english/comprehension",
    description:
      "Develop reading skills, inference, retrieval, and understanding of fiction and non-fiction passages.",
    focus: "Reading skills",
    buttonText: "Open Comprehension",
  },
  {
    title: "Grammar",
    path: "/english/grammar",
    description:
      "Build confidence with sentence structure, tenses, word classes, agreement, and key grammar rules for 11+ exams.",
    focus: "Grammar rules",
    buttonText: "Open Grammar",
  },
  {
    title: "Punctuation",
    path: "/english/punctuation",
    description:
      "Practise full stops, commas, apostrophes, speech marks, colons, semicolons, and other punctuation used in 11+ English.",
    focus: "Punctuation accuracy",
    buttonText: "Open Punctuation",
  },
]

export default function EnglishPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    let mounted = true

    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (mounted) {
        setIsLoggedIn(!!user)
      }
    }

    checkUser()

    return () => {
      mounted = false
    }
  }, [])

  function openCategory(path: string) {
    router.push(path)
  }

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.hero}>
          <h1 style={styles.title}>English</h1>
          <p style={styles.subtitle}>
            Practise core English skills to build confidence for 11+ entrance
            exams.
          </p>
        </div>

        <div style={styles.grid}>
          {categories.map((category) => (
            <PublicLandingCard
              key={category.title}
              variant="plain"
              title={category.title}
              description={category.description}
              buttonText={category.buttonText}
              onOpen={() => openCategory(category.path)}
              footer={
                <div style={styles.infoBox}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Focus:</span>
                    <span style={styles.infoValue}>{category.focus}</span>
                  </div>

                  {isLoggedIn && category.resultHref && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Last result:</span>
                      <Link
                        href={category.resultHref}
                        style={styles.resultLink}
                        onClick={(event) => event.stopPropagation()}
                      >
                        View
                      </Link>
                    </div>
                  )}
                </div>
              }
            />
          ))}
        </div>
      </div>
    </>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f4fbf4",
    padding: "28px 20px 48px",
  },

  hero: {
    maxWidth: "1000px",
    margin: "0 auto 28px",
    textAlign: "center",
  },

  title: {
    fontSize: "42px",
    fontWeight: 800,
    color: "#064e3b",
    margin: "0 0 10px",
  },

  subtitle: {
    fontSize: "18px",
    lineHeight: 1.5,
    color: "#374151",
    maxWidth: "820px",
    margin: "0 auto",
  },

  grid: {
    maxWidth: "1150px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "18px",
  },

  infoBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "12px",
    padding: "10px 12px",
    marginTop: "auto",
    marginBottom: "14px",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    fontSize: "15px",
    marginBottom: "4px",
  },

  infoLabel: {
    fontWeight: 700,
    color: "#065f46",
  },

  infoValue: {
    color: "#374151",
    textAlign: "right",
  },

  resultLink: {
    color: "#047857",
    fontWeight: 700,
    textDecoration: "underline",
  },
}
