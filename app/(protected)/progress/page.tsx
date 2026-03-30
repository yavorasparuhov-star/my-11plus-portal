"use client"

import Link from "next/link"

export default function ProgressPage() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>📊 Your Progress</h1>
        <p>Choose a category to track your performance:</p>

        <div style={styles.buttons}>
          <Link href="/progress/vocabulary" style={styles.button}>
            📘 Vocabulary Progress →
          </Link>

          <Link href="/progress/spelling" style={styles.button}>
            ✍️ Spelling Progress →
          </Link>

          <Link href="/progress/comprehension" style={styles.button}>
            📖 Comprehension Progress →
          </Link>
        </div>
      </div>
    </div>
  )
}

const styles: any = {
  container: {
    minHeight: "80vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    textAlign: "center",
    width: "100%",
    maxWidth: "500px",
  },
  buttons: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginTop: "20px",
  },
  button: {
    padding: "12px",
    borderRadius: "10px",
    background: "#d4f5d0",
    color: "#065f46",
    textDecoration: "none",
    fontWeight: "bold",
  },
}