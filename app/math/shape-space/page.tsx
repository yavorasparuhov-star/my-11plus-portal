"use client"

import { useRouter } from "next/navigation"
import Header from "../../../components/Header"

export default function ShapeSpacePage() {
  const router = useRouter()

  return (
    <>
      <Header />

      <div style={pageStyle}>
        <div style={containerStyle}>
          <h1 style={titleStyle}>Shape & Space</h1>

          <p style={textStyle}>
            Explore angles, properties of shapes, coordinates, symmetry,
            transformations, and spatial reasoning.
          </p>

          <div style={cardStyle}>
            <h2 style={subTitleStyle}>Coming next</h2>
            <p style={textStyle}>
              This topic page is ready. The next step will be adding sample
              tests, free-account tests, and full paid access.
            </p>

            <div style={buttonRowStyle}>
              <button onClick={() => router.push("/login")} style={primaryButtonStyle}>
                Start Topic Tests
              </button>

              <button onClick={() => router.push("/signup")} style={secondaryButtonStyle}>
                Create Free Account
              </button>

              <button onClick={() => router.push("/math")} style={secondaryButtonStyle}>
                Back to Math
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const pageStyle = {
  minHeight: "100vh",
  backgroundColor: "#f4fbf4",
  padding: "40px 20px",
}

const containerStyle = {
  maxWidth: "900px",
  margin: "0 auto",
  textAlign: "center" as const,
}

const titleStyle = {
  fontSize: "40px",
  marginBottom: "16px",
  color: "#1f3b2d",
}

const subTitleStyle = {
  fontSize: "24px",
  marginBottom: "12px",
  color: "#1f3b2d",
}

const textStyle = {
  fontSize: "18px",
  color: "#355244",
  lineHeight: "1.6",
}

const cardStyle = {
  marginTop: "30px",
  backgroundColor: "white",
  borderRadius: "16px",
  padding: "28px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
}

const buttonRowStyle = {
  display: "flex",
  gap: "15px",
  justifyContent: "center",
  flexWrap: "wrap" as const,
  marginTop: "20px",
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