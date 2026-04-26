"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Header from "../../components/Header"
import { supabase } from "../../lib/supabaseClient"

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSignup = async () => {
    setError(null)
    setSuccess(null)

    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      setError("Please enter your email address.")
      return
    }

    if (!trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.")
      return
    }

    if (!password) {
      setError("Please create a password.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    setLoading(false)

    if (error) {
      const lowerMessage = error.message.toLowerCase()

      if (lowerMessage.includes("already")) {
        setError("An account with this email may already exist. Try logging in instead.")
      } else {
        setError(error.message)
      }

      return
    }

    setSuccess("Account created! Please check your email if confirmation is required, then log in.")

    setTimeout(() => {
      router.replace("/login")
    }, 1200)
  }

  return (
    <>
      <Header />

      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f3f4f6",
          padding: "40px 20px",
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
            margin: "40px auto 0 auto",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h1
              style={{
                fontSize: "42px",
                fontWeight: "700",
                marginBottom: "10px",
                color: "#111827",
              }}
            >
              Create Account
            </h1>

            <p
              style={{
                fontSize: "22px",
                color: "#4b5563",
                margin: 0,
              }}
            >
              Register for your 11+ learning account
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSignup()
                }
              }}
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
              Password <span style={{ color: "red" }}>*</span>
            </label>

            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void handleSignup()
                  }
                }}
                style={{
                  width: "100%",
                  padding: "16px",
                  paddingRight: "52px",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#f9fafb",
                  fontSize: "18px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <p
              style={{
                color: "#dc2626",
                background: "#fee2e2",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "15px",
              }}
            >
              {error}
            </p>
          )}

          {success && (
            <p
              style={{
                color: "#065f46",
                background: "#d1fae5",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "15px",
              }}
            >
              {success}
            </p>
          )}

          <button
            onClick={handleSignup}
            disabled={loading}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.background = "#bbf7d0"
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.background = "#d4f5d0"
            }}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "10px",
              border: "none",
              background: loading ? "#e5e7eb" : "#d4f5d0",
              color: loading ? "#6b7280" : "#065f46",
              fontSize: "28px",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "22px",
            }}
          >
            {loading ? "Creating..." : "Register"}
          </button>

          <div style={{ textAlign: "center" }}>
            <span style={{ color: "#111827", fontSize: "18px" }}>
              Already have an account?{" "}
            </span>

            <Link
              href="/login"
              style={{
                color: "#065f46",
                textDecoration: "none",
                fontWeight: "500",
                fontSize: "18px",
              }}
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}