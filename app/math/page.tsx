"use client"

import { useRouter } from "next/navigation"
import Header from "../../components/Header"

export default function MathPage() {
  const router = useRouter()

  const topics = [
    {
      title: "Number & Place Value",
      path: "/math/number-place-value",
    },
    {
      title: "Four Operations",
      path: "/math/four-operations",
    },
    {
      title: "Fractions, Decimals & Percentages",
      path: "/math/fractions-decimals-percentages",
    },
    {
      title: "Shape & Space",
      path: "/math/shape-space",
    },
    {
      title: "Measurement",
      path: "/math/measurement",
    },
    {
      title: "Data Handling",
      path: "/math/data-handling",
    },
    {
      title: "Algebra & Reasoning",
      path: "/math/algebra-reasoning",
    },
  ]

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
              Math
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
              Strengthen 11+ Math skills through focused topic practice. Free
              accounts get 2 tests per category. Paid accounts unlock the full
              Math library.
            </p>
          </div>

          <h2 style={sectionTitleStyle}>Math Topics</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
              marginBottom: "40px",
            }}
          >
            {topics.map((topic) => (
              <button
                key={topic.title}
                onClick={() => router.push(topic.path)}
                style={mainCardStyle}
              >
                {topic.title}
              </button>
            ))}
          </div>

          <h2 style={sectionTitleStyle}>Saved Areas</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
              marginBottom: "40px",
            }}
          >
            <button
              onClick={() => router.push("/review/math")}
              style={secondaryCardStyle}
            >
              Math Review
            </button>

            <button
              onClick={() => router.push("/progress/math")}
              style={secondaryCardStyle}
            >
              Math Progress
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
              Create a free account to unlock 2 tests per Math category and save
              your review and progress.
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
  padding: "28px 20px",
  fontSize: "20px",
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