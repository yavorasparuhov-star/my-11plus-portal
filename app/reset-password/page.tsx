"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabaseClient"

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const setupRecoverySession = async () => {
      try {
        setCheckingSession(true)
        setError(null)

        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)

        const accessToken = params.get("access_token")
        const refreshToken = params.get("refresh_token")
        const type = params.get("type")

        if (type !== "recovery" || !accessToken || !refreshToken) {
          setError("Invalid or expired reset link. Please request a new one.")
          setReady(false)
          return
        }

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          setError(error.message)
          setReady(false)
          return
        }

        setReady(true)
      } finally {
        setCheckingSession(false)
      }
    }

    setupRecoverySession()
  }, [])

  const handleUpdatePassword = async () => {
    setError(null)
    setMessage(null)

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters long.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage("Password updated successfully. Redirecting to login...")

    await supabase.auth.signOut()

    setLoading(false)

    setTimeout(() => {
      router.replace("/login")
    }, 1500)
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
            Reset Password
          </h1>
          <p
            style={{
              fontSize: "20px",
              color: "#4b5563",
              margin: 0,
            }}
          >
            Enter your new password below
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
            New Password <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            Confirm Password <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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

        {checkingSession && (
          <p style={{ color: "#374151", marginBottom: "16px" }}>
            Checking reset link...
          </p>
        )}

        {error && (
          <p style={{ color: "#dc2626", marginBottom: "16px" }}>
            {error}
          </p>
        )}

        {message && (
          <p style={{ color: "#065f46", marginBottom: "16px" }}>
            {message}
          </p>
        )}

        <button
          onClick={handleUpdatePassword}
          disabled={loading || checkingSession || !ready}
          onMouseOver={(e) => {
            if (!loading && ready) e.currentTarget.style.background = "#bbf7d0"
          }}
          onMouseOut={(e) => {
            if (!loading && ready) e.currentTarget.style.background = "#d4f5d0"
          }}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "10px",
            border: "none",
            background: ready ? "#d4f5d0" : "#d1d5db",
            color: ready ? "#065f46" : "#6b7280",
            fontSize: "24px",
            fontWeight: "600",
            cursor: loading || checkingSession || !ready ? "not-allowed" : "pointer",
            marginBottom: "20px",
          }}
        >
          {loading ? "Updating..." : "Update Password"}
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