"use client"

import { useState } from "react"
import Link from "next/link"
import { supabase } from "../../lib/supabaseClient"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleResetPassword = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/reset-password",
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage("Password reset email sent. Please check your inbox.")
    }

    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "40px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: "40px",
              fontWeight: "700",
              marginBottom: "10px",
              color: "#111827",
            }}
          >
            Forgot Password
          </h1>
          <p
            style={{
              fontSize: "20px",
              color: "#4b5563",
              margin: 0,
            }}
          >
            Enter your email and we will send you a password reset link
          </p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#374151",
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            Email <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              backgroundColor: "#f9fafb",
              fontSize: "18px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <p
            style={{
              color: "#dc2626",
              marginBottom: "16px",
              fontSize: "15px",
            }}
          >
            {error}
          </p>
        )}

        {message && (
          <p
            style={{
              color: "#065f46",
              marginBottom: "16px",
              fontSize: "15px",
            }}
          >
            {message}
          </p>
        )}

        <button
          onClick={handleResetPassword}
          disabled={loading}
          onMouseOver={(e) => (e.currentTarget.style.background = "#bbf7d0")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#d4f5d0")}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "10px",
            border: "none",
            background: "#d4f5d0",
            color: "#065f46",
            fontSize: "24px",
            fontWeight: "600",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <div style={{ textAlign: "center" }}>
          <Link
            href="/login"
            style={{
              color: "#2563eb",
              textDecoration: "none",
              fontWeight: "500",
              fontSize: "17px",
            }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}