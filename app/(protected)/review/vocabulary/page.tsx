"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabaseClient"

type VocabularyReviewRow = {
  id: string
  user_id: string
  word_id: number | null
  word: string
  knew_it: boolean | null
  difficulty: number | null
  created_at: string
  definition?: string
  example_sentence?: string
}

type WordRow = {
  id: number
  definition: string | null
  example_sentence: string | null
}

export default function VocabularyReviewPage() {
const router = useRouter()
  const [reviewWords, setReviewWords] = useState<VocabularyReviewRow[]>([])
const [loading, setLoading] = useState(true)
const [difficultyFilter, setDifficultyFilter] = useState<"all" | 1 | 2 | 3>("all")

  useEffect(() => {
    fetchReviewWords()
  }, [])

  async function fetchReviewWords() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("vocabulary_review")
      .select("*")
      .eq("user_id", user.id)
      .eq("knew_it", false)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading vocabulary review:", error)
      setLoading(false)
      return
    }

    const reviewData = (data || []) as VocabularyReviewRow[]

    const wordIds = reviewData
      .map((row) => row.word_id)
      .filter((id): id is number => id !== null)

    let wordMap = new Map<number, { definition: string; example_sentence: string }>()

    if (wordIds.length > 0) {
      const { data: wordsData, error: wordsError } = await supabase
        .from("words")
        .select("id, definition, example_sentence")
        .in("id", wordIds)

      if (wordsError) {
        console.error("Error loading vocabulary meanings:", wordsError)
      } else {
        wordMap = new Map(
          ((wordsData || []) as WordRow[]).map((word) => [
            word.id,
            {
              definition: word.definition || "",
              example_sentence: word.example_sentence || "",
            },
          ])
        )
      }
    }

    const mergedData = reviewData.map((row) => ({
      ...row,
      definition:
        row.word_id !== null ? wordMap.get(row.word_id)?.definition || "" : "",
      example_sentence:
        row.word_id !== null ? wordMap.get(row.word_id)?.example_sentence || "" : "",
    }))

    setReviewWords(mergedData)
    setLoading(false)
  }
function retryFilteredWords() {
  const reviewWordIds = filteredWords
    .map((row) => row.word_id)
    .filter((id): id is number => id !== null)

  if (reviewWordIds.length === 0) return

  localStorage.setItem("vocabulary_review_word_ids", JSON.stringify(reviewWordIds))
  router.push("/vocabulary-test?mode=review")
}
  async function removeWord(id: string) {
    const { error } = await supabase.from("vocabulary_review").delete().eq("id", id)

    if (error) {
      console.error("Error deleting vocabulary review word:", error)
      return
    }

    setReviewWords((prev) => prev.filter((row) => row.id !== id))
  }

  const uniqueWords = Array.from(
    new Map(reviewWords.map((item) => [item.word.toLowerCase(), item])).values()
  )
const easyCount = uniqueWords.filter(w => w.difficulty === 1).length
const mediumCount = uniqueWords.filter(w => w.difficulty === 2).length
const hardCount = uniqueWords.filter(w => w.difficulty === 3).length
 const filteredWords =
  difficultyFilter === "all"
    ? uniqueWords
    : uniqueWords.filter((w) => w.difficulty === difficultyFilter)
if (loading) {
    return <p style={styles.message}>Loading vocabulary review...</p>
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>📚 Vocabulary Review</h1>
        <p style={styles.subtitle}>
          These are the words that need more vocabulary practice.
        </p>

        <div style={styles.summaryCard}>
<div style={styles.filterRow}>
  <button
    onClick={() => setDifficultyFilter("all")}
    style={{
      ...styles.filterButton,
      backgroundColor: difficultyFilter === "all" ? "#4f46e5" : "#e5e7eb",
      color: difficultyFilter === "all" ? "white" : "black",
    }}
  >
    All ({uniqueWords.length})
  </button>

  <button
    onClick={() => setDifficultyFilter(1)}
    style={{
      ...styles.filterButton,
      backgroundColor: difficultyFilter === 1 ? "#4f46e5" : "#e5e7eb",
      color: difficultyFilter === 1 ? "white" : "black",
    }}
  >
    Easy ({easyCount})
  </button>

  <button
    onClick={() => setDifficultyFilter(2)}
    style={{
      ...styles.filterButton,
      backgroundColor: difficultyFilter === 2 ? "#4f46e5" : "#e5e7eb",
      color: difficultyFilter === 2 ? "white" : "black",
    }}
  >
    Medium ({mediumCount})
  </button>

  <button
    onClick={() => setDifficultyFilter(3)}
    style={{
      ...styles.filterButton,
      backgroundColor: difficultyFilter === 3 ? "#4f46e5" : "#e5e7eb",
      color: difficultyFilter === 3 ? "white" : "black",
    }}
  >
    Hard ({hardCount})
  </button>
</div>
{filteredWords.length > 0 && (
  <div style={styles.retryRow}>
    <button onClick={retryFilteredWords} style={styles.actionButton}>
      Retry filtered words
    </button>
  </div>
)}
        </div>

        {uniqueWords.length === 0 ? (
          <div style={styles.emptyCard}>
            <h2>No vocabulary review words yet</h2>
            <p>
              Complete a vocabulary test and any incorrect answers will appear here.
            </p>
          </div>
        ) : (
         filteredWords.length === 0 ? (
  <div style={styles.emptyCard}>
    <h2>No words in this difficulty</h2>
    <p>Try another filter.</p>
  </div>
) : (
  <div style={styles.grid}>
    {filteredWords.map((row) => (
              <div key={row.id} style={styles.card}>
                <h2 style={styles.word}>{row.word}</h2>

                <p style={styles.definition}>
                  <strong>Meaning:</strong>{" "}
                  {row.definition && row.definition.trim() !== ""
                    ? row.definition
                    : "No definition available."}
                </p>

                {row.example_sentence && row.example_sentence.trim() !== "" && (
                  <p style={styles.example}>
                    <strong>Example:</strong> {row.example_sentence}
                  </p>
                )}

                <p style={styles.meta}>
                  Added:{" "}
                  {new Date(row.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  {new Date(row.created_at).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                <p style={styles.meta}>
                  Difficulty:{" "}
                  {row.difficulty === 1
                    ? "Easy"
                    : row.difficulty === 2
                    ? "Medium"
                    : row.difficulty === 3
                    ? "Hard"
                    : "Not set"}
                </p>

                <button
                  onClick={() => removeWord(row.id)}
                  style={styles.button}
                >
                  Remove from review
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    padding: "24px",
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  title: {
    fontSize: "32px",
    marginBottom: "8px",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: "#555",
    marginBottom: "24px",
  },
  summaryCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    marginBottom: "24px",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "12px",
  },
  emptyCard: {
    background: "white",
    borderRadius: "16px",
    padding: "32px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },
  word: {
    marginTop: 0,
    marginBottom: "12px",
    fontSize: "24px",
  },
  definition: {
    color: "#222",
    marginBottom: "12px",
    lineHeight: 1.5,
  },
  example: {
    color: "#444",
    marginBottom: "12px",
    lineHeight: 1.5,
    fontStyle: "italic",
  },
  meta: {
    color: "#555",
    marginBottom: "10px",
  },
  button: {
    marginTop: "10px",
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#4f46e5",
    color: "white",
    cursor: "pointer",
  },
  filterRow: {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "16px",
},
filterButton: {
  padding: "8px 14px",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
},
  message: {
    textAlign: "center",
    marginTop: "40px",
  },
  retryRow: {
  marginTop: "18px",
},
actionButton: {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "none",
  background: "#e5e7eb",
  color: "#111827",
  cursor: "pointer",
  fontWeight: 600,
},
}