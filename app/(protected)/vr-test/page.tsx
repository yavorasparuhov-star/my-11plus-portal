"use client"

import { useState } from "react"

export default function VRTestPage() {
  const [difficulty, setDifficulty] = useState(1)
  const [testStarted, setTestStarted] = useState(false)

  if (!testStarted) {
    return (
      <div style={styles.page}>
        <div style={styles.wrapper}>
          <div style={styles.hero}>
            <h1 style={styles.title}>Verbal Reasoning Test</h1>
            <p style={styles.subtitle}>
              Practise verbal reasoning skills such as word relationships, codes,
              logic, and sequences. Choose your difficulty level to begin.
            </p>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Choose Difficulty</h2>

            <div style={styles.difficultyRow}>
              <button
                onClick={() => setDifficulty(1)}
                style={{
                  ...styles.difficultyButton,
                  ...(difficulty === 1 ? styles.activeDifficultyButton : {}),
                }}
              >
                Easy
              </button>

              <button
                onClick={() => setDifficulty(2)}
                style={{
                  ...styles.difficultyButton,
                  ...(difficulty === 2 ? styles.activeDifficultyButton : {}),
                }}
              >
                Medium
              </button>

              <button
                onClick={() => setDifficulty(3)}
                style={{
                  ...styles.difficultyButton,
                  ...(difficulty === 3 ? styles.activeDifficultyButton : {}),
                }}
              >
                Hard
              </button>
            </div>

            <div style={styles.infoBox}>
              <p style={styles.infoText}>
                Selected level:{" "}
                <strong>{["Easy", "Medium", "Hard"][difficulty - 1]}</strong>
              </p>
              <p style={styles.infoText}>
                This page is ready and protected. Next we will connect it to
                Supabase test data.
              </p>
            </div>

            <button
              onClick={() => setTestStarted(true)}
              style={styles.startButton}
            >
              Start VR Test
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.testCard}>
          <div style={styles.testIcon}>🧠</div>
          <h1 style={styles.title}>VR Test Coming Soon</h1>
          <p style={styles.subtitle}>
            The protected VR test page is working correctly.
          </p>

          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              Chosen difficulty:{" "}
              <strong>{["Easy", "Medium", "Hard"][difficulty - 1]}</strong>
            </p>
            <p style={styles.infoText}>
              Next step: connect sample VR questions from Supabase.
            </p>
          </div>

          <button
            onClick={() => setTestStarted(false)}
            style={styles.secondaryButton}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "calc(100vh - 70px)",
    background: "#f9fafb",
    padding: "32px 20px 50px",
  },
  wrapper: {
    maxWidth: "850px",
    margin: "0 auto",
  },
  hero: {
    textAlign: "center",
    marginBottom: "28px",
  },
  title: {
    fontSize: "38px",
    marginBottom: "10px",
    color: "#111827",
  },
  subtitle: {
    fontSize: "18px",
    color: "#4b5563",
    lineHeight: 1.6,
    maxWidth: "700px",
    margin: "0 auto",
  },
  card: {
    background: "white",
    borderRadius: "22px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    padding: "30px",
    textAlign: "center",
  },
  testCard: {
    background: "white",
    borderRadius: "22px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    padding: "40px 30px",
    textAlign: "center",
  },
  testIcon: {
    fontSize: "54px",
    marginBottom: "12px",
  },
  cardTitle: {
    fontSize: "26px",
    marginBottom: "20px",
    color: "#111827",
  },
  difficultyRow: {
    display: "flex",
    gap: "14px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: "22px",
  },
  difficultyButton: {
    padding: "12px 22px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "white",
    color: "#111827",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
    minWidth: "120px",
  },
  activeDifficultyButton: {
    background: "#d4f5d0",
    border: "1px solid #86efac",
    color: "#065f46",
  },
  infoBox: {
    background: "#f9fafb",
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "24px",
  },
  infoText: {
    fontSize: "16px",
    color: "#374151",
    margin: "8px 0",
    lineHeight: 1.5,
  },
  startButton: {
    padding: "14px 24px",
    borderRadius: "12px",
    border: "none",
    background: "#d4f5d0",
    color: "#065f46",
    cursor: "pointer",
    fontSize: "17px",
    fontWeight: 700,
    minWidth: "180px",
  },
  secondaryButton: {
    padding: "12px 22px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "white",
    color: "#111827",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 600,
    minWidth: "140px",
  },
}