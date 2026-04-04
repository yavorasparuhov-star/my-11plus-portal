"use client"

import Link from "next/link"

export default function ReviewPage() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>📚 Your Review</h1>
        <p>Choose a category to review your mistakes:</p>

        <div style={styles.buttons}>
          <Link href="/review/vocabulary" style={styles.button}>
            📘 Vocabulary Review →
          </Link>

          <Link href="/review/spelling" style={styles.button}>
            ✍️ Spelling Review →
          </Link>

          <Link href="/review/comprehension" style={styles.button}>
            📖 Comprehension Review →
          </Link>
<Link href="/review/math" style={styles.button}>
  ➕ Math Review →
</Link>
          <Link href="/review/vr" style={styles.button}>
            🧠 Verbal Reasoning Review →
          </Link>

          <Link href="/review/nvr" style={styles.button}>
            🔷 Non-Verbal Reasoning Review →
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
    padding: "24px",
  },
  card: {
    background: "white",
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    textAlign: "center",
    width: "100%",
    maxWidth: "560px",
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