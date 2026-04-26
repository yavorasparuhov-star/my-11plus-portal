"use client"

import { useState } from "react"
import Link from "next/link"
import { supabase } from "../../lib/supabaseClient"
import { useRouter } from "next/navigation"
import Header from "../../components/Header"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

const handleLogin = async () => {
  setError(null)

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
    setError("Please enter your password.")
    return
  }

  setLoading(true)

  const { error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  })

  if (error) {
    setError("Invalid email or password.")
  } else {
    router.replace("/home")
  }

  setLoading(false)
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
              Welcome Back
            </h1>
            <p
              style={{
                fontSize: "22px",
                color: "#4b5563",
                margin: 0,
              }}
            >
              Sign in to your account
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

          <div style={{ marginBottom: "16px" }}>
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
                placeholder="************"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "24px",
            }}
          >
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              style={{ transform: "scale(1.2)" }}
            />
            <label
              htmlFor="rememberMe"
              style={{
                color: "#4b5563",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Remember me for 30 days
            </label>
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

          <button
            onClick={handleLogin}
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
              fontSize: "28px",
              fontWeight: "500",
              cursor: "pointer",
              marginBottom: "22px",
            }}
          >
            {loading ? "Please wait..." : "Sign In"}
          </button>

          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            <Link
              href="/forgot-password"
              style={{
                color: "#111827",
                textDecoration: "underline",
                fontSize: "16px",
              }}
            >
              Forgot password
            </Link>
          </div>

          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <span style={{ color: "#374151", fontSize: "16px" }}>
              By clicking continue, you agree to our Terms &amp; Conditions
            </span>
          </div>

          <div style={{ textAlign: "center" }}>
            <span style={{ color: "#111827", fontSize: "18px" }}>
              Not Registered Yet?{" "}
            </span>
            <Link
              href="/signup"
              style={{
                color: "#065f46",
                textDecoration: "none",
                fontWeight: "500",
                fontSize: "18px",
              }}
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}