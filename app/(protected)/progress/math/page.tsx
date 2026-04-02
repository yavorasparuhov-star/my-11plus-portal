"use client"

import { useRouter } from "next/navigation"

export default function MathProgressPage() {
  const router = useRouter()

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4fbf4",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "40px",
            marginBottom: "16px",
            color: "#1f3b2d",
          }}
        >
          Math Progress
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#355244",
            lineHeight: "1.6",
            marginBottom: "30px",
          }}
        >
          This page will show saved Math progress across all Math categories.
        </p>

        <div
          style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "28px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          }}
        >
          <p
            style={{
              fontSize: "17px",
              color: "#355244",
              marginBottom: "20px",
            }}
          >
            Your Math progress area is ready to be built.
          </p>

          <button
            onClick={() => router.push("/math")}
            style={{
              padding: "14px 28px",
              fontSize: "16px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              backgroundColor: "#90ee90",
              color: "#1f3b2d",
              fontWeight: "bold",
            }}
          >
            Back to Math
          </button>
        </div>
      </div>
    </div>
  )
}