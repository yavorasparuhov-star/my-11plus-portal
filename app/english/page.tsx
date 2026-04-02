"use client"

import { useRouter } from "next/navigation"
import Header from "../../components/Header"

export default function EnglishPage() {
  const router = useRouter()

  return (
    <>
      <Header />

      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f4fbf4",
          padding: "40px 20px",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1
              style={{
                fontSize: "40px",
                marginBottom: "10px",
                color: "#1f3b2d",
              }}
            >
              English
            </h1>

            <p
              style={{
                fontSize: "18px",
                color: "#355244",
                lineHeight: "1.6",
                maxWidth: "780px",
                margin: "0 auto",
              }}
            >
              Practise key 11+ English skills with vocabulary, spelling, and
              comprehension exercises. Free accounts get 2 tests per category.
              Paid accounts unlock full access.
            </p>
          </div>

          <h2 style={sectionTitleStyle}>Practice Tests</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
              marginBottom: "40px",
            }}
          >
            <button
              onClick={() => router.push("/vocabulary-test")}
              style={mainCardStyle}
            >
              Vocabulary
            </button>

            <button
              onClick={() => router.push("/spelling-test")}
              style={mainCardStyle}
            >
              Spelling
            </button>

            <button
              onClick={() => router.push("/comprehension-test")}
              style={mainCardStyle}
            >
              Comprehension
            </button>
          </div>

          <h2 style={sectionTitleStyle}>Review</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
              marginBottom: "40px",
            }}
          >
            <button
              onClick={() => router.push("/review/vocabulary")}
              style={secondaryCardStyle}
            >
              Vocabulary Review
            </button>

            <button
              onClick={() => router.push("/review/spelling")}
              style={secondaryCardStyle}
            >
              Spelling Review
            </button>

            <button
              onClick={() => router.push("/review/comprehension")}
              style={secondaryCardStyle}
            >
              Comprehension Review
            </button>
          </div>

          <h2 style={sectionTitleStyle}>Progress</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
              marginBottom: "40px",
            }}
          >
            <button
              onClick={() => router.push("/progress/vocabulary")}
              style={secondaryCardStyle}
            >
              Vocabulary Progress
            </button>

            <button
              onClick={() => router.push("/progress/spelling")}
              style={secondaryCardStyle}
            >
              Spelling Progress
            </button>

            <button
              onClick={() => router.push("/progress/comprehension")}
              style={secondaryCardStyle}
            >
              Comprehension Progress
            </button>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              textAlign: "center",
            }}
          >
            <h2 style={{ color: "#1f3b2d", marginBottom: "12px" }}>
              Start for free
            </h2>

            <p
              style={{
                color: "#355244",
                lineHeight: "1.6",
                marginBottom: "20px",
              }}
            >
              Create a free account to unlock 2 tests per English category and
              save your results, review, and progress.
            </p>

            <div
              style={{
                display: "flex",
                gap: "15px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => router.push("/signup")}
                style={primaryButtonStyle}
              >
                Create Free Account
              </button>

              <button
                onClick={() => router.push("/")}
                style={secondaryButtonStyle}
              >
                Back Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const sectionTitleStyle = {
  fontSize: "24px",
  color: "#1f3b2d",
  marginBottom: "18px",
}

const mainCardStyle = {
  padding: "30px 20px",
  fontSize: "22px",
  borderRadius: "16px",
  border: "none",
  cursor: "pointer",
  backgroundColor: "#90ee90",
  color: "#1f3b2d",
  fontWeight: "bold" as const,
  minHeight: "110px",
  boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
}

const secondaryCardStyle = {
  padding: "24px 20px",
  fontSize: "20px",
  borderRadius: "16px",
  border: "1px solid #b7e4b7",
  cursor: "pointer",
  backgroundColor: "white",
  color: "#1f3b2d",
  fontWeight: "bold" as const,
  minHeight: "90px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
}

const primaryButtonStyle = {
  padding: "14px 28px",
  fontSize: "16px",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  backgroundColor: "#90ee90",
  color: "#1f3b2d",
  fontWeight: "bold" as const,
}

const secondaryButtonStyle = {
  padding: "14px 28px",
  fontSize: "16px",
  borderRadius: "10px",
  border: "1px solid #90ee90",
  cursor: "pointer",
  backgroundColor: "white",
  color: "#1f3b2d",
  fontWeight: "bold" as const,
}