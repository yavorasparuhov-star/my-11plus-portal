"use client"

import { useRouter } from "next/navigation"

export default function LandingPage() {
  const router = useRouter()

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4fbf4",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "42px",
          marginBottom: "10px",
          color: "#1f3b2d",
        }}
      >
        11+ Trainer
      </h1>

      <p
        style={{
          fontSize: "18px",
          maxWidth: "700px",
          marginBottom: "40px",
          color: "#355244",
          lineHeight: "1.6",
        }}
      >
        Build confidence in English and Math with targeted 11+ practice,
        progress tracking, and review tools.
      </p>

      <div
        style={{
          display: "flex",
          gap: "15px",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "25px",
        }}
      >
        <button
          onClick={() => router.push("/english")}
          style={buttonStyle}
        >
          English
        </button>

        <button
          onClick={() => router.push("/math")}
          style={buttonStyle}
        >
          Math
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: "15px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => router.push("/login")}
          style={secondaryButtonStyle}
        >
          Login
        </button>

        <button
          onClick={() => router.push("/signup")}
          style={secondaryButtonStyle}
        >
          Sign Up
        </button>
      </div>
    </div>
  )
}

const buttonStyle = {
  padding: "14px 28px",
  fontSize: "18px",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  backgroundColor: "#90ee90",
  color: "#1f3b2d",
  fontWeight: "bold" as const,
  minWidth: "160px",
}

const secondaryButtonStyle = {
  padding: "12px 24px",
  fontSize: "16px",
  borderRadius: "10px",
  border: "1px solid #90ee90",
  cursor: "pointer",
  backgroundColor: "white",
  color: "#1f3b2d",
  fontWeight: "bold" as const,
  minWidth: "140px",
}